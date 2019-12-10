/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { IncomingMessage } from 'http';

import { Readable } from 'stream'

import logger from '../logger/index';

type requestData = string | Buffer;
type requestBody = Array<Buffer>;

const maxBodySize = 1024 * 1024;  // 1MB

export const captureRequestBody = (request): void => {
  if(request._capturing){
    request._capturing = true;
  }
  request._capturing = true;
  let _body: requestBody;
  let _bodySize = 0;
  logger.debug('capture request body on');
  request.captureBody = (data: requestData, encoding?: BufferEncoding): void => {
    // if(typeof data == 'function' || !data){
    //   return;
    // }
    // if(typeof encoding == 'function'){
    //   encoding = null;
    // }
    const buffer = ((): Buffer => {
      if(!Buffer.isBuffer(data)){
        return Buffer.from(data, encoding)
      }
      return data
    })();
    // data 推入 _body，并且转换为buffer
    _bodySize += buffer.length;
    if(_bodySize < maxBodySize){
      _body.push(buffer);
    }
  };
  request._send = (fn => {
    return (data: requestData, encoding?: string, callback?: any) => {
      request.captureBody(data, encoding);
      return fn.apply(request, [data, encoding, callback])
    }
  })(request._send);
  request._finish = ((fn?) => {
    return (params?): void => {
      const bodyResult = ((): Buffer => {
        // 请求结束后，将_body转换为buffer
        if(!Buffer.isBuffer(_body)){
          return Buffer.concat(_body);
        }
        return _body;
      })();
      request._body = bodyResult;
    }
  })(request._finish);
}
// http://nodejs.cn/api/stream.html#stream_readable_push_chunk_encoding
export const captureResponseBody = (stream: IncomingMessage, handler): void => {
  const originPush = stream.push;

  // readable.readableBuffer undefined ???
  // let head = stream.readableBuffer && stream.readableBuffer.head;
  // while(head){
  //   handler(head.data);
  //   head = head.next;
  // }

  stream.push = (chunk: any, encoding?: string): boolean => {
    try {
      chunk && handler(chunk);
    } catch (error) {
      logger.debug(`capture stream chunk error ${error.message}`)
    }
    return originPush.call(stream, chunk, encoding)
  }
}
