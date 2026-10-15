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
    /**
     * NOT. Checks that the "value" is falsy.
     * @example affirm.not(user.isBanned, 'Banned user cannot place an order')
     */
    not(value: any, msg?: string): void
    /**
     * AND. Checks that every value of a non-empty "values" array is truthy.
     * @example affirm.all([host, port, token], 'Incomplete connection settings')
     */
    all(values: any[], msg?: string): void
    /**
     * OR. Checks that at least one value of a non-empty "values" array is truthy.
     * @example affirm.any([email, phone], 'Provide an email or a phone number')
     */
    any(values: any[], msg?: string): void
    /**
     * NOR. Checks that no value of a non-empty "values" array is truthy.
     * @example affirm.none([order.isVoid, order.isRefunded], 'Order is no longer payable')
     */
    none(values: any[], msg?: string): void
    /**
     * XOR. Checks that exactly one between "left" and "right" is truthy.
     * @example affirm.xor(cardToken, bankAccount, 'Pay by card or by bank, not both')
     */
    xor(left: any, right: any, msg?: string): void
    /**
     * XOR over many. Checks that exactly one value of a non-empty "values" array is truthy.
     * @example affirm.oneOf([byId, byEmail, byPhone], 'Pass exactly one lookup key')
     */
    oneOf(values: any[], msg?: string): void
    /**
     * XNOR. Checks that a non-empty "values" array is either all truthy or all falsy — no partial set.
     * @example affirm.allOrNone([proxyHost, proxyPort], 'A proxy needs both host and port, or neither')
     */
    allOrNone(values: any[], msg?: string): void
    /**
     * IMPLIES. Checks that "consequence" is truthy whenever "condition" is truthy; passes if "condition" is falsy.
     * @example affirm.implies(job.isScheduled, job.startsAt, 'A scheduled job needs a start time')
     */
    implies(condition: any, consequence: any, msg?: string): void
}

/** Throws the guard error, appending the human-readable reason when one is given. */
const fail = (msg?: string): never => {
    throw new Error(`Affirm failed${(msg && msg.length > 0) ? `: ${msg}` : ''}`)
}

/** Counts the truthy values, the shared primitive behind the XOR-family guards. */
const countTruthy = (values: any[]): number => values.filter(Boolean).length

/**
 * Checks if 'value' is truthy. If not, throws an exception with custom 'msg' (if present).
 */
const affirm: IAffirmFunction = (value: any, msg?: string) => {
    if (!value) fail(msg)
}

affirm.hasValue = (value: any, msg?: string) => {
    if (value === null || value === undefined) fail(msg)
}

affirm.hasItems = (value: any[], msg?: string) => {
    if (!value || !Array.isArray(value) || !(value.length > 0)) fail(msg)
}

affirm.doesntInclude = (value: any, array: any[], msg?: string) => {
    affirm(value, msg)
    if (!array || !Array.isArray(array) || array.includes(value)) fail(msg)
}

affirm.doesntExist = <T>(item: T, array: T[], key: keyof T, msg?: string) => {
    affirm(item, msg)
    if (!array || !Array.isArray(array)) fail(msg)
    if (array.some(arrayItem => arrayItem[key] === item[key])) fail(msg)
}

affirm.noDupes = (array: any[], msg?: string) => {
    if (!array || !Array.isArray(array) || new Set(array).size !== array.length) fail(msg)
}

affirm.noDupedItems = <T>(array: T[], key: keyof T, msg?: string) => {
    if (!array || !Array.isArray(array)) fail(msg)
    const seen = new Set()
    for (const item of array) {
        if (seen.has(item[key])) fail(msg)
        seen.add(item[key])
    }
}

affirm.not = (value: any, msg?: string) => {
    if (value) fail(msg)
}

affirm.all = (values: any[], msg?: string) => {
    affirm.hasItems(values, msg)
    if (!values.every(Boolean)) fail(msg)
}

affirm.any = (values: any[], msg?: string) => {
    affirm.hasItems(values, msg)
    if (!values.some(Boolean)) fail(msg)
}

affirm.none = (values: any[], msg?: string) => {
    affirm.hasItems(values, msg)
    if (values.some(Boolean)) fail(msg)
}

affirm.xor = (left: any, right: any, msg?: string) => {
    // Both operands are normalized to booleans, so "different truthiness" is a plain inequality
    if (!left === !right) fail(msg)
}

affirm.oneOf = (values: any[], msg?: string) => {
    affirm.hasItems(values, msg)
    if (countTruthy(values) !== 1) fail(msg)
}

affirm.allOrNone = (values: any[], msg?: string) => {
    affirm.hasItems(values, msg)
    const truthy = countTruthy(values)
    if (truthy !== 0 && truthy !== values.length) fail(msg)
}

affirm.implies = (condition: any, consequence: any, msg?: string) => {
    if (condition && !consequence) fail(msg)
}

export default affirm
