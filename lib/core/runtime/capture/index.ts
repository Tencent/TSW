/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { createRequire } from "node:module";
import * as http from "node:http";
import * as https from "node:https";
import * as domain from "node:domain";
import { URL } from "node:url";
import { Socket, isIP } from "node:net";
import lodash from "lodash";
const { cloneDeep } = lodash;
import { captureOutgoing } from "./outgoing.js";
import { captureIncoming } from "./incoming.js";

import currentContext, { RequestLog, Context } from "../../context.js";
import logger from "../../logger/index.js";

const require = createRequire(import.meta.url);
const httpMut = require("node:http") as typeof http;
const httpsMut = require("node:https") as typeof https;

type requestProtocol = "http:" | "https:";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "cookie",
  "set-cookie"
]);

/**
 * Parse a raw HTTP header string into an object,
 * masking sensitive header values with "***".
 */
const parseHeaders = (str: string): Record<string, string> | undefined => {
  if (!str) return undefined;
  const obj: Record<string, string> = {};

  str.trim().split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) {
      obj._firstLine = line;
    } else {
      const key = line.slice(0, idx).trim();
      obj[key] = SENSITIVE_HEADERS.has(key.toLowerCase())
        ? "***"
        : line.slice(idx + 1).trim();
    }
  });

  return obj;
};

/** Decode a base64-encoded body, truncated to maxLen characters. */
const decodeBody = (base64Str: string | undefined, maxLen = 2000): string | null => {
  if (!base64Str) return null;
  try {
    const text = Buffer.from(base64Str, "base64").toString("utf-8");

    return text.length > maxLen
      ? `${text.slice(0, maxLen)}... (truncated, total ${text.length} chars)`
      : text;
  } catch {
    return null;
  }
};

