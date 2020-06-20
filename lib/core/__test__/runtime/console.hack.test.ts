import { consoleHack, consoleRestore } from "../../runtime/console.hack";
import logger from "../../logger/index";
import getCurrentContext from "../../context";

jest.mock("../../logger/index");
jest.mock("../../context");

beforeAll(() => {
  consoleHack();
});

afterAll(() => {
  consoleRestore();
});

afterEach(() => {
  jest.clearAllMocks();
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
    (getCurrentContext as jest.Mock).mockImplementation(() => true);
    const mockedWriteLog = logger.writeLog as jest.Mock;

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

    (getCurrentContext as jest.Mock).mockClear();
  });

  test("console.debug should be logged by log111ger", () => {
    (getCurrentContext as jest.Mock).mockImplementation(() => true);
    const mockedWriteLog = logger.writeLog as jest.Mock;

    expect(mockedWriteLog.mock.calls.length).toEqual(0);
    process.stdout.write("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(1);
    process.stderr.write("test_log");
    expect(mockedWriteLog.mock.calls.length).toEqual(2);

    (getCurrentContext as jest.Mock).mockClear();
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
