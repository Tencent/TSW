/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

export interface Log {
  showLineNumber: boolean;
  arr: Array<string>;

  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export interface RequestLog {
  SN: number;

  protocol: "HTTPS" | "HTTP";
  host: string;
  url: string;
  cache: string;
  process: string;
  resultCode: number;
  contentLength: number;
  contentType: string;
  clientIp: string;
  clientPort: number;
  serverIp: string;
  serverPort: number;
  requestHeader: string;
  requestBody: string;
  responseHeader: string;
  responseBody: string;
  /**
   * Fiddler timers
   */
  timestamps: {
      /**
       * Exact time that the client browser made a TCP/IP connection to Fiddler.
       */
      ClientConnected: Date;
      /**
       * Time at which this HTTP request began. May be much later than ClientConnected due to client connection reuse.
       */
      ClientBeginRequest: Date;
      /**
       * Exact time at which Fiddler finished reading the request headers from the client
       */
      GotRequestHeaders: Date;
      /**
       * Exact time that the client browser finished sending the HTTP request to Fiddler.
       */
      ClientDoneRequest: Date;
      /**
       * milliseconds Fiddler spent determining the upstream gateway proxy to use (e.g. processing autoproxy script). Mutually exclusive to DNSTime.
       */
      GatewayTime: number;
      /**
       * milliseconds Fiddler spent in DNS looking up the server's IP address.
       */
      DNSTime: number;
      /**
       * milliseconds Fiddler spent TCP/IP connecting to that server's IP address.
       */
      TCPConnectTime: number;
      /**
       * Amount of time spent in HTTPS handshake
       */
      HTTPSHandshakeTime: number;
      /**
       * Time at which this connection to the server was made. May be much earlier than ClientConnected due to server connection reuse.
       */
      ServerConnected: Date;
      /**
       * The time at which Fiddler began sending the HTTP request to the server.
       */
      FiddlerBeginRequest: Date;
      /**
       * Exact time that Fiddler finished (re)sending the HTTP request to the server.
       */
      ServerGotRequest: Date;
      /**
       * Exact time that Fiddler got the first bytes of the server's HTTP response.
       */
      ServerBeginResponse: Date;
      /**
       * Exact time when Fiddler starts getting the response back from the server.
       */
      GotResponseHeaders: Date;
      /**
       * Exact time that Fiddler got the last bytes of the server's HTTP response.
       */
      ServerDoneResponse: Date;
      /**
       * Exact time that Fiddler began transmitting the HTTP response to the client browser.
       */
      ClientBeginResponse: Date;
      /**
       * Exact time that Fiddler finished transmitting the HTTP response to the client browser.
       */
      ClientDoneResponse: Date;
  };
}

export class Context {
  log: Log;
  SN: number;
  captureSN: number;
  captureRequests: RequestLog[];

  constructor() {
    this.log = {
      showLineNumber: false,
      arr: [],
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0
    };

    this.SN = process.SN || 0;
    this.captureSN = 0;
    this.captureRequests = [];
  }
}

export default (): Context | null => {
  if (!process.domain) {
    return null;
  }

  if (!process.domain.currentContext) {
    process.domain.currentContext = new Context();
  }

  return process.domain.currentContext;
};
