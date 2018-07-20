const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');
const logger = plug('logger');
const addTestMod = plug('util/h5-test/add.js');
const delTestMod = plug('util/h5-test/del.js');
const getTestMod = plug('util/h5-test/get.js');
const isTestMod = plug('util/h5-test/is-test.js');

logger.setLogLevel('error');

describe('测试环境', () => {
    let cmem;
    const _cache = {};
    let contextAppid;
    /**
     * cmem 模拟
     */
    before(() => {

        contextAppid = context.appid;

        delete context.appid;

        cmem = plug('pool/cmem.l5.js');
        sinon.stub(cmem, 'getCmem').callsFake(() => {
            return {
                get: (key, cb) => {
                    if (_cache[key]) {
                        cb(undefined, _cache[key].value);
                    } else {
                        cb(undefined, false);
                    }
                },
                set: (key, val, expire, cb) => {
                    if (_cache[key] && _cache[key].timer) {
                        clearTimeout(_cache[key].timer);
                    }
                    _cache[key] = { value: val };
                    if (expire) {
                        _cache[key].timer = setTimeout(() => {
                            delete _cache[key];
                        }, expire * 1000);
                    }
                    cb(null, true);
                }
            };
        });
    });

    /**
     * 恢复模拟接口与关掉进程
     */
    after(() => {
        if (contextAppid) {
            context.appid = contextAppid;
        }

        cmem.getCmem.restore();

        for (const d in _cache) {
            if (_cache[d].timer) {
                clearTimeout(_cache[d].timer);
            }
        }
    });


    describe('单个uin测试', () => {
        it('#设置-测试环境判断 & 删除-测试环境判断', (done) => {

            const uin = 123456;
            const val = 'alpha';

            addTestMod.addTestUser(uin, val).done(() => {
                expect(isTestMod.getTestUserMap()[uin]).to.equal(val);

                delTestMod.deleteTestUser(uin).done(() => {
                    expect(isTestMod.getTestUserMap()[uin]).to.equal(undefined);
                    done();
                }).fail(err => {
                    done(err || '删除失败');
                });
            }).fail(err => {
                done(err);
            });
        });

        it('#设置-测试环境判断 & 读取接口', (done) => {

            const uin = 123456;
            const val = 'alpha';

            addTestMod.addTestUser(uin, val).done(() => {
                expect(isTestMod.getTestUserMap()[uin]).to.equal(val);

                getTestMod.getTestUser().done(data => {
                    expect(data[uin]).to.equal(val);
                    done();
                }).fail(err => {
                    done(err);
                });
            }).fail(err => {
                done(err);
            });
        });
    });
    describe('批量uin测试', () => {
        it('#批量设置-测试环境判断 & 读取接口判断', (done) => {

            const map = {
                '123456': 'alpha',
                '789654': '10.100.65.100:80'
            };

            addTestMod.addTestUsers(map).done(() => {
                expect(JSON.stringify(isTestMod.getTestUserMap())).to.equal(JSON.stringify(map));

                getTestMod.getTestUser().done(data => {
                    expect(JSON.stringify(data)).to.equal(JSON.stringify(map));
                    done();
                }).fail(err => {
                    done(err);
                });
            }).fail(err => {
                done(err);
            });
        });

        it('#批量设置-测试环境判断 & 单个删除-测试环境判断', (done) => {

            const uin = '123456';
            const map = {
                '123456': 'alpha',
                '789654': '10.100.65.100:80'
            };

            addTestMod.addTestUsers(map).done(() => {
                expect(JSON.stringify(isTestMod.getTestUserMap())).to.equal(JSON.stringify(map));

                expect(isTestMod.getTestUserMap()[uin]).to.equal(map[uin]);

                delTestMod.deleteTestUser(uin).done(() => {
                    const data = isTestMod.getTestUserMap();
                    expect(data[uin]).to.equal(undefined);
                    expect(data['789654']).to.equal(map['789654']);
                    done();
                }).fail(err => {
                    done(err || '删除失败');
                });
            }).fail(err => {
                done(err);
            });
        });

        it('#批量设置-测试环境判断 & 批量删除 - 测试环境判断', (done) => {

            const uin = '123456';
            const map = {
                '123456': 'alpha',
                '789654': '10.100.65.100:80'
            };

            addTestMod.addTestUsers(map).done(() => {
                expect(JSON.stringify(isTestMod.getTestUserMap())).to.equal(JSON.stringify(map));

                expect(isTestMod.getTestUserMap()[uin]).to.equal(map[uin]);

                delTestMod.deleteTestUsers(Object.keys(map)).done(() => {
                    const data = isTestMod.getTestUserMap();
                    expect(data[uin]).to.equal(undefined);
                    expect(data['789654']).to.equal(undefined);
                    done();
                }).fail(err => {
                    done(err || '删除失败');
                });
            }).fail(err => {
                done(err);
            });
        });
    });

});
