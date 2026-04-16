import type { Mock } from "vitest";

vi.mock("../../logger/index.js", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    writeLog: vi.fn(),
    setLogLevel: vi.fn(),
    setCleanLog: vi.fn()
  },
  Logger: vi.fn()
}));

vi.mock("../../context.js", () => {
  const mockFn = vi.fn();
  return {
    default: mockFn,
    Context: vi.fn(),
    Log: {},
    RequestLog: {}
  };
});

import { consoleHack, consoleRestore } from "../console.hack.js";
import logger from "../../logger/index.js";
import getCurrentContext from "../../context.js";

beforeAll(() => {
  consoleHack();
});

afterAll(() => {
  consoleRestore();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("console hack test", () => {
  test("ensure console contains all origin functions", () => {
    expect(typeof console.originDebug).toBe("function");
    expect(typeof console.originLog).toBe("function");
    expect(typeof console.originInfo).toBe("function");
    expect(typeof console.originDir).toBe("function");
    expect(typeof console.originWarn).toBe("function");
    expect(typeof console.originError).toBe("function");
  });

  test("console.debug should be logged by logger", () => {
    (getCurrentContext as Mock).mockImplementation(() => true);
    const mockedWriteLog = logger.writeLog as Mock;

    expect(mockedWriteLog.mock.calls.length).toEqual(0);
    console.debug("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(1);
    console.log("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(2);
    console.info("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(3);
    console.dir("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(4);
    console.warn("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(5);
    console.error("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(6);

    (getCurrentContext as Mock).mockClear();
  });

  test("console.debug should be logged by log111ger", () => {
    (getCurrentContext as Mock).mockImplementation(() => true);
    const mockedWriteLog = logger.writeLog as Mock;

    expect(mockedWriteLog.mock.calls.length).toEqual(0);
    process.stdout.write("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(1);
    process.stderr.write("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(2);

    (getCurrentContext as Mock).mockClear();
  });

  test("multi consoleRestore() should not have side effect", () => {
    consoleRestore();
    consoleRestore();
  });

  test("multi consoleHack() should not have side effect", () => {
    consoleHack();
    consoleHack();
  });
});
