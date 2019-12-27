/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as http from "http";
import * as domain from "domain";
import { RequestLog, Context } from "../context";
import { address } from "ip";
import { AddressInfo } from "net";
import { captureOutgoing } from "./capture/outgoing";
import { captureIncoming } from "./capture/incoming";
import { eventBus, EVENT_LIST, EventPayload } from "../bus";

let httpCreateServerHacked = false;
let originHttpCreateServer = null;

export interface ResponseEventPayload extends EventPayload {
  data: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    context: Context;
  };
}

export const httpCreateServerHack = (): void => {
  if (!httpCreateServerHacked) {
    httpCreateServerHacked = true;
    originHttpCreateServer = http.createServer;

    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    http.createServer = ((
      createServer
    ) => (
      optionsOrRequestListener: http.ServerOptions,
      requestListenerOrUndefined?: http.RequestListener
    ): void => {
      let requestListener: http.RequestListener;
      let options: http.ServerOptions;
      if (typeof optionsOrRequestListener === "function") {
        requestListener = optionsOrRequestListener;
      } else {
        requestListener = requestListenerOrUndefined;
        options = optionsOrRequestListener;
      }

      const requestListenerWrap: http.RequestListener = (req, res) => {
        const start = new Date();
        const timestamps: RequestLog["timestamps"] = {
          dnsTime: 0,
          requestStart: start,
          onSocket: start,
          onLookUp: start,
          requestFinish: start,
          socketConnect: start
        } as RequestLog["timestamps"];

        console.log("httpCreateServerHack - creating domain");

        const d = domain.create();

        d.add(req);
        d.add(res);
        d.run(() => {
          console.log(
            "httpCreateServerHack - calling requestListener within domain"
          );

          console.log(process.domain);
          requestListener(req, res);
        });

        const requestInfo = captureIncoming(req);

        res.writeHead = ((fn): typeof res.writeHead => (
          ...args: unknown[]
        ): ReturnType<typeof res.writeHead> => {
          timestamps.onResponse = new Date();

          const context = process.domain.currentContext;
          const payload: ResponseEventPayload = {
            code: 0,
            msg: "success",
            success: true,
            error: null,
            data: {
              req, res, context
            }
          };

          eventBus.emit(EVENT_LIST.RESPONSE_START, payload);

          captureOutgoing(res);

          return fn.apply(res, args);
        })(res.writeHead);

        res.once("finish", () => {
          const context = process.domain.currentContext;

          context.currentRequest = {
            SN: context.SN,

            protocol: "HTTP",
            host: req.headers.host,
            path: req.url,

            process: `TSW: ${process.pid}`,

            clientIp: req.socket.remoteAddress,
            clientPort: req.socket.remotePort,
            serverIp: address(),
            serverPort: (req.socket.address() as AddressInfo).port,
            requestHeader: ((): string => {
              const result = [];
              result.push(`${req.method} ${
                req.url} HTTP/${req.httpVersion}`);

              Object.keys(req.headers).forEach((key) => {
                result.push(`${key}: ${req.headers[key]}`);
              });

              result.push("");
              result.push("");

              return result.join("\r\n");
            })(),
            requestBody: requestInfo.body.toString("base64"),
            responseHeader: ((): string => {
              const result = [];
              result.push(`HTTP/${req.httpVersion} ${
                res.statusCode} ${res.statusMessage}`);

              const resHeaders = res.getHeaders();
              Object.keys(resHeaders).forEach((key) => {
                result.push(`${key}: ${resHeaders[key]}`);
              });

              result.push("");
              result.push("");

              return result.join("\r\n");
            })(),
            responseBody: (res as any)._body.toString("base64"),
            responseLength: (res as any)._bodyLength,
            responseType: res.getHeader("content-type"),
            statusCode: res.statusCode,
            timestamps
          } as RequestLog;

          const payload: ResponseEventPayload = {
            code: 0,
            msg: "success",
            success: true,
            error: null,
            data: {
              req, res, context
            }
          };

          eventBus.emit(EVENT_LIST.RESPONSE_FINISH, payload);
        });

        res.once("close", () => {
          timestamps.responseClose = new Date();

          const context = process.domain.currentContext;

          const payload: ResponseEventPayload = {
            code: 0,
            msg: "success",
            success: true,
            error: null,
            data: {
              req, res, context
            }
          };

          eventBus.emit(EVENT_LIST.RESPONSE_CLOSE, payload);
        });
      };

      if (options) {
        return createServer.apply(this, [options, requestListenerWrap]);
      }

      return createServer.apply(this, [requestListenerWrap]);
    })(http.createServer);
  }
};

export const httpCreateServerRestore = (): void => {
  if (httpCreateServerHacked) {
    httpCreateServerHacked = false;
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    http.createServer = originHttpCreateServer;
  }
};
