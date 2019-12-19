/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { Socket, isIP } from "net";

import currentContext from "../../context";
import logger from "../../logger/index";

type requestProtocol = "http:" | "https:";
type chunk = Buffer | Uint8Array | string | null | any;

interface Timestamps {
  timeStart: number;
  timeConnect: number;
  timeLookup?: number;
  timeResponse?: number;
  timeEnd?: number;
}
interface RequestInfo {
  localAddress?: string;
  localPort?: string | number;
  requestBody?: string;
}
interface ResponseInfo {
  remoteAddress?: string;
  remotePort?: string | number;
  responseBody?: chunk[];
  contentLength?: number;
}

const maxBodySize = 512 * 1024;

/**
 * Convert a URL instance to a http.request options
 * https://github.com/nodejs/node/blob/afa9a7206c26a29a2af226696c145c924a6d3754/lib/internal/url.js#L1270
 * @param url a URL instance
 */
const urlToOptions = (url: URL): http.RequestOptions => {
  const options: http.RequestOptions = {
    protocol: url.protocol,
    hostname: typeof url.hostname === "string" && url.hostname.startsWith("[")
      ? url.hostname.slice(1, -1)
      : url.hostname,
    path: `${url.pathname || ""}${url.search || ""}`
  };

  if (url.port !== "") {
    options.port = Number(url.port);
  }

  if (url.username || url.password) {
    options.auth = `${url.username}:${url.password}`;
  }

  return options;
};

const captureRequestBody = (request: http.ClientRequest): void => {
  let bodySize = 0;
  const body: Buffer[] = [];

  (request as any)._send = ((fn) => (
    data: Buffer | Uint8Array | string,
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

      if (typeof data === "string") {
        return Buffer.from(data, encoding);
      }

      return Buffer.from(data);
    })();

    bodySize += buffer.length;
    if (bodySize < maxBodySize) {
      body.push(buffer);
    }

    return fn.apply(request, [data, encoding, callback]);
  })((request as any)._send);

  (request as any)._finish = ((fn) => (
    ...args: unknown[]
  ): void => {
    (request as any)._body = ((): Buffer => {
      // 请求结束后，将_body转换为buffer
      if (!Buffer.isBuffer(body)) {
        return Buffer.concat(body);
      }

      return body;
    })();

    (request as any)._bodySize = bodySize;

    return fn.apply(request, args);
  })((request as any)._finish);
};

const captureResponseBody = (
  response: http.IncomingMessage,
  handler: (d: any) => void
): void => {
  const originPush = response.push;

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
};

