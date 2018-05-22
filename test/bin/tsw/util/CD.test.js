const mocha = require('mocha');
const chai  = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');

/**
这一部分是CD.js依赖的模块，我们需要弄一些stub,以避免干扰
*/
let CD 			= plug('util/CD.js');
let cmem		= plug('pool/cmem.l5.js');
let isWindows 	= plug('util/isWindows.js');
let dcapi		= plug('api/libdcapi/dcapi.js');
let logger		= plug('logger');

logger.setLogLevel('error');

describe('test CD module', ()=>{

	before(() =>{
		sinon.stub(cmem, 'getCmem').returns({
			_cache : {},
			add : function(key,count,time, cb){
				var randomDelay = Math.floor(Math.random()*100);
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
});