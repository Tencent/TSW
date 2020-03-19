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
  path: string;
  process: string;

  clientIp: string;
  clientPort: number;
  serverIp: string;
  serverPort: number;

  requestHeader: string;
  requestBody: string;

  responseHeader: string;
  responseBody: string;
  responseLength: number;
  responseType: string;
  statusCode: number;

  timestamps: {
    /**
     * Request begin.
     */
    requestStart: Date;
    /**
     * request.on("socket")
     */
    onSocket: Date;
    /**
     * Exact time that dns look up done.
     */
    onLookUp: Date;
    /**
     * Exact time that client finished sending HTTP request to the server.
     */
    requestFinish: Date;
    /**
     * socket.on("connect")
     */
    socketConnect: Date;
    /**
     * request.on("response")
     */
    onResponse: Date;
    /**
     * response.on("close")
     */
    responseClose: Date;
    /**
     * milliseconds Fiddler spent in DNS looking up the server's IP address.
     */
    dnsTime: number;
  };
}

export class Context {
  /**
   * Line by line logs for current request/response.
   */
  log: Log;
  /**
   * Serial number for this process.
   * Indicates how many this server handled.
   */
  SN: number;
  /**
   * Raw data of current request/response.
   */
  currentRequest: RequestLog;
  /**
   * How many ajax launched by current request.
   */
  captureSN: number;
  /**
   * All ajax raw data.
   */
  captureRequests: RequestLog[];
  /**
   * Proxy ip for certain request.
   */
  proxyIp: string;
  /**
   * Proxy port for certain request.
   */
  proxyPort: number;
  /**
   * Mark for user.
   */
  uid: string;

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
    // Empty string is a loopback address in IPV6
    this.proxyIp = "NOT_A_IP";
    this.proxyPort = 80;
    this.uid = "";
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
