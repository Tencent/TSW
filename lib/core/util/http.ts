/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { IncomingMessage } from "http";
import logger from "../logger/index";

type requestData = string | Buffer;
type requestBody = Array<Buffer>;

const maxBodySize = 1024 * 1024;// 1MB

export const captureRequestBody = (request): void => {
  // eslint-disable-next-line no-underscore-dangle
  if (request._capturing) {
    // eslint-disable-next-line no-underscore-dangle
    request._capturing = true;
  }

  // eslint-disable-next-line no-underscore-dangle
  request._capturing = true;
  let body: requestBody;
  let bodySize = 0;
  logger.debug("capture request body on");
  request.captureBody = (
    data: requestData,
    encoding?: BufferEncoding
  ): void => {
    // if(typeof data == 'function' || !data){
    //   return;
    // }
    // if(typeof encoding == 'function'){
    //   encoding = null;
    // }
    const buffer = ((): Buffer => {
      if (!Buffer.isBuffer(data)) {
        return Buffer.from(data, encoding);
      }

      return data;
    })();
    // data 推入 _body，并且转换为buffer
    bodySize += buffer.length;
    if (bodySize < maxBodySize) {
      body.push(buffer);
    }
  };

  // eslint-disable-next-line no-underscore-dangle
  request._send = ((fn) => (
    data: requestData,
    encoding?: string, callback?: any
  ): any => {
    request.captureBody(data, encoding);
    return fn.apply(request, [data, encoding, callback]);
  // eslint-disable-next-line no-underscore-dangle
  })(request._send);

  // eslint-disable-next-line no-underscore-dangle
  request._finish = ((fn?) => (params?): void => {
    const bodyResult = ((): Buffer => {
      // 请求结束后，将_body转换为buffer
      if (!Buffer.isBuffer(body)) {
        return Buffer.concat(body);
      }

      return body;
    })();
    // eslint-disable-next-line no-underscore-dangle
    request._body = bodyResult;
  // eslint-disable-next-line no-underscore-dangle
  })(request._finish);
};

// http://nodejs.cn/api/stream.html#stream_readable_push_chunk_encoding
export const captureResponseBody = (
  stream: IncomingMessage,
  handler: { (chunk: any): void; (arg0: any): void }
): void => {
  const originPush = stream.push;

  // readable.readableBuffer undefined ???
  // let head = stream.readableBuffer && stream.readableBuffer.head;
  // while(head){
  //   handler(head.data);
  //   head = head.next;
  // }

  // eslint-disable-next-line no-param-reassign
  stream.push = (chunk: any, encoding?: string): boolean => {
    try {
      if (chunk) {
        handler(chunk);
      }
    } catch (error) {
      logger.debug(`capture stream chunk error ${error.message}`);
    }

    return originPush.call(stream, chunk, encoding);
  };
};
