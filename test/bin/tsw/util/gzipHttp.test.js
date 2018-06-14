const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');
const logger = plug('logger');

logger.setLogLevel('error');

describe('#gzipHttp', () => {

    describe('#empty', () => {

        const gzipHttp = plug('util/gzipHttp.js');
        const resopnse = gzipHttp.create();

        it('#check', () => {
            expect(resopnse.write()).to.be.equal(undefined);
            expect(resopnse.flush()).to.be.equal(undefined);
            expect(resopnse.end()).to.be.equal(undefined);
        });
    });

    describe('#no gzip', () => {

        it('#check', () => {
            const gzipHttp = plug('util/gzipHttp.js');
            const request = {
                headers: []
            };
            const response = {
                setHeader: () => {},
                writeHead: (code, headers) => {
                    expect(code).to.be.equal(200);
                },
                on: () => {

                },
                write: () => {

                },
                end: () => {

                }
            };

            const spy1 = sinon.spy(response, 'writeHead');
            const spy2 = sinon.spy(response, 'write');
            const spy3 = sinon.spy(response, 'end');

            const gzipResopnse = gzipHttp.create({
                request: request,
                response: response
            });

            expect(gzipResopnse.write()).to.be.equal(undefined);
            expect(gzipResopnse.end()).to.be.equal(undefined);
            expect(spy1.callCount).to.be.equal(1);
            expect(spy2.callCount).to.be.equal(1);
            expect(spy3.callCount).to.be.equal(1);
            spy1.restore();
            spy2.restore();
            spy3.restore();
        });
    });

    describe('#gzip', () => {
        // TODO
    });
});
