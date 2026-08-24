# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conventions

- **Assertions via `affirm`**, not raw throws or `assert`: `import { affirm } from '@remora/app-core'` — `affirm(x, 'msg')`, `affirm.hasItems(arr, ...)`, `affirm.noDupes(names, ...)`.
- **Naming**: singleton pattern `class FooClass {}; const Foo = new FooClass(); export default Foo`. Interfaces prefixed `I` (`IConsumer`). Types live in `packages/definitions`.
- **TypeScript**: `strict: false` across the repo; `moduleResolution: bundler`; targets ES2020/ESNext. `_tests/` and `scripts/` excluded from builds.
- **Style**: enforced by ESLint + `@stylistic` (see Engineering principles for the shared rules). Repo-specific: 1TBS braces, `arrow-parens: as-needed` (`x => x + 1`), and `no-explicit-any` is a warning, not an error.
- Cross-package imports always go through the package's `@remora/app-*` name and its `index.ts` barrel, never deep relative paths across packages. After changing a package, re-run `sync:internal` (or have `watch:internal` running) so consumers pick up the rebuilt `dist/`.

## Runtime / environment

- Config is loaded from a `remora/` project directory (`REMORA_DATA_PATH` / `/app/data/remora` in Docker) via `Environment.load()`.
- Key env vars: `REMORA_LICENCE_KEY` (CLI refuses to run without a valid licence), `REMORA_RUNTIME_CONTEXT` (defaults to `cli`), `REMORA_WORKERS_PATH`, `REMORA_DEBUG_MODE` (enables rotating file logging), `JWT_SECRET`, `ADMIN_JWT_SECRET`, `ROOT_TEMP_PASSWORD`, `INSTALLATION_ID`, `REMORA_MASK_IN_DEV`.
- Adding a **new source type**: create a driver in `packages/drivers/src/`, register it in `DriverFactory`, extend the source schema/`ISourceAuthentication`, and implement the driver interface methods.
- Adding a **new consumer output format**: extend the output type in [Consumer.ts](packages/definitions/src/resources/Consumer.ts) and its handling in the executor/output path.

---

# Engineering principles

Cross-project guidelines I apply everywhere. Where they touch formatting, ESLint + `@stylistic` is the enforcing authority (see the repo Conventions above).

## Simplicity

- Simplicity is a requirement, not a compromise. It is usually the hardest revision, not the first attempt.
- Max 3 levels of nesting. Deep nesting means unclear control flow.
- Centralize control flow: keep `switch`/`if` in a parent function, push branch logic into separate functions.
- Centralize state manipulation: hold state in the parent, pass it down, apply changes in the parent.
- Minimize dependencies, external services, and tooling. Each adds unknown behavior, failure points, and lock-in. Use only when they accelerate a critical path, and be ready to remove them.
- Keep the whole system in one repository and one environment. A new hire should clone the repo and understand the entire product. Avoid stored procedures and code scattered across separate places.

## Design

- Every line of code is a liability. Write less; write it with care.
- Design for performance from day one — solve it on paper before implementing. You don't have to build it immediately, but know how you will.
- Design for one order of magnitude more load than you realistically expect.
- Optimize developer iteration speed; fast test/iterate cycles compound over time.
- Build the critical path first — the hardest, indispensable piece before anything else.
- Centralize business logic in tech-agnostic modules (`SomethingEngine`, `SomethingManager`, `SomethingService`), separate from presentation.
- Design with limits in mind. Always set upper bounds (loop counters, query sizes, in-memory data). Avoid unbounded `while (true)`.
- Build systems, not features. Prefer an engine that executes logic defined in data over hardcoding one-off behavior. Extending should mean changing the data fed to the engine, not the engine.
- Separate data from logic.
- Use functional patterns where possible.

## Abstractions

- Always wrap external services (database, queue, file system, logging) behind an abstraction layer to hide details and reduce lock-in.
- Factory and Strategy patterns are powerful — use them.
- Don't over-engineer. Every abstraction has a cost.
- Code against abstractions to unblock parallel work. Assume the implementation exists (e.g. a `LoggingService` interface) and let it be filled in later.

