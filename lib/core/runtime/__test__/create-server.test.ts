/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { createRequire } from "node:module";
import type * as httpTypes from "node:http";
import {
  httpCreateServerHack,
  httpsCreateServerHack,
  httpCreateServerRestore,
  httpsCreateServerRestore
} from "../create-server.hack.js";
import { eventBus, EVENT_LIST } from "../../bus.js";
import currentContext from "../../context.js";

const require = createRequire(import.meta.url);
const http = require("node:http") as typeof httpTypes;

beforeAll(() => {
  httpCreateServerHack();
  httpsCreateServerHack();
});

afterAll(() => {
  httpCreateServerRestore();
  httpsCreateServerRestore();
});

const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);
const randomString = (): string => Math.random().toString(36).substring(2, 15)
  + Math.random().toString(36).substring(2, 15);

describe("http createServer hack test", () => {
  test("createServer with 1 params", async () => {
    const port = randomPort();
    const path = randomString();

    const server = http.createServer((req, res) => {
      expect(currentContext()).not.toBeNull();
      res.statusCode = 200;
      res.end("success");
    }).listen(port);

    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/${path}`, (res) => {
        server.close();

        if (res.statusCode === 200) resolve(0);
        else reject();
      });
    });
  });

  test("createServer with 2 params", async () => {
    const port = randomPort();
    const path = randomString();

    const server = http.createServer({}, (req, res) => {
      expect(currentContext()).not.toBeNull();
      res.setHeader("x-test-res", "test");
      res.statusCode = 200;
      res.end("success");
    }).listen(port);

    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/${path}`, (res) => {
        server.close();

        if (res.statusCode === 200) resolve(0);
        else reject();
      });
    });
  });

  test("proxy get", async () => {
    const path = randomString();

    const proxyServerPort = randomPort();
    const realServerPort = randomPort();

    const requestStartListener = ({ context }): void => {
      context.proxyIp = "127.0.0.1";
      context.proxyPort = realServerPort;
    };

    eventBus.on(EVENT_LIST.REQUEST_START, requestStartListener);

    const realServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.end("real server response");
    }).listen(realServerPort);

    const proxyServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${proxyServerPort}/${path}`, (res) => {
        proxyServer.close();
        realServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(body).toBe("real server response");
          resolve(0);
        });
      });
    });

    eventBus.off(EVENT_LIST.REQUEST_START, requestStartListener);
  });

  test("proxy post", async () => {
    const path = randomString();

    const proxyServerPort = randomPort();
    const realServerPort = randomPort();

    const requestStartListener = ({ context }): void => {
      context.proxyIp = "127.0.0.1";
      context.proxyPort = realServerPort;
    };

    eventBus.on(EVENT_LIST.REQUEST_START, requestStartListener);

    const realServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.end("real server response");
    }).listen(realServerPort);

    const proxyServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      http.request(`http://127.0.0.1:${proxyServerPort}/${path}`, {
        method: "POST"
      }, (res) => {
        proxyServer.close();
        realServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(body).toBe("real server response");
          resolve(0);
        });
      }).end();
    });

    eventBus.off(EVENT_LIST.REQUEST_START, requestStartListener);
  });

  test("proxy to a non-exist server", async () => {
    const path = randomString();

    const proxyServerPort = randomPort();

    const requestStartListener = ({ context }): void => {
      context.proxyIp = "127.0.0.1";
      context.proxyPort = 10;
    };

    eventBus.on(EVENT_LIST.REQUEST_START, requestStartListener);

    const proxyServer = http.createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      http.get(`http://127.0.0.1:${proxyServerPort}/${path}`, (res) => {
        proxyServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(res.statusCode).toBe(500);
          expect(body).toBe("");
          resolve(0);
        });
      });
    });

    eventBus.off(EVENT_LIST.REQUEST_START, requestStartListener);
  });
});
