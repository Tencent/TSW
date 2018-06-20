const logger = plug('logger');

module.exports = function() {
    const res = window.response;

    logger.setKey('xxx');

    res.end('hello world');
};

