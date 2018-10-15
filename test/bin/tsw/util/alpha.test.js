const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');
const logger = plug('logger');
const alpha = plug('util/alpha.js');
const config = plug('config');

logger.setLogLevel('error');

describe('test tsw/util/alpha', () => {

    describe('#isAlpha', () => {

        it('#check a num not skymode', () => {
            config.skyMode = false;
            const uid = 1;
            expect(alpha.isAlpha(uid)).to.be.equal(undefined);
        });

        it('#update', () => {
            alpha.update({ 1: true });
            const uid = 1;
            expect(alpha.isAlpha(uid)).to.be.equal(true);
        });

        it('#get From logger', () => {
            alpha.update({ 1: true });

            const stub = sinon.stub(logger, 'getKey').callsFake(() => {
                return 1;
            });

            expect(alpha.isAlpha()).to.be.equal(true);
            stub.restore();
        });

        it('#get From getUin', () => {
            alpha.update({ 1: true });
            context.window = {
                request: {}
            };
            config.extendMod = {
                getUid: (req) => {
                    return 1;
                }
            };

            expect(alpha.isAlpha()).to.be.equal(true);
            delete context.window;
            delete config.extendMod;
        });
    });

    describe('#isAlphaUin', () => {

        it('#without uin', () => {
            expect(alpha.isAlphaUin()).to.be.equal(false);
        });

        it('#update', () => {
            alpha.update({ 1: true });
            const uid = 1;
            expect(alpha.isAlphaUin(uid)).to.be.equal(true);
        });
    });


    describe('#getUin', () => {
        it('#without req', () => {
            expect(alpha.getUin()).to.be.equal(undefined);
        });

        it('#with req', () => {
            expect(alpha.getUin({})).to.be.equal(undefined);
        });

        it('#extendMod without req', () => {
            config.extendMod = {
                getUid: (req) => {
                    return 1;
                }
            };
            expect(alpha.getUin()).to.be.equal(undefined);
        });

        it('#extendMod getUid with req', () => {
            config.extendMod = {
                getUid: (req) => {
                    return 1;
                }
            };
            expect(alpha.getUin({})).to.equal(1);
        });

        it('#extendMod getUin with req', () => {
            config.extendMod = {
                getUin: (req) => {
                    return 1;
                }
            };
            expect(alpha.getUin({})).to.equal(1);
        });

        it('#extendMod getUin with window.request', () => {
            context.window = {
                request: {}
            };
            config.extendMod = {
                getUin: (req) => {
                    return 1;
                }
            };
            expect(alpha.getUin()).to.equal(1);
        });
    });

});
