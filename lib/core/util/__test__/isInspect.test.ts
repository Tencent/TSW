import isInspect from "../isInspect";

describe("test inspect env", () => {
  test("test isInspect when NODE_OPTIONS === ''", () => {
    process.env.NODE_OPTIONS = "";
    expect(isInspect()).toBe(false);
  });

  test("test isInspect when NODE_OPTIONS === '--require=ts-node/register'",
    () => {
      process.env.NODE_OPTIONS = "--require=ts-node/register";
      expect(isInspect()).toBe(false);
    });

  test("test isInspect when NODE_OPTIONS === '--inspect'", () => {
    process.env.NODE_OPTIONS = "--inspect";
    expect(isInspect()).toBe(true);
  });

  test("test isInspect when NODE_OPTIONS === '--inspect-brk=true'", () => {
    process.env.NODE_OPTIONS = "--inspect-brk=true";
    expect(isInspect()).toBe(true);
  });
});
