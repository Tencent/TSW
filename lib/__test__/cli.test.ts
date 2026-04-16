const mockTsw = vi.fn();
vi.mock("../index.js", () => ({
  default: mockTsw,
  installHacks: vi.fn(),
  uninstallHacks: vi.fn()
}));

describe("tsw cli", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("params -c", async () => {
    process.argv.push("-c");
    process.argv.push("a/b/config.js");

    mockTsw.mockImplementation(() => {});

    await import("../cli.js");

    expect(mockTsw.mock.calls[0][2]).toStrictEqual("a/b/config.js");

    process.argv.pop();
    process.argv.pop();
  });
});
