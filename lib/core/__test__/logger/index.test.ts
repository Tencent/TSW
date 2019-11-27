import logger from '../../logger/index'
import * as Context from '../../context'

jest.mock('../../context');

(Context.currentContext as jest.Mock).mockReturnValue({
  log: {},
  window: {},
  SN: 0,
  beforeClean: () => {

  }
})

describe("logger test", () => {
  const log = Context.currentContext().log
  test("loglevel could be set by setLogLevel", async () => {
    logger.setLogLevel(10)
    expect(logger.getLogLevel()).toBe(10)
  })
  test("log could be classified by level", async () => {
    logger.debug('TEST DEBUG LOG')
    expect(log['DEBUG']).toBe(1)
    logger.info('TEST INFO LOG')
    expect(log['INFO']).toBe(1)
    logger.warn('TEST INFO LOG')
    expect(log['WARN']).toBe(1)
    logger.error('TEST ERROR LOG')
    expect(log['ERROR']).toBe(1)
  })
  test("log could be collected in currentContext", async () => {
    logger.info('LOG LENGTH IS CUMULATIVE')
    expect(log['arr'].length).toBe(5)
  })
  test("log could be clean", async () => {
    logger.clean()
    expect(log.arr).toBe(null)
  })
})
