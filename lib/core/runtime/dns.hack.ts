/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as dns from "dns";
import * as net from "net";

import { EVENT_LIST, eventBus } from "../bus";
import config from "../config";
import logger from "../logger";

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family: number
) => void;

type LookupSecondParam =
  | number
  | dns.LookupOneOptions
  | dns.LookupAllOptions
  | dns.LookupOptions
  | LookupCallback;

let dnsHacked = false;
let originDnsLookUp = null;

export const dnsHack = (): void => {
  // Ensure hack can only be run once.
  if (!dnsHacked) {
    dnsHacked = true;
    originDnsLookUp = dns.lookup;

    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    dns.lookup = ((lookup) => (
      hostname: string,
      optionsOrCallback: LookupSecondParam,
      callbackOrUndefined?: LookupCallback
    ): void => {
      const start = Date.now();

      const options = typeof optionsOrCallback === "function"
        ? undefined
        : optionsOrCallback;
      const callback = typeof optionsOrCallback === "function"
        ? optionsOrCallback
        : callbackOrUndefined;

      logger.debug(`dns lookup for ${hostname}`);

      // For http.request, if host is a ip
      // It will not entry dns.lookup by default
      // https://github.com/nodejs/node/blob/master/lib/net.js#L1002
      // But still need this, in case use call dns.lookup directly
      if (net.isIP(hostname)) {
        logger.debug(`dns lookup: ${hostname} is a ip`);
        if (options) {
          return lookup.apply(this, [hostname, options, callback]);
        }

        return lookup.apply(this, [hostname, callback]);
      }

      let isCalled = false;
      let timeoutError: Error;
      let timer: NodeJS.Timeout | undefined;

      const callbackWrap = (
        err: NodeJS.ErrnoException,
        address: string | dns.LookupAddress[],
        family: number
      ): void => {
        if (isCalled) {
          return;
        }

        isCalled = true;

        const cost = Date.now() - start;
        if (!err) {
          logger.debug(`dns lookup [${cost}ms]: ${hostname} > ${address}`);
          eventBus.emit(EVENT_LIST.DNS_LOOKUP_SUCCESS, address);
        } else {
          logger.error(`dns lookup [${cost}ms] error: ${err.stack}`);
          eventBus.emit(EVENT_LIST.DNS_LOOKUP_ERROR, err);
        }

        if (timer) clearTimeout(timer);
        if (callback) callback(err, address, family);
      };

      timer = setTimeout(() => {
        timeoutError = new Error("Dns Lookup Timeout");
        callbackWrap(timeoutError, "", 0);
      }, (config.timeout && config.timeout.dns) || 3000);

      if (options) {
        return lookup.apply(this, [hostname, options, callbackWrap]);
      }

      return lookup.apply(this, [hostname, callbackWrap]);
    })(dns.lookup);
  }
};

export const dnsRestore = (): void => {
  if (dnsHacked) {
    // eslint-disable-next-line
    // @ts-ignore
    // By default, ts not allow us to rewrite original methods.
    dns.lookup = originDnsLookUp;
    dnsHacked = false;
  }
};
