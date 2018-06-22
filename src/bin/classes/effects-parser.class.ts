import { Effect, ofType } from '@ngrx/effects';
import {
  ArrayLiteralExpression,
  ClassDeclaration,
  ClassInstanceMemberTypes,
  Decorator,
  Diagnostic,
  ExpressionWithTypeArguments, Identifier,
  ImportDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  Type
} from 'ts-simple-ast';
import { CommandAction } from '../../classes/command-action.class';
import { DocumentAction } from '../../classes/document-action.class';
import { EventAction } from '../../classes/event-action.class';

export const ACTION_CLASS_NAMES = [
  CommandAction.name,
  DocumentAction.name,
  EventAction.name
];

export class EffectsParser {

  constructor(private _sourceFile: SourceFile) {
  }

  /**
   * get diagnostics
   * @return {Diagnostic[]}
   */
  getDiagnostics(): Diagnostic[] {
    return this._sourceFile.getDiagnostics();
  }

  /**
   * get pre-emit diagnostics
   * @return {Diagnostic[]}
   */
  getPreEmitDiagnostics(): Diagnostic[] {
    return this._sourceFile.getPreEmitDiagnostics();
  }

  /**
   * find members with `@Effect()` decorator
   * @return {ClassInstanceMemberTypes[]}
   */
  getEffectDecoratedMembers(): ClassInstanceMemberTypes[] | undefined {
    const classDeclarations = this._sourceFile.getClasses();
    const effectDecoratedMembers = classDeclarations.reduce((collectedEffectDecoratedMembers: ClassInstanceMemberTypes[], sourceFileClass: ClassDeclaration) => {
      const classMembers: ClassInstanceMemberTypes[] = sourceFileClass.getInstanceMembers();
      const effectDecoratedClassMembers: ClassInstanceMemberTypes[] = classMembers.filter((classMember: ClassInstanceMemberTypes) => {
        const memberDecorators: Decorator[] = classMember.getDecorators();
        return memberDecorators.some((memberDecorator: Decorator) => {
          return memberDecorator.getName() === Effect.name;
        });
      });
      return [
        ...collectedEffectDecoratedMembers,
        ...effectDecoratedClassMembers
      ];
    }, []);

    if (effectDecoratedMembers.length < 1) {
      return undefined;
    }

    return effectDecoratedMembers;
  }

  /**
   * find tagging decorators for the given member
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @return {string[] | undefined}
   */
  getTaggingDecorators(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
    const taggingDecorators = effectDecoratedMember.getDecorators()
      .filter((decorator: Decorator) => decorator.getName() !== Effect.name)
      .map((taggingDecorator: Decorator) => taggingDecorator.getName());

    if (taggingDecorators.length < 1) {
      return undefined;
    }

    return taggingDecorators;
  }

  /**
   * get the property name of the member
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @return {string}
   */
  getEffectName(effectDecoratedMember: ClassInstanceMemberTypes): string {
    return effectDecoratedMember
      .getFirstChildByKindOrThrow(SyntaxKind.Identifier)
      .getText();
  }

