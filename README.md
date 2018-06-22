[![Build Status](https://travis-ci.org/zalari/ngrx-utils.svg?branch=master)](https://travis-ci.org/zalari/ngrx-utils)
[![GitHub version](https://badge.fury.io/gh/zalari%2Fngrx-utils.svg)](https://badge.fury.io/gh/zalari%2Fngrx-utils)
[![npm version](https://badge.fury.io/js/%40zalari%2Fngrx-utils.svg)](https://badge.fury.io/js/%40zalari%2Fngrx-utils)
# Ngrx utils
A library containing tagging decorators for [@ngrx] to help implementing the
[Nrwl conventions][nrwl.io] for [@ngrx/effects].

## Getting started
Just install the package from npm.
```:bash
npm i --save-dev @zalari/ngrx-utils
```

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

### Run
The cli tool can be run using `ngrx-utils`.

If this somehow won't work, you can use `node_modules/.bin/ngrx-utils` on Linux or Mac, or 
`node_modules/.bin/ngrx-utils.cmd` on Windows.

### Options
The options can be shown by running `ngrx-utils --help`:
```:bash
    -V, --version                      output the version number
    -c, --config <path>                path to tsconfig.json
    -s, --source <path>                path to ngrx effects source file
    -d, --diagram <activity|sequence>  the diagram type to use (default: activity)
    -h, --help                         output usage information
```

### Example using the test data
* A simple test case is: `ngrx-utils --config test/test.tsconfig.json --source test/test.effects.ts`.
* Globbing source files: `ngrx-utils --config test/test.tsconfig.json --source **/*.effects.ts`.
* Extended tsconfig.json: `ngrx-utils --config test/test-extending.tsconfig.json --source **/*.effects.ts`.

> By default the [Angular CLI][@angular/angular-cli] creates a base `tsconfig.json` in the root directory which is extended by specific
config files in the `src` folder (e.g. `tsconfig.app.json`) by using the `extends` property. The CLI tool recognizes this property and
loads all extended configs recursively and merges the `compilerOptions`.

### Run tests
The tests are based on [Mocha] and [Chai].

`npm run test`

[@ngrx]: https://github.com/ngrx/platform
[@ngrx/effects]: https://github.com/ngrx/platform/tree/master/docs/effects
[@ngrx/actions]: https://github.com/ngrx/platform/blob/master/docs/store/actions.md#typed-actions

[@angular/angular-cli]: https://github.com/angular/angular-cli

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
