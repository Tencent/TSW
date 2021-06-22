/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { createServer, get as httpGet, request as httpRequest } from "http";
import {
  httpCreateServerHack,
  httpsCreateServerHack,
  httpCreateServerRestore,
  httpsCreateServerRestore
} from "../create-server.hack";
import { eventBus, EVENT_LIST } from "../../bus";

beforeAll(() => {
  httpCreateServerHack();
  httpsCreateServerHack();
});

afterAll(() => {
  httpCreateServerRestore();
  httpsCreateServerRestore();
});

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);
const randomString = (): string => Math.random().toString(36).substring(2, 15)
  + Math.random().toString(36).substring(2, 15);

describe("http createServer hack test", () => {
  test("createServer with 1 params", async () => {
    const port = randomPort();
    const path = randomString();

    const server = createServer((req, res) => {
      expect(process.domain).not.toBeNull();
      res.statusCode = 200;
      res.end("success");
    }).listen(port);

    return new Promise((resolve, reject) => {
      httpGet(`http://127.0.0.1:${port}/${path}`, (res) => {
        // Close server first
        server.close();

        if (res.statusCode === 200) resolve();
        else reject();
      });
    });
  });

  test("createServer with 2 params", async () => {
    const port = randomPort();
    const path = randomString();

    const server = createServer({}, (req, res) => {
      expect(process.domain).not.toBeNull();
      res.setHeader("x-test-res", "test");
      res.statusCode = 200;
      res.end("success");
    }).listen(port);

    return new Promise((resolve, reject) => {
      httpGet(`http://127.0.0.1:${port}/${path}`, (res) => {
        // Close server first
        server.close();

        if (res.statusCode === 200) resolve();
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

    const realServer = createServer((req, res) => {
      res.statusCode = 200;
      res.end("real server response");
    }).listen(realServerPort);

    const proxyServer = createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      httpGet(`http://127.0.0.1:${proxyServerPort}/${path}`, (res) => {
        // Close server first
        proxyServer.close();
        realServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(body).toBe("real server response");
          resolve();
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

    const realServer = createServer((req, res) => {
      res.statusCode = 200;
      res.end("real server response");
    }).listen(realServerPort);

    const proxyServer = createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      httpRequest(`http://127.0.0.1:${proxyServerPort}/${path}`, {
        method: "POST"
      }, (res) => {
        // Close server first
        proxyServer.close();
        realServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(body).toBe("real server response");
          resolve();
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
      // A non-exists port
      context.proxyPort = 10;
    };

    eventBus.on(EVENT_LIST.REQUEST_START, requestStartListener);

    const proxyServer = createServer((req, res) => {
      res.statusCode = 200;
      res.end("proxy server response");
    }).listen(proxyServerPort);

    await new Promise((resolve) => {
      httpGet(`http://127.0.0.1:${proxyServerPort}/${path}`, (res) => {
        // Close server first
        proxyServer.close();

        let body = "";

        res.on("data", (d) => {
          body += d.toString("utf8");
        });

        res.on("end", () => {
          expect(res.statusCode).toBe(500);
          expect(body).toBe("");
          resolve();
        });
      });
    });

    eventBus.off(EVENT_LIST.REQUEST_START, requestStartListener);
  });
});
