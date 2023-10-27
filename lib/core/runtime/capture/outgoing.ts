/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as http from "http";

// Max request body size
const maxBodySize = 512 * 1024;

export const captureOutgoing = (outgoing: http.OutgoingMessage): void => {
  let bodyLength = 0;
  const body: Buffer[] = [];

  (outgoing as any)._send = ((fn) => (
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

    // 达到最大长度限制，不再收集包内容
    if (bodyLength > maxBodySize) {
      return fn.apply(outgoing, [data, encoding, callback]);
    }

    const buffer = ((): Buffer => {
      if (Buffer.isBuffer(data)) {
        return data;
      }

      return Buffer.from(data, encoding);
    })();

    bodyLength += buffer.length;
    body.push(buffer);

    return fn.apply(outgoing, [data, encoding, callback]);
  })((outgoing as any)._send);

  (outgoing as any)._finish = ((fn) => (
    ...args: unknown[]
  ): void => {
    (outgoing as any)._body = Buffer.concat(body);

    (outgoing as any)._bodyTooLarge = bodyLength > maxBodySize;
    (outgoing as any)._bodyLength = bodyLength;

    return fn.apply(outgoing, args);
  })((outgoing as any)._finish);
};
