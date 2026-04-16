import type { Mock } from "vitest";

vi.mock("../../context.js", () => {
  const mockContext = vi.fn().mockReturnValue({
    log: {
      showLineNumber: false,
      arr: [],
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0
    },
    SN: 0
  });
  return {
    default: mockContext,
    Log: {},
    Context: vi.fn(),
    RequestLog: {}
  };
});

import logger, { Logger } from "../index.js";
import currentContext from "../../context.js";

const { log } = (currentContext as Mock)();

describe("logger test", () => {
  test("log could be set by setLogLevel", async () => {
    logger.setLogLevel("INFO");
    expect(logger.logLevel).toBe(20);

    logger.debug("TEST DROP LOG IN INFO LEVEL");
    expect(log.INFO).toBe(0);

    logger.setLogLevel("DEBUG");
  });

  test("log could be set by setCleanLog", async () => {
    logger.setCleanLog(true);
    expect(logger.getCleanLog()).toBe(true);

    logger.setCleanLog(false);
  });

  test("debug and info could be hided by cleanLog", async () => {
    logger.setCleanLog(true);

    logger.debug("TEST DEBUG LOG IN CLEANLOG");
    expect(log.DEBUG).toBe(0);

    logger.info("TEST INFO LOG IN CLEANLOG");
    expect(log.INFO).toBe(0);

    logger.setCleanLog(false);
  });

  test("log could be classified by level", async () => {
    logger.debug("TEST DEBUG LOG");
    expect(log.DEBUG).toBe(1);

    logger.info("TEST INFO LOG");
    expect(log.INFO).toBe(1);

    logger.warn("TEST INFO LOG");
    expect(log.WARN).toBe(1);

    logger.error("TEST ERROR LOG");
    expect(log.ERROR).toBe(1);
  });

  test("log could be collected in currentContext", async () => {
    logger.info("LOG LENGTH IS CUMULATIVE");
    expect(log.arr.length).toBe(5);
  });

  test("log could be log with color", async () => {
    process.env.NODE_OPTIONS = "--inspect=true";

    logger.error("LOG IS COLORFUL");
    logger.warn("LOG IS COLORFUL");
    logger.info("LOG IS COLORFUL");
  });

  test("log could be clean", async () => {
    Logger.clean();
    expect(log.arr).toBe(null);
  });
});
