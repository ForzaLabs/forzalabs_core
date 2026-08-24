import { affirm, algo, DSTE } from '../dist/index.js'

/**
 * Smoke tests for the published artifact.
 *
 * These deliberately import from `dist/` rather than `src/` so a run also proves the
 * built package resolves under Node's ESM loader — the failure mode that a src-only
 * test suite cannot see. Run via `npm test`, which builds first.
 */

/** Asserts that @fn throws. Used to cover the affirm guards, whose contract is the throw. */
const throws = (fn: () => unknown): boolean => {
    try {
        fn()
        return false
    } catch {
        return true
    }
}

const summary = await DSTE.tests([
    // affirm
    DSTE.test('affirm passes on a truthy value', () => !throws(() => affirm(1, 'should not throw'))),
    DSTE.test('affirm throws on a falsy value', () => throws(() => affirm(0, 'expected'))),
    DSTE.test('affirm message is included in the error', () => {
        try {
            affirm(false, 'my reason')
            return false
        } catch (error) {
            return (error as Error).message === 'Affirm failed: my reason'
        }
    }),
    DSTE.test('affirm.hasValue accepts 0 and empty string', () =>
        !throws(() => affirm.hasValue(0)) && !throws(() => affirm.hasValue(''))),
    DSTE.test('affirm.hasValue rejects null and undefined', () =>
        throws(() => affirm.hasValue(null)) && throws(() => affirm.hasValue(undefined))),
    DSTE.test('affirm.hasItems accepts a non-empty array', () => !throws(() => affirm.hasItems([1]))),
    DSTE.test('affirm.hasItems rejects an empty array', () => throws(() => affirm.hasItems([]))),
    DSTE.test('affirm.noDupes accepts distinct values', () => !throws(() => affirm.noDupes([1, 2, 3]))),
    DSTE.test('affirm.noDupes rejects repeated values', () => throws(() => affirm.noDupes([1, 2, 2]))),
    DSTE.test('affirm.noDupedItems keys off the given field', () =>
        !throws(() => affirm.noDupedItems([{ id: 1 }, { id: 2 }], 'id'))
        && throws(() => affirm.noDupedItems([{ id: 1 }, { id: 1 }], 'id'))),
    DSTE.test('affirm.doesntExist throws when a match on the key is already present', () =>
        throws(() => affirm.doesntExist({ id: 1 }, [{ id: 1 }], 'id'))),
    DSTE.test('affirm.doesntExist passes when no entry shares the key', () =>
        !throws(() => affirm.doesntExist({ id: 9 }, [{ id: 1 }, { id: 2 }], 'id'))),
    DSTE.test('affirm.doesntExist passes against an empty array', () =>
        !throws(() => affirm.doesntExist({ id: 1 }, [], 'id'))),
    DSTE.test('affirm.doesntExist compares the key, not object identity', () =>
        throws(() => affirm.doesntExist({ id: 1, name: 'a' }, [{ id: 1, name: 'b' }], 'id'))),
    DSTE.test('affirm.doesntExist rejects a missing array', () =>
        throws(() => affirm.doesntExist({ id: 1 }, null, 'id'))),
    DSTE.test('affirm.doesntInclude passes when the value is absent', () =>
        !throws(() => affirm.doesntInclude(3, [1, 2]))),
    DSTE.test('affirm.doesntInclude throws when the value is present', () =>
        throws(() => affirm.doesntInclude(1, [1, 2]))),

    // algo — arrays
    DSTE.test('algo.hasVal distinguishes 0 from nullish', () =>
        algo.hasVal(0) === true && algo.hasVal(null) === false && algo.hasVal(undefined) === false),
    DSTE.test('algo.uniq removes duplicates', () => algo.uniq([1, 1, 2, 3, 3]).join(',') === '1,2,3'),
    DSTE.test('algo.uniq on an empty array returns empty', () => algo.uniq([]).length === 0),
    DSTE.test('algo.uniqBy projects the key', () =>
        algo.uniqBy([{ id: 1 }, { id: 1 }, { id: 2 }], 'id').join(',') === '1,2'),
    DSTE.test('algo.first returns the head', () => algo.first([7, 8, 9]) === 7),
    DSTE.test('algo.last returns the tail', () => algo.last([7, 8, 9]) === 9),
    DSTE.test('algo.first rejects an empty array', () => throws(() => algo.first([]))),
    DSTE.test('algo.orderBy sorts ascending by default', () =>
        algo.orderBy([3, 1, 2]).join(',') === '1,2,3'),
    DSTE.test('algo.orderBy sorts descending on request', () =>
        algo.orderBy([1, 3, 2], undefined, 'desc').join(',') === '3,2,1'),
    DSTE.test('algo.orderBy sorts objects by key', () =>
        algo.orderBy([{ n: 3 }, { n: 1 }], 'n').map(x => x.n).join(',') === '1,3'),
    DSTE.test('algo.orderBy does not mutate its input', () => {
        const input = [3, 1, 2]
        algo.orderBy(input)
        return input.join(',') === '3,1,2'
    }),
    DSTE.test('algo.groupBy buckets by key', () => {
        const grouped = algo.groupBy([{ k: 'a' }, { k: 'b' }, { k: 'a' }], 'k')
        return grouped.size === 2 && grouped.get('a').length === 2 && grouped.get('b').length === 1
    }),

    // algo — numbers
    DSTE.test('algo.sum adds the values', () => algo.sum([1, 2, 3]) === 6),
    DSTE.test('algo.sum of an empty array is 0', () => algo.sum([]) === 0),
    DSTE.test('algo.mean averages the values', () => algo.mean([2, 4, 6]) === 4),
    DSTE.test('algo.mean of an empty array is 0', () => algo.mean([]) === 0),
    DSTE.test('algo.min and algo.max find the bounds', () =>
        algo.min([3, 1, 2]) === 1 && algo.max([3, 1, 2]) === 3),
    DSTE.test('algo.round defaults to 2 decimals', () => algo.round(1.23456) === 1.23),
    DSTE.test('algo.round honours an explicit precision', () => algo.round(1.23456, 3) === 1.235),
    DSTE.test('algo.isNumber only accepts numbers', () =>
        algo.isNumber(1) === true && algo.isNumber('1') === false),

    // algo — strings
    DSTE.test('algo.locations finds every occurrence', () =>
        algo.locations('abcabc', 'b').join(',') === '1,4'),
    DSTE.test('algo.replaceAll replaces every match', () =>
        algo.replaceAll('a-b-c', '-', '+') === 'a+b+c'),
    DSTE.test('algo.isGlob detects a wildcard', () =>
        algo.isGlob('addr*Street') === true && algo.isGlob('addr') === false),
    DSTE.test('algo.globCaptures returns the wildcard captures', () =>
        algo.globCaptures('addr*Street', 'addr0Street').join(',') === '0'),
    DSTE.test('algo.globCaptures returns null when it does not match', () =>
        algo.globCaptures('addr*Street', 'nope') === null),
    DSTE.test('algo.globCaptures treats the pattern literally, not as a regex', () =>
        algo.globCaptures('a.c', 'abc') === null),

    // algo — rng and chunkString
    DSTE.test('algo.rng accepts a min of 0', () => {
        const value = algo.rng(0, 10)
        return value >= 0 && value <= 10
    }),
    DSTE.test('algo.rng accepts negative bounds', () => {
        const value = algo.rng(-10, -1)
        return value >= -10 && value <= -1
    }),
    DSTE.test('algo.rng stays within its bounds across many draws', () => {
        for (let i = 0; i < 1000; i++) {
            const value = algo.rng(0, 3)
            if (value < 0 || value > 3) return false
        }
        return true
    }),
    DSTE.test('algo.rng rejects NaN bounds', () => throws(() => algo.rng(NaN, 10))),
    DSTE.test('algo.rng rejects a min above its max', () => throws(() => algo.rng(10, 1))),
    DSTE.test('algo.chunkString splits evenly when the length divides', () =>
        algo.chunkString('abcdef', 3).join('|') === 'abc|def'),
    DSTE.test('algo.chunkString leaves a short tail chunk when it does not divide', () =>
        algo.chunkString('abcdefgh', 3).join('|') === 'abc|def|gh'),
    DSTE.test('algo.chunkString returns the whole text when it fits in one chunk', () =>
        algo.chunkString('ab', 5).join('|') === 'ab'),
    DSTE.test('algo.chunkString of size 1 yields one chunk per character', () =>
        algo.chunkString('abc', 1).join('|') === 'a|b|c'),
    DSTE.test('algo.chunkString loses no characters and emits no empty chunk', () => {
        const chunks = algo.chunkString('abcdefghij', 4)
        return chunks.join('') === 'abcdefghij' && chunks.every(chunk => chunk.length > 0)
    }),
    DSTE.test('algo.chunkString rejects a non-positive chunk size', () =>
        throws(() => algo.chunkString('abc', 0))),

    // algo — misc
    DSTE.test('algo.deepClone produces an independent copy', () => {
        const source = { nested: { value: 1 } }
        const copy = algo.deepClone(source)
        copy.nested.value = 2
        return source.nested.value === 1 && copy.nested.value === 2
    }),
    DSTE.test('algo.sleep resolves', async () => {
        await algo.sleep(1)
        return true
    }),
    DSTE.test('algo.sleep rejects a non-positive delay', () => throws(() => algo.sleep(0))),

    // DSTE itself
    DSTE.test('DSTE.random stays within [0, 1)', () => {
        const value = DSTE.random()
        return value >= 0 && value < 1
    }),
    DSTE.test('DSTE.now returns a Date', () => DSTE.now() instanceof Date),
    DSTE.test('DSTE.test reports a failing assertion as failed', async () => {
        const result = await DSTE.test('inner', () => false)
        return result.success === false
    }),
    DSTE.test('DSTE.test reports a thrown error as failed, not a crash of the run', async () => {
        const result = await DSTE.test('inner', () => { throw new Error('boom') })
        return result.success === false && result.message.includes('boom')
    }),
])

process.exit(summary.failCount > 0 ? 1 : 0)
