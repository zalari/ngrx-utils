import { Effect, ofType } from '@ngrx/effects';
import { ClassDeclaration, ClassInstanceMemberTypes, Decorator, Diagnostic, Node, PropertyDeclaration, SourceFile, SyntaxKind, Type } from 'ts-simple-ast';

export class EffectsParser {

    constructor(private _sourceFile: SourceFile) {}

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
     * get classes in source file
     * @return {ClassDeclaration[] | undefined}
     */
    getClasses(): ClassDeclaration[] | undefined {
        const classDeclarations = this._sourceFile.getClasses();
        if (classDeclarations.length < 1) {
            return undefined;
        }

        return classDeclarations;
    }

    /**
     * find members with `@Effect()` decorator
     * @param {ClassDeclaration[]} classDeclarations
     * @return {ClassInstanceMemberTypes[]}
     */
    getEffectDecoratedMembers(classDeclarations: ClassDeclaration[]): ClassInstanceMemberTypes[] | undefined {
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
            .getChildrenOfKind(SyntaxKind.Identifier)[0]
            .getText();
    }

    /**
     * find all used input action types of a member
     * @param {ClassInstanceMemberTypes} effectDecoratedMember
     * @return {string[] | undefined}
     */
    getInputTypes(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
        let ofTypeNode: Node | undefined = undefined;

        effectDecoratedMember
        // get the assignemnt expression
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
        if (ofTypeNode === undefined) {
            return undefined;
        }

        const ofTypeChildren = (ofTypeNode as Node).getChildren();
        const ofTypeOpenIndex = ofTypeChildren.findIndex((node: Node) => node.getKind() === SyntaxKind.OpenParenToken);

        // the types are right after the open paren (`(`)
        const inputTypeEnumValues = ofTypeChildren[ofTypeOpenIndex + 1]
            .getChildrenOfKind(SyntaxKind.PropertyAccessExpression)
            .map((node: Node) => node.getText());

        // find the classes whose `type` property equals the string based enum value
        const actionClasses = (this.getClasses() as ClassDeclaration[])
            .filter((actionClass: ClassDeclaration) => actionClass.getProperty('type') !== undefined);

        return inputTypeEnumValues.map((inputTypeEnumValue: string) => {
            // find the action class whose `type` property matches the enum value
            const actionTypeClass = actionClasses
                .find((actionClass: ClassDeclaration) => {
                    const typeProperty = actionClass.getProperty('type') as PropertyDeclaration;
                    const typePropertyName = typeProperty.getChildrenOfKind(SyntaxKind.PropertyAccessExpression)[0].getText();
                    return typePropertyName === inputTypeEnumValue;
                }) as ClassDeclaration;

            // the name of the class is needed
            return actionTypeClass
                .getChildrenOfKind(SyntaxKind.Identifier)[0]
                .getText();
        });
    }

    /**
     * find all used output action types of a member
     * @param {ClassInstanceMemberTypes} effectDecoratedMember
     * @return {string[] | undefined}
     */
    getOutputTypes(effectDecoratedMember: ClassInstanceMemberTypes): string[] | undefined {
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

}
