'use strict';

var retry = require('retry')
  , ms = require('./ms');

/**
 * A net.Stream connection pool.
 *
 * @constructor
 * @param {Number} limit Size of the connection pool.
 * @param {Function} builder Stream factory.
 * @param {Object} options Configuration options.
 * @api public
 */
function Manager(limit, builder, options) {
  options = options || {};

  if ('object' === typeof builder) {
    options = builder;
    builder = null;
  }

  this.limit = +limit || 20;                        // Defaults to 20 connections max.
  this.pool = [];                                   // Contains the active connections.
  this.pending = 0;                                 // Connecting connections.
  this.generator = null;                            // Stream generator.
  this.retries = options.retries || 5;              // Max retries for each #pull.
  this.factor = options.factor || 3;                // Exponential backoff factor.
  this.minTimeout = ms(options.min || '1 seconds'); // Minimum delay.
  this.maxTimeout = ms(options.max || '60 seconds');// Maximum delay.
  this.randomize = 'randomize' in options           // Randomize the retry timeout.
    ? options.randomize
    : true;

  // Some stats that can be used for metrics.
  this.metrics = {
      allocations: 0
    , releases: 0
  };

  if (builder) this.factory(builder);
}

Manager.prototype.__proto__ = require('events').EventEmitter.prototype;

/**
 * Add a stream generator so we can generate streams for the pool.
 *
 * @param {Function} builder Function that pre-configures a stream.
 * @api public
 */
Manager.prototype.factory = function factory(builder) {
  if (typeof builder !== 'function') {
    throw new Error('The #factory requires a function.');
  }

  this.generator = builder;
  return this;
};

/**
 * Start listening to events that could influence the state of the connection.
 *
 * @param {net.Connection} net The connection.
 * @api private
 */
Manager.prototype.listen = function listen(net) {
  if (!net) return this;

  var self = this;

  /**
   * Simple helper function that allows us to automatically remove the
   * connection from the pool when we are unable to connect using it.
   *
   * @param {Error} err Optional error.
   * @api private
   */
  function regenerate(err) {
    net.destroySoon();

    self.remove(net);

    net.removeListener('timeout', regenerate);
    net.removeListener('error', regenerate);
    net.removeListener('end', regenerate);

    if (err) self.emit('error', err);
  }

  // Listen for events that would mess up the connection.
  net.once('timeout', regenerate)
     .once('error', regenerate)
     .once('end', regenerate);

  return this;
};

/**
 * A fault tolerant connection allocation wrapper.
 *
 * @param {Function} fn Callback that receives a working connection.
 * @api public
 */
Manager.prototype.pull = function pull(fn) {
  var operation = retry.operation({
          retries: this.retries
        , factor: this.factor
        , minTimeout: this.minTimeout
        , maxTimeout: this.maxTimeout
        , randomize: this.randomize
      })
    , self = this;

  /**
   * Small wrapper around pulling a connection.
   *
   * @param {Error} err Optional error argument.
   * @param {Socket} connection A working connection.
   * @api private
   */
  function allocate(err, connection) {
    if (operation.retry(err)) return;

    fn(err, connection);
  }

  operation.attempt(function attempt() {
    self.allocate(allocate);
  });

  return this;
};

/**
 * Allocate a new connection from the connection pool, this can be done async
 * that's why we use a error first callback pattern.
 *
 * @param {Function} fn
 * @api public
 */
Manager.prototype.allocate = function allocate(fn) {
  if (!this.generator) {
    fn(new Error('Specify a stream #factory'));
    return this;
  }

  /**
   * Two helper functions that allows us to correctly call the callback with
   * the correct arguments when we generate a new connection as the connection
   * should be emitting 'connect' before we can use it. But it can also emit
   * error if it fails to connect, or times in so doing.
   *
   * @param {Error} err Optional error argument.
   * @api private
   */
  function either(err) {
    this.removeListener('error', either);
    this.removeListener('connect', either);
    this.removeListener('timeout', timeout);

    // Add to the pool
    if (!err) self.pool.push(this);
    self.pending--;

    fn(err, this);
  }

  /**
   * Listen to timeout events.
   *
   * @api private
   */
  function timeout() {
    this.removeListener('timeout', timeout);
    self.pending--;
    fn(new Error('Timed out while trying to establish connection'), this);
  }

  var probabilities = []
    , self = this
    , total, i, probability, connection;

  i = total = this.pool.length;

  // increase the allocation metric
  this.metrics.allocations++;

  // check the current pool if we already have a few connections available, so
  // we don't have to generate a new connection
  while (i--) {
    connection = this.pool[i];
    probability = this.isAvailable(connection);

    // we are sure this connection works
    if (probability === 100) {
      fn(undefined, connection);
      return this;
    }

    // no accurate match, add it to the queue as we can get the most likely
    // available connection
    probabilities.push({
        probability: probability
      , connection: connection
    });
  }

  // we didn't find a confident match, see if we are allowed to generate a fresh
  // connection
  if ((this.pool.length + this.pending) < this.limit) {
    // determine if the function expects a callback or not, this can be done by
    // checking the length of the given function, as the amount of args accepted
    // equals the length..
    if (this.generator.length === 0) {
      connection = this.generator();

      if (connection) {
        this.pending++;
        this.listen(connection);

        connection.on('error', either)
                  .on('connect', either)
                  .on('timeout', timeout);

        return this;
      }
    } else {
      return this.generator(function generate(err, connection) {
        if (err) return fn(err);
        if (!connection) return fn(new Error('The #factory failed to generate a stream'));

        self.pending++;
        self.listen(connection);

        return connection.on('error', either)
                         .on('connect', either)
                         .on('timeout', timeout);
      });
    }
  }

  // o, dear, we got issues.. we didn't find a valid connection and we cannot
  // create more.. so we are going to check if we might have semi valid
  // connection by sorting the probabilities array and see if it has
  // a probability above 60
  probability = probabilities.sort(function sort(a, b) {
    return a.probability - b.probability;
  }).pop();

  if (probability && probability.probability >= 60) {
    fn(undefined, probability.connection);
    return this;
  }

  // well, that didn't work out, so assume failure
  fn(new Error('The connection pool is full'));
  return this;
};

