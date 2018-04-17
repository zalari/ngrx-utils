import { writeFile } from 'fs';
import { dirname, basename, extname, join } from 'path';

import * as commander from 'commander';
import * as pack from '../../../package.json';
import Project, { ClassDeclaration, ClassInstanceMemberTypes, Diagnostic, SourceFile } from 'ts-simple-ast';

import { EffectsParser } from './effects-parser.class';
import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { PumlGenerator } from './puml-generator.class';
import { DiagramType } from '../enum/diagram-type.enum';

const TARGET_EXT_NAME = 'puml';
const TARGET_ENCODING = 'utf8';

export class CliTool {

    private _project: Project;

    private _sourceFile: SourceFile;

    private _targetFilePath: string;

    private _effectsParser: EffectsParser;

    private _pumlGenerator: PumlGenerator;

    constructor() {
        this._registerCommands();
        this._processCommand();
    }

    /**
     * if the given script contains errors, halt and output error messages
     */
    checkForErrors() {
        // TODO: check for errors only to discontinue parser
        // check for diagnostics
        const sourceFileDiagnostics: Diagnostic[] = this._effectsParser.getDiagnostics();
        if (sourceFileDiagnostics.length) {
            this._exitWithError(
                sourceFileDiagnostics
                    .map((sourceFileDiagnostic: Diagnostic) => {
                        return sourceFileDiagnostic
                            .getMessageText()
                            .toString();
                    })
                    .join()
            );
        }

        // TODO: check for errors only to discontinue parser
        // TODO: what's the difference to the 'normal' diagnostics?
        // check for pre-emit diagnostics
        const sourceFilePreEmitDiagnostics: Diagnostic[] = this._effectsParser.getPreEmitDiagnostics();
        if (sourceFilePreEmitDiagnostics.length) {
            this._exitWithError(
                sourceFilePreEmitDiagnostics
                    .map((sourceFilePreEmitDiagnostic: Diagnostic) => {
                        return sourceFilePreEmitDiagnostic
                            .getMessageText()
                            .toString();
                    })
                    .join()
            );
        }
    }

    getEffectExchangeTypes(): EffectExchangeTypes[] {
        const classDeclarations = this._effectsParser.getClasses();
        if (classDeclarations === undefined) {
            this._exitWithError(`No class found in source file`);
        }

        const decoratedMembers = this._effectsParser.getEffectDecoratedMembers(classDeclarations as ClassDeclaration[]);
        if (decoratedMembers === undefined) {
            this._exitWithError(`No effects found in source file`);
        }

        return (decoratedMembers as ClassInstanceMemberTypes[]).map((decoratedMember: ClassInstanceMemberTypes) => {
            const memberName = this._effectsParser.getEffectName(decoratedMember);
            const taggingDecorators = this._effectsParser.getTaggingDecorators(decoratedMember);
            const inputTypes = this._effectsParser.getInputTypes(decoratedMember);
            const outputTypes = this._effectsParser.getOutputTypes(decoratedMember);

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
            .option('-s, --source <path>', 'path to ngrx effects source file')
            .option(`-d, --diagram <${diagramTypes.join('|')}>`, 'the diagram type to use', DiagramType.Activity)
            .parse(process.argv);

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
        this._sourceFile = this._project.addExistingSourceFile(commander.source);

        // create the target path
        const sourceDirName = dirname(commander.source);
        const sourceExtName = extname(commander.source);
        const targetBaseName = basename(commander.source, sourceExtName);
        this._targetFilePath = join(sourceDirName, `${targetBaseName}.${TARGET_EXT_NAME}`);

        // instantiate parser
        this._effectsParser = new EffectsParser(this._sourceFile);

        // instantiate puml generator with diagram type
        this._pumlGenerator = new PumlGenerator(commander.diagram);
    }

    private _processCommand() {
        // check for errors and return if necessary
        this.checkForErrors();

        // get effects
        const effects = this.getEffectExchangeTypes();

        // create puml for effects file
        const activities = this._pumlGenerator.output(effects);

        // write to target file
        this._writeTarget(activities)
            .catch((error: Error) => this._exitWithError(error.message))
            .then(() => this._exitSuccessful());
    }

    private _writeTarget(content: string): Promise<boolean | Error> {
        return new Promise((resolve, reject) => {
            writeFile(this._targetFilePath, content, TARGET_ENCODING, (error: Error) => {
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
