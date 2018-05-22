

//http监听地址
this.httpAddress = '0.0.0.0';

//http监听地址
this.httpPort = 80;

//路由
this.router = require('./router.js');

//logger
this.logger = {
    logLevel: 'debug'
};

this.wsRouter = require('./wsRouter.js')