## Resiliency

- Check preconditions at the start of core functions. Fail fast before corrupt state propagates.

```typescript
function doSomething<T>(param1: T, param2: string) {
    affirm(param1, 'Missing required parameter param1')
    affirm(param2, 'Missing required parameter param2')
    // ... rest of the code
}

function affirm(value: unknown, msg?: string) {
    if (!value) throw new Error('Affirm failed: ' + msg)
}
```

- Check core/shared services' parameters exhaustively.
- One precondition per line: `check(a); check(b);` not `check(a && b)`.
- Preconditions double as documentation. Use them in UI components too — render an error state (or throw) if assumptions fail, and log on error.
- On unrecoverable error, the safe move is to stop execution immediately.
- Always give a human-readable reason when throwing.
- Prefer pure functions: same input → same output, no mutation.
- Write deterministic code. Be careful with `random`, dates, parallelism, network, DB, and file system — abstract them so they can be tested and replayed. State machines are a good model.
- Prefer stateless over stateful.
- Do it right the first time when feasible, but shipping beats over-planning — don't fear rewrites once more information exists.
- Refactor aggressively and fearlessly; it's how tech debt stays low.
- Fix bugs at the root cause, never with a workaround layered on top.
- Never use timeouts for logic. Timeouts belong only in UI interactions.

## Problem Solving

- Break the problem into chunks. Block out function signatures and expected behavior first, orchestrate them, then implement.
- Start from data shapes: define the input shape and desired output shape, then work backward. Ask "what is the easiest data shape to work with?"
- No non-trivial problem is solved in one shot. Decompose recursively; abstract away sub-problems you can assume are solved.
- Most problems are variations of known problems. Broad knowledge helps you recognize and cluster them.
- Always try the simplest solution first. Add complexity only when strictly necessary.

## Logging

- Log all exceptions and errors with function, file, and line number — plus the relevant parameters when possible.
- Separate development logging (local file) from production logging (centralized service).

## Readability

- Indent with 4 spaces. Exactly one indentation level per nested block.
- Keep code blocks to ~70 lines.
- Keep lines short enough to avoid horizontal scrolling. Break long statements into multiple statements, or lines only if needed.
- Use conditions natural to the concept (e.g. `index < length` for indexes).
- Remove unused code immediately — history lives in version control.
- Self-documenting code explains *how*. Comments explain *why*: reasoning, decisions, weird behaviors exploited on purpose, and magic numbers.
- Add semantic comments to core public functions.
- Add semantic comments important types and interfaces, commenting each field, especially when shared between modules/systems.

```typescript
const hoursPerDay = 24 // hours in a day
```

- Declare variables where they're needed, not all at the top.
- Avoid redundant syntax (no `;` when the language doesn't require it).
- Order function parameters by importance; callbacks always last.
- Watch parameter count — many parameters usually signals a design flaw.
- Avoid boolean "behavior flags" that switch what a function does; refactor instead.
- If a function needs more than 4 arguments, pass a single params object:

```typescript
type DoSomethingParams = {
    // ...
}
const doSomething = (args: DoSomethingParams) => {
    // ...
}
```

- Order functions in execution sequence (first-run at the top) where a natural order exists.
- Write descriptive commit messages explaining *why*.
- Prefer readability over optimization until performance demands it; when you optimize, comment the why.
- Choose iteration or recursion to match the data structure and problem shape.

## Naming

- Use descriptive names. Abbreviations only for short-lived, single-line temporaries.
- Avoid abbreviations unless they're a codebase-wide standard.
- `camelCase` — variables, functions, parameters, component props.
- `PascalCase` — files.
- `snake_case` — folders.
- `ALL_CAPS_CASE` — constants.
- Append units/qualifiers last: `maxLatencyMs`.
- Prefer related names of equal length so they align: `source` / `target`, not `src` / `dest`.
- Don't overload names. `LogService` should have `write()`, not `writeLog()` — context implies the rest.

## Formatting

- Max 1 blank line between code blocks. No stray blank lines.
- Max 1 space between keywords. No trailing whitespace, no space before closing blocks.
- Formatting is enforced by ESLint + `@stylistic`.