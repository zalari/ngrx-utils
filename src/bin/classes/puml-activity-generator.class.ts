import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';
import { ActivityJoinSyntax } from '../enum/activity-join-syntax.enum';

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

        // join input actions
        if (effect.inputTypes !== undefined) {
            inputActions = this._joinActions(effect.inputTypes, ActivityJoinSyntax.Fork);
        }

        // join output actions
        if (effect.outputTypes !== undefined) {
            outputActions = this._joinActions(effect.outputTypes, ActivityJoinSyntax.Split);
        }

        // combine actions in swim lanes joined by new lines
        return [
            '|In|',
            inputActions,
            '|Out|',
            outputActions,
            'detach',
            ''
        ].join('\n');
    }

    /**
     * joins actions by using the given syntax
     * @param {string[]} actions
     * @param {ActivityJoinSyntax} joinSyntax
     * @returns {string}
     * @private
     */
    private _joinActions(actions: string[], joinSyntax: ActivityJoinSyntax): string {
        // we require at least one action
        if (actions.length < 1) {
            return '';
        }
        // single actions just have to be wrapped as activity
        else if (actions.length === 1) {
            return this._wrapAction(actions[0]);
        }
        // multiple actions have to be joined
        else {
            return [
                // the first branch is just prefixed with 'fork' or 'split'
                this._wrapActionJoinBranch(actions.shift() as string, joinSyntax, true),
                // all other branches have to use 'fork again' or 'split again'
                ...actions.map((action: string) => this._wrapActionJoinBranch(action, joinSyntax, false)),
                // to finish joining the branches use 'endfork' or 'endsplit'
                `end${joinSyntax}`
            ].join('\n');
        }
    }

    /**
     * wraps a branch with the required join syntax
     * @param {string} action
     * @param {ActivityJoinSyntax} joinSyntax
     * @param {boolean} isFirst
     * @param {string} prefix
     * @returns {string}
     * @private
     */
    private _wrapActionJoinBranch(action: string, joinSyntax: ActivityJoinSyntax, isFirst = false, prefix = '\t'): string {
        const branch: string[] = [
            // the first branch is just prefixed with 'fork' or 'split', all
            // subsequent branches have to use 'fork again' or 'split again'
            isFirst ? joinSyntax : `${joinSyntax} again`,
            `${this._wrapAction(action, prefix)}`
        ];

        // the split syntax requires us to detach every branch individually
        if (joinSyntax === ActivityJoinSyntax.Split) {
            branch.push(`${prefix}detach`);
        }

        return branch.join('\n');
    }

    /**
     * wraps a single action with activity syntax
     * @param {string} action
     * @param {string} prefix
     * @returns {string}
     * @private
     */
    private _wrapAction(action: string, prefix = ''): string {
        return `${prefix}:${action};`;
    }

}
