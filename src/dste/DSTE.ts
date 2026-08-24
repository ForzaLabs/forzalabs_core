import affirm from '../Affirm'

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

    tests = async (tests: Promise<ITestResult>[]) => {
        const results = await Promise.all(tests)
        console.log(results.map(x => `- ${x.message}`).join('\n'))

        const count = results.length
        const successCount = results.filter(x => x.success).length
        const failCount = results.filter(x => !x.success).length
        console.log(`\nTests summary:\n- test count: ${count}\n- successes: \x1b[42m${successCount}\x1b[0m\n- failures: \x1b[41m${failCount}\x1b[0m`)
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
    success: boolean
    message: string
}
