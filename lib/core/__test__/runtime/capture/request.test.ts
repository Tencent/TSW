/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as http from "http";
import { captureOutgoing } from "../../../runtime/capture/outgoing";

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

let server: http.Server;
let port: number;

beforeAll(() => {
  port = randomPort();
  server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end("success");
  }).listen(port);
});

afterAll(() => {
  server.close();
});

describe("capture request function test", () => {
  test("request should capture post data", (done) => {
    const firstData = "a";
    const secondData = "b";
    const thirdData = "c";
    const data = firstData + secondData + thirdData;

    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: "/",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data)
      }
    }, () => {
      expect((req as any)._body).toBeTruthy();
      expect((req as any)._body.toString()).toEqual(data);
      expect((req as any)._bodySize).toEqual(Buffer.byteLength(data));
      expect((req as any)._bodyTooLarge).toEqual(false);
      done();
    });

    captureOutgoing(req);

    req.write(firstData);
    // Write data to request body
    req.write(Buffer.from(secondData, "utf8"), "utf8", () => {
      // do nothing
    });

    req.write(Buffer.from(thirdData), () => {
      // do nothing
    });

    req.end();
  });
});
