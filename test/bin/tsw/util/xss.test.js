var mocha = require('mocha');
var chai  = require('chai');
var expect = chai.expect;
var plug = require('plug');
var xss = plug('util/xss.js');
var logger = plug('logger');
// var assert = require('assert');

logger.setLogLevel('error');





describe('xss.js', () => {
	it('#htmlEncode', ()=> {
		// console.log(xss.filterXSS('<'));
		expect('&lt;&gt;&amp;&#039;&quot;').to.equal(xss.htmlEncode('<>&\'"'))
	});

	it('#htmlDecode', ()=> {
		expect('<>&\'"').to.equal(xss.htmlDecode('&lt;&gt;&amp;&#039;&quot;'))
	});

	it('#filterParams', () => {
		//这个函数没法测，就这样吧
	})
});