/**
 * Check if a connection is available for writing.
 *
 * @param {net.Connection} net The connection.
 * @param {Boolean} ignore Ignore closed or dead connections.
 * @returns {Number} Probability that his connection is available or will be.
 * @api private
 */
Manager.prototype.isAvailable = function isAvailable(net, ignore) {
  var readyState = net.readyState
    , writable = readyState === 'open' || readyState === 'writeOnly'
    , writePending = net._pendingWriteReqs || 0
    , writeQueue = net._writeQueue || []
    , writes = writeQueue.length || writePending;

  // If the stream is writable and we don't have anything pending we are 100%
  // sure that this stream is available for writing.
  if (writable && writes === 0) return 100;

  // The connection is already closed or has been destroyed, why on earth are we
  // getting it then, remove it from the pool and return 0.
  if (readyState === 'closed' || net.destroyed) {
    this.remove(net);
    return 0;
  }

  // If the stream isn't writable we aren't that sure..
  if (!writable) return 0;

  // The connection is still opening, so we can write to it in the future.
  if (readyState === 'opening') return 70;

  // We have some writes, so we are going to subtract that amount from our 100.
  if (writes < 100) return 100 - writes;

  // We didn't find any reliable states of the stream, so we are going to
  // assume something random, because we have no clue, so generate a random
  // number between 0 - 70.
  return Math.floor(Math.random() * 70);
};

/**
 * Release the connection from the connection pool.
 *
 * @param {Stream} net The connection.
 * @param {Boolean} hard Switch between destroySoon or destroy.
 * @returns {Boolean} Was the removal successful
 * @api private
 */
Manager.prototype.release = function release(net, hard) {
  var index = this.pool.indexOf(net);
  if (index === -1) return false;

  // Check if the stream is still open.
  if (net) {
    if (!hard) net.destroySoon();
    else net.destroy();

    // Remove it from the pool.
    this.pool.splice(index, 1);

    // Increase the releases metric.
    this.metrics.releases++;
  }

  return true;
};

// Alias remove to release.
Manager.prototype.remove = Manager.prototype.release;

/**
 * Free dead connections from the pool.
 *
 * @param {Number} keep the amount of connection to keep open
 * @param {Boolean} hard destroy all connections instead of destroySoon
 * @api public
 */
Manager.prototype.free = function free(keep, hard) {
  // Default to 0 if no arguments are supplied.
  keep = +keep || 0;

  // Create a back-up of the pool as we will be removing items from the array
  // and this could cause memory / socket leaks as we are unable to close some
  // connections in the array as the index has moved.
  var pool = this.pool.slice(0)
    , saved = 0;

  for (var i = 0, length = pool.length; i < length; i++) {
    var connection = pool[i]
      , probability = this.isAvailable(connection);

    // This is still a healthy connection, so try we probably just want to keep it.
    if (keep && saved < keep && probability === 100) {
      saved++;
      continue;
    }

    this.release(connection, hard);
  }

  // Clear the back-up
  pool.length = 0;

  // See how much connections are still available.
  return this.emit('free', saved, this.pool.length);
};

/**
 * Iterate over the different connection.
 *
 * @param {Function} callback
 * @param {Mixed} context
 * @api public
 */
Manager.prototype.forEach = function forEach(callback, context) {
  this.pool.forEach(callback, context);
  return this;
};

/**
 * Close the connection pool.
 *
 * @param {Boolean} hard destroy all connections
 * @api public
 */
Manager.prototype.end = function end(hard) {
  this.free(0, hard);

  return this.emit('end');
};

module.exports = Manager;
