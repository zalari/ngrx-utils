import { EffectExchangeTypes } from '../interface/effect-exchange-types.interface';
import { Generator } from '../interface/puml-generator.interface';
import { ActivityJoinSyntax } from '../enum/activity-join-syntax.enum';
import { ActivityType } from '../enum/activity-type.enum';
import { ArrowType } from '../enum/arrow-type.enum';

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
      inputActions = this._joinActions(effect.inputTypes, ActivityJoinSyntax.Fork, ActivityType.In);
    }

    // join output actions
    if (effect.outputTypes !== undefined) {
      outputActions = this._joinActions(effect.outputTypes, ActivityJoinSyntax.Split, ActivityType.Out);
    }

    // combine actions in swim lanes
    const inputs = [
      '|In|',
      'start',
      this._wrapArrow(effect.memberName),
      inputActions
    ];
    const outputs = [
      '|Out|',
      outputActions,
      'detach'
    ];

    // add the name(s) of the tagging decorator(s) if present
    if (effect.taggingDecorators !== undefined && effect.taggingDecorators.length > 0) {
      inputs.push(this._wrapArrow(effect.taggingDecorators.join(', ')));
    }

    // join by new lines
    return [
      ...inputs,
      ...outputs,
      ''
    ].join('\n');
  }

  /**
   * joins actions by using the given syntax
   * @param {string[]} actions
   * @param {} joinSyntax
   * @param {ActivityType} type
   * @returns {string}
   * @private
   */
  private _joinActions(actions: string[], joinSyntax: ActivityJoinSyntax, type: ActivityType): string {
    // we require at least one action
    if (actions.length < 1) {
      return '';
    }
    // single actions just have to be wrapped as activity
    else if (actions.length === 1) {
      return this._wrapAction(actions[0], '', type);
    }
    // multiple actions have to be joined
    else {
      return [
        // the first branch is just prefixed with 'fork' or 'split'
        this._wrapActionJoinBranch(actions.shift() as string, joinSyntax, type, true),
        // all other branches have to use 'fork again' or 'split again'
        ...actions.map((action: string) => this._wrapActionJoinBranch(action, joinSyntax, type, false)),
        // to finish joining the branches use 'endfork' or 'endsplit'
        `end${joinSyntax}`
      ].join('\n');
    }
  }

  /**
   * wraps a branch with the required join syntax
   * @param {string} action
   * @param {} joinSyntax
   * @param {ActivityType} type
   * @param {boolean} isFirst
   * @param {string} prefix
   * @returns {string}
   * @private
   */
  private _wrapActionJoinBranch(action: string, joinSyntax: ActivityJoinSyntax, type: ActivityType, isFirst = false, prefix = '\t'): string {
    const branch: string[] = [
      // the first branch is just prefixed with 'fork' or 'split', all
      // subsequent branches have to use 'fork again' or 'split again'
      isFirst ? joinSyntax : `${joinSyntax} again`,
      `${this._wrapAction(action, prefix, type)}`
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
   * @param {ActivityType} type
   * @returns {string}
   * @private
   */
  private _wrapAction(action: string, prefix = '', type: ActivityType = ActivityType.Default): string {
    return `${prefix}:${action}${type}`;
  }

  /**
   * wraps a text with arrow syntax
   * @param {string} arrowText
   * @param {string} prefix
   * @param {ArrowType} type
   * @returns {string}
   * @private
   */
  private _wrapArrow(arrowText: string, prefix = '', type: ArrowType = ArrowType.Default): string {
    let arrow = '->';

    // non default arrow types are added in square brackets
    if (type !== ArrowType.Default) {
      arrow = `-[${type}]->`;
    }

    return `${prefix}${arrow} ${arrowText};`;
  }

}
