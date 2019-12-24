/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as http from "http";

// Max response body size
const maxBodySize = 512 * 1024;

export interface ResponseBodyInfo {
  bodyLength: number;
  bodyChunks: Buffer[];
  body: Buffer;
  bodyTooLarge: boolean;
}

export const captureReadableStream = (
  stream: NodeJS.ReadableStream
): ResponseBodyInfo => {
  const originPush = (stream as any).push;

  const info: ResponseBodyInfo = {
    bodyLength: 0,
    bodyChunks: [],
    bodyTooLarge: false,
    body: Buffer.alloc(0)
  };

  const handler = (chunk: any): void => {
    info.bodyLength += Buffer.byteLength(chunk);
    info.bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    info.body = Buffer.concat(info.bodyChunks);
    info.bodyTooLarge = info.bodyLength > maxBodySize;
  };

  let { head } = (stream as any).readableBuffer;
  while (head) {
    handler(head.data);
    head = head.next;
  }

  // eslint-disable-next-line no-param-reassign
  (stream as any).push = (chunk: any, encoding?: string): boolean => {
    if (chunk) {
      handler(chunk);
    }

    return originPush.call(stream, chunk, encoding);
  };

  return info;
};

export const captureResponseBody = (
  response: http.IncomingMessage
): ResponseBodyInfo => captureReadableStream(response);
