import { readFile, writeFile } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';

import * as argvAutoGlob from 'argv-auto-glob';
import * as commander from 'commander';
import * as ProgressBar from 'progress';
import * as pack from '../../../package.json';
import Project, { ClassInstanceMemberTypes, Diagnostic, SourceFile, ts } from 'ts-simple-ast';

import { DiagramType } from '../enum/diagram-type.enum';
import { EffectsParser } from './effects-parser.class';
import { PumlGenerator } from './puml-generator.class';
import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { CompilerOptions, DiagnosticCategory } from 'ts-simple-ast/dist/typescript/typescript';

const SOURCE_ENCODING = 'utf8';
const TARGET_ENCODING = 'utf8';
const TARGET_EXT_NAME = 'puml';

export class CliTool {

  private _project: Project;

  private _progressBar: ProgressBar;

  private _sourceFiles: SourceFile[] = [];

  private _pumlGenerator: PumlGenerator;

  constructor() {
    // initialize by registering the commands
    this._registerCommands();
  }

  /**
   * if the given script contains errors, halt and output error messages
   * @param {EffectsParser} parser
   */
  checkForErrors(parser: EffectsParser) {
    // check for diagnostics
    const diagnostics: Diagnostic[] = parser.getDiagnostics();
    // check for errors only to discontinue parser
    if (diagnostics.some((diagnostic: Diagnostic) => diagnostic.getCategory() === DiagnosticCategory.Error)) {
      this._exitWithError(
        diagnostics
          .map((sourceFileDiagnostic: Diagnostic) => {
            return sourceFileDiagnostic
              .getMessageText()
              .toString();
          })
          .join('\n')
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
          .join('\n')
      );
    }
  }

  /**
   * gather the effect types
   * @param {EffectsParser} parser
   * @returns {EffectExchangeTypes[]}
   */
  getEffectExchangeTypes(parser: EffectsParser): EffectExchangeTypes[] {
    const decoratedMembers = parser.getEffectDecoratedMembers();
    if (decoratedMembers === undefined) {
      this._exitWithError(`No effects found in source file`);
    }

    return (decoratedMembers as ClassInstanceMemberTypes[]).map((decoratedMember: ClassInstanceMemberTypes) => {
      const memberName = parser.getEffectName(decoratedMember);
      const taggingDecorators = parser.getTaggingDecorators(decoratedMember);
      // we try to use the actions passed by the specific taggingDecorator;
      // if they have not been passed :( , resort to deduction logic from actual code
      const inputTypesByDecorator = parser.getInputActionsFromDecorator(decoratedMember);
      const inputTypes = inputTypesByDecorator ? inputTypesByDecorator : parser.getInputTypes(decoratedMember);

      const outputTypesByDecorator = parser.getOutputActionsFromDecorator(decoratedMember);
      const outputTypes = outputTypesByDecorator ? outputTypesByDecorator : parser.getOutputTypes(decoratedMember);

      return { memberName, taggingDecorators, inputTypes, outputTypes };
    });
  }

  /**
   * register the commander options and read the arguments
   * @private
   */
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

    // resolve the compiler options from the eventually extended base config (`extends`)
    this._loadConfig(commander.config)
      .then((compilerOptions: CompilerOptions) => {
        // create a project
        this._project = new Project({
          compilerOptions,
          addFilesFromTsConfig: false
        });

        // add source file and keep reference
        this._sourceFiles = [
          ...commander.source,
          // TODO: collect variadic source argument and remove quick fix, s. https://github.com/tj/commander.js/issues/571
          // thus we have to merge all unresolved args as long as `source` is the only variadic argument
          ...commander.args
        ].map((sourcePath: string) => this._project.addExistingSourceFile(sourcePath));

        // instantiate progress bar
        this._progressBar = new ProgressBar('[:bar] :current/:total (:percent) :target', {
          complete: '#',
          incomplete: ' ',
          total: this._sourceFiles.length,
          width: 50
        });
        this._progressBar.render({ target: '' });

        // instantiate puml generator with diagram type
        this._pumlGenerator = new PumlGenerator(commander.diagram);

        // now we're set up to process the command
        this._processCommand();
      })
      .catch((error) => this._exitWithError(error.toString()));
  }

  /**
   * process the commands
   * @private
   */
  private _processCommand() {
    Promise
      .all(this._sourceFiles.map((sourceFile: SourceFile) => this._processSourceFile(sourceFile)))
      .catch((error: Error) => this._exitWithError(error.message))
      .then(() => this._exitSuccessful());
  }

  /**
   * process a given source file asynchronously
   * @param {SourceFile} sourceFile
   * @return {Promise<boolean | Error>}
   * @private
   */
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
    const target = `- ${targetBaseName}`;

    // update progress
    this._progressBar.tick({ target });

    // write to target file
    return this._writeTarget(targetFilePath, activities);
  }

  /**
   * reads the compiler options from a config and parses the result
   * @param config
   * @param {string} basepath
   * @return {CompilerOptions}
   * @private
   */
  private _getCompilerOptions(config: any, basepath: string): CompilerOptions {
    return ts.convertCompilerOptionsFromJson(config, basepath).options;
  }

  /**
   * resolves the compiler options from the eventually extended base config (`extends`)
   * @param {string} path
   * @param {CompilerOptions} extendingCompilerOptions
   * @return {Promise<CompilerOptions>}
   * @private
   */
  private _loadConfig(path: string, extendingCompilerOptions: CompilerOptions = {}): Promise<CompilerOptions> {
    return new Promise<CompilerOptions>((resolve, reject) => {
      readFile(path, SOURCE_ENCODING, ((error: NodeJS.ErrnoException, data: string) => {
        if (error) {
          reject(error);
        }

        // read the config from data
        const basepath = dirname(path);
        const config = JSON.parse(data);
        let compilerOptions: CompilerOptions = {};

        if ('compilerOptions' in config) {
          compilerOptions = this._getCompilerOptions(config.compilerOptions, basepath);
        }

        // merge the eventually given extending configs
        const mergedCompilerOptions = {
          ...compilerOptions,
          ...extendingCompilerOptions
        };

        // if the config extends another, load it
        if ('extends' in config) {
          const extendedPath = resolvePath(basepath, config.extends);
          // TODO: how could we make this better? async / await? simply return?
          this._loadConfig(extendedPath, mergedCompilerOptions)
            .then(resolve)
            .catch(reject);
        }
        // or resolve the merged options
        else {
          resolve(mergedCompilerOptions);
        }
      }));
    });
  }

  /**
   * writes the result to the target path
   * @param {string} filePath
   * @param {string} content
   * @return {Promise<boolean | Error>}
   * @private
   */
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

  /**
   * exit the tool with an error message (status code 1)
   * @param {string} message
   * @private
   */
  private _exitWithError(message: string) {
    this._progressBar.interrupt(message);
    this._progressBar.terminate();
    process.exit(1);
  }

  /**
   * exit the tool with a success message (status code 0)
   * @private
   */
  private _exitSuccessful() {
    process.exit(0);
  }

}
