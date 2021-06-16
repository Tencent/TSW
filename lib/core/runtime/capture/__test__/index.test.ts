import * as http from "http";
import { requestHack, requestRestore } from "../index";

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

let server: http.Server;
let port: number;

const RESPONSE_STRING = "success";

beforeAll(() => {
  requestHack();

  port = randomPort();
  server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end(RESPONSE_STRING);
  }).listen(port);
});

afterAll(() => {
  requestRestore();

  server.close();
});

describe("capture(request hack) test", () => {
  test("http request", async () => {
    await new Promise((resolve) => {
      http.request(`http://127.0.0.1:${port}`, (res) => {
        res.on("data", (d) => {
          expect(d.toString("utf8")).toBe(RESPONSE_STRING);
          resolve();
        });
      }).end();
    });
  });

  test("http request", async () => {
    await new Promise((resolve) => {
      http.request({
        protocol: "http:",
        host: "127.0.0.1",
        port
      }, (res) => {
        res.on("data", (d) => {
          expect(d.toString("utf8")).toBe(RESPONSE_STRING);
          resolve();
        });
      }).end();
    });
  });
});
