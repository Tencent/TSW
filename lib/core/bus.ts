import { EventEmitter } from "events";

export enum EVENT_LIST {
  DNS_LOOKUP_SUCCESS = "DNS_LOOKUP_SUCCESS",
  DNS_LOOKUP_ERROR = "DNS_LOOKUP_ERROR"
}

export interface EventPayload {
  error: Error | null;
  code: number;
  msg: string;
  success: boolean;
  data: any | null;
}

let bus: EventEmitter | undefined;

export const eventBus = bus ? bus : (bus = new EventEmitter());
