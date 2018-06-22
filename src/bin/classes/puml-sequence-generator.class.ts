import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';

export class PumlSequenceGenerator implements Generator {

  /**
   * generates results as PlantUML sequence diagram
   * @param {EffectExchangeTypes[]} effects
   * @returns {string[]}
   */
  generate(effects: EffectExchangeTypes[]): string[] {
    return [
      'left to right direction',
      ...effects.map((effect: EffectExchangeTypes) => this._generateEntry(effect))
    ];
  }

  /**
   * generates a sequence entry for a single effect
   * @param {EffectExchangeTypes} effect
   * @returns {string}
   * @private
   */
  private _generateEntry(effect: EffectExchangeTypes): string {
    if (effect.inputTypes === undefined || effect.outputTypes === undefined) {
      return '';
    }

    const relations: string[] = [];
    (effect.inputTypes as string[]).forEach((inputType: string) => {
      (effect.outputTypes as string[]).forEach((outputType: string) => {
        relations.push(`(${inputType}) -> (${outputType}) : ${effect.memberName}`);
      });
    });

    return relations.join('\n');
  }

}
