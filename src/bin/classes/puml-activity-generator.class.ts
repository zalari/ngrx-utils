import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';

export class PumlActivityGenerator implements Generator {

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
        let inputActions = '';
        let outputActions = '';
        const joinActions = (actions: string[]) => actions.reduce((joined: string, action: string) => `${joined}:${action};\n`, '');

        if (effect.inputTypes !== undefined) {
            inputActions = joinActions(effect.inputTypes);
        }
        if (effect.outputTypes !== undefined) {
            outputActions = joinActions(effect.outputTypes);
        }

        return `
|In|
${inputActions}
|Out|
${outputActions}
detach
        `;
    }

}
