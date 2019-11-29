import { consoleHack, consoleRestore } from "../../runtime/console.hack";
import logger from "../../logger/index";

jest.mock("../../logger/index");

const mockedWriteLog = logger.writeLog as jest.Mock;

beforeAll(() => {
  consoleHack();
});

afterAll(() => {
  consoleRestore();
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
