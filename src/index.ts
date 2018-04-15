#!/usr/bin/env node

import * as pack from '../package.json';
import * as commander from 'commander';

import { Effect, ofType } from '@ngrx/effects';
import Project, { ClassDeclaration, ClassInstanceMemberTypes, Decorator, Diagnostic, Node, PropertyDeclaration, SourceFile, Type } from 'ts-simple-ast';
import { SyntaxKind } from 'ts-simple-ast/dist/typescript/typescript';

commander
    .version(pack.version as string)
    .description(pack.description as string)
    .option('-c, --config <path>', 'path to tsconfig.json')
    .option('-s, --source <path>', 'path to ngrx effects source file')
    .parse(process.argv);

const project = new Project({
    tsConfigFilePath: commander.config,
    addFilesFromTsConfig: false
});

const sourceFile: SourceFile = project.addExistingSourceFile(commander.source);

// TODO: check for errors only to discontinue parser
// check for diagnostics
const sourceFileDiagnostics: Diagnostic[] = sourceFile.getDiagnostics();
if (sourceFileDiagnostics.length) {
    sourceFileDiagnostics.forEach((sourceFileDiagnostic: Diagnostic) => {
        console.error(sourceFileDiagnostic.getMessageText());
    });
    process.exit(1);
}

// TODO: check for errors only to discontinue parser
// TODO: what's the difference to the 'normal' diagnostics?
// check for pre-emit diagnostics
const sourceFilePreEmitDiagnostics: Diagnostic[] = sourceFile.getPreEmitDiagnostics();
if (sourceFilePreEmitDiagnostics.length) {
    sourceFilePreEmitDiagnostics.forEach((sourceFilePreEmitDiagnostic: Diagnostic) => {
        console.error(sourceFilePreEmitDiagnostic.getMessageText());
    });
    process.exit(1);
}

// check for classes in source file
const sourceFileClasses: ClassDeclaration[] = sourceFile.getClasses();
if (sourceFileClasses.length < 1) {
    console.error(`No class found in source file`);
    process.exit(1);
}

// find members with `@Effect()` decorator
const effectDecoratedMembers: ClassInstanceMemberTypes[] = sourceFileClasses.reduce((collectedEffectDecoratedMembers: ClassInstanceMemberTypes[], sourceFileClass: ClassDeclaration) => {
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
    console.error(`No effects found in source file`);
    process.exit(1);
}

// read input and output actions from source
effectDecoratedMembers.forEach((effectDecoratedMember: PropertyDeclaration) => {
    const effectName = effectDecoratedMember.getChildrenOfKind(SyntaxKind.Identifier)[0].getText();
    let ofTypeNode: Node | undefined;

    effectDecoratedMember
        .getChildrenOfKind(SyntaxKind.CallExpression)
        .forEach((node: Node) => node
            .getChildrenOfKind(SyntaxKind.SyntaxList)
            .forEach((node: Node) => ofTypeNode = node
                .getChildrenOfKind(SyntaxKind.CallExpression)
                .find((node: Node) => node
                    .getChildAtIndex(0)
                    .getText() === ofType.name
                )
            )
        );
    
    if (ofTypeNode === undefined) {
        console.error(`No ofType operator found in effect ${effectName}`);
        process.exit(1);
    }
    
    const ofTypeChildren = (ofTypeNode as Node).getChildren();
    const ofTypeOpenIndex = ofTypeChildren.findIndex((node: Node) => node.getKind() === SyntaxKind.OpenParenToken);

    const typesIn: string[] = ofTypeChildren[ofTypeOpenIndex + 1]
        .getChildrenOfKind(SyntaxKind.PropertyAccessExpression)
        .map((node: Node) => node.getText());

    const typesOut: any = effectDecoratedMember
        .getType()
        .getTypeArguments()
        .reduce((collectedTypes: string[], currentType: Type) => {
            if (currentType.isUnionType()) {
                return [
                    ...collectedTypes,
                    ...currentType.getUnionTypes().map((type: Type) => type.getText())
                ]
            } else {
                return [
                    ...collectedTypes,
                    currentType.getText()
                ]
            }
        }, []);

    console.log(typesIn, typesOut);
});
