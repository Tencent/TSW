"use strict";

/**
 * Node's native modules
 */
var EventEmitter = require('events').EventEmitter
  , Stream = require('net').Stream
  , Socket = require('net').Socket;

/**
 * External or custom modules
 */
var HashRing = require('hashring')
  , Connection = require('./connection')
  , Jackpot = require('jackpot')
  , Utils = require('./utils')
  , IssueLog = Connection.IssueLog;

/**
 * Variable lookups
 */
var curry = Utils.curry;

/**
 * Constructs a new memcached client
 *
 * @constructor
 * @param {Mixed} args Array, string or object with servers
 * @param {Object} options options
 * @api public
 */
function Client (args, options) {
  var servers = []
    , weights = {}
    , regular = 'localhost:11211'
    , key;

  // Parse down the connection arguments
  switch (Object.prototype.toString.call(args)) {
    case '[object Object]':
      weights = args;
      servers = Object.keys(args);
      break;

    case '[object Array]':
      servers = args.length ? args : [regular];
      break;

    default:
      servers.push(args || regular);
      break;
  }

  if (!servers.length) {
    throw new Error('No servers where supplied in the arguments');
  }

  // merge with global and user config
  Utils.merge(this, Client.config);
  Utils.merge(this, options);
  EventEmitter.call(this);

  this.servers = servers;
  this.HashRing = new HashRing(args, this.algorithm);
  this.connections = {};
  this.issues = [];
}

// Allows users to configure the memcached globally or per memcached client
Client.config = {
    maxKeySize: 251         // max key size allowed by Memcached
  , maxExpiration: 2592000  // max expiration duration allowed by Memcached
  , maxValue: 1048576       // max length of value allowed by Memcached

  , algorithm: 'crc32'      // hashing algorithm that is used for key mapping

  , poolSize: 10            // maximal parallel connections
  , reconnect: 18000000     // if dead, attempt reconnect each xx ms
  , timeout: 5000           // after x ms the server should send a timeout if we can't connect
  , retries: 5              // amount of retries before server is dead
  , retry: 30000            // timeout between retries, all call will be marked as cache miss
  , remove: false           // remove server if dead if false, we will attempt to reconnect
  , redundancy: false       // allows you do re-distribute the keys over a x amount of servers
  , keyCompression: true    // compress keys if they are to large (md5)
  , debug: false            // Output the commands and responses
};

