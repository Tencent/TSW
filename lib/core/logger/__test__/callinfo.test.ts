import getCallInfo from "../callInfo.js";

describe("callInfo test", () => {
  test("callInfo test without arguments", () => {
    const res = getCallInfo();
    expect(res.filename).toContain("callInfo");
  });

  test("callInfo test with arguments", () => {
    const res = getCallInfo(0);
    expect(res.filename).toContain("callInfo");
  });

  test("callInfo test with invalid arguments", () => {
    const res = getCallInfo(-1);
    expect(res.filename).toBe("");
    expect(res.column).toBe(0);
    expect(res.line).toBe(0);
  });
});
