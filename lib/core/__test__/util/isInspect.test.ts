import isInspect from "../../util/isInspect";

describe("test inspect env", () => {
  test("test isInspect when NODE_OPTIONS === ''", () => {
    process.env.NODE_OPTIONS = "";
    expect(isInspect()).toBe(false);
  });

  test("test isInspect when NODE_OPTIONS === '--inspect=true'", () => {
    process.env.NODE_OPTIONS = "--inspect=true";
    expect(isInspect()).toBe(true);
  });

  test("test isInspect when NODE_OPTIONS === '--inspect-brk=true'", () => {
    process.env.NODE_OPTIONS = "--inspect-brk=true";
    expect(isInspect()).toBe(true);
  });
});
