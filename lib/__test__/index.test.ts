import tsw, { uninstallHacks } from "../index";
import { createServer, get as httpGet } from "http";

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

let server;
let port;

const RESPONSE_STRING = "success";

beforeAll(() => {
  uninstallHacks();

  port = randomPort();
  server = createServer((req, res) => {
    // process.domain in git pipeline is undefined
    expect(process.domain).toBeFalsy();

    res.statusCode = 200;
    res.end(RESPONSE_STRING);
  }).listen(port);
});

afterAll(() => {
  server.close();
  uninstallHacks();
});

describe("tsw index", () => {
  it("load normal plugin", async () => {
    await tsw(
      __dirname,
      "./__fixtures__/normal-plugin/index.ts",
      "./__fixtures__/normal-plugin/tswconfig.ts"
    );
  });

  it("load no plugin", async () => {
    await tsw(
      __dirname,
      "./__fixtures__/no-plugin/index.ts",
      "./__fixtures__/no-plugin/tswconfig.ts"
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

  it("test uninstallHacks", async () => new Promise((resolve) => {
    httpGet(`http://127.0.0.1:${port}`, (res) => {
      res.on("data", (d) => {
        expect(d.toString("utf8")).toBe(RESPONSE_STRING);
        resolve(0);
      });
    }).end();
  }));
});
