/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
import * as http from "http";

// Max request body size
const maxBodySize = 512 * 1024;

export const captureRequestBody = (request: http.ClientRequest): void => {
  let bodySize = 0;
  const body: Buffer[] = [];

  (request as any)._send = ((fn) => (
    data: Buffer | string,
    encodingOrCallback?: string | ((err?: Error) => void) | undefined,
    callbackOrUndefined?: ((err?: Error) => void) | undefined
  ): boolean => {
    let encoding: BufferEncoding = null;
    let callback: (err?: Error) => void;

    if (typeof encodingOrCallback === "function") {
      callback = encodingOrCallback;
    } else if (typeof callbackOrUndefined === "function") {
      encoding = encodingOrCallback as BufferEncoding;
      callback = callbackOrUndefined;
    }

    const buffer = ((): Buffer => {
      if (Buffer.isBuffer(data)) {
        return data;
      }

      return Buffer.from(data, encoding);
    })();

    bodySize += buffer.length;
    body.push(buffer);

    return fn.apply(request, [data, encoding, callback]);
  })((request as any)._send);

  (request as any)._finish = ((fn) => (
    ...args: unknown[]
  ): void => {
    (request as any)._body = Buffer.concat(body);

    (request as any)._bodyTooLarge = bodySize > maxBodySize;
    (request as any)._bodySize = bodySize;

    return fn.apply(request, args);
  })((request as any)._finish);
};
