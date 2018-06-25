'use strict';

const Controller = require('egg').Controller;

class FooController extends Controller {
    async render() {
        const ctx = this.ctx;

        ctx.body = 'Hello foo';
    }
}

module.exports = FooController;