  /**
   * find all used input action types of a member
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @return {string[] | undefined}
   */
  getInputTypes(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
    // TODO: refactor logic to look at generic TypeArgument -> ofType<ActionType>(Discriminator)
    let ofTypeNode: Node | undefined;
    let ofTypeChildren: Node[] = [];

    effectDecoratedMember
    // get the assignment expression
      .getChildrenOfKind(SyntaxKind.CallExpression)
      .forEach((pipeExpression: Node) => pipeExpression
        // get the action operators
          .getChildrenOfKind(SyntaxKind.SyntaxList)
          .forEach((actionPipe: Node) => ofTypeNode = actionPipe
            // get the action operator expressions
              .getChildrenOfKind(SyntaxKind.CallExpression)
              // the first should be the `ofType` operator
              .find((ofTypeExpression: Node) => ofTypeExpression
                .getChildAtIndex(0)
                .getText() === ofType.name
              )
          )
      );

    // return if no `ofType` can be found
    if (ofTypeNode !== undefined) {
      ofTypeChildren = ofTypeNode.getChildren();
    } else {
      return undefined;
    }

    // find index of the open paren `(`, as it is followed by the type we're interested in
    const ofTypeOpenIndex = ofTypeChildren.findIndex((node: Node) => node.getKind() === SyntaxKind.OpenParenToken);

    // too bad, there's no open paren :(
    if (ofTypeOpenIndex < 0) {
      return undefined;
    }

    // the types are right after the open paren (`(`)
    const inputTypeEnumValues = ofTypeChildren[ofTypeOpenIndex + 1]
      .getChildrenOfKind(SyntaxKind.PropertyAccessExpression)
      .map((node: Node) => node.getText());

    // search all imports for classes
    const importedClasses = this._sourceFile.getImportDeclarations()
      .reduce((collectedClasses: ClassDeclaration[], imported: ImportDeclaration) => [
        ...collectedClasses,
        ...imported
          .getModuleSpecifierSourceFileOrThrow()
          .getClasses()
      ], []);
    const localClasses = this._sourceFile.getClasses();

    // combine the imported and the local classes
    const actionClasses = [
      ...importedClasses,
      ...localClasses
    ]
    // find the classes which implement / extend an action class
      .filter((actionClass: ClassDeclaration) => {
        const basis = actionClass.getImplements();
        const extendedFrom = actionClass.getExtends();
        if (extendedFrom !== undefined) {
          basis.push(extendedFrom);
        }
        return basis.some((basedOn: ExpressionWithTypeArguments) => {
          return ACTION_CLASS_NAMES.includes(basedOn.getText());
        });
      });

    return inputTypeEnumValues.map((inputTypeEnumValue: string) => {
      // find the action class whose `type` property matches the enum value
      const actionTypeClass = actionClasses
        .find((actionClass: ClassDeclaration) => {
          const typeProperty = actionClass.getPropertyOrThrow('type');
          const typePropertyName = typeProperty
            .getFirstChildByKindOrThrow(SyntaxKind.PropertyAccessExpression)
            .getText();
          // the type property value has to match our enum value
          return typePropertyName === inputTypeEnumValue;
        });

      // bad luck, no action class found matching our enum value
      if (actionTypeClass === undefined) {
        return inputTypeEnumValue;
      }

      // the name of the class is needed
      return actionTypeClass
        .getFirstChildByKindOrThrow(SyntaxKind.Identifier)
        .getText();
    });
  }

  /**
   * find all used output action types of a member
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @return {string[] | undefined}
   */
  getOutputTypes(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
    // TODO: refactor logic to look at Type of effect declaration -> EFFECT: Observable<ActionType> = ...
    const outputTypes = effectDecoratedMember
      .getType()
      .getTypeArguments()
      .reduce((collectedTypes: string[], currentType: Type) => {
        if (currentType.isUnionType()) {
          return [
            ...collectedTypes,
            ...currentType.getUnionTypes()
              .map((type: Type) => type.getText())
          ];
        } else {
          return [
            ...collectedTypes,
            currentType.getText()
          ];
        }
      }, []);

    if (outputTypes.length < 1) {
      return undefined;
    }

    return outputTypes;
  }

  /**
   * gets all the inputActions by using the passed ones, from the Decorator
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @returns {string[]}
   */
  getInputActionsFromDecorator(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
    // find the first matching taggingDecorator
    const taggingDecorator = this.getTaggingDecoratorOrThrow(effectDecoratedMember);
    const args = taggingDecorator.getArguments();
    if (!args || args.length !== 2) {
      return undefined;
    } else {
      // inputTypes are in the first Argument...
      return this.getNamesFromArgumentOrThrow(taggingDecorator.getArguments()[0]);
    }
  }

  /**
   * gets all the outputActions by using the passed ones, from the Decorator
   * @param {ClassInstanceMemberTypes} effectDecoratedMember
   * @returns {string[]}
   */
  getOutputActionsFromDecorator(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
    // find the first matching taggingDecorator
    const taggingDecorator = this.getTaggingDecoratorOrThrow(effectDecoratedMember);
    const args = taggingDecorator.getArguments();
    if (!args || args.length !== 2) {
      return undefined;
    } else {
      // inputTypes are in the first Argument...
      return this.getNamesFromArgumentOrThrow(taggingDecorator.getArguments()[1]);
    }
  }

  getTaggingDecoratorOrThrow(effectDecoratedMember: ClassInstanceMemberTypes): Decorator {
    // we assume, that there are only "our" taggingDecorator and therefore we simply return the first, whose
    // name is not Effect
    const taggingDecorator = effectDecoratedMember.getDecorators()
      .find(decorator => decorator.getName() !== Effect.name);
    if (taggingDecorator) {
      return taggingDecorator;
    } else {
      throw new Error('TaggingDecorator not found');
    }
  }

  getNamesFromArgumentOrThrow(argument: Node): string[] {
    // the passed node is (in our case) either an Identifier or an ArrayLiteralExpression
    if (argument instanceof Identifier) {
      return [argument.getText()];
    } else if (argument instanceof ArrayLiteralExpression) {
      return argument.getElements().map(element => element.getText());
    } else {
      throw new Error('Invalid Argument Type for TaggingDecorator');
    }
  }


}