const formatRequestLog = (log: Partial<RequestLog>): string => {
  const resBody = decodeBody(log.responseBody);
  const info = JSON.stringify({
    url: `${log.protocol} ${log.host}${log.path}`,
    statusCode: log.statusCode,
    requestHeader: parseHeaders(log.requestHeader),
    responseHeader: parseHeaders(log.responseHeader),
    responseLength: log.responseLength
  }, null, 2);

  return resBody ? `${info}\nResponseBody: ${resBody}` : info;
};

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
): ((...args: unknown[]) => http.ClientRequest) => (
    (...args): http.ClientRequest => {
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
      // Execute capture，ClientRequest extends OutgoingMessage(extends Stream.Writable)
      captureOutgoing(request);

      const context = currentContext() || new Context();
      const logPre = `[${context.captureSN}]`;

      const {
        method, host: reqHost, hostname = reqHost, path, port
      } = options;

      logger.debug(`${logPre} Request begin. ${
        method} ${hostname}${port ? `:${port}` : ""} ~ ${path}`);

      const requestLog: Partial<RequestLog> = {
        SN: context.captureSN,

        protocol: protocol === "http:" ? "HTTP" : "HTTPS",
        host: hostname,
        path,

        process: `TSW: ${process.pid}`,
        timestamps: {} as RequestLog["timestamps"]
      };

      const { timestamps } = requestLog;
      timestamps.requestStart = new Date().getTime();

      const clearDomain = (): void => {
        const parser = (request.socket as any)?.parser as any;
        if (parser && parser.domain) {
          (parser.domain as domain.Domain).exit();
          parser.domain = null;
        }
      };

      const finishRequest = (): void => {
        context.captureRequests.push(requestLog as RequestLog);

        logger.debug(`${logPre} Record request info. Response body length: ${
          requestLog.responseLength
        }`);
      };

      request.once("socket", (socket: Socket): void => {
        timestamps.onSocket = new Date().getTime();

        if (!isIP(hostname)) {
          socket.once("lookup", (
            err: Error,
            address: string,
            family: string | number,
            host: string
          ): void => {
            timestamps.onLookUp = new Date().getTime();
            timestamps.dnsTime = timestamps.onLookUp - timestamps.onSocket;

            logger.debug(`${logPre} Dns lookup ${host} -> ${
              address || "null"}. Cost ${timestamps.dnsTime}ms`);

            if (err) {
              logger.error(`${logPre} Lookup ${host} -> ${address || "null"}, error ${err.stack}`);

              logger.debug(`${logPre} Request: ${formatRequestLog(requestLog)}`);
            }
          });
        }

        socket.once("connect", (): void => {
          timestamps.socketConnect = new Date().getTime();

          logger.debug(`${logPre} Socket connected. Remote: ${
            socket.remoteAddress
          }:${socket.remotePort}. Cost ${
            timestamps.socketConnect - timestamps.onSocket
          } ms`);
        });

        if (socket.remoteAddress) {
          timestamps.dnsTime = 0;

          logger.debug(`${logPre} Socket reused. Remote: ${
            socket.remoteAddress
          }:${socket.remotePort}`);
        }
      });

      request.once("error", (error: Error) => {
        // error may fire before finish — manually capture headers & body
        if (!requestLog.requestHeader) {
          requestLog.requestHeader = (request as any)._header;
        }

        if (!requestLog.requestBody) {
          const body = (request as any)._body;
          if (body) {
            requestLog.requestBody = body.toString("base64");
          }
        }

        logger.error(`${logPre} Request error. Stack: ${error.stack}`);

        logger.error(`${logPre} Request: ${formatRequestLog(requestLog)}`);

        finishRequest();
        clearDomain();
      });

      request.once("close", clearDomain);

      request.once("finish", () => {
        timestamps.requestFinish = new Date().getTime();

        context.captureSN += 1;

        let requestBody: string;
        const length = (request as any)._bodyLength;
        const tooLarge = (request as any)._bodyTooLarge;
        if (tooLarge) {
          requestBody = Buffer.from(`body was too large too show, length: ${
            length}`).toString("base64");
        } else {
          requestBody = (request as any)._body.toString("base64");
        }

        requestLog.requestHeader = (request as any)._header;
        requestLog.requestBody = requestBody;
        logger.debug(`${logPre} Request send finish. Body size ${
          length
        }. Cost: ${
          timestamps.requestFinish - timestamps.onSocket
        } ms`);

        clearDomain();
      });

      request.once("response", (response: http.IncomingMessage): void => {
        timestamps.onResponse = new Date().getTime();

        const { socket } = response;
        requestLog.serverIp = socket.remoteAddress;
        requestLog.serverPort = socket.remotePort;
        // This could be undefined
        // https://stackoverflow.com/questions/16745745/nodejs-tcp-socket-does-not-show-client-hostname-information
        requestLog.clientIp = socket.localAddress;
        requestLog.clientPort = socket.localPort;

        logger.debug(`${logPre} Request on response. Socket chain: ${
          socket.localAddress
        }:${socket.localPort} > ${
          socket.remoteAddress
        }:${socket.remotePort}. Response status code: ${
          response.statusCode
        }. Cost: ${
          timestamps.onResponse - timestamps.onSocket
        } ms`);

        // responseInfo can't retrieve data until response "end" event
        const responseInfo = captureIncoming(response);

        response.once("end", () => {
          timestamps.responseClose = new Date().getTime();

          requestLog.statusCode = response.statusCode;
          requestLog.responseLength = responseInfo.bodyLength;
          requestLog.responseType = response.headers["content-type"];
          requestLog.responseHeader = ((): string => {
            const result = [];
            result.push(`HTTP/${response.httpVersion} ${
              response.statusCode} ${response.statusMessage}`);

            const cloneHeaders = cloneDeep(response.headers);
            // Transfer a chunked response to a full response.
            // https://imququ.com/post/transfer-encoding-header-in-http.html
            if (!cloneHeaders["content-length"]
            && responseInfo.bodyLength >= 0) {
              delete cloneHeaders["transfer-encoding"];
              cloneHeaders["content-length"] = String(responseInfo.bodyLength);
            }

            Object.keys(cloneHeaders).forEach((key) => {
              result.push(`${key}: ${cloneHeaders[key]}`);
            });

            result.push("");
            result.push("");

            return result.join("\r\n");
          })();

          requestLog.responseBody = responseInfo.body.toString("base64");

          logger.debug(`${logPre} Response on end. Body size：${
            requestLog.responseLength
          }. Cost: ${
            timestamps.responseClose - timestamps.onSocket
          } ms`);

          // Log full request/response details for non-2xx to aid debugging
          if (response.statusCode >= 400) {
            logger.debug(`${logPre} ❌ HTTP request failed [${response.statusCode}]: ${formatRequestLog(requestLog)}`);
          }

          finishRequest();
        });
      });

      return request;
    }
  );

let hacked = false;
let originHttpRequest = null;
let originHttpsRequest = null;
export const requestHack = (): void => {
  if (!hacked) {
    originHttpRequest = httpMut.request;
    originHttpsRequest = httpsMut.request;
    httpMut.request = hack(httpMut.request, "http:") as any;
    httpsMut.request = hack(httpsMut.request, "https:") as any;

    hacked = true;
  }
};

export const requestRestore = (): void => {
  if (hacked) {
    httpMut.request = originHttpRequest;
    httpsMut.request = originHttpsRequest;

    hacked = false;
  }
};
