# @forzalabs/core

Dependency-free TypeScript core utilities used across Forza Labs projects: preconditions, common array/string/number algorithms, and a deterministic simulation testing engine.

- **Zero runtime dependencies.** Nothing is pulled into your tree.
- **ESM-only**, ships its own type declarations and source maps.
- **Fails fast.** Public functions check their preconditions and throw with a human-readable reason.

## Install

```sh
npm install @forzalabs/core
```

Requires Node 18 or newer. The package is ESM-only — from a CommonJS file, reach it with a dynamic import:

```js
const { algo } = await import('@forzalabs/core')
```

## Usage

```ts
import { affirm, algo, DSTE } from '@forzalabs/core'
```

### `affirm` — preconditions

Guards that throw when an assumption does not hold. Call them at the top of a function, one per line, so corrupt state never propagates.

```ts
affirm(userId, 'Missing required parameter userId')
affirm.hasValue(count, 'count must be present')        // 0 and '' are valid; null/undefined are not
affirm.hasItems(rows, 'rows must be non-empty')
affirm.noDupes(ids, 'ids must be unique')
affirm.noDupedItems(users, 'email', 'emails must be unique')
```

| Function | Throws unless |
| --- | --- |
| `affirm(value, msg?)` | `value` is truthy |
| `affirm.hasValue(value, msg?)` | `value` is neither `null` nor `undefined` |
| `affirm.hasItems(array, msg?)` | `array` is an array with at least one item |
| `affirm.doesntInclude(value, array, msg?)` | `value` is truthy **and** `array` does not contain it |
| `affirm.doesntExist(item, array, key, msg?)` | see the note below — current behaviour is inverted |
| `affirm.noDupes(array, msg?)` | `array` has no repeated values |
| `affirm.noDupedItems(array, key, msg?)` | `array` has no repeated values at `key` |

Every guard throws `Error("Affirm failed: <msg>")`, so the reason travels with the stack.

> **Known issue — `affirm.doesntExist`.** Despite its name, it currently throws when `item` is *absent*
> from `array` and passes when it is *present*, i.e. it asserts the opposite of what it reads as. Treat it
> as unusable until this is resolved; use `affirm.noDupedItems` for the duplicate check it looks like it
> performs. Note also that `doesntInclude` calls `affirm(value)` first, so a falsy `value` such as `0`
> throws regardless of the array's contents.

### `algo` — algorithms

```ts
algo.uniq([1, 1, 2])                        // [1, 2]
algo.uniqBy(users, 'id')                    // the distinct id values
algo.groupBy(users, 'role')                 // Map<role, User[]>
algo.orderBy(users, 'age', 'desc')          // a sorted copy; the input is untouched
algo.first(rows) / algo.last(rows)          // guarded head / tail
algo.sum(nums) / algo.mean(nums)            // 0 on an empty array
algo.min(nums) / algo.max(nums)
algo.round(1.23456, 3)                      // 1.235 (2 decimals by default)
algo.locations('abcabc', 'b')               // [1, 4]
algo.replaceAll('a-b-c', '-', '+')          // 'a+b+c'
algo.isGlob('addr*Street')                  // true
algo.globCaptures('addr*Street', 'addr0Street')  // ['0'], or null when it does not match
algo.deepClone(value)                       // structural copy via JSON
await algo.sleep(250)                       // rejects a non-positive delay

algo.hasVal(0)                              // true — only null/undefined are absent
algo.isNumber(value)                        // typeof check; note NaN is a number
algo.rng(1, 10)                             // random integer in [min, max]
algo.duplicates([1, 1, 2, 3, 3])            // [1, 1, 3, 3] — every occurrence, not one per value
algo.duplicatesObject(rows, 'id')           // same, keyed on a field
algo.chunkString(text, size)                // see the note below
```

`orderBy` and `deepClone` return new values rather than mutating their input. `globCaptures` matches
everything outside a wildcard literally, so a pattern is never a regular expression in disguise.
`deepClone` goes through JSON, so it drops `undefined`, functions, and `Map`/`Set`, and turns `Date`
into a string.

> **Known issues.** `chunkString` is broken: its slice end is miscomputed, so
> `chunkString('abcdefgh', 3)` returns `["abc", "", "def"]` instead of `["abc", "def", "gh"]`. And `rng`
> guards its bounds with a truthiness check, so a `min` of `0` — `rng(0, 10)` — throws rather than being
> accepted. Avoid both until they are fixed.

### `DSTE` — deterministic simulation testing engine

`DSTE` centralizes the non-deterministic calls a program makes — the clock and the random source — behind one seam, so they can later be replaced with reproducible implementations without touching call sites.

```ts
import { DSTE } from '@forzalabs/core'

DSTE.random()   // use instead of Math.random()
DSTE.now()      // use instead of new Date()
```

It also carries a minimal test runner. `tests` returns a tally, so a suite can set its own exit code:

```ts
const summary = await DSTE.tests([
    DSTE.test('sum adds the values', () => algo.sum([1, 2, 3]) === 6),
    DSTE.test('an async case works too', async () => {
        await algo.sleep(1)
        return true
    }),
])

process.exit(summary.failCount > 0 ? 1 : 0)
```

A test that throws is reported as a failure with its message and stack, rather than aborting the run.

## Exported types

`IDSTEOptions`, `ITestResult`, `ITestSummary`.

## Development

```sh
npm install
npm run build      # clean + tsc into dist/
npm run dev        # tsc --watch
npm run typecheck  # types only, no emit
npm test           # build, then run the suite against dist/
```

The suite in [tests/Core.test.ts](tests/Core.test.ts) imports from `dist/` rather than `src/`, so a run also proves the built package resolves under Node's ESM loader. It is executed with Node's native TypeScript stripping, which needs Node 22.18+ — a development-only requirement that does not apply to consumers.

## License

[MIT](LICENSE) © Forza Labs
