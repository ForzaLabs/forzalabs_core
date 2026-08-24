import affirm from '../Affirm.js'

/**
 * This class is used to abstract away all calls that are non-deterministic.
 * As of now they just return non-deterministic values, but in the future the implementation can be easily replaced with deterministic code
 */
class DeterministicSimulationTestingEngine {
    _options: IDSTEOptions

    init = (options: IDSTEOptions) => {
        affirm(options, 'Invalid options')
        this._options = options
    }

    /**
     * returns a random number between 0 and 1
     */
    random = (): number => Math.random()

    now = (): Date => new Date()

    /**
     * Awaits every test, prints each result plus a summary, and returns the tally so
     * callers can decide the process exit code. Returning it (rather than only logging)
     * is what lets a CI runner fail the build on a failed test.
     */
    tests = async (tests: Promise<ITestResult>[]): Promise<ITestSummary> => {
        affirm.hasItems(tests, 'Invalid @tests parameter. Must be a non-empty array of test promises.')

        const results = await Promise.all(tests)
        console.log(results.map(x => `- ${x.message}`).join('\n'))

        const count = results.length
        const successCount = results.filter(x => x.success).length
        const failCount = results.filter(x => !x.success).length
        console.log(`\nTests summary:\n- test count: ${count}\n- successes: \x1b[42m${successCount}\x1b[0m\n- failures: \x1b[41m${failCount}\x1b[0m`)

        return { count, successCount, failCount }
    }

    test = async (name: string, fn: () => boolean | Promise<boolean>): Promise<ITestResult> => {
        try {
            const res = await Promise.resolve(fn())
            if (!res) return { message: `test "${name}"\x1b[41m failed.\x1b[0m`, success: false }
            else return { message: `test "${name}"\x1b[42m succeded.\x1b[0m`, success: true }
        } catch (error) {
            const myerror = error as Error
            return { message: `test "${name}"\x1b[41m crashed\x1b[0m with message: ${myerror.message}; trace: ${myerror.stack}`, success: false }
        }
    }
}

/**
 * Deterministic Simulation Testing Engine
 */
const DSTE = new DeterministicSimulationTestingEngine()
DSTE.init({ seed: 0 }) // this is going to bite me in the butt...
export default DSTE

export interface IDSTEOptions {
    seed: number
}

export interface ITestResult {
    /** Whether the test's assertion held. */
    success: boolean
    /** Human-readable, pre-coloured line describing the outcome. */
    message: string
}

/** Tally returned by `DSTE.tests`, for turning a run into an exit code. */
export interface ITestSummary {
    /** How many tests were run. */
    count: number
    /** How many passed. */
    successCount: number
    /** How many failed or crashed. */
    failCount: number
}
