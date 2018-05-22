/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const EventEmitter = require('events');
const net          = require('net');
const http         = require('http');
const domain       = require('domain');
const Context      = require('runtime/Context');
const Window       = require('runtime/Window');
const parseGet     = require('util/http/parseGet');

class ContextWrap extends EventEmitter {

    constructor(opt = {}) {
        super();

        this._domain = domain.create();

        this._req = new http.IncomingMessage(opt.reqSocket || new net.Socket());
        this._rsp = new http.ServerResponse(this._req);

        this._req.url = opt.url || '/emptyurl';

        parseGet(this._req);
    }

    fillRequest(md) {
        md && md(this._req);
    }

    fillResponse(md) {
        md && md(this._rsp);
    }

    add(obj) {
        this._domain.add(obj);
    }

    remove(obj) {
        this._domain.remove(obj);
    }

    run(md) {
        this._domain.add(this._req);
        this._domain.add(this._rsp);

        this._domain.currentContext                 = new Context();
        this._domain.currentContext.log             = {};
        this._domain.currentContext.SN              = ++process.SN;
        this._domain.currentContext.window          = new Window();
        this._domain.currentContext.window.request  = this._req;
        this._domain.currentContext.window.response = this._rsp;

        this._domain.on('error', e => {
            this.emit('error', e);
        });

        this._domain.run(md);
    }

    destroy() {
        this._domain.remove(this._req);
        this._domain.remove(this._rsp);

        this._domain = null;
        this._req    = null;
        this._rsp    = null;
    }
}

module.exports = ContextWrap;