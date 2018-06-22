import { Action } from '@ngrx/store';

// base class for tagging instances of command actions for runtime evaluation
export class CommandAction implements Action {
  type: string;
}
