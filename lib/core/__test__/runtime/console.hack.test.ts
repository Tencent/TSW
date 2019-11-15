// import logger from '../../logger/index'
import { consoleHack } from '../../runtime/console.hack'

// jest.mock('../../logger/index')

beforeAll(() => {
    consoleHack()
})

const writeLog = jest.fn((level, info) => {
    return `${level}: ${info}`
})

describe('console hack test', () => {
    test('ensure console contains all origin functions', () => {
        expect(typeof console.originDebug).toBe('function')
        expect(typeof console.originLog).toBe('function')
        expect(typeof console.originInfo).toBe('function')
        expect(typeof console.originDir).toBe('function')
        expect(typeof console.originWarn).toBe('function')
        expect(typeof console.originError).toBe('function')
    })
    test('console.debug should be logged by logger', () => {
        console.debug('test_log')
        console.log('test_log')
        console.info('test_log')
        console.dir('test_log')
        console.warn('test_log')
        console.error('test_log')
    })
})
