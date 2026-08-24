interface IAffirmFunction {
    (value: any, msg?: string): void
    /**
     * Checks that the "value" has a value, so it's NOT null or undefined
     */
    hasValue(value: any, msg?: string): void
    /**
     * Checks that value exists, is an array and has at least one item
     */
    hasItems(value: any[], msg?: string): void
    /**
     * Checks that the "value" is NOT present in the "array"
     */
    doesntInclude(value: any, array: any[], msg?: string): void
    /**
     * Checks that the "item" is NOT present in the "array" using the value of @key as an unique identifier
     */
    doesntExist<T>(item: T, array: T[], key: keyof T, msg?: string): void
    /**
     * Checks that the array has no duplicate values
     */
    noDupes(array: any[], msg?: string): void
    /**
     * Checks that the array of objects has no duplicate values based on a specific key
     */
    noDupedItems<T>(array: T[], key: keyof T, msg?: string): void
}

/**
 * Checks if 'value' is truthy. If not, throws an exception with custom 'msg' (if present).
 */
const affirm: IAffirmFunction = (value: any, msg?: string) => {
    if (!value) throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.hasValue = (value: any, msg?: string) => {
    if (value === null || value === undefined) throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.hasItems = (value: any[], msg?: string) => {
    if (!value || !Array.isArray(value) || !(value.length > 0)) throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.doesntInclude = (value: any, array: any[], msg?: string) => {
    affirm(value, msg)
    if (!array || !Array.isArray(array) || array.includes(value)) throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.doesntExist = <T>(item: T, array: T[], key: keyof T, msg?: string) => {
    affirm(item, msg)
    if (!array || !Array.isArray(array) || !array.some(arrayItem => arrayItem[key] === item[key]))
        throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.noDupes = (array: any[], msg?: string) => {
    if (!array || !Array.isArray(array) || new Set(array).size !== array.length)
        throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

affirm.noDupedItems = <T>(array: T[], key: keyof T, msg?: string) => {
    if (!array || !Array.isArray(array))
        throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
    const seen = new Set()
    for (const item of array) {
        if (seen.has(item[key]))
            throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
        seen.add(item[key])
    }
}

export default affirm
