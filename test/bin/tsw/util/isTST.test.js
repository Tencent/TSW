const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');

const isTST = plug('util/isTST.js');
const logger = plug('logger');
const config = plug('config');

logger.setLogLevel('error');

describe('test isTST', () => {

    const req = {};

    it('no extendMod', async () => {
        config.extendMod = false;
        expect(isTST.isTST(req)).to.equal(false);
    });

    it('extendMod no isTST', async () => {
        config.extendMod = {};
        expect(isTST.isTST(req)).to.equal(false);
    });

    it('extendMod isTST return false', async () => {
        config.extendMod = {
            isTST: () => false
        };
        expect(isTST.isTST(req)).to.equal(false);
    });

    it('extendMod isTST return true', async () => {
        config.extendMod = {
            isTST: () => true
        };
        expect(isTST.isTST(req)).to.equal(true);
    });
});
