'use strict';

const koa = require('koa');
const app = new koa();

//http://127.0.0.1/koa
app.use(ctx => {
    ctx.body = 'Hello Koa';
});

//app.listen(80);
//划重点
module.exports = app;
