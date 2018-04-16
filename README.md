# Ngrx utils
A library containing tagging decorators for [@ngrx] to help implementing the
[Nrwl conventions][nrwl.io] for [@ngrx/effects].

## Runtime evaluation
This package includes tagging decorators and classes for runtime evaluation.

### [Action classes][Categories of Actions]
* [CommandAction][Command]
* [DocumentAction][Document]
* [EventAction][Event]

Usage example:
```:typescript
// command types as string based enums
export enum ExampleCommandTypes {
    Foo = '[Example] Foo'
}

// commands
export class FooCommand implements CommandAction {
    readonly type = ExampleCommandTypes.Foo;
}
```

### Tagging decorators for [Actions][@ngrx/actions]
The effects are distinguished into two groups, [Deciders] and [Transformers].

#### Action [Deciders]
* [AggregatorDecider]
* [ContentBasedDecider]
* [ContextBasedDecider]
* [FilteringDecider]
* [SplitterDecider]

#### Action [Transformers]
* [EnrichTransformer]
* [NormalizeTransformer]

## CLI tool
Additionally a command line tool is included to generate [activity diagrams][Activity diagram]
in the [PlantUML] file format from given effect files.

### Example using the test data
`npm run start -- --config test/test.tsconfig.json --source test/test.effects.ts`

### Run tests
The tests are based on [Mocha] and [Chai].

`npm run test`

[@ngrx]: https://github.com/ngrx/platform
[@ngrx/effects]: https://github.com/ngrx/platform/tree/master/docs/effects
[@ngrx/actions]: https://github.com/ngrx/platform/blob/master/docs/store/actions.md#typed-actions

[nrwl.io]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5
[Categories of Actions]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#8d68
[Command]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#219c
[Document]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#3385
[Event]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#68eb

[Deciders]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#ae62
[AggregatorDecider]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#6e15
[ContentBasedDecider]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#ab44
[ContextBasedDecider]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#19ad
[FilteringDecider]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#d712
[SplitterDecider]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#cdd3

[Transformers]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#ada3
[EnrichTransformer]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#4da0
[NormalizeTransformer]: https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5#5ee1

[PlantUML]: http://plantuml.com/
[Activity diagram]: http://plantuml.com/activity-diagram-beta
[Mocha]: https://mochajs.org/
[Chai]: http://www.chaijs.com/
