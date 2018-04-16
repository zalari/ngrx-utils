import { Action } from '@ngrx/store';

// base class for tagging instances of event actions for runtime evaluation
export class EventAction implements Action {
    type: string;
}
