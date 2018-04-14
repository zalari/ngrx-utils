#!/usr/bin/env node

import * as pack from '../package.json';
import * as commander from 'commander';

import Project from 'ts-simple-ast';

commander
    .version(pack.version as string)
    .description(pack.description as string)
    .option('-c, --config <path>', 'path to tsconfig.json')
    .option('-t, --target <path>', 'path to ngrx effects target file')
    .parse(process.argv);

const project = new Project({
    tsConfigFilePath: commander.config,
    addFilesFromTsConfig: false
});

const sourceFile = project.addExistingSourceFile(commander.target);

const sourceFileDiagnostics = sourceFile.getDiagnostics();
const sourceFilePreEmitDiagnostics = sourceFile.getPreEmitDiagnostics();

console.log(sourceFileDiagnostics)
console.log(sourceFilePreEmitDiagnostics)

console.log(sourceFile.getClasses())
