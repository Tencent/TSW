'use strict';

/**
 * Expose some globals which will be used during the test suite.
 */
global.net = require('net');
global.chai = require('chai');
global.chai.Assertion.includeStack = true;
global.expect = global.chai.expect;

/**
 * Awesome global hack to automatically increase numbers
 */
var testnumbers = 10000;

global.__defineGetter__('TESTNUMBER', function testnumber() {
  return testnumbers++;
});

