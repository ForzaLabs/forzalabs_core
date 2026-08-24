import affirm from './Affirm.js'

/**
 * Core Algorithms that are shared between different project/problems.
 * This file needs to be as lean as possible and must not include any external dependencies.
 */
const algo = {
    hasVal: (value: any) => value !== null && value !== undefined,
    sleep: (milliseconds: number) => {
        affirm(milliseconds > 0, 'Invalid @milliseconds parameter. Must be a positive number.')

        return new Promise(resolve => setTimeout(resolve, milliseconds))
    },
    rng: (min: number, max: number) => {
        affirm(min, 'Invalid @min parameter. Must be a valid number.')
        affirm(max, 'Invalid @max parameter. Must be a valid number.')
        affirm(min < max, 'The minimum value must be less than the maximum value.')

        return Math.floor(Math.random() * (max - min + 1)) + min
    },
    uniqBy: <T, K extends keyof T>(array: T[], pk: K): T[K][] => {
        if (!array || array.length === 0) return []
        return Array.from(new Set(array.map(x => x[pk])))
    },
    uniq: <T>(array: T[]): T[] => {
        if (!array || array.length === 0) return []
        return Array.from(new Set(array))
    },
    duplicatesObject: <T, K extends keyof T>(array: T[], pk: K): T[] => {
        if (!array || array.length === 0) return []
        return array.filter(x => array.filter(k => k[pk] === x[pk]).length > 1)
    },
    duplicates: <T>(array: T[]): T[] => {
        if (!array || array.length === 0) return []
        return array.filter(x => array.filter(k => k === x).length > 1)
    },
    locations: (string: string, substring: string) => {
        affirm(string, 'Invalid @string parameter.')
        affirm(substring, 'Invalid @substring parameter.')

        const a: number[] = []
        let i = -1
        while ((i = string.indexOf(substring, i + 1)) >= 0) a.push(i)
        return a
    },
    isNumber: (value: any) => typeof value === 'number',
    orderBy: <T>(list: T[], key?: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
        affirm(list, 'Invalid array.')
        affirm.hasItems(list, 'Array must be non-empty.')
        affirm(direction, 'Invalid direction parameter. Must be "asc" or "desc".')

        const sortedList = [...list]

        if (key) {
            sortedList.sort((a, b) => {
                const aValue = a[key]
                const bValue = b[key]

                if (aValue < bValue) return direction === 'asc' ? -1 : 1
                if (aValue > bValue) return direction === 'asc' ? 1 : -1
                return 0
            })
            return sortedList
        } else {
            sortedList.sort((a, b) => {
                if (a < b) return direction === 'asc' ? -1 : 1
                if (a > b) return direction === 'asc' ? 1 : -1
                return 0
            })
            return sortedList
        }
    },
    groupBy: <T>(array: T[], key: keyof T): Map<T[keyof T], T[]> => {
        affirm.hasItems(array, 'Array must be non-empty')
        affirm(key, 'key is invalid')

        const result: Map<T[keyof T], T[]> = new Map()
        for (let i = 0; i < array.length; i++) {
            const item = array[i]
            const keyVal = item[key]

            if (result.has(keyVal)) {
                const current = result.get(keyVal)
                current.push(item)
                result.set(keyVal, current)
            } else {
                result.set(keyVal, [item])
            }
        }

        return result
    },
    chunkString: (text: string, chunkSize: number): string[] => {
        affirm(text, 'Invalid text')
        affirm(chunkSize, 'Invalid chunk size')
        affirm(text.length > 0, 'Text length must be greater than 0')
        affirm(chunkSize > 0, 'Chunk size must be greater than 0')

        if (text.length <= chunkSize) return [text]

        const numChunks = Math.ceil(text.length / chunkSize)
        const chunks = new Array(numChunks)
        for (let i = 0; i < chunks.length; i++) {
            chunks[i] = text.substring(i * chunkSize, chunkSize)
        }

        return chunks
    },
    first: <T>(arr: T[]): T => {
        affirm(algo.hasVal(arr), 'Array must not be null or undefined')
        affirm.hasItems(arr, 'Array must be non-empty')

        return arr[0]
    },
    last: <T>(arr: T[]): T => {
        affirm(algo.hasVal(arr), 'Array must not be null or undefined')
        affirm(arr.length > 0, 'Array must be non-empty')

        return arr[arr.length - 1]
    },
    mean: (numbers: number[]): number => {
        affirm(algo.hasVal(numbers), 'Array must not be null or undefined')
        if (numbers.length === 0)
            return 0

        const total = algo.sum(numbers)
        return total / numbers.length
    },
    sum: (numbers: number[]): number => {
        affirm(algo.hasVal(numbers), 'Array must not be null or undefined')
        if (numbers.length === 0)
            return 0

        let total = 0
        for (let i = 0; i < numbers.length; i++) {
            total += numbers[i]
        }
        return total
    },
    round: (number: number, precision?: number) => {
        affirm(algo.hasVal(number), 'Number must not be null or undefined')

        const factor = Math.pow(10, precision ?? 2)
        return Math.round(number * factor) / factor
    },
    min: (arr: number[]): number => {
        affirm(algo.hasVal(arr), 'Array must not be null or undefined')
        if (arr.length === 0)
            return 0

        return Math.min(...arr)
    },
    max: (arr: number[]): number => {
        affirm(algo.hasVal(arr), 'Array must not be null or undefined')
        if (arr.length === 0)
            return 0

        return Math.max(...arr)
    },
    replaceAll: (text: string, search: string, replace: string) => text.replace(new RegExp(search, 'g'), replace),
    /** Whether this pattern holds at least one "*" wildcard, and so has to be matched rather than compared. */
    isGlob: (pattern: string) => typeof pattern === 'string' && pattern.includes('*'),
    /**
     * Matches a value against a "*" glob pattern and returns what each wildcard captured, in order —
     * `["0"]` for pattern "addr*Street" against "addr0Street" — or `null` when it doesn't match. The
     * captures are what lets a name built from a glob keep the part that varies. Everything outside a
     * wildcard is matched literally, so a pattern is never a regular expression in disguise.
     */
    globCaptures: (pattern: string, value: string): string[] => {
        affirm(algo.hasVal(pattern), 'Invalid @pattern parameter.')
        affirm(algo.hasVal(value), 'Invalid @value parameter.')

        const escaped = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const match = new RegExp(`^${escaped.join('(.*)')}$`).exec(value)
        return match ? match.slice(1) : null
    },
    deepClone: <T>(data: T): T => JSON.parse(JSON.stringify(data))
}

export default algo
