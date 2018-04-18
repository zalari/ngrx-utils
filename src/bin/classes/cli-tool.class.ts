import { writeFile } from 'fs';
import { join } from 'path';

import * as argvAutoGlob from 'argv-auto-glob';
import * as commander from 'commander';
import * as pack from '../../../package.json';
import Project, { ClassDeclaration, ClassInstanceMemberTypes, Diagnostic, SourceFile } from 'ts-simple-ast';

import { DiagramType } from '../enum/diagram-type.enum';
import { EffectsParser } from './effects-parser.class';
import { PumlGenerator } from './puml-generator.class';
import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { DiagnosticCategory } from 'ts-simple-ast/dist/typescript/typescript';

const TARGET_EXT_NAME = 'puml';
const TARGET_ENCODING = 'utf8';

export class CliTool {

    private _project: Project;

    private _sourceFiles: SourceFile[] = [];

    private _pumlGenerator: PumlGenerator;

    constructor() {
        this._registerCommands();
        this._processCommand();
    }

    /**
     * if the given script contains errors, halt and output error messages
     * @param {EffectsParser} parser
     */
    checkForErrors(parser: EffectsParser) {
        // check for diagnostics
        const diagnostics: Diagnostic[] = parser.getDiagnostics();
        console.log(diagnostics.map(d => d.getCategory()))
        // check for errors only to discontinue parser
        if (diagnostics.some((diagnostic: Diagnostic) => diagnostic.getCategory() === DiagnosticCategory.Error)) {
            this._exitWithError(
                diagnostics
                    .map((sourceFileDiagnostic: Diagnostic) => {
                        return sourceFileDiagnostic
                            .getMessageText()
                            .toString();
                    })
                    .join()
            );
        }

        // TODO: what's the difference to the 'normal' diagnostics?
        // check for pre-emit diagnostics
        const preEmitDiagnostics: Diagnostic[] = parser.getPreEmitDiagnostics();
        // check for errors only to discontinue parser
        if (preEmitDiagnostics.some((diagnostic: Diagnostic) => diagnostic.getCategory() === DiagnosticCategory.Error)) {
            this._exitWithError(
                preEmitDiagnostics
                    .map((sourceFilePreEmitDiagnostic: Diagnostic) => {
                        return sourceFilePreEmitDiagnostic
                            .getMessageText()
                            .toString();
                    })
                    .join()
            );
        }
    }

    /**
     * gather the effect types
     * @param {EffectsParser} parser
     * @returns {EffectExchangeTypes[]}
     */
    getEffectExchangeTypes(parser: EffectsParser): EffectExchangeTypes[] {
        const classDeclarations = parser.getClasses();
        if (classDeclarations === undefined) {
            this._exitWithError(`No class found in source file`);
        }

        const decoratedMembers = parser.getEffectDecoratedMembers(classDeclarations as ClassDeclaration[]);
        if (decoratedMembers === undefined) {
            this._exitWithError(`No effects found in source file`);
        }

        return (decoratedMembers as ClassInstanceMemberTypes[]).map((decoratedMember: ClassInstanceMemberTypes) => {
            const memberName = parser.getEffectName(decoratedMember);
            const taggingDecorators = parser.getTaggingDecorators(decoratedMember);
            const inputTypes = parser.getInputTypes(decoratedMember);
            const outputTypes = parser.getOutputTypes(decoratedMember);

            return { memberName, taggingDecorators, inputTypes, outputTypes };
        });
    }

    private _registerCommands() {
        const diagramTypes: string[] = Object
            .keys(DiagramType)
            .map((key: string) => DiagramType[key as any]);

        commander
            .version(pack.version as string)
            .description(pack.description as string)
            .option('-c, --config <path>', 'path to tsconfig.json')
            .option('-s, --source <path>', 'path to ngrx effects source file', (source: string, sources: string[]) => {
                // TODO: this will only work to collect coerced arguments
                // @ref https://github.com/tj/commander.js/issues/571#issuecomment-336526935
                sources.push(source);
                return sources;
            }, [])
            .option(`-d, --diagram <${diagramTypes.join('|')}>`, 'the diagram type to use', DiagramType.Activity)
            .parse(argvAutoGlob(process.argv));

        // exit if diagram type is unknown
        if (!diagramTypes.includes(commander.diagram)) {
            this._exitWithError(`Unknown diagram type "${commander.diagram}". Use one of: "${diagramTypes.join('", "')}".`);
        }

        // create a project
        this._project = new Project({
            tsConfigFilePath: commander.config,
            addFilesFromTsConfig: false
        });

        // add source file and keep reference
        this._sourceFiles = [
            ...commander.source,
            // TODO: collect variadic source argument, s. https://github.com/tj/commander.js/issues/571
            // thus we have to merge all unresolved args as long as `source` is the only variadic argument
            ...commander.args
        ].map((sourcePath: string) => this._project.addExistingSourceFile(sourcePath));

        // instantiate puml generator with diagram type
        this._pumlGenerator = new PumlGenerator(commander.diagram);
    }

    private _processCommand() {
        Promise
            .all(this._sourceFiles.map((sourceFile: SourceFile) => this._processSourceFile(sourceFile)))
            .catch((error: Error) => this._exitWithError(error.message))
            .then(() => this._exitSuccessful());
    }

    private _processSourceFile(sourceFile: SourceFile): Promise<true | Error> {
        // instantiate parser
        const effectsParser = new EffectsParser(sourceFile);

        // check for errors and return if necessary
        this.checkForErrors(effectsParser);

        // get effects
        const effects = this.getEffectExchangeTypes(effectsParser);

        // create puml for effects file
        const activities = this._pumlGenerator.output(effects);

        // create the target file path
        const sourceDirName = sourceFile.getDirectoryPath();
        const targetBaseName = sourceFile.getBaseNameWithoutExtension();
        const targetFilePath = join(sourceDirName, `${targetBaseName}.${TARGET_EXT_NAME}`);

        // write to target file
        return this._writeTarget(targetFilePath, activities);
    }

    private _writeTarget(filePath: string, content: string): Promise<true | Error> {
        return new Promise<true | Error>((resolve, reject) => {
            writeFile(filePath, content, TARGET_ENCODING, (error: Error) => {
                if (error) {
                    reject(error);
                }

                resolve(true);
            });
        });
    }

    private _exitWithError(message: string) {
        console.error(message);
        process.exit(1);
    }

    private _exitSuccessful() {
        process.exit(0);
    }

}
