import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { concatMap, map, switchMap } from 'rxjs/operators';

import { Actions, Effect, ofType } from '@ngrx/effects';

import { CommandAction } from '../src/classes/command-action.class';
import { EventAction } from '../src/classes/event-action.class';
import { _AggregatorDecider } from '../src/decorators/effects/deciders/_aggregator-decider.decorator';
import { _SplitterDecider } from '../src/decorators/effects/deciders/_splitter-decider.decorator';
import { _FilteringDecider } from '../src/decorators/effects/deciders/_filtering-decider.decorator';
import { _Command } from '../src/decorators/actions/_command.decorator';
import { _Event } from '../src/decorators/actions/_event.decorator';
import { DocumentAction } from '../src/classes/document-action.class';
import { _Document } from '../src/decorators/actions/_document.decorator';
import { Action } from '@ngrx/store';
import { _ContentBasedDecider } from '../src/decorators/effects/deciders/_content-based-decider.decorator';
import { _ContextBasedDecider } from '../src/decorators/effects/deciders/_context-based-decider.decorator';
import { _NormalizeTransformer } from '../src/decorators/effects/transformers/_normalize-transformer.decorator';

// Define Actions by using Classes and discriminated union types

// discriminators for commands
enum TodoCommandTypes {
  AddTodo = '[Todo] ADD_TODO',
  RequestAddTodo = '[Todo] REQUEST_ADD_TODO',
  RemoveTodo = '[Todo] REMOVE_TODO',
  AppendTodo = '[Todo] APPEND_TODO',
  InsertTodo = '[Todo] INSERT_TODO',
  RemoveTodoWithConfirmation = '[Todo] REMOVE_TODO_WITH_CONFIRMATION',
  RemoveTodoWithoutConfirmation = '[Todo] REMOVE_TODO_WITHOUT_CONFIRMATION',
  LoadTodos = '[Todo] LOAD_TODOS'
}

enum GenericCommandTypes {
  LogAction = '[NgRx] LOG_ACTION'
}

// ...for events
enum TodoEventTypes {
  TodoAdded = '[Todo] TODO_ADDED',
  TodoRemoved = '[Todo] TODO_REMOVED',
  TodosLoaded = '[Todo] TODOS_LOADED'
}

// and for documents
enum TodoDocumentTypes {
  Todos = '[Todo] TODOS_DOCUMENT'
}

// Commands
@_Command()
class TodoAddTodoCommand extends CommandAction {
  readonly type = TodoCommandTypes.AddTodo;

  constructor(public payload: { todo: Partial<Todo>, addLast?: boolean }) {
    super();
  }
}

@_Command()
class TodoRemoveTodoCommand extends CommandAction {
  readonly type = TodoCommandTypes.RemoveTodo;

  constructor(public payload: { id: string }) {
    super();
  }
}

@_Command()
class TodoAppendTodoCommand extends CommandAction {
  readonly type = TodoCommandTypes.AppendTodo;

  constructor(public payload: { todo: Partial<Todo> }) {
    super();
  }
}

@_Command()
class TodoInsertTodoCommand extends CommandAction {
  readonly type = TodoCommandTypes.InsertTodo;

  constructor(public payload: { todo: Partial<Todo> }) {
    super();
  }
}

@_Command()
class TodoRemoveWithConfirmationCommand extends CommandAction {
  readonly type = TodoCommandTypes.RemoveTodoWithConfirmation;

  constructor(public payload: { id: string }) {
    super();
  }
}

@_Command()
class TodoRemoveWithoutConfirmationCommand extends CommandAction {
  readonly type = TodoCommandTypes.RemoveTodoWithoutConfirmation;

  constructor(public payload: { id: string }) {
    super();
  }
}

@_Command()
class TodoLoadCommand extends CommandAction {
  readonly type = TodoCommandTypes.LoadTodos;
}

// generic commands
@_Command()
class LogActionCommand extends CommandAction {
  readonly type = GenericCommandTypes.LogAction;

  constructor(public payload: { action: Action }) {
    super();
  }
}

@_Command()
class TodoRequestAddTodoCommand extends CommandAction {
  readonly type = TodoCommandTypes.RequestAddTodo;

  constructor(public payload: { todo: Partial<Todo>, addLast: boolean }) {
    super();
  }
}

// Events
@_Event()
class TodoAddedEvent extends EventAction {
  readonly type = TodoEventTypes.TodoAdded;

  constructor(public payload: { todo: Partial<Todo>, addLast?: boolean }) {
    super();
  }
}

@_Event()
class TodoRemovedEvent extends EventAction {
  readonly type = TodoEventTypes.TodoRemoved;

  constructor(public payload: { id: string }) {
    super();
  }
}

@_Event()
class TodosLoadedEvent extends EventAction {
  readonly type = TodoEventTypes.TodosLoaded;

  constructor(public payload: { todos: Todo[] }) {
    super();
  }
}

// Documents
@_Document()
class TodosDocument extends DocumentAction {
  readonly type = TodoDocumentTypes.Todos;

  constructor(public payload: Todo[]) {
    super();
  }
}

// Union types for Action categories
type TodoCommands =
  TodoAddTodoCommand |
  TodoRemoveTodoCommand |
  TodoLoadCommand |
  TodoRemoveWithConfirmationCommand |
  TodoRemoveWithoutConfirmationCommand |
  TodoAppendTodoCommand |
  TodoInsertTodoCommand |
  never;

type TodoEvents =
  TodoAddedEvent |
  TodoRemovedEvent |
  TodosLoadedEvent |
  never;

type TodoDocuments =
  TodosDocument |
  never;

type TodoActions = TodoCommands | TodoEvents | TodoDocuments;

// Payload Types
interface Todo {
  id: string;
  content: string;
}

