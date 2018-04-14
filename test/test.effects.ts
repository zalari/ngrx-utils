import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';

// actions
export enum LayoutCommandTypes {
    OpenSidenav = '[Layout] Open Sidenav',
    CloseSidenav = '[Layout] Close Sidenav'
}
export enum LayoutEventTypes {
    SidenavOpened = '[Layout] Sidenav Opened',
    SidenavClosed = '[Layout] Sidenav Closed'
}

// commands
export class OpenSidenavCommand implements Action {
    readonly type = LayoutCommandTypes.OpenSidenav;
}

export class CloseSidenavCommand implements Action {
    readonly type = LayoutCommandTypes.CloseSidenav;
}

// events
export class SidenavOpenedEvent implements Action {
    readonly type = LayoutEventTypes.SidenavOpened;
}

export class SidenavClosedEvent implements Action {
    readonly type = LayoutEventTypes.SidenavClosed;
}

export type LayoutCommands = OpenSidenavCommand | CloseSidenavCommand;
export type LayoutEvents = SidenavOpenedEvent | SidenavClosedEvent;

// state
export interface State {
    showSidenav: boolean;
}

const initialState: State = {
    showSidenav: false
};

// reducer
export function reducer(
    state: State = initialState,
    action: LayoutEvents
): State {
    switch (action.type) {
        case LayoutEventTypes.SidenavClosed:
            return {
                ...state,
                showSidenav: false
            };

        case LayoutEventTypes.SidenavOpened:
            return {
                ...state,
                showSidenav: true
            };

        default:
            return state;
    }
}

// selectors
export const isSidenavVisible = (state: State) => state.showSidenav;

// effects
export class LayoutEffects {

    @Effect()
    SIDENAV_OPENED: Observable<Action> = this._actions.pipe(
        ofType<LayoutCommands>(LayoutCommandTypes.OpenSidenav),
        map(() => new SidenavOpenedEvent())
    );

    @Effect()
    SIDENAV_CLOSED: Observable<Action> = this._actions.pipe(
        ofType<LayoutCommands>(LayoutCommandTypes.CloseSidenav),
        map(() => new SidenavClosedEvent())
    );

    constructor(private _actions: Actions) {}
}
