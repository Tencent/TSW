const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const logger = plug('logger');
const encryption = plug('util/auto-report/encryption.js');

logger.setLogLevel('error');

describe('test tsw/util/auto-report/encryption', () => {

    const appid = 12345;
    const appkey = '12345';

    describe('#encryption', () => {

        it('#encode then decode', () => {
            const data = {
                hello: 'world'
            };
            const encodeResult = encryption.encode(appid, appkey, data);
            const decodeResult = encryption.decode(appid, appkey, encodeResult);
            expect(decodeResult).to.not.be.null; // eslint-disable-line
            expect(decodeResult.hello).to.be.equal(data.hello);
        });

        it('#wrong appid', () => {
            const data = {
                hello: 'world'
            };
            const encodeResult = encryption.encode(12388, 'wrongkey', data);
            const decodeResult = encryption.decode(appid, appkey, encodeResult);
            expect(decodeResult).to.be.null; // eslint-disable-line
        });

        it('#wrong appkey', () => {
            const data = {
                hello: 'world'
            };
            const encodeResult = encryption.encode(appid, 'wrongkey', data);
            const decodeResult = encryption.decode(appid, appkey, encodeResult);
            expect(decodeResult).to.be.null; // eslint-disable-line
        });
    });

    describe('#decode aes & des', () => {
        it('#decode des', () => {
            const data = {
                hello: 'world'
            };
            const desResult = 'hSTAQQZe0upcjB6tOcmtPP6cekLcJ0GzatBO5ysOziw=';
            const decodeResult = encryption.decode(appid, appkey, desResult);
            expect(decodeResult).to.not.be.null; // eslint-disable-line
            expect(decodeResult.hello).to.be.equal(data.hello);
        });

        it('#decode aes', () => {
            const data = {
                hello: 'world'
            };
            const aesResult = 'v1:nqOGY6yvpc0D3nl/pG7D9IEk83thrZjGRlN4x2EHGILxqcOsT8HUHbt7PsPEODmL242szYQSqHxgLw7pt/D7c7n6i9d6';
            const decodeResult = encryption.decode(appid, appkey, aesResult);
            expect(decodeResult).to.not.be.null; // eslint-disable-line
            expect(decodeResult.hello).to.be.equal(data.hello);
        });
    });
});