// There some functions we don't want users to touch so we scope them
(function (nMemcached) {
  var LINEBREAK = '\r\n'
    , NOREPLY = ' noreply'
    , FLUSH = 1E3
    , BUFFER = 1E2
    , CONTINUE = 1E1
    , FLAG_JSON = 1<<1
    , FLAG_BINARY = 1<<2
    , FLAG_NUMERIC = 1<<3;

  var memcached = nMemcached.prototype = new EventEmitter
    , privates = {}
    , undefined;

  // Creates or generates a new connection for the give server, the callback
  // will receive the connection if the operation was successful
  memcached.connect = function connect(server, callback) {
    // server is dead, bail out
    if (server in this.issues && this.issues[server].failed) {
      return callback(false, false);
    }

    // fetch from connection pool
    if (server in this.connections) {
      return this.connections[server].pull(callback);
    }

    // No connection factory created yet, so we must build one
    var serverTokens = server[0] === '/'
        ? server
        : /(.*):(\d+){1,}$/.exec(server).reverse()
      , memcached = this;

    // Pop original string from array
    if (Array.isArray(serverTokens)) serverTokens.pop();

    var sid = 0
      , manager;

    /**
     * Generate a new connection pool manager.
     */

    manager = new Jackpot(this.poolSize);
    manager.retries = memcached.retries;

    manager.factory(function factory() {
      var S = Array.isArray(serverTokens)
          ? new Stream
          : new Socket
        , Manager = this;

      // config the Stream
      S.streamID = sid++;
      S.setTimeout(memcached.timeout);
      S.setNoDelay(true);
      S.setEncoding('utf8');
      S.metaData = [];
      S.responseBuffer = "";
      S.bufferArray = [];
      S.serverAddress = server;
      S.tokens = [].concat(serverTokens);
      S.memcached = memcached;

      // Add the event listeners
      Utils.fuse(S, {
          close: function streamClose() {
            Manager.remove(this);
          }
        , data: curry(memcached, privates.buffer, S)
        , timeout: function streamTimeout() {
            Manager.remove(this);
          }
        , end: S.end
      });

      // connect the net.Stream (or net.Socket) [port, hostname]
      S.connect.apply(S, S.tokens);
      return S;
    });

    manager.on('error', function err(e) {
      if (memcached.debug) console.log('Connection error', e);
    });

    this.connections[server] = manager;

    // now that we have setup our connection factory we can allocate a new
    // connection
    this.connections[server].pull(callback);
  };

  // Creates a multi stream, so it's easier to query agains multiple memcached
  // servers.
  memcached.multi = function memcachedMulti(keys, callback) {
    var map = {}
      , memcached = this
      , servers
      , i;

    // gets all servers based on the supplied keys,
    // or just gives all servers if we don't have keys
    if (keys) {
      keys.forEach(function fetchMultipleServers(key) {
        var server = memcached.servers.length === 1
          ? memcached.servers[0]
          : memcached.HashRing.getNode(key);

        if (map[server]){
          map[server].push(key);
        } else {
          map[server] = [key];
        }
      });

      // store the servers
      servers = Object.keys(map);
    } else {
      servers = this.servers;
    }

    i = servers.length;

    while (i--) {
      callback.call(this, servers[i], map[servers[i]], i, servers.length);
    }
  };

  // Executes the command on the net.Stream, if no server is supplied it will
  // use the query.key to get the server from the HashRing
  memcached.command = function memcachedCommand(queryCompiler, server) {
    // generate a regular query,
    var query = queryCompiler()
      , redundancy = this.redundancy && this.redundancy < this.servers.length
      , queryRedundancy = query.redundancyEnabled
      , memcached = this;

    // validate the arguments
    if (query.validate && !Utils.validateArg(query, this)) return;

    // try to find the correct server for this query
    if (!server) {
      // no need to do a hashring lookup if we only have one server assigned to
      // us
      if (this.servers.length === 1) {
        server = this.servers[0];
      } else {
        if (redundancy && queryRedundancy) {
          redundancy = this.HashRing.createRange(query.key, (this.redundancy + 1), true);
          server = redundancy.shift();
        } else {
          server = this.HashRing.getNode(query.key);
        }
      }
    }

    // check if the server is still alive
    if (server in this.issues && this.issues[server].failed) {
      return query.callback && query.callback(new Error('Server not available'));
    }

    this.connect(server, function allocateMemcachedConnection(error, S) {
      if (memcached.debug) {
        query.command.split(LINEBREAK).forEach(function errors(line) {
          console.log(S.streamID + ' << ' + line);
        });
      }

      // check for issues
      if (error) return query.callback && query.callback(error);
      if (!S) return query.callback && query.callback(new Error('Connect did not give a server'));

      if (S.readyState !== 'open') {
        return query.callback && query.callback(new Error('Connection readyState is set to ' + S.readySate));
      }

      // used for request timing
      query.start = Date.now();
      S.metaData.push(query);
      S.write(query.command + LINEBREAK);
    });

    // if we have redundancy enabled and the query is used for redundancy, than
    // we are going loop over the servers, check if we can reach them, and
    // connect to the correct net connection. because all redundancy queries are
    // executed with "no reply" we do not need to store the callback as there
    // will be no value to parse.
    if (redundancy && queryRedundancy) {
      queryRedundancy = queryCompiler(queryRedundancy);

      redundancy.forEach(function each(server) {
        if (server in memcached.issues && memcached.issues[server].failed) return;

        memcached.connect(server, function allocateMemcachedConnection(error, S) {
          if (!S || error || S.readyState !== 'open') return;
          S.write(queryRedundancy.command + LINEBREAK);
        });
      });
    }
  };

  // Logs all connection issues, and handles them off. Marking all requests as
  // cache misses.
  memcached.connectionIssue = function connectionIssue(error, S) {
    if (S && S.end) S.end();

    var issues
      , server = S.serverAddress
      , memcached = this;

    // check for existing issue logs, or create a new log
    if (server in this.issues) {
      issues = this.issues[server];
    } else {
      issues = this.issues[server] = new IssueLog({
          server: server
        , tokens: S.tokens
        , reconnect: this.reconnect
        , retries: this.retries
        , retry: this.retry
        , remove: this.remove
      });

      // proxy the events
      Utils.fuse(issues, {
          issue: function issue(details) {
            memcached.emit('issue', details);
          }
        , failure: function failure(details) {
            memcached.emit('failure', details);
          }
        , reconnecting: function reconnect(details) {
            memcached.emit('reconnecting', details);
          }
        , reconnected: function reconnected(details) {
            memcached.emit('reconnect', details);
          }
        , remove: function remove(details) {
            // emit event and remove servers
            memcached.emit('remove', details);
            memcached.connections[server].end();

            if (this.failOverServers && this.failOverServers.length) {
              memcached.HashRing.replaceServer(server, this.failOverServers.shift());
            } else {
              memcached.HashRing.removeServer(server);
            }
          }
      });

      // bumpt the event listener limit
      issues.setMaxListeners(0);
    }

    // log the issue
    issues.log(error);
  };

  // Kills all active connections
  memcached.end = function endMemcached() {
    var memcached = this;

    Object.keys(this.connections).forEach(function closeConnection(key) {
      memcached.connections[key].free(0);
    });
  };

  // These do not need to be publicly available as it's one of the most important
  // parts of the whole client, the parser commands:
  privates.parsers = {
    // handle error responses
    'NOT_FOUND': function notfound(tokens, dataSet, err) {
      return [CONTINUE, false];
    }

  , 'NOT_STORED': function notstored(tokens, dataSet, err) {
      var errObj = new Error('Item is not stored');
      errObj.notStored = true;
      err.push(errObj);
      return [CONTINUE, false];
    }

  , 'ERROR': function error(tokens, dataSet, err) {
      err.push(new Error('Received an ERROR response'));
      return [FLUSH, false];
    }

  , 'CLIENT_ERROR': function clienterror(tokens, dataSet, err) {
      err.push(new Error(tokens.splice(1).join(' ')));
      return [CONTINUE, false];
    }

  , 'SERVER_ERROR': function servererror(tokens, dataSet, err, queue, S, memcached) {
      (memcached || this.memcached).connectionIssue(tokens.splice(1).join(' '), S);
      return [CONTINUE, false];
    }

    // keyword based responses
  , 'STORED': function stored(tokens, dataSet) {
      return [CONTINUE, true];
    }

  , 'DELETED': function deleted(tokens, dataSet) {
      return [CONTINUE, true];
    }

  , 'OK': function ok(tokens, dataSet) {
      return [CONTINUE, true];
    }

  , 'EXISTS': function exists(tokens, dataSet) {
      return [CONTINUE, false];
    }

  , 'END': function end(tokens, dataSet, err, queue) {
      if (!queue.length) queue.push(false);
      return [FLUSH, true];
    }

    // value parsing:
  , 'VALUE': function value(tokens, dataSet, err, queue) {
      var key = tokens[1]
        , flag = +tokens[2]
        , dataLen = tokens[3] // length of dataSet in raw bytes
        , cas = tokens[4]
        , multi = this.metaData[0] && this.metaData[0].multi || cas
          ? {}
          : false
        , tmp;

      // In parse data there is an '||' passing us the content of token
      // if dataSet is empty. This may be fine for other types of responses,
      // in the case of an empty string being stored in a key, it will
      // result in unexpected behavior:
      // https://github.com/3rd-Eden/node-memcached/issues/64
      if (dataLen === '0') {
        dataSet = '';
      }

      switch (flag) {
        case FLAG_JSON:
          dataSet = JSON.parse(dataSet);
          break;
        case FLAG_NUMERIC:
          dataSet = +dataSet;
          break;
        case FLAG_BINARY:
          tmp = new Buffer(dataSet.length);
          tmp.write(dataSet, 0, 'binary');
          dataSet = tmp;
          break;
        }

      // Add to queue as multiple get key key key key key returns multiple values
      if (!multi) {
        queue.push(dataSet);
      } else {
        multi[key] = dataSet;
        if (cas) multi.cas = cas;
        queue.push(multi);
      }

      return [BUFFER, false];
    }

  , 'INCRDECR': function incrdecr(tokens) {
      return [CONTINUE, +tokens[1]];
    }

  , 'STAT': function stat(tokens, dataSet, err, queue) {
      queue.push([tokens[1], /^\d+$/.test(tokens[2]) ? +tokens[2] : tokens[2]]);
      return [BUFFER, true];
    }

  , 'VERSION': function version(tokens, dataSet) {
      var versionTokens = /(\d+)(?:\.)(\d+)(?:\.)(\d+)$/.exec(tokens.pop());

      return [CONTINUE, {
        server: this.serverAddress
      , version: versionTokens[0]
      , major: versionTokens[1] || 0
      , minor: versionTokens[2] || 0
      , bugfix: versionTokens[3] || 0
      }];
    }

  , 'ITEM': function item(tokens, dataSet, err, queue) {
      queue.push({
        key: tokens[1]
      , b: +tokens[2].substr(1)
      , s: +tokens[4]
      });

      return [BUFFER, false];
    }
  };

  function resultSetIsEmpty(resultSet) {
    return !resultSet || (resultSet.length === 1 && !resultSet[0]);
  }
  // Parses down result sets
  privates.resultParsers = {
    // combines the stats array, in to an object
    'stats': function stats(resultSet) {
      var response = {};
      if (resultSetIsEmpty(resultSet)) return response;

      // add references to the retrieved server
      response.server = this.serverAddress;

      // Fill the object
      resultSet.forEach(function each(statSet) {
        if (statSet) response[statSet[0]] = statSet[1];
      });

      return response;
    }

    // the settings uses the same parse format as the regular stats
  , 'stats settings': function settings() {
      return privates.resultParsers.stats.apply(this, arguments);
    }

    // Group slabs by slab id
  , 'stats slabs': function slabs(resultSet) {
      var response = {};
      if (resultSetIsEmpty(resultSet)) return response;

      // add references to the retrieved server
      response.server = this.serverAddress;

      // Fill the object
      resultSet.forEach(function each(statSet) {
        if (statSet) {
          var identifier = statSet[0].split(':');

          if (!response[identifier[0]]) response[identifier[0]] = {};
          response[identifier[0]][identifier[1]] = statSet[1];
        }
      });

      return response;
    }

  , 'stats items': function items(resultSet) {
      var response = {};
      if (resultSetIsEmpty(resultSet)) return response;

      // add references to the retrieved server
      response.server = this.serverAddress;

      // Fill the object
      resultSet.forEach(function each(statSet) {
        if (statSet) {
          var identifier = statSet[0].split(':');

          if (!response[identifier[1]]) response[identifier[1]] = {};
          response[identifier[1]][identifier[2]] = statSet[1];
        }
      });

      return response;
    }
  };

  // Generates a RegExp that can be used to check if a chunk is memcached response identifier
  privates.allCommands = new RegExp('^(?:' + Object.keys(privates.parsers).join('|') + '|\\d' + ')');
  privates.bufferedCommands = new RegExp('^(?:' + Object.keys(privates.parsers).join('|') + ')');

  // When working with large chunks of responses, node chunks it in to pieces.
  // So we might have half responses. So we are going to buffer up the buffer
  // and user our buffered buffer to query // against. Also when you execute
  // allot of .writes to the same stream, node will combine the responses in to
  // one response stream. With no indication where it had cut the data. So it
  // can be it cuts inside the value response, or even right in the middle of
  // a line-break, so we need to make sure, the last piece in the buffer is
  // a LINEBREAK because that is all what is sure about the Memcached Protocol,
  // all responds end with them.
  privates.buffer = function BufferBuffer(S, BufferStream) {
    S.responseBuffer += BufferStream;

    // only call transform the data once we are sure, 100% sure, that we valid
    // response ending
    if (S.responseBuffer.substr(S.responseBuffer.length - 2) === LINEBREAK) {
      var chunks = S.responseBuffer.split(LINEBREAK);

      if (this.debug) {
        chunks.forEach(function each(line) {
          console.log(S.streamID + ' >> ' + line);
        });
      }

      S.responseBuffer = ""; // clear!
      this.rawDataReceived(S, S.bufferArray = S.bufferArray.concat(chunks));
    }
  };

  // The actual parsers function that scan over the responseBuffer in search of
  // Memcached response identifiers. Once we have found one, we will send it to
  // the dedicated parsers that will transform the data in a human readable
  // format, deciding if we should queue it up, or send it to a callback fn.
  memcached.rawDataReceived = function rawDataReceived(S) {
    var queue = []
      , token
      , tokenSet
      , dataSet
      , resultSet
      , metaData
      , err = []
      , tmp;

    while(S.bufferArray.length && privates.allCommands.test(S.bufferArray[0])) {
      token = S.bufferArray.shift();
      tokenSet = token.split(' ');

      // special case for digit only's these are responses from INCR and DECR
      if (/^\d+$/.test(tokenSet[0])) tokenSet.unshift('INCRDECR');

      // special case for value, it's required that it has a second response!
      // add the token back, and wait for the next response, we might be
      // handling a big ass response here.
      if (tokenSet[0] === 'VALUE' && S.bufferArray.indexOf('END') === -1) {
        return S.bufferArray.unshift(token);
      }

      // check for dedicated parser
      if (privates.parsers[tokenSet[0]]) {

        // fetch the response content
        if (tokenSet[0] === 'VALUE') {
          dataSet = Utils.unescapeValue(S.bufferArray.shift());
        }

        resultSet = privates.parsers[tokenSet[0]].call(S, tokenSet, dataSet || token, err, queue, this);

        // check how we need to handle the resultSet response
        switch (resultSet.shift()) {
          case BUFFER:
            break;

          case FLUSH:
            metaData = S.metaData.shift();
            resultSet = queue;

            // if we have a callback, call it
            if (metaData && metaData.callback) {
              metaData.execution = Date.now() - metaData.start;
              metaData.callback.call(
                  metaData
                , err.length ? err : err[0]

                  // see if optional parsing needs to be applied to make the result set more readable
                , privates.resultParsers[metaData.type]
                    ? privates.resultParsers[metaData.type].call(S, resultSet, err)
                    : !Array.isArray(queue) || queue.length > 1 ? queue : queue[0]
             );
            }

            queue.length = err.length = 0;
            break;

          default:
            metaData = S.metaData.shift();

            if (metaData && metaData.callback) {
              metaData.execution = Date.now() - metaData.start;
              metaData.callback.call(metaData, err.length > 1 ? err : err[0], resultSet[0]);
            }

            err.length = 0;
            break;
        }
      } else {
        // handle unkown responses
        metaData = S.metaData.shift();
        if (metaData && metaData.callback){
          metaData.execution = Date.now() - metaData.start;
          metaData.callback.call(metaData, new Error('Unknown response from the memcached server: "' + token + '"'), false);
        }
      }

      // cleanup
      dataSet = tokenSet = metaData = undefined;

      // check if we need to remove an empty item from the array, as splitting on /r/n might cause an empty
      // item at the end..
      if (S.bufferArray[0] === '') S.bufferArray.shift();
    }
  };

  // Small wrapper function that only executes errors when we have a callback
  privates.errorResponse = function errorResponse(error, callback) {
    if (typeof callback === 'function') callback(error, false);

    return false;
  };

  // This is where the actual Memcached API layer begins:
  memcached.get = function get(key, callback) {
    if (Array.isArray(key)) return this.getMulti.apply(this, arguments);

    this.command(function getCommand(noreply) {
      return {
          key: key
        , callback: callback
        , validate: [['key', String], ['callback', Function]]
        , type: 'get'
        , command: 'get ' + key
      };
    });
  };

  // the difference between get and gets is that gets, also returns a cas value
  // and gets doesn't support multi-gets at this moment.
  memcached.gets = function get(key, callback) {
    this.command(function getCommand(noreply) {
      return {
          key: key
        , callback: callback
        , validate: [['key', String], ['callback', Function]]
        , type: 'gets'
        , command: 'gets ' + key
      };
    });
  };

  // Handles get's with multiple keys
  memcached.getMulti = function getMulti(keys, callback) {
    var memcached = this
      , responses = {}
      , errors = []
      , calls;

    // handle multiple responses and cache them untill we receive all.
    function handle(err, results) {
      if (err) {
        errors.push(err);
      }

      // add all responses to the array
      (Array.isArray(results) ? results : [results]).forEach(function each(value) {
        Utils.merge(responses, value);
      });

      if (!--calls) callback(errors.length ? errors : false, responses);
    }

    this.multi(keys, function multi(server, key, index, totals) {
      if (!calls) calls = totals;

      memcached.command(function getMultiCommand(noreply) {
        return {
            callback: handle
          , multi:true
          , type: 'get'
          , command: 'get ' + key.join(' ')
        };
      }, server);
    });
  };

  // As all command nearly use the same syntax we are going to proxy them all to
  // this function to ease maintenance. This is possible because most set
  // commands will use the same syntax for the Memcached server. Some commands
  // do not require a lifetime and a flag, but the memcached server is smart
  // enough to ignore those.
  privates.setters = function setters(type, validate, key, value, lifetime, callback, cas) {
    var flag = 0
      , valuetype = typeof value
      , length;

    if (Buffer.isBuffer(value)) {
      flag = FLAG_BINARY;
      value = value.toString('binary');
    } else if (valuetype === 'number') {
      flag = FLAG_NUMERIC;
      value = value.toString();
    } else if (valuetype !== 'string') {
      flag = FLAG_JSON;
      value = JSON.stringify(value);
    }

    value = Utils.escapeValue(value);

    length = Buffer.byteLength(value);
    if (length > this.maxValue) {
      return privates.errorResponse(new Error('The length of the value is greater than ' + this.maxValue), callback);
    }

    this.command(function settersCommand(noreply) {
      return {
          key: key
        , callback: callback
        , lifetime: lifetime
        , value: value
        , cas: cas
        , validate: validate
        , type: type
        , redundancyEnabled: false
        , command: [type, key, flag, lifetime, length].join(' ') +
               (cas ? ' ' + cas : '') +
               (noreply ? NOREPLY : '') +
               LINEBREAK + value
      };
    });
  };

  // Curry the function and so we can tell the type our private set function
  memcached.set = curry(undefined, privates.setters
    , 'set'
    , [
          ['key', String]
        , ['lifetime', Number]
        , ['value', String]
        , ['callback', Function]
      ]
  );

  memcached.replace = curry(undefined, privates.setters
    , 'replace'
    , [
          ['key', String]
        , ['lifetime', Number]
        , ['value', String]
        , ['callback', Function]
      ]
  );

  memcached.add = curry(undefined, privates.setters
    , 'add'
    , [
          ['key', String]
        , ['lifetime', Number]
        , ['value', String]
        , ['callback', Function]
      ]
  );

  memcached.cas = function checkandset(key, value, cas, lifetime, callback) {
    privates.setters.call(this
      , 'cas'
      , [
            ['key', String]
          , ['lifetime', Number]
          , ['value', String]
          , ['callback', Function]
        ]
      , key
      , value
      , lifetime
      , callback
      , cas
    );
  };

  memcached.append = function append(key, value, callback) {
    privates.setters.call(this
      , 'append'
      , [
            ['key', String]
          , ['lifetime', Number]
          , ['value', String]
          , ['callback', Function]
        ]
      , key
      , value
      , 0
      , callback
    );
  };

  memcached.prepend = function prepend(key, value, callback) {
    privates.setters.call(this
      , 'prepend'
      , [
            ['key', String]
          , ['lifetime', Number]
          , ['value', String]
          , ['callback', Function]
        ]
      , key
      , value
      , 0
      , callback
    );
  };

  // Small handler for incr and decr's
  privates.incrdecr = function incrdecr(type, key, value, callback) {
    this.command(function incredecrCommand(noreply) {
      return {
          key: key
        , callback: callback
        , value: value
        , validate: [
              ['key', String]
            , ['value', Number]
            , ['callback', Function]
          ]
        , type: type
        , redundancyEnabled: true
        , command: [type, key, value].join(' ') +
               (noreply ? NOREPLY : '')
      };
    });
  };

  // Curry the function and so we can tell the type our private incrdecr
  memcached.increment = memcached.incr = curry(undefined, privates.incrdecr, 'incr');
  memcached.decrement = memcached.decr = curry(undefined, privates.incrdecr, 'decr');

  // Deletes the keys from the servers
  memcached.del = function del(key, callback){
    this.command(function deleteCommand(noreply) {
      return {
          key: key
        , callback: callback
        , validate: [
              ['key', String]
            , ['callback', Function]
          ]
        , type: 'delete'
        , redundancyEnabled: true
        , command: 'delete ' + key +
               (noreply ? NOREPLY : '')
      };
    });
  };
  memcached['delete'] = memcached.del;

  // Small wrapper that handle single keyword commands such as FLUSH ALL, VERSION and STAT
  privates.singles = function singles(type, callback) {
    var memcached = this
      , responses = []
      , errors
      , calls;

      // handle multiple servers
    function handle(err, results) {
      if (err) {
        errors = errors || [];
        errors.push(err);
      }
      if (results) responses = responses.concat(results);

      // multi calls should ALWAYS return an array!
      if (!--calls) callback(errors && errors.length ? errors.pop() : undefined, responses);
    }

    this.multi(false, function multi(server, keys, index, totals) {
      if (!calls) calls = totals;

      memcached.command(function singlesCommand(noreply) {
        return {
            callback: handle
          , type: type
          , command: type
        };
      }, server);
    });
  };

  // Curry the function and so we can tell the type our private singles
  memcached.version  = curry(undefined, privates.singles, 'version');
  memcached.flush = curry(undefined, privates.singles, 'flush_all');
  memcached.stats = curry(undefined, privates.singles, 'stats');
  memcached.settings = curry(undefined, privates.singles, 'stats settings');
  memcached.slabs = curry(undefined, privates.singles, 'stats slabs');
  memcached.items = curry(undefined, privates.singles, 'stats items');

  // aliases
  memcached.flushAll = memcached.flush;
  memcached.statsSettings = memcached.settings;
  memcached.statsSlabs = memcached.slabs;
  memcached.statsItems = memcached.items;


  // You need to use the items dump to get the correct server and slab settings
  // see simple_cachedump.js for an example
  memcached.cachedump = function cachedump(server, slabid, number, callback) {
    this.command(function cachedumpCommand(noreply) {
      return {
          callback: callback
        , number: number
        , slabid: slabid
        , validate: [
              ['number', Number]
            , ['slabid', Number]
            , ['callback', Function]
          ]
        , type: 'stats cachedump'
        , command: 'stats cachedump ' + slabid + ' ' + number
      };
    }, server);
  };
})(Client);

module.exports = Client;
