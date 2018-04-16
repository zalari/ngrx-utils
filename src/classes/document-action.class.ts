import { Action } from '@ngrx/store';

// base class for tagging instances of document actions for runtime evaluation
export class DocumentAction implements Action {
    type: string;
}
