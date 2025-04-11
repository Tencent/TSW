/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as http from "http";
import {
  captureIncoming,
  captureReadableStream
} from "../incoming";
import { Readable } from "stream";

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

let server: http.Server;
let port: number;

const responseData = "success";

beforeAll(() => {
  port = randomPort();
  server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end(responseData);
  }).listen(port);
});

afterAll(() => {
  server.close();
});

describe("capture response function test", () => {
  test("response data should be captured", (done) => {
    const data = "a";
    let info: any;

    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: "/",
      method: "POST",
      headers: {
        Connection: "Close",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (response) => {
      info = captureIncoming(response);
    });

    req.write(data);

    req.once("close", () => {
      expect(info.body).toEqual(Buffer.from(responseData));
      expect(info.bodyLength).toEqual(Buffer.byteLength(responseData));
      done();
    });
  });

  test("capture readableStream should be right", (done) => {
    const stream = new Readable();

    stream.push("before");
    const info = captureReadableStream(stream);

    stream.push("after");
    stream.destroy();

    stream.on("close", () => {
      expect(info.bodyLength).toEqual(Buffer.byteLength("beforeafter"));
      expect(info.body).toEqual(Buffer.from("beforeafter"));
      expect(info.bodyTooLarge).toEqual(false);
      done();
    });
  });
});
