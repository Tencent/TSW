

const Hapi = require('hapi');
const server = new Hapi.Server();
const logger = plug('logger');

server.connection();
server.start();

// http://127.0.0.1/hapi
server.route({
    method: 'GET',
    path: '/hapi',
    handler: function (request, reply) {
        logger.debug('hello hapi');
        return reply('hello hapi~');
    }
});


/**
 * 业务处理模块，通过config.js路由请求过来
 */
module.exports = function(req, res) {
    logger.debug('hello hapi');
    // 全转给hapi去处理
    server.connections[0].listener.emit('request', req, res);
};

