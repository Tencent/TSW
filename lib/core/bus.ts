/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { EventEmitter } from "events";

export enum EVENT_LIST {
  DNS_LOOKUP_SUCCESS = "DNS_LOOKUP_SUCCESS",
  DNS_LOOKUP_ERROR = "DNS_LOOKUP_ERROR",

  /**
   * Emitted when then http.ServerResponse begin writeHead()
   */
  RESPONSE_START = "RESPONSE_START",
  /**
   * http.ServerResponse on "finish" event
   *
   * Emitted when the response has been sent.
   * More specifically, this event is emitted when the last segment of the
   * response headers and body have been handed off to the operating system
   * for transmission over the network.
   * It does not imply that the client has received anything yet.
   */
  RESPONSE_FINISH = "RESPONSE_FINISH",
  /**
   * http.ServerResponse on "close" event
   *
   * Indicates that the underlying connection was terminated.
   */
  RESPONSE_CLOSE = "RESPONSE_CLOSE"
}

export interface EventPayload {
  error: Error | null;
  code: number;
  msg: string;
  success: boolean;
  data: any | null;
}

let bus: EventEmitter | undefined;

export const eventBus = bus || (bus = new EventEmitter());
