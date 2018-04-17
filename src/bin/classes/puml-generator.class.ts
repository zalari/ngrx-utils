import { DiagramType } from '../enum/diagram-type.enum';
import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';
import { PumlActivityGenerator } from './puml-activity-generator.class';
import { PumlSequenceGenerator } from './puml-sequence-generator.class';

export class PumlGenerator implements Generator {

    constructor(private _diagramType: DiagramType = DiagramType.Activity) {}

    /**
     * generates the PlantUML results
     * @param {EffectExchangeTypes[]} effects
     * @returns {string[]}
     */
    generate(effects: EffectExchangeTypes[]): string[] {
        let generator: Generator;

        // get reference to the matching generator
        switch (this._diagramType) {
            default:
            case DiagramType.Activity:
                generator = new PumlActivityGenerator();
                break;

            case DiagramType.Sequence:
                generator = new PumlSequenceGenerator();
                break;
        }

        // return the generated results
        return generator.generate(effects);
    }

    /**
     * output a ready-to-write-to-file string with the needed ambient meta data
     * @param {EffectExchangeTypes[]} effects
     * @returns {string}
     */
    output(effects: EffectExchangeTypes[]): string {

        // combine header, footer and generated results
        const puml = [
            this._generateHeader(),
            ...this.generate(effects),
            this._generateFooter()
        ];

        // join using new lines
        return puml.join('\n');
    }

    /**
     * generates the PlantUml file header
     * @returns {string}
     * @private
     */
    private _generateHeader(): string {
        return `@startuml`;
    }

    /**
     * generates the PlantUml file footer
     * @returns {string}
     * @private
     */
    private _generateFooter(): string {
        return `@enduml`;
    }

}
