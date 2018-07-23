const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');

/**
这一部分是CD.js依赖的模块，我们需要弄一些stub,以避免干扰
*/
const CD = plug('util/CD.js');
const logger = plug('logger');
const config = plug('config');
const Deferred = plug('util/Deferred');
const ajax = plug('ajax');
const gzipHttp = plug('util/gzipHttp.js');


logger.setLogLevel('error');

describe('test CD module', () => {

    describe('test 发送openapiCD', async () => {
        const CHECK_INTERVAL = 200;
        const DEFAULT_CHECK_KEY = '1234';
        let _appid;
        beforeEach(() => {
            _appid = config.appid;
            config.appid = 123;
            config.appkey = 123;

            sinon.stub(ajax, 'request').callsFake(() => {
                return Deferred.create().resolve({
                    result: {
                        code: 0,
                        data: 1
                    }
                });
            });
        });
        afterEach(() => {
            config.appid = _appid;
            ajax.request.restore();
        });
        it('beforeOpenapi', async () => {
            await CD.check(DEFAULT_CHECK_KEY, 1, CHECK_INTERVAL).toES6Promise();
            /* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
            try {
                await CD.check(DEFAULT_CHECK_KEY, 1, CHECK_INTERVAL).toES6Promise();
                throw new Error(CHECK_INTERVAL + '毫秒内再次check不应该成功');
            } catch (err) {}
        });
    });

    describe('test openapi接收CD请求', () => {
        let returnJson = {};
        beforeEach(() => {
            sinon.stub(gzipHttp, 'create').callsFake(() => {
                return {
                    write: _ => {
                        returnJson = JSON.parse(_);
                    },
                    end: _ => {}
                };
            });
        });
        afterEach(() => {
            gzipHttp.create.restore();
        });
        it('appid不匹配', async () => {
            const req = {
                param: _ => {
                    return '123';
                }
            };
            const _appid = context.appid;
            context.appid = 'tsw123';
            await CD.openapi(req, {});
            expect(returnJson['code']).to.equal(-2);
            expect(returnJson['message']).to.equal('appid错误');
            context.appid = _appid;
        });

        it('上下文不存在appid', async () => {
            const req = {
                param: _ => {
                    return '';
                }
            };
            const _appid = context.appid;
            context.appid = '';
            await CD.openapi(req, {});
            expect(returnJson['code']).to.equal(-2);
            expect(returnJson['message']).to.equal('appid is required');
            context.appid = _appid;
        });

        it('上下文不存在appkey', async () => {
            const req = {
                param: _ => {
                    return 'tsw123';
                }
            };
            const _appid = context.appid;
            context.appid = 'tsw123';
            await CD.openapi(req, {});
            expect(returnJson['code']).to.equal(-2);
            expect(returnJson['message']).to.equal('appkey is required');
            context.appid = _appid;
        });

        it('appid不符合规范', async () => {
            const req = {
                param: _ => {
                    return 'tsw123，';
                }
            };
            const _appid = context.appid;
            context.appid = 'tsw123，';
            context.appkey = 'tsw123，';
            await CD.openapi(req, {});
            expect(returnJson['code']).to.equal(-2);
            expect(returnJson['message']).to.equal('appid is required');
            context.appid = _appid;
        });

        it('checkByCmem', async () => {
            const req = {
                param: _ => {
                    switch (_) {
                    case 'key':
                        return '123';
                    case 'count':
                        return 1;
                    case 'second':
                        return 200;
                    }
                    return 'tsw123';
                }
            };
            const _appid = context.appid;
            context.appid = 'tsw123';
            context.appkey = 'tsw123';
            await CD.openapi(req, {});
            expect(returnJson['code']).to.equal(0);
            context.appid = _appid;
        });

    });
});
