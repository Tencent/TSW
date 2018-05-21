const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const plug = require('plug');
const cpuUtil = plug('util/cpu.js');
const logger	= plug('logger');

logger.setLogLevel('error');

describe('测试获取cpu信息的接口', () => {
	it('#cpus() 3个cpu，3个空闲，结果为数组', () => {
		let os = require('os');
		sinon.stub(os, 'cpus').callsFake(() => {
			return [{
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 252020,
					nice: 0,
					sys: 30340,
					idle: 1070356870,
					irq: 0
				}
			}, {
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 306960,
					nice: 0,
					sys: 26980,
					idle: 1071569080,
					irq: 0
				}
			}, {
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 248450,
					nice: 0,
					sys: 21750,
					idle: 1070919370,
					irq: 0
				}
			}]
		});

		let cpus = cpuUtil.cpus()
		expect(cpus.length).to.equal(3);
		expect(Array.isArray(cpus)).to.equal(true);
		os.cpus.restore();
	})

	it('#cpus() 3个cpu，2个空闲，结果为数组', () => {
		let os = require('os');
		sinon.stub(os, 'cpus').callsFake(() => {
			return [{
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 252020,
					nice: 0,
					sys: 30340,
					idle: 0,
					irq: 0
				}
			}, {
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 306960,
					nice: 0,
					sys: 26980,
					idle: 1071569080,
					irq: 0
				}
			}, {
				model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
				speed: 2926,
				times: {
					user: 248450,
					nice: 0,
					sys: 21750,
					idle: 1070919370,
					irq: 0
				}
			}]
		});

		let cpus = cpuUtil.cpus()
		expect(cpus.length).to.equal(2);
		expect(Array.isArray(cpus)).to.equal(true)
		os.cpus.restore();
	})
});