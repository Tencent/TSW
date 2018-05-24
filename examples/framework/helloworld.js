const logger = plug('logger');

module.exports = function() {
    let res = window.response;

    logger.setKey('xxx');

    res.end('hello world');
};

