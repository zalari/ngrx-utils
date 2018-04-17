import { EffectExchangeTypes } from './effect-exchange-types.interface';

export interface Generator {
    generate(effects: EffectExchangeTypes[]): string[];
}
