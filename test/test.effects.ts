import { Observable } from 'rxjs/Observable';
import { concatMap, map } from 'rxjs/operators';

import { Actions, Effect, ofType } from '@ngrx/effects';

import { CommandAction } from '../src/classes/command-action.class';
import { EventAction } from '../src/classes/event-action.class';
import { _AggregatorDecider } from '../src/decorators/effects/deciders/_aggregator-decider.decorator';

// actions
export enum LayoutCommandTypes {
    OpenSidenav = '[Layout] Open Sidenav',
    CloseSidenav = '[Layout] Close Sidenav',
    LogSidenav = '[Layout] Log Sidenav'
}
export enum LayoutEventTypes {
    SidenavOpened = '[Layout] Sidenav Opened',
    SidenavClosed = '[Layout] Sidenav Closed',
    SidenavToggled = '[Layout] Sidenav toggled'
}

// commands
export class OpenSidenavCommand implements CommandAction {
    readonly type = LayoutCommandTypes.OpenSidenav;
}

export class CloseSidenavCommand implements CommandAction {
    readonly type = LayoutCommandTypes.CloseSidenav;
}

export class LogSidenavCommand implements CommandAction {
    readonly type = LayoutCommandTypes.LogSidenav;
}

// events
export class SidenavOpenedEvent implements EventAction {
    readonly type = LayoutEventTypes.SidenavOpened;
}

export class SidenavClosedEvent implements EventAction {
    readonly type = LayoutEventTypes.SidenavClosed;
}

export class SidenavToggledEvent implements EventAction {
    readonly type = LayoutEventTypes.SidenavToggled;
}

export type LayoutCommands = OpenSidenavCommand | CloseSidenavCommand | LogSidenavCommand;
export type LayoutEvents = SidenavOpenedEvent | SidenavClosedEvent | SidenavToggledEvent;

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

        case LayoutEventTypes.SidenavToggled:
            return state;

        default:
            return state;
    }
}

// selectors
export const isSidenavVisible = (state: State) => state.showSidenav;

// effects
export class LayoutEffects {

    @Effect()
    SIDENAV_OPENED: Observable<SidenavOpenedEvent> = this._actions.pipe(
        ofType<LayoutCommands>(LayoutCommandTypes.OpenSidenav),
        map(() => new SidenavOpenedEvent())
    );

    @Effect()
    SIDENAV_CLOSED: Observable<SidenavClosedEvent> = this._actions.pipe(
        ofType<LayoutCommands>(LayoutCommandTypes.CloseSidenav),
        map(() => new SidenavClosedEvent())
    );

    // TODO: add all effect types from nrwl.io

    @Effect()
    // Splitter
    WEIRD_SIDENAV: Observable<SidenavClosedEvent | LogSidenavCommand> = this._actions.pipe(
        ofType<LayoutCommands>(LayoutCommandTypes.CloseSidenav),
        concatMap(() => [
            new SidenavClosedEvent(),
            new LogSidenavCommand()
        ])
    );

    @Effect()
    @_AggregatorDecider()
    ALL_SIDENAV: Observable<SidenavToggledEvent> = this._actions.pipe(
        ofType<LayoutCommands>(
            LayoutCommandTypes.OpenSidenav,
            LayoutCommandTypes.CloseSidenav
        ),
        map(() => new SidenavToggledEvent())
    );

    constructor(private _actions: Actions) {}
}
