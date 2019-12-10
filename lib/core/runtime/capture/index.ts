/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import * as http from 'http';
import { URL } from 'url';
import { RequestOptions, IncomingMessage } from 'http';
import { Socket } from 'net';

import { currentContext } from '../../context';
import logger from '../../logger/index';
import { captureRequestBody, captureResponseBody } from '../../util/http'

type requestCallback = (
  res: IncomingMessage
) => void;
type optionsType = URL | RequestOptions;
type optionalType = RequestOptions | requestCallback;
type requestProtocol = "http:" | "https:";
type requestPort = string | number;
type chunk = Buffer | Uint8Array | string | null | any;

interface Timestamps {
  timeStart: number;
  timeConnect: number;
  timeLookup?: number;
  timeResponse?: number;
  timeEnd?: number;
}
interface RequestInfo {
  localAddress: string;
  localPort: string | number;
  requestBody: string;
}
interface ResponseInfo {
  remoteAddress: string;
  remotePort: string | number;
  responseBody: Array<chunk>;
  contentLength: number;
}

const maxBodySize = 512 * 1024;

export const requestHack = <T extends typeof http.request>(originRequest: T, protocol: requestProtocol): () => T  => {
  return (optionsOrUrl?: optionsType, optionsOrCallback?: optionalType): T => {
    const request = originRequest.apply(this, [optionsOrUrl, optionsOrCallback]);
    const logPre = `[${currentContext().SN}]`;
    if(optionsOrUrl instanceof URL){
      return
    }
    const { method, host, path } = optionsOrUrl;
    const ip = host;
    let port: requestPort = protocol == 'https:'? 443: 80;
    port = port || optionsOrUrl.port;
    logger.debug(`${logPre} ${method} ${ip}:${port} ~ ${protocol}//${host}${path}`)
    // 请求信息 - clientIp clientPort requestBody
    let requestInfo: RequestInfo
    // 响应信息 - serveIp servePort responseBody
    let responseInfo: ResponseInfo
    // 请求时序
    const timeStart = Date.now();
    const timestamps: Timestamps = {
      timeStart,
      timeConnect: timeStart
    }
    // 请求结束后，将请求信息记录在logger.json中
    const recordInLogger = (): void => {
      logger.debug(`record request info -> request length: ${responseInfo.contentLength}`)
    }
    // 结束请求
    const finishRequest = (response?: IncomingMessage): void => {
      timestamps.timeEnd = new Date().getTime();
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener('socket', onSocket);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener('error', onError);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener('response', onResponse);
      recordInLogger();
    }
    // 错误日志
    const onError = (error: Error): void => {
      logger.error(`${logPre} request error ${error.stack}`);
      recordInLogger()
    }
    // 获取远程IP与端口
    const onSocket = (socket: Socket): void => {
      if(socket.remoteAddress){
        const timeLookup = timestamps.timeLookup = Date.now();
        timestamps.timeConnect = Date.now();
        const remoteAddress = responseInfo.remoteAddress = socket.remoteAddress;
        const remotePort = responseInfo.remotePort = socket.remotePort;
        const cost = timeLookup - timeStart;
        logger.debug(`${logPre} socket reuse ${remoteAddress}:${remotePort}, cost ${cost}ms`);
        return
      }

      const onError = (error: Error): void => {
        logger.error(`${logPre} socket error ${error.stack}`);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cleanSocket();
        finishRequest();
      };
      const onConnect = (): void => {
        timestamps.timeConnect = Date.now();
        const cost = timestamps.timeConnect - timeStart;
        const remoteAddress = responseInfo.remoteAddress = socket.remoteAddress;
        const remotePort = responseInfo.remotePort = socket.remotePort;
        logger.debug(`${logPre} connect ${remoteAddress}:${remotePort}, cost ${cost}ms`);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cleanSocket();
      };
      const onLookup =(err, address, family, host): void => {
        const timeLookup = timestamps.timeLookup = Date.now();
        const cost = timeLookup - timeStart;
        logger.debug(`${logPre} dns lookup ${host} -> ${address || 'null'}, cost ${cost}ms`);
        if (err) {
          logger.error(`${logPre} lookup error ${err.stack}`);
        }
      };
      const cleanSocket = (): void => {
        socket.removeListener('error', onError);
        socket.removeListener('connect', onConnect);
        socket.removeListener('lookup', onLookup);
      };
    }
    // 抓取请求包
    captureRequestBody(request)
    // 抓回包
    const onResponse = (response: IncomingMessage): void => {
      timestamps.timeResponse = Date.now();
      const socket: Socket = response.socket;
      const remotePort = responseInfo.remotePort = socket.remotePort;
      const remoteAddress = responseInfo.remoteAddress = socket.remoteAddress;
      const localAddress = requestInfo.localAddress = socket.localAddress;
      const localPort = requestInfo.localPort = socket.localPort;
      const cost = timestamps.timeResponse - timestamps.timeStart;
      logger.debug(`${logPre} ${localAddress}:${localPort} > ${remoteAddress}:${remotePort} response ${response.statusCode} cost:${cost}ms ${response.headers['content-encoding']}`);
      // 抓取请求包
      const handler = (chunk: chunk): void => {
        responseInfo.contentLength += chunk.length;
        if(responseInfo.contentLength <= maxBodySize){
          responseInfo.responseBody.push(chunk);
        }
      }
      captureResponseBody(response, handler)
      const finishResponse = (response: IncomingMessage) => {
        response.removeListener('data', handler);
        finishRequest(response)
      }
      response.once('close', () => {
        logger.debug(`${logPre} close`);
        finishResponse.call(response);
      })
      response.once('end', () => {
        const cost = Date.now() - timeStart;
        logger.debug(`${logPre}end size：${responseInfo.contentLength}, receive data cost: ${cost}ms'`);
        finishResponse.call(response)
      })
    }
    // 事件监听
    request.once('socket', onSocket);
    request.once('error', onError);
    request.once('finish', () => {
      let requestBody: string;
      const length = request._bodySize;
      if(length >= maxBodySize){
        requestBody = Buffer.from(`body was too large too show, length: ${length}`).toString('base64');
      }else{
        requestBody = request._body.toString('base64');
      }
      requestInfo.requestBody = requestBody;
      logger.debug(`${logPre} send finish, total size ${length}`);
    });
    request.once('response', onResponse)
    return request
  }
}