// state
interface State {
  todos: Todo[];
}

const initialState: State = {
  todos: []
};

// Reducer
function reducer(state: State = initialState,
                 action: any): State {
  return state;
}

// Selectors
// const isSideNavVisible = (state: State) => state.showSideNav;

// simulate environment

const environment = {
  showConfirmation: false
};

// Effects
class TodoEffects {

  @_FilteringDecider(TodoLoadCommand, TodosLoadedEvent)
  @Effect()
  LOAD_TODOS: Observable<TodosLoadedEvent> = this.actions.pipe(
    ofType<TodoLoadCommand>(TodoCommandTypes.LoadTodos),
    switchMap(action => observableOf([])),
    map(todos => new TodosLoadedEvent({ todos }))
  );

  @_FilteringDecider(TodosLoadedEvent, TodosDocument)
  @Effect()
  SET_LOADED_TODOS: Observable<TodosDocument> = this.actions.pipe(
    ofType<TodosLoadedEvent>(TodoEventTypes.TodosLoaded),
    map(action => {
      const { todos } = action.payload;
      return new TodosDocument(todos);
    })
  );

  @_ContentBasedDecider(TodoAddTodoCommand, [TodoInsertTodoCommand, TodoAppendTodoCommand])
  @Effect()
  ADD_TODO: Observable<TodoInsertTodoCommand | TodoAppendTodoCommand> = this.actions.pipe(
    ofType<TodoAddTodoCommand>(TodoCommandTypes.AddTodo),
    map(action => {
      const { addLast, todo } = action.payload;
      if (addLast) {
        return new TodoAppendTodoCommand({ todo });
      } else {
        return new TodoInsertTodoCommand({ todo });
      }
    })
  );

  @_ContextBasedDecider(TodoRemoveTodoCommand, [TodoRemoveWithoutConfirmationCommand, TodoRemoveWithConfirmationCommand])
  @Effect()
  REMOVE_TODO: Observable<TodoRemoveWithoutConfirmationCommand | TodoRemoveWithConfirmationCommand> = this.actions.pipe(
    ofType<TodoRemoveTodoCommand>(TodoCommandTypes.RemoveTodo),
    map(action => {
      const { id } = action.payload;
      if (environment.showConfirmation) {
        return new TodoRemoveWithConfirmationCommand({ id });
      } else {
        return new TodoRemoveWithoutConfirmationCommand({ id });
      }
    })
  );

  @_FilteringDecider(TodoAppendTodoCommand, TodoAddedEvent)
  @Effect()
  APPEND_TODO: Observable<TodoAddedEvent> = this.actions.pipe(
    ofType<TodoAppendTodoCommand>(TodoCommandTypes.AppendTodo),
    map(action => {
      const { todo } = action.payload;
      return new TodoAddedEvent({ todo, addLast: true });
    })
  );

  @_FilteringDecider(TodoInsertTodoCommand, TodoAddedEvent)
  @Effect()
  INSERT_TODO: Observable<TodoAddedEvent> = this.actions.pipe(
    ofType<TodoAppendTodoCommand>(TodoCommandTypes.AppendTodo),
    map(action => {
      const { todo } = action.payload;
      return new TodoAddedEvent({ todo, addLast: true });
    })
  );

  @_FilteringDecider(TodoRemoveWithoutConfirmationCommand, TodoRemovedEvent)
  @Effect()
  REMOVE_TODO_WITHOUT_CONFIRM: Observable<TodoRemovedEvent> = this.actions.pipe(
    ofType<TodoRemoveWithoutConfirmationCommand>(TodoCommandTypes.RemoveTodoWithoutConfirmation),
    map(action => {
      const { id } = action.payload;
      return new TodoRemovedEvent({ id });
    })
  );

  @_FilteringDecider(TodoRemoveWithConfirmationCommand, TodoRemovedEvent)
  @Effect()
  REMOVE_TODO_WITH_CONFIRM: Observable<TodoRemovedEvent> = this.actions.pipe(
    ofType<TodoRemoveWithConfirmationCommand>(TodoCommandTypes.RemoveTodoWithConfirmation),
    map(action => {
      const { id } = action.payload;
      return new TodoRemovedEvent({ id });
    })
  );

  @_SplitterDecider(TodoRequestAddTodoCommand, [LogActionCommand, TodoAddTodoCommand])
  @Effect()
  LOG_ADD_TODO: Observable<Action> = this.actions.pipe(
    ofType<TodoRequestAddTodoCommand>(TodoCommandTypes.RequestAddTodo),
    switchMap(action => {
      const { todo, addLast } = action.payload;
      return [
        new TodoAddTodoCommand({ todo, addLast }),
        new LogActionCommand({ action })
      ];
    })
  );

  @_AggregatorDecider([LogActionCommand, TodoAddTodoCommand], TodoAddedEvent)
  @Effect()
  WEIRD_TODO_STUFF: Observable<TodoAddedEvent> = this.actions.pipe(
    ofType<LogActionCommand>(GenericCommandTypes.LogAction),
    // this is an execercise for the astute reader or: I have an implementation, but not enough paper
    map(action => new TodoAddedEvent({ todo: {} }))
  );

  @_NormalizeTransformer([LogActionCommand, TodoAddTodoCommand, TodoRequestAddTodoCommand], TodoAddedEvent)
  @Effect()
  WEIRD_TRANSFORM: Observable<TodoAddedEvent> = this.actions.pipe(
    ofType<LogActionCommand |
      TodoAddTodoCommand |
      TodoRequestAddTodoCommand>(GenericCommandTypes.LogAction, TodoCommandTypes.AddTodo, TodoCommandTypes.RequestAddTodo),
    map(action => new TodoAddedEvent({ todo: {} }))
  );
  );

  constructor(private actions: Actions) {
  }
}
