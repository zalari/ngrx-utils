import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as handlebars from 'handlebars';

// add firstEntry helper
// deliberately use a function, because the this context in the helper fn is set by handlebars
/* tslint:disable-next-line:only-arrow-functions */
handlebars.registerHelper('firstEntry', function (list: any[]) {
  const [first, ...rest] = list;
  return first;
});

export class PumlActivityGeneratorV2 implements Generator {

  /**
   * generates results as PlantUML activity diagram
   * @param {EffectExchangeTypes[]} effects
   * @returns {string[]}
   */
  generate(effects: EffectExchangeTypes[]): string[] {
    return effects.map((effect: EffectExchangeTypes) => this._generateEntry(effect));
  }

  /**
   * generates an activity entry for a single effect
   * @param {EffectExchangeTypes} effect
   * @returns {string}
   * @private
   */
  private _generateEntry(effect: EffectExchangeTypes): string {
    const inputActions = effect.inputTypes;
    const outputActions = effect.outputTypes;


    // nasty runtime-safe-guard to prevent tsc from compiling
    // TODO: fix passing undefined and only do the magic on actual annotated effects...
    const assertNoUndef = (effect: any) => {
      if (effect.taggingDecorators) {
        return effect.taggingDecorators;
      } else {
        throw new Error('Sorryz!');
      }
    };
    // take the actual (first) tagging decorator and load
    // TODO: add sanity check
    const taggingDecorator = assertNoUndef(effect)
      .shift()
      .replace('_', '');
    // TODO: add .hbs to templates
    const taggingDecoratorTemplateFile = _.kebabCase(taggingDecorator) + '.puml';
    // its handlebar template
    const template = fs.readFileSync(`${__dirname}/../templates/${taggingDecoratorTemplateFile}`, 'utf8');

    // compile and evaluate with context
    const compiledTemplate = handlebars
      .compile(template)({
        inputActions,
        outputActions,
        effectName: effect.memberName
      })
      // remove @startml and @enduml
      .replace('@startuml', '')
      .replace('@enduml', '');

    return compiledTemplate;

  }


}
