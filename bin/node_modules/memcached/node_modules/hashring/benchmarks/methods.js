/**
 * Benchmark dependencies
 */
var Benchmark = require('benchmark')
  , microtime = require('microtime');
  
/**
 * Different hashring drivers
 */
var hashring = require('hashring')
  , nodes = {'192.168.0.102:11212': 1, '192.168.0.103:11212': 1, '192.168.0.104:11212': 1};

/**
 * prebuild hashrings
 */
var ring = new hashring(nodes)
  , md5 = new hashring(nodes, 'md5')
  , crc32 = new hashring(nodes, 'crc32');
/**
 * Benchmark the constructing and generating of a hashring
 */
var constructing = new Benchmark.Suite;
constructing
  .add('constructing', function(){
    var r = new hashring(nodes);
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var random = new Benchmark.Suite;
random
  .add('random key', function(){
    ring.getNode('key' + Math.random())
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var same = new Benchmark.Suite;
same
  .add('same key', function(){
    ring.getNode('key')
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var regenerating = new Benchmark.Suite;
regenerating
  .add('generate ring', function(){
    ring.generateRing()
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var algorithmMD5 = new Benchmark.Suite;
algorithmMD5
  .add('md5 hashing', function(){
    md5.generateKey('key')
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var algorithmCRC32 = new Benchmark.Suite;
algorithmCRC32
  .add('crc32 hashing', function(){
    crc32.generateKey('key')
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });

var range = new Benchmark.Suite;
range
  .add('range', function(){
    ring.createRange('key', 2, true);
  })
  .on('cycle', function(bench){
    console.log('Executing benchmark: ' + bench + '\n');
  })
  .on('complete', function(){
    // run the next benchmark if it exists
    var next = benchmarks.shift();
    if (next && next.run) next.run();
  });


/**
 * Add all benchmarks that that need to be run.
 */
var benchmarks = [constructing, random, same, regenerating, algorithmMD5, algorithmCRC32, range];

// run benchmarks
if (benchmarks.length) benchmarks.shift().run();