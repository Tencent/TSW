/* 路由模块 */

// 定义一个路由表
const map = {
    // http://127.0.0.1/egg
    egg: './helloworld.egg/app.js',

    // http://127.0.0.1/hapi
    hapi: './hapi.js',

    // http://127.0.0.1/express
    express: './express.js',

    // http://127.0.0.1/koa
    koa: './koa.js',

    // http://127.0.0.1/other
    default: './helloworld.js'
};

// 路由：起个名字
this.name = function(req) {
    const pathname = req.REQUEST.pathname;
    const arr = pathname.split('/', 2);

    return arr[1];

};

// 路由：返回一个模块
this.find = function(name, req, res) {
    const moduleId = map[name] || map['default'];
    return require(moduleId);
};
