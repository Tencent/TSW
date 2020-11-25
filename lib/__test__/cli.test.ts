import tsw from "../index";

jest.mock("../index");

describe("tsw cli", () => {
  it("without any params", async () => {
    process.argv.push("-c");
    process.argv.push("a/b/config.js");

    (tsw as jest.Mock).mockImplementation(() => {});

    await import("../cli");

    expect((tsw as jest.Mock).mock.calls[0][2]).toStrictEqual("a/b/config.js");

    process.argv.pop();
    process.argv.pop();
  });

  it("params -c", async () => {
    process.argv.push("-c");
    process.argv.push("a/b/config.js");

    (tsw as jest.Mock).mockImplementation(() => {});

    await import("../cli");

    expect((tsw as jest.Mock).mock.calls[0][2]).toStrictEqual("a/b/config.js");

    process.argv.pop();
    process.argv.pop();
  });

  it("params --config", async () => {
    process.argv.push("--config");
    process.argv.push("a/b/config.js");

    (tsw as jest.Mock).mockImplementation(() => {});

    await import("../cli");

    expect((tsw as jest.Mock).mock.calls[0][2]).toStrictEqual("a/b/config.js");

    process.argv.pop();
    process.argv.pop();
  });
});
