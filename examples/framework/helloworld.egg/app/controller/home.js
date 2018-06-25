'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
    async render() {
        const ctx = this.ctx;
        ctx.body = 'Hello Egg';
    }
}

module.exports = HomeController;
