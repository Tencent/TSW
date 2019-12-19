/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as http from "http";
import logger from "../../logger/index";

// Max response body size
const maxBodySize = 512 * 1024;

export interface ResponseBodyInfo {
  bodyLength: number;
  body: any[];
}

export const captureResponseBody = (
  response: http.IncomingMessage
): ResponseBodyInfo => {
  const originPush = response.push;

  const info: ResponseBodyInfo = {
    bodyLength: 0,
    body: []
  };

  const handler = (chunk: any): void => {
    info.bodyLength += chunk.length;
    if (info.bodyLength <= maxBodySize) {
      info.body.push(chunk);
    }
  };

  let { head } = (response as any).readableBuffer;
  while (head) {
    handler(head.data);
    head = head.next;
  }

  response.push = (chunk: any, encoding?: string): boolean => {
    try {
      if (chunk) {
        handler(chunk);
      }
    } catch (error) {
      logger.debug(`capture stream chunk error ${error.message}`);
    }

    return originPush.call(response, chunk, encoding);
  };

  return info;
};
