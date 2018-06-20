const chai = require('chai');
const { expect } = chai;
const plug = require('plug');
const logger = plug('logger');

logger.setLogLevel('error');


describe('context', () => {
    describe('#await', () => {
        it('#await in domain', async () => {
            const before = process.domain;
            await new Promise(resolve => {
                resolve();
            });
            const after = process.domain;

            expect(true).to.equal(before === after);
        });
    });
});
