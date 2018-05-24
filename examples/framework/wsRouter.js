/*路由模块*/

//定义一个路由表
const map = {
    default: './websocket.js'
};

//路由：起个名字
this.name = function(ws){
    // const req = ws.upgradeReq;
    
    return 'websocket';
};

//路由：返回一个模块
this.find = function(name,ws){
    const moduleId = map[name] || map['default'];
    return require(moduleId);
};
