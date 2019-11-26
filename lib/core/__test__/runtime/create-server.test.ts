/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { httpCreateServerHack, httpCreateServerRestore } from "../../runtime/create-server.hack";
import { createServer, get as httpGet } from "http";

beforeAll(() => {
  httpCreateServerHack();
});

afterAll(() => {
  httpCreateServerRestore();
})

/**
 * 4000 - 5000 random port
 */
const randomPort = (): number => Math.floor(Math.random() * 1000 + 4000);

describe("http createServer hack test", () => {
  test("every request should be wrapped by a domain instance", async () => {
    const port = randomPort();
    const path = "test-path";

    createServer((req, res) => {
      // TODO: Enable this test when Jest release 25.0.0
      // https://github.com/facebook/jest/issues/7247

      // expect(process.domain).not.toBeNull();
      res.end("");
    }).listen(port);

    return new Promise((resolve, reject) => {
      httpGet(`http://127.0.0.1:${port}/${path}`, (res) => {
        if (res.statusCode === 200) resolve();
        else reject();
      });
    })
  })
});
