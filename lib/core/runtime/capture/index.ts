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
import { captureRequestBody } from "./request";
import { captureResponseBody } from "./response";

import currentContext, { RequestLog } from "../../context";
import logger from "../../logger/index";

type requestProtocol = "http:" | "https:";

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

    // Execute request
    const request: http.ClientRequest = originRequest.apply(this, args);
    // Execute capture
    captureRequestBody(request);

    const context = currentContext();

    const logPre = `[${context.captureSN}]`;

    const {
      method, hostname, path, port, host
    } = options;

    logger.debug(`${logPre} Request begin. ${method} ${hostname}:${port} ~ ${
      protocol}//${hostname}${path}`);

    const requestLog: Partial<RequestLog> = {
      SN: context.captureSN,

      host,
      protocol: protocol.toUpperCase() as RequestLog["protocol"],
      url: `${protocol}//${host}${path}`,
      cache: "",
      process: `TSW: ${process.pid}`,
      timestamps: {
        ServerConnected: new Date(),
        ClientConnected: new Date(),
        GatewayTime: 0,
        TCPConnectTime: 0,
        HTTPSHandshakeTime: 0
      } as RequestLog["timestamps"]
    };

    const { timestamps } = requestLog;

    const finishRequest = (): void => {
      context.captureRequests.push(requestLog as RequestLog);
      context.captureSN += 1;

      console.log(requestLog);

      logger.debug(`Record request info. Response length: ${
        requestLog.contentLength
      }`);
    };

    request.once("socket", (socket: Socket): void => {
      timestamps.ClientBeginRequest = new Date();
      timestamps.FiddlerBeginRequest = new Date();
      timestamps.GotRequestHeaders = new Date();

      if (!isIP(hostname)) {
        socket.once("lookup", (
          err: Error,
          address: string,
          family: string | number,
          /**
           * host
           */
          h: string
        ): void => {
          timestamps.DNSTime = new Date().getTime()
            - timestamps.ClientBeginRequest.getTime();

          logger.debug(`${logPre} dns lookup ${h} -> ${
            address || "null"}, cost ${timestamps.DNSTime}ms`);

          if (err) {
            logger.error(`${logPre} lookup error ${err.stack}`);
          }
        });
      }

      socket.once("connect", (): void => {
        const timeConnect = Date.now();
        const cost = timeConnect - 0;
        logger.debug(`${logPre} connect ${
          socket.remoteAddress}:${socket.remotePort}, cost ${cost}ms`);
      });

      if (socket.remoteAddress) {
        timestamps.DNSTime = new Date().getTime()
            - timestamps.ClientBeginRequest.getTime();

        logger.debug(`${logPre} socket reuse ${
          socket.remoteAddress
        }:${socket.remotePort}, cost ${
          timestamps.DNSTime
        }ms`);
      }
    });

    request.once("error", (error: Error) => {
      logger.error(`${logPre} request error ${error.stack}`);
      finishRequest();
    });

    request.once("finish", () => {
      timestamps.ClientDoneRequest = new Date();
      // Unknown when server got the request
      timestamps.ServerGotRequest = new Date();

      let requestBody: string;
      const length = (request as any)._bodySize;
      const tooLarge = (request as any)._bodyTooLarge;
      if (tooLarge) {
        requestBody = Buffer.from(`body was too large too show, length: ${
          length}`).toString("base64");
      } else {
        requestBody = (request as any)._body.toString("base64");
      }

      requestLog.requestHeader = (request as any)._header;
      requestLog.requestBody = requestBody;
      logger.debug(`${logPre} send finish, total size ${length}`);
    });

    request.once("response", (response: http.IncomingMessage): void => {
      const timeOnResponse = new Date();
      timestamps.ServerBeginResponse = timeOnResponse;
      timestamps.ClientBeginResponse = timeOnResponse;
      timestamps.GotResponseHeaders = timeOnResponse;

      const { socket } = response;
      requestLog.serverIp = socket.remoteAddress;
      requestLog.serverPort = socket.remotePort;
      requestLog.clientIp = socket.localAddress;
      requestLog.clientPort = socket.localPort;

      logger.debug(`${logPre} ${socket.localAddress}:${socket.localPort} > ${
        socket.remoteAddress
      }:${socket.remotePort} response ${
        response.statusCode
      }. Cost:${
        timestamps.ServerBeginResponse.getTime()
        - timestamps.ClientConnected.getTime()
      } ms ${
        response.headers["content-encoding"]
      }`);

      // responseInfo can't retrieve data until response "end" event
      const responseInfo = captureResponseBody(response);

      response.once("close", () => {
        const timeOnResponseClose = new Date();
        timestamps.ServerDoneResponse = timeOnResponseClose;
        timestamps.ClientDoneResponse = timeOnResponseClose;

        requestLog.resultCode = response.statusCode;
        requestLog.contentLength = Number(response.headers["content-length"]);
        requestLog.contentType = response.headers["content-type"];
        requestLog.responseHeader = ((): string => {
          const result = [];
          result.push(`HTTP/${response.httpVersion} ${
            response.statusCode} ${response.statusMessage}`);

          Object.keys(response.headers).forEach((key) => {
            result.push(`${key}: ${response.headers[key]}`);
          });

          result.push("");
          result.push("");

          return result.join("\r\n");
        })();

        requestLog.responseBody = responseInfo.body.toString("base64");

        logger.debug(`${logPre} Response on end. Size：${
          requestLog.contentLength
        }. Cost: ${
          timestamps.ServerDoneResponse.getTime()
          - timestamps.ClientConnected.getTime()
        } ms'`);

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
