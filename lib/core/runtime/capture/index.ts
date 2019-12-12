/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// eslint-disable-next-line import/no-duplicates
import * as http from "http";
// eslint-disable-next-line import/no-duplicates
import { RequestOptions, IncomingMessage } from "http";
import { URL } from "url";
import { Socket } from "net";

import currentContext from "../../context";
import logger from "../../logger/index";
import { captureRequestBody, captureResponseBody } from "../../util/http";

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

const requestHack = <T extends typeof http.request>(
  originRequest: T,
  protocol: requestProtocol
): () => T => (
    optionsOrUrl?: optionsType,
    optionsOrCallback?: optionalType
  ): T => {
    const request = originRequest.apply(
      this, [optionsOrUrl, optionsOrCallback]
    );
    const logPre = `[${currentContext().SN}]`;
    if (optionsOrUrl instanceof URL) {
      return;
    }

    const { method, host, path } = optionsOrUrl;
    const ip = host;
    let port: requestPort = protocol === "https:" ? 443 : 80;
    port = port || optionsOrUrl.port;
    // eslint-disable-next-line max-len
    logger.debug(`${logPre} ${method} ${ip}:${port} ~ ${protocol}//${host}${path}`);
    // 请求信息 - clientIp clientPort requestBody
    let requestInfo: RequestInfo;
    // 响应信息 - serveIp servePort responseBody
    let responseInfo: ResponseInfo;
    // 请求时序
    const timeStart = Date.now();
    const timestamps: Timestamps = {
      timeStart,
      timeConnect: timeStart
    };
    let cost: number;
    // 请求结束后，将请求信息记录在logger.json中
    const recordInLogger = (): void => {
      // eslint-disable-next-line max-len
      logger.debug(`record request info -> request length: ${responseInfo.contentLength}`);
    };

    // 结束请求
    const finishRequest = (response?: IncomingMessage): void => {
      timestamps.timeEnd = new Date().getTime();
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener("socket", onSocket);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener("error", onError);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      request.removeListener("response", onResponse);
      recordInLogger();
    };

    // 错误日志
    const onError = (error: Error): void => {
      logger.error(`${logPre} request error ${error.stack}`);
      recordInLogger();
    };

    // 获取远程IP与端口
    const onSocket = (socket: Socket): void => {
      if (socket.remoteAddress) {
        const timeLookup = Date.now();
        timestamps.timeLookup = timeLookup;
        timestamps.timeConnect = Date.now();
        responseInfo.remoteAddress = socket.remoteAddress;
        responseInfo.remotePort = socket.remoteAddress;
        cost = timeLookup - timeStart;
        // eslint-disable-next-line max-len
        logger.debug(`${logPre} socket reuse ${socket.remoteAddress}:${socket.remotePort}, cost ${cost}ms`);
        return;
      }

      const onSocketError = (error: Error): boolean => {
        logger.error(`${logPre} socket error ${error.stack}`);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cleanSocket();
        finishRequest();
        return true;
      };

      const onConnect = (): void => {
        timestamps.timeConnect = Date.now();
        cost = timestamps.timeConnect - timeStart;
        responseInfo.remoteAddress = socket.remoteAddress;
        responseInfo.remotePort = socket.remotePort;
        // eslint-disable-next-line max-len
        logger.debug(`${logPre} connect ${socket.remoteAddress}:${socket.remotePort}, cost ${cost}ms`);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cleanSocket();
      };

      const onLookup = (
        err: Error,
        address: string,
        family: string | number,
        // eslint-disable-next-line no-shadow
        host: string
      ): void => {
        const timeLookup = Date.now();
        timestamps.timeLookup = timeLookup;
        cost = timeLookup - timeStart;
        // eslint-disable-next-line max-len
        logger.debug(`${logPre} dns lookup ${host} -> ${address || "null"}, cost ${cost}ms`);
        if (err) {
          logger.error(`${logPre} lookup error ${err.stack}`);
        }
      };

      const cleanSocket = (): void => {
        socket.removeListener("error", onSocketError);
        socket.removeListener("connect", onConnect);
        socket.removeListener("lookup", onLookup);
      };
    };

    // 抓取请求包
    captureRequestBody(request);
    // 抓回包
    const onResponse = (response: IncomingMessage): void => {
      timestamps.timeResponse = Date.now();
      const { socket } = response;
      responseInfo.remotePort = socket.remotePort;
      responseInfo.remoteAddress = socket.remoteAddress;
      requestInfo.localAddress = socket.localAddress;
      requestInfo.localPort = socket.localPort;
      cost = timestamps.timeResponse - timestamps.timeStart;
      // eslint-disable-next-line max-len
      logger.debug(`${logPre} ${socket.localAddress}:${socket.localPort} > ${socket.remoteAddress}:${socket.remotePort} response ${response.statusCode} cost:${cost}ms ${response.headers["content-encoding"]}`);
      // 抓取请求包
      const handler = (chunk: chunk): void => {
        responseInfo.contentLength += chunk.length;
        if (responseInfo.contentLength <= maxBodySize) {
          responseInfo.responseBody.push(chunk);
        }
      };

      captureResponseBody(response, handler);
      const finishResponse = (_response: IncomingMessage): void => {
        _response.removeListener("data", handler);
        finishRequest(_response);
      };

      response.once("close", () => {
        logger.debug(`${logPre} close`);
        finishResponse.call(response);
      });

      response.once("end", () => {
        cost = Date.now() - timeStart;
        // eslint-disable-next-line max-len
        logger.debug(`${logPre} end size：${responseInfo.contentLength}, receive data cost: ${cost}ms'`);
        finishResponse.call(response);
      });
    };

    // 事件监听
    request.once("socket", onSocket);
    request.once("error", onError);
    request.once("finish", () => {
      let requestBody: string;
      // eslint-disable-next-line no-underscore-dangle
      const length = request._bodySize;
      if (length >= maxBodySize) {
        // eslint-disable-next-line max-len
        requestBody = Buffer.from(`body was too large too show, length: ${length}`).toString("base64");
      } else {
        // eslint-disable-next-line no-underscore-dangle
        requestBody = request._body.toString("base64");
      }

      requestInfo.requestBody = requestBody;
      logger.debug(`${logPre} send finish, total size ${length}`);
    });

    request.once("response", onResponse);
    // eslint-disable-next-line consistent-return
    return request;
  };

export default requestHack;
