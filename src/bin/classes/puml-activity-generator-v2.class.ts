import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';

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
        console.log('I should draw effect:', effect);

        // take the actual (first) tagging decorator and load
        // TODO: add sanity check
        const taggingDecorator = effect.taggingDecorators.shift().replace('_', '');
        // TODO: add .hbs to templates
        const taggingDecoratorTemplateFile = _.kebabCase(taggingDecorator) + '.puml';
        // its handlebar template
        const template = fs.readFileSync(`src/bin/templates/${taggingDecoratorTemplateFile}`, 'utf8');

        // compile and evaluate with context
        const compiledTemplate = handlebars
            .compile(template)({
                inputActions,
                outputActions,
                effectName: ''
            })
            // remove @startml and @enduml
            .replace('@startuml', '')
            .replace('@enduml', '');

        return compiledTemplate;

    }


}
