const mocha = require('mocha');
const chai  = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

/**
这一部分是CD.js依赖的模块，我们需要弄一些stub,以避免干扰
*/
let CD 			= plug('util/CD.js');
let cmem		= plug('pool/cmem.l5.js');
let isWindows 	= plug('util/isWindows.js');
let dcapi		= plug('api/libdcapi/dcapi.js');
let logger		= plug('logger');
let config		= plug('config');
let Deferred 	= plug('util/Deferred');
let ajax  		= plug('ajax');
let gzipHttp 	= plug('util/gzipHttp.js');

const noop = function() {};


logger.setLogLevel('error');

describe('test CD module', ()=>{

	before(() =>{
		sinon.stub(cmem, 'getCmem').returns({
			_cache : {},
			add : function(key,count,time, cb){
				let randomDelay = Math.floor(Math.random()*100);
				if(randomDelay>50){
					randomDelay = 50;
				}
				if(this._cache[key]){

					setTimeout(function(){
						cb(null, false);
					},randomDelay);
					
					return;
				}

				this._cache[key] = new Date().getTime();
				setTimeout(function(){
					cb(null,true);
				});
			}
		});
		sinon.stub(isWindows, 'isWindows').value(false);
		//sinon.stub(dcapi);
	})
	after(()=>{
		cmem.getCmem.restore();
		//isWindows.isWindows.restore();
	})


	it('test #check', async ()=>{
		
		const CHECK_INTERVAL = 200;
		const DEFAULT_CHECK_KEY = '123';
		await CD.check(DEFAULT_CHECK_KEY,1,CHECK_INTERVAL).toES6Promise();
		try{
			await CD.check(DEFAULT_CHECK_KEY,1,CHECK_INTERVAL).toES6Promise();
			throw new Error(CHECK_INTERVAL +'毫秒内再次check不应该成功');
			
		}catch(err){
			
		}
		
		//以下是普通promise写法
		// CD.check('123',1,CHECK_INTERVAL).toES6Promise().then(_=>{
		// 	//第一次写入成功后的n毫秒内再写入，会失败

		// 	CD.check('123',1,CHECK_INTERVAL).toES6Promise().then(_=>{
				
		// 		throw new Error(CHECK_INTERVAL+'毫秒内再次check不应该成功');
		// 		done();
		// 	}).catch(_=>{
		// 		done();
		// 	})
		// });
	});

	describe('test 发送openapiCD', async()=>{
		const CHECK_INTERVAL = 200;
		const DEFAULT_CHECK_KEY = '1234';

		beforeEach(()=>{
			config.appid = 123;
			config.appkey = 123;
			
			sinon.stub(ajax, 'request').callsFake(() => {
				return Deferred.create().resolve({
					result: {
						code: 0,
						data: 1
					}
				})
			});
		});
		afterEach(()=>{
			delete config.appid;
			delete config.appkey;
			ajax.request.restore();
		});
		it('beforeOpenapi', async()=>{
			await CD.check(DEFAULT_CHECK_KEY, 1, CHECK_INTERVAL).toES6Promise();
			try {
				await CD.check(DEFAULT_CHECK_KEY, 1, CHECK_INTERVAL).toES6Promise();
				throw new Error(CHECK_INTERVAL + '毫秒内再次check不应该成功');
			} catch (err) {}
		});
	});

	describe('test openapi接收CD请求', ()=>{
		let returnJson = {};
		beforeEach(()=>{
			sinon.stub(gzipHttp, 'create').callsFake(() => {
				return {
					write: _=>{
						returnJson = JSON.parse(_);
					},
					end: _=>{}
				}
			});
		});
		afterEach(()=>{
			gzipHttp.create.restore();
		});
		it('appid不匹配',async ()=>{
			let req = {param:_=>{ return '123'}};
			context.appid = 'tsw123';
			await CD.openapi(req,{});
			expect(returnJson['code']).to.equal(-2);
			expect(returnJson['message']).to.equal('appid错误');			
		});

		it('上下文不存在appid',async ()=>{
			let req = {param:_=>{ return ''}};
			context.appid = '';
			await CD.openapi(req,{});
			expect(returnJson['code']).to.equal(-2);
			expect(returnJson['message']).to.equal('appid is required');
			
		});

		it('上下文不存在appkey',async ()=>{
			let req = {param:_=>{ return 'tsw123'}};
			context.appid = 'tsw123';
			await CD.openapi(req,{});
			expect(returnJson['code']).to.equal(-2);
			expect(returnJson['message']).to.equal('appkey is required');
		});

		it('appid不符合规范',async ()=>{
			let req = {param:_=>{ return 'tsw123，'}};
			context.appid = 'tsw123，';
			context.appkey = 'tsw123，';
			await CD.openapi(req,{});
			expect(returnJson['code']).to.equal(-2);
			expect(returnJson['message']).to.equal('appid is required');
		});

		it('checkByCmem',async ()=>{
			let req = {param:_=>{ 
				switch(_){
					case 'key':
						return '123';
					case 'count': 
						return 1;
					case 'second':
						return 200;
				}
				return 'tsw123';
			}};
			context.appid = 'tsw123';
			context.appkey = 'tsw123';
			await CD.openapi(req,{});
			expect(returnJson['code']).to.equal(0);
		});

	});
});