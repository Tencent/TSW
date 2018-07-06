const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const network = plug('util/network.js');
const logger = plug('logger');

logger.setLogLevel('error');

describe('测试获取network信息的接口', () => {

    it('# getNetInfo ', () => {

        const info = network.getNetInfo();
        expect(info.external.receive.bytes >= 0).to.equal(true);
        expect(info.external.receive.packets >= 0).to.equal(true);
        expect(info.external.transmit.bytes >= 0).to.equal(true);
        expect(info.external.transmit.packets >= 0).to.equal(true);
        expect(info.internal.receive.bytes >= 0).to.equal(true);
        expect(info.internal.receive.packets >= 0).to.equal(true);
        expect(info.internal.transmit.bytes >= 0).to.equal(true);
        expect(info.internal.transmit.packets >= 0).to.equal(true);
        expect(info.local.receive.bytes >= 0).to.equal(true);
        expect(info.local.receive.packets >= 0).to.equal(true);
        expect(info.local.transmit.bytes >= 0).to.equal(true);
        expect(info.local.transmit.packets >= 0).to.equal(true);

    });
});
