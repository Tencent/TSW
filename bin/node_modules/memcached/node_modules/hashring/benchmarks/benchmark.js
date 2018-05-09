/**
 * Benchmark dependencies
 */
var Benchmark = require('benchmark')
  , microtime = require('microtime');
  
/**
 * Different hashring drivers
 */
var hashring = require('hashring')
  , hash_ring = require('hash_ring')
  , nodes = {'192.168.0.102:11212': 1, '192.168.0.103:11212': 1, '192.168.0.104:11212': 1};

/**
 * prebuild hashrings
 */
var ring1 = new hashring(nodes)
  , ring2 = new hash_ring(nodes);

/**
 * Benchmark the constructing and generating of a hashring
 */
var constructing = new Benchmark.Suite;
constructing
  .add('hashring', function(){
    var r = new hashring(nodes);
  })
  .add('hash_ring', function(){
    var r = new hash_ring(nodes);
  })
  .on('cycle', function(bench){
    console.log("Executing benchmark: " + bench);
  })
  .on('complete', function(){
    console.log(this.filter('fastest').pluck('name') + ' has the fastest constructor');
    
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var random = new Benchmark.Suite;
random
  .add('hashring', function(){
    ring1.getNode('key' + Math.random())
  })
  .add('hash_ring', function(){
    ring2.getNode('key' + Math.random())
  })
  .on('cycle', function(bench){
    console.log("Executing benchmark: " + bench);
  })
  .on('complete', function(){
    console.log(this.filter('fastest').pluck('name') + ' has the fastest random key getNode');
    
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var same = new Benchmark.Suite;
same
  .add('hashring', function(){
    ring1.getNode('key')
  })
  .add('hash_ring', function(){
    ring2.getNode('key')
  })
  .on('cycle', function(bench){
    console.log("Executing benchmark: " + bench);
  })
  .on('complete', function(){
    console.log(this.filter('fastest').pluck('name') + ' has the fastest same key getNode');
    
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });


/**
 * Add all benchmarks that that need to be run.
 */
var benchmarks = [constructing,random,same];

// run benchmarks
if (benchmarks.length) benchmarks.shift().run();