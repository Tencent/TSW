const logger = plug('logger');

module.exports = function(){
	var req = window.request;
	var res = window.response;

	logger.setKey('xxx');

	res.end('hello world');
};

