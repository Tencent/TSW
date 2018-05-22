const logger = plug('logger');

module.exports = function(){
    var res = window.response;

    logger.setKey('xxx');

    res.end('hello world');
};

