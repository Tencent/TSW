/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as http from "http";
import * as domain from "domain";

let httpCreateServerHacked = false;
let originHttpCreateServer = null;

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
