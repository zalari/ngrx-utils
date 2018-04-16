import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';

export class PumlGenerator {

    generateActivity(effect: EffectExchangeTypes): string {
        return `
            |Dispatchers|
            :DynamicAufgabeRedirectGuard;
            |Effects|
            :LoadAufgabeCommand;
            :AufgabeLoadedEvent;
            detach
        `;
    }

    generateActivities(effects: EffectExchangeTypes[]): string {
        // combine header, footer and single activities
        const puml = [
            this._generateHeader(),
            ...effects.map((effect: EffectExchangeTypes) => this.generateActivity(effect)),
            this._generateFooter()
        ];

        // join using new lines
        return puml.join('\n');
    }

    private _generateHeader(): string {
        return `@startuml`;
    }

    private _generateFooter(): string {
        return `@enduml`;
    }

}
