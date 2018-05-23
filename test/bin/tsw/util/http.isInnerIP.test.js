const chai = require('chai');
const expect = chai.expect;
const plug = require('plug');
const isInnerIP = plug('util/http.isInnerIP.js');
const logger = plug('logger');

logger.setLogLevel('error');

describe('test http.isInnerIP', () => {

    it('#ipAddress not string', () => {
        expect(isInnerIP.isInnerIP(null)).to.equal(false);
        expect(isInnerIP.isInnerIP(2)).to.equal(false);
    });

    it('#not IPv4', () => {
        expect(isInnerIP.isInnerIP('skdgedakfksa')).to.equal(false);
    });

    it('#127.x.x.x', () => {
        expect(isInnerIP.isInnerIP('127.0.0.1')).to.equal('127.0.0.1');
        expect(isInnerIP.isInnerIP('127.0.1.1')).to.equal('127.0.0.1');
        expect(isInnerIP.isInnerIP('127.1.1.1')).to.equal('127.0.0.1');
    });

    it('#A    100.64.0.0/10', () => {
        expect(isInnerIP.isInnerIP('100.64.0.0')).to.equal('A');
        expect(isInnerIP.isInnerIP('100.125.100.1')).to.equal('A');
        expect(isInnerIP.isInnerIP('100.127.255.255')).to.equal('A');
    });

    it('#A类  10.0.0.0-10.255.255.255', () => {
        expect(isInnerIP.isInnerIP('10.0.0.0')).to.equal('a');
        expect(isInnerIP.isInnerIP('10.2.100.1')).to.equal('a');
        expect(isInnerIP.isInnerIP('10.255.255.255')).to.equal('a');
    });

    it('#a2    9.0.0.0-9.255.255.255', () => {
        expect(isInnerIP.isInnerIP('9.0.0.0')).to.equal('a2');
        expect(isInnerIP.isInnerIP('9.125.255.255')).to.equal('a2');
        expect(isInnerIP.isInnerIP('9.255.255.255')).to.equal('a2');
    });

    it('#b    172.16.0.0-172.31.255.255', () => {
        expect(isInnerIP.isInnerIP('172.16.0.0')).to.equal('b');
        expect(isInnerIP.isInnerIP('172.17.255.1')).to.equal('b');
        expect(isInnerIP.isInnerIP('172.31.255.255')).to.equal('b');
    });

    it('#c    192.168.0.0-192.168.255.255', () => {
        expect(isInnerIP.isInnerIP('192.168.0.0')).to.equal('c');
        expect(isInnerIP.isInnerIP('192.168.1.0')).to.equal('c');
        expect(isInnerIP.isInnerIP('192.168.255.255')).to.equal('c');
    });

    it('#not innerIp Test', () => {
        expect(isInnerIP.isInnerIP('14.44.22.55')).to.equal(false);
    });
});