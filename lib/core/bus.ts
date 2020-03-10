/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import { EventEmitter } from "events";
import * as dns from "dns";
import * as http from "http";
import { Context } from "./context";

interface ResponseEventPayload {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  context: Context;
}

interface RequestEventPayload {
  req: http.IncomingMessage;
  context: Context;
}

interface EventBus extends EventEmitter {
  emit(
    event: "DNS_LOOKUP_SUCCESS",
    payload: string | dns.LookupAddress[]
  ): boolean;
  emit(
    event: "DNS_LOOKUP_ERROR",
    payload: NodeJS.ErrnoException
  ): boolean;
  emit(
    event: "RESPONSE_START",
    payload: ResponseEventPayload
  ): boolean;
  emit(
    event: "RESPONSE_FINISH",
    payload: ResponseEventPayload
  ): boolean;
  emit(
    event: "RESPONSE_CLOSE",
    payload: ResponseEventPayload
  ): boolean;
  emit(
    event: "REQUEST_START",
    payload: RequestEventPayload
  ): boolean;

  on(
    event: "DNS_LOOKUP_SUCCESS",
    listener: (payload: string | dns.LookupAddress[]) => void
  ): this;
  on(
    event: "DNS_LOOKUP_ERROR",
    listener: (payload: NodeJS.ErrnoException) => void
  ): this;
  on(
    event: "RESPONSE_START",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  on(
    event: "RESPONSE_FINISH",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  on(
    event: "RESPONSE_CLOSE",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  on(
    event: "REQUEST_START",
    listener: (payload: RequestEventPayload) => void
  ): this;

  once(
    event: "DNS_LOOKUP_SUCCESS",
    listener: (payload: string | dns.LookupAddress[]) => void
  ): this;
  once(
    event: "DNS_LOOKUP_ERROR",
    listener: (payload: NodeJS.ErrnoException) => void
  ): this;
  once(
    event: "RESPONSE_START",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  once(
    event: "RESPONSE_FINISH",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  once(
    event: "RESPONSE_CLOSE",
    listener: (payload: ResponseEventPayload) => void
  ): this;
  once(
    event: "REQUEST_START",
    listener: (payload: RequestEventPayload) => void
  ): this;
}

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
  RESPONSE_CLOSE = "RESPONSE_CLOSE",

  /**
   * Emitted when then http.Request coming
   */
  REQUEST_START = "REQUEST_START",
}

let bus: EventBus | undefined;

export const eventBus: EventBus = bus || (bus = new EventEmitter());
