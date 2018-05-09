var should = require('should')
  , bisection = require('..');

var small = [0,1,2,3,5,6,7,8,9]
  , large = [122,124,134,176,320,341,345,346,500,587,666,768,1230,23231];

module.exports = {
  'Library version': function(){
     bisection.version.should.match(/^\d+\.\d+\.\d+$/);
  }
, 'Bisection and bisection right': function(){
     bisection.should.equal(bisection.right);
  }
, 'Bisection right': function(){
    bisection(small, 4).should.equal(4);
    bisection(small, 15).should.equal(9);
    bisection(small, 4, 5).should.equal(5);
    bisection(small, 12, 0, 5).should.equal(5);

    bisection(large, 350).should.equal(8);
    bisection(large, 242).should.equal(4);
    bisection(large, 0).should.equal(0);
    bisection(large, 232424).should.equal(14);
  }
, 'Bisection left': function(){
    bisection.left(small, 4).should.equal(9);
    bisection.left(small, 15).should.equal(0);
    bisection.left(small, 4, 5).should.equal(9);
    bisection.left(small, 12, 0, 5).should.equal(0);

    bisection.left(large, 350).should.equal(0);
    bisection.left(large, 242).should.equal(14);
    bisection.left(large, 0).should.equal(14);
    bisection.left(large, 232424).should.equal(0);
  }
}
