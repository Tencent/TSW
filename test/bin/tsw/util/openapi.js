const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const openapi = plug('util/openapi.js');
const logger = plug('logger');

logger.setLogLevel('error');

describe('test openapi', () => {
    describe('test signature', () => {
        it('#test empty opt', () => {
            expect(openapi.signature()).to.equal('WpwWYWdXU3pZcrGelrkKmp5O2Mo=');
        });

        it('#test GET :/api', () => {
            const opt = {
                method: 'get',
                pathname: '/api'
            };
            expect(openapi.signature(opt)).to.equal('2LSL602UgKjf5smwELFnSDQuKvQ=');
        });

        it('#test data :/api?a=1', () => {
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { a: 1 }
            };
            expect(openapi.signature(opt)).to.equal('grX3/m7QAZ19L5WXM6xDzmXQa8s=');
        });

        it('#test appkey :/api?a=1 (appkey 1234)', () => {
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { a: 1 },
                appkey: '1234'
            };
            expect(openapi.signature(opt)).to.equal('oRtuUrmxnQ0+NOs9GkZpbZMq9bk=');
        });

        it('#test encode :/api?aa=~; (appkey 1234)', () => {
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { aa: '~' },
                appkey: '1234'
            };
            expect(openapi.signature(opt)).to.equal('RaeBv27oo3hOlDAYLXorp4zYhbs=');
        });

        it('#test undefined value key', () => {
            let undefinedValue;
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { a: 1, key: undefinedValue }
            };
            expect(openapi.signature(opt)).to.equal('grX3/m7QAZ19L5WXM6xDzmXQa8s=');
        });

        it('#test null value key', () => {
            const undefinedValue = null;
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { a: 1, key: undefinedValue }
            };
            expect(openapi.signature(opt)).to.equal('3hfVrbEv5VKMYu9QP4kB6rtBd4o=');
        });

        it('#test empty value key', () => {
            const undefinedValue = '';
            const opt = {
                method: 'get',
                pathname: '/api',
                data: { a: 1, key: undefinedValue }
            };
            expect(openapi.signature(opt)).to.equal('AGMogi7bjCvtnnCecK+TnZGzR3M=');
        });
    });
});
