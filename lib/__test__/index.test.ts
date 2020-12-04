import tsw from "../index";

describe("tsw index", () => {
  it("load normal plugin", async () => {
    await tsw(
      __dirname,
      "./__fixtures__/normal-plugin/index.ts",
      "./__fixtures__/normal-plugin/tswconfig.ts"
    );
  });

  it("load error plugin", async () => {
    const mockExit = jest
      .spyOn<any, any>(process, "exit")
      .mockImplementationOnce(() => {});

    await tsw(
      __dirname,
      "./__fixtures__/error-plugin/index.ts",
      "./__fixtures__/error-plugin/tswconfig.ts"
    );

    expect(mockExit).toHaveBeenCalledWith(-1);
  });
});
