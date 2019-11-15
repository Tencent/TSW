import { EventEmitter } from 'events'

export enum EVENT_LIST {
    DNS_LOOKUP_SUCCESS = 'DNS_LOOKUP_SUCCESS',
    DNS_LOOKUP_ERROR = 'DNS_LOOKUP_ERROR',
}

export interface IEventPayload {
    error: Error | null
    code: number
    msg: string
    success: boolean
    data: any | null
}

let bus: EventEmitter

export const eventBus = bus ? bus : (bus = new EventEmitter())
