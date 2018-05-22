const chai  = require('chai');
const expect = chai.expect;
const plug = require('plug');
const xss = plug('util/xss.js');
const logger = plug('logger');
// var assert = require('assert');

logger.setLogLevel('error');


describe('xss.js', () => {
    it('#htmlEncode', ()=> {
        // console.log(xss.filterXSS('<'));
        expect('&lt;&gt;&amp;&#039;&quot;').to.equal(xss.htmlEncode('<>&\'"'));
    });

    it('#htmlDecode', ()=> {
        expect('<>&\'"').to.equal(xss.htmlDecode('&lt;&gt;&amp;&#039;&quot;'));
    });

    it('#filterParams', () => {
        //这个函数没法测，就这样吧
    });
});
