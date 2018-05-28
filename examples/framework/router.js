/* 路由模块 */

// 定义一个路由表
const map = {
    hapi: './hapi.js',            // http://127.0.0.1/hapi
    express: './express.js',    // http://127.0.0.1/express
    koa: './koa.js',            // http://127.0.0.1/koa
    default: './helloworld.js' // http://127.0.0.1/other
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
