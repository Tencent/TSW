const chai  = require('chai');
const {expect} = chai;
const plug = require('plug');
const logger = plug('logger');
const config = plug('config');

logger.setLogLevel('error');


describe('config.js', () => {
    describe('#logger', () => {
        it('#logger check', ()=> {
            expect('object').to.equal(typeof config.logger);
        });
    });

    describe('#http', () => {
        it('#httpPort check', ()=> {
            expect('number').to.equal(typeof config.httpPort);
        });

        it('#httpAddress check', ()=> {
            expect('string').to.equal(typeof config.httpAddress);
        });
    });

});
