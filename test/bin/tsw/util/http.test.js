const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');

const http = plug('util/http.js');
const logger = plug('logger');

logger.setLogLevel('error');

describe('# http', () => {

    describe('# formatHeader', () => {
        it('null', () => {
            expect(http.formatHeader(null)).to.be.equal(null);
        });

        it('empty', () => {
            const headers = http.formatHeader({});
            expect(Object.keys(headers).length).to.be.equal(0);
        });

        it('formatKey', () => {
            const headers = http.formatHeader({
                'kEY': 'value'
            });
            expect(headers['kEY']).to.be.equal(undefined);
            expect(headers['Key']).to.not.be.equal(undefined);
            expect(headers['Key']).to.be.equal('value');
        });

        it('invalidHeaderChar', () => {
            const headers = http.formatHeader({
                'kEY': 'value! \tg'
            });
            expect(headers['Key']).to.be.equal('value! \tg');
        });
    });

    describe('# isHttps', () => {
        it('empty', () => {
            expect(http.isHttps()).to.be.equal(false);
        });

        it('http:', () => {
            expect(http.isHttps({
                REQUEST: {
                    protocol: 'http:'
                }
            })).to.be.equal(false);
        });

        it('https:', () => {
            expect(http.isHttps({
                REQUEST: {
                    protocol: 'https:'
                }
            })).to.be.equal(true);
        });
    });

    describe('#getUserIp', () => {
        it('empty', () => {
            expect(http.getUserIp()).to.be.equal('');
        });
    });


    describe('#isMethodLike', () => {
        it('isPostLike', () => {
            expect(http.isPostLike('POST')).to.be.equal(true);
            expect(http.isPostLike('PUT')).to.be.equal(true);
            expect(http.isPostLike('DELETE')).to.be.equal(true);

            expect(http.isPostLike('GET')).to.be.equal(false);
            expect(http.isPostLike('HEAD')).to.be.equal(false);
            expect(http.isPostLike('OPTIONS')).to.be.equal(false);
        });

        it('isGetLike ', () => {
            expect(http.isGetLike('POST')).to.be.equal(false);
            expect(http.isGetLike('PUT')).to.be.equal(false);
            expect(http.isGetLike('DELETE')).to.be.equal(false);

            expect(http.isGetLike('GET')).to.be.equal(true);
            expect(http.isGetLike('HEAD')).to.be.equal(true);
            expect(http.isGetLike('OPTIONS')).to.be.equal(true);
        });
    });
});
