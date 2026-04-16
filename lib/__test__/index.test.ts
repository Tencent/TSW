import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, get as httpGet } from "node:http";
import tsw, { uninstallHacks } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

let server;
let port;

const RESPONSE_STRING = "success";

beforeAll(() => {
  uninstallHacks();

  port = randomPort();
  server = createServer((req, res) => {
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
    const mockExit = vi
      .spyOn(process, "exit")
      .mockImplementationOnce((() => {}) as any);

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
