const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const xss = plug('util/xss.js');
const logger = plug('logger');
// var assert = require('assert');

logger.setLogLevel('error');


describe('xss.js', () => {
    it('#htmlEncode', () => {
        // console.log(xss.filterXSS('<'));
        expect(xss.htmlEncode(1)).to.equal('1');
        expect('&lt;&gt;&amp;&#039;&quot;').to.equal(xss.htmlEncode('<>&\'"'));
    });

    it('#htmlDecode', () => {
        expect(xss.htmlDecode(1)).to.equal('1');
        expect('<>&\'"').to.equal(xss.htmlDecode('&lt;&gt;&amp;&#039;&quot;'));
    });

    it('#filterParams', () => {
        const oriParam = {
            key: 'value',
            arr: ['1', '2', '3']
        };

        const param = JSON.parse(JSON.stringify(oriParam));

        xss.filterParams(param);

        expect(JSON.stringify(param)).to.be.equal(JSON.stringify(oriParam));
    });

    it('#filterParams number', () => {
        const oriParam = {
            key: 1
        };

        const param = JSON.parse(JSON.stringify(oriParam));

        xss.filterParams(param);

        expect(JSON.stringify(param)).to.not.be.equal(JSON.stringify(oriParam));
    });

    it('#filterParams obj', () => {
        const oriParam = {
            key: 'value',
            arr: { a: '1' }
        };

        const param = JSON.parse(JSON.stringify(oriParam));

        xss.filterParams(param);
        expect(JSON.stringify(param)).to.not.be.equal(JSON.stringify(oriParam));
    });

    it('#filterParams <', () => {
        // TODO 去掉了全部空位，需确认下用途
        const oriParam = {
            key: '< gg >'
        };

        const param = JSON.parse(JSON.stringify(oriParam));

        xss.filterParams(param);

        expect(param.key).to.not.be.equal(oriParam.key);
        expect(param.key).to.be.equal('<gg>');
    });

    it('#filterXSS', () => {
        expect(xss.filterXSS('< gg >')).to.be.equal('<gg>');
    });
});