export const hack = <T extends typeof http.request>(
  originRequest: T,
  protocol: requestProtocol
): (...args: unknown[]) => http.ClientRequest => (
    ...args
  ): http.ClientRequest => {
    let options: http.RequestOptions;
    if (typeof args[1] === "undefined" || typeof args[1] === "function") {
      // function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
      if (typeof args[0] === "string") {
        options = urlToOptions(new URL(args[0]));
      } else if (args[0] instanceof URL) {
        options = urlToOptions(args[0]);
      } else {
        options = args[0] as http.RequestOptions;
      }
    } else {
      // function request(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
      if (typeof args[0] === "string") {
        options = urlToOptions(new URL(args[0]));
      } else {
        options = urlToOptions(args[0] as URL);
      }

      options = Object.assign(options, args[1]);
    }

    // Execute request here
    const request: http.ClientRequest = originRequest.apply(this, args);

    const logPre = `[${currentContext().captureSN}]`;
    currentContext().captureSN += 1;

    const {
      method, hostname, path, port
    } = options;

    logger.debug(`${logPre} ${method} ${hostname}:${port} ~ ${
      protocol}//${hostname}${path}`);

    const requestInfo: RequestInfo = {};
    const responseInfo: ResponseInfo = {
      contentLength: 0
    };
    const timeStart = Date.now();
    const timestamps: Timestamps = {
      timeStart,
      timeConnect: timeStart
    };
    let cost: number;
    // 请求结束后，将请求信息记录在logger.json中
    const recordInLogger = (): void => {
      logger.debug(`record request info -> request length: ${
        responseInfo.contentLength}`);
    };

    const finishRequest = (): void => {
      timestamps.timeEnd = new Date().getTime();

      console.log(timestamps);
      console.log(requestInfo);
      console.log(responseInfo);

      recordInLogger();
    };

    captureRequestBody(request);

    request.once("socket", (socket: Socket): void => {
      if (socket.remoteAddress) {
        const timeLookup = Date.now();
        timestamps.timeLookup = timeLookup;
        timestamps.timeConnect = Date.now();
        responseInfo.remoteAddress = socket.remoteAddress;
        responseInfo.remotePort = socket.remoteAddress;
        cost = timeLookup - timeStart;
        logger.debug(`${logPre} socket reuse ${
          socket.remoteAddress}:${socket.remotePort}, cost ${cost}ms`);

        return;
      }

      if (!isIP(hostname)) {
        socket.once("lookup", (
          err: Error,
          address: string,
          family: string | number,
          host: string
        ): void => {
          const timeLookup = Date.now();
          timestamps.timeLookup = timeLookup;
          cost = timeLookup - timeStart;
          logger.debug(`${logPre} dns lookup ${host} -> ${
            address || "null"}, cost ${cost}ms`);

          if (err) {
            logger.error(`${logPre} lookup error ${err.stack}`);
          }
        });
      }

      socket.once("connect", (): void => {
        timestamps.timeConnect = Date.now();
        cost = timestamps.timeConnect - timeStart;
        responseInfo.remoteAddress = socket.remoteAddress;
        responseInfo.remotePort = socket.remotePort;
        logger.debug(`${logPre} connect ${
          socket.remoteAddress}:${socket.remotePort}, cost ${cost}ms`);
      });

      socket.once("error", (error: Error): boolean => {
        logger.error(`${logPre} socket error ${error.stack}`);
        finishRequest();
        return true;
      });
    });

    request.once("error", (error: Error) => {
      logger.error(`${logPre} request error ${error.stack}`);
      recordInLogger();
    });

    request.once("finish", () => {
      let requestBody: string;
      const length = (request as any)._bodySize;
      if (length >= maxBodySize) {
        requestBody = Buffer.from(`body was too large too show, length: ${
          length}`).toString("base64");
      } else {
        requestBody = (request as any)._body.toString("base64");
      }

      requestInfo.requestBody = requestBody;
      logger.debug(`${logPre} send finish, total size ${length}`);
    });

    request.once("response", (response: http.IncomingMessage): void => {
      timestamps.timeResponse = Date.now();
      const { socket } = response;
      responseInfo.remotePort = socket.remotePort;
      responseInfo.remoteAddress = socket.remoteAddress;
      requestInfo.localAddress = socket.localAddress;
      requestInfo.localPort = socket.localPort;
      cost = timestamps.timeResponse - timestamps.timeStart;

      logger.debug(`${logPre} ${socket.localAddress}:${socket.localPort} > ${
        socket.remoteAddress
      }:${socket.remotePort} response ${
        response.statusCode
      } cost:${cost}ms ${
        response.headers["content-encoding"]
      }`);

      const handler = (chunk: chunk): void => {
        responseInfo.contentLength += chunk.length;
        if (responseInfo.contentLength <= maxBodySize) {
          responseInfo.responseBody.push(chunk);
        }
      };

      captureResponseBody(response, handler);

      response.once("close", () => {
        logger.debug(`${logPre} close`);
        finishRequest();
      });

      response.once("end", () => {
        cost = Date.now() - timeStart;

        logger.debug(`${logPre} end size：${
          responseInfo.contentLength
        }, receive data cost: ${cost}ms'`);

        finishRequest();
      });
    });

    return request;
  };

let hacked = false;
let originHttpRequest = null;
let originHttpsRequest = null;
export const requestHack = (): void => {
  if (!hacked) {
    originHttpRequest = http.request;
    originHttpsRequest = https.request;
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    http.request = hack(http.request, "http:");
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    https.request = hack(https.request, "https:");

    hacked = true;
  }
};

export const requestRestore = (): void => {
  if (hacked) {
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    http.request = originHttpRequest;
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    https.request = originHttpsRequest;

    hacked = false;
  }
};
