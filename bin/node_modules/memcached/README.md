# Memcached [![Build Status](https://secure.travis-ci.org/3rd-Eden/node-memcached.png?branch=master)](http://travis-ci.org/3rd-Eden/node-memcached)

`memcached` is a fully featured Memcached client for Node.js. `memcached` is
build with scaling, high availability and exceptional performance in mind. We
use consistent hashing to store the data across different nodes. Consistent
hashing is a scheme that provides a hash table functionality in a way that
adding or removing a server node does not significantly change the mapping of
the keys to server nodes. The algorithm that is used for consistent hashing is
the same as `libketama`.

There are different ways to handle errors for example, when a server becomes
unavailable you can configure the client to see all requests to that server as
cache misses until it goes up again. It's also possible to automatically remove
the affected server from the consistent hashing algorithm or provide `memcached`
with a failover server that can take the place of the unresponsive server.

When these issues occur the `memcached` client will emit different events where
you can subscribe to containing detailed information about the issues.

The client is configurable on different levels. There's a global configuration
that you update so all you Memcached clusters will use the same failure
configuration for example, but it's also possible to overwrite these changes per
`memcached` instance.

### protocol

This module uses the ASCII protocol to communicate with the server, this makes
it easier to debug for you are user as you can see what is send over the wire
but also for me as developer. But this also means that SASL auth is not
supported in this driver as that requires the use of the binary protocol. The
ASCII protocol not only used by memcached but also by other databases and
message queues, so that is a nice extra.

## Setting up the client

The constructor of the `memcached` client take 2 different arguments `server
locations` and `options`. Syntax:

``` js
var Memcached = require('memcached');
var memcached = new Memcached(Server locations, options);
```

### Server locations

The server locations is designed to work with different formats. These formats
are all internally parsed to the correct format so our consistent hashing scheme
can work with it. You can either use:

1. **String**, this only works if you have are running a single server instance
   of Memcached.  It's as easy a suppling a string in the following format:
   `hostname:port`. For example `192.168.0.102:11212` This would tell the client
   to connect to host `192.168.0.102` on port number `11212`.

2. **Array**, if you are running a single server you would only have to supply
  one item in the array.  The array format is particularly useful if you are
  running a cluster of Memcached servers. This will allow you to spread the keys
  and load between the different servers. Giving you higher availability for
  when one of your Memcached servers goes down.

3. **Object**, when you are running a cluster of Memcached servers it could
   happen to not all server can allocate the same amount of memory. You might
   have a Memcached server with 128mb, 512, 128mb. If you would the array
   structure all servers would have the same weight in the consistent hashing
   scheme. Spreading the keys 33/33/33 over the servers. But as server 2 has
   more memory available you might want to give it more weight so more keys get
   stored on that server. When you are using a object, the `key` should
   represent the server location syntax and the value the weight of the server.
   By default all servers have a weight of 1.  `{ '192.168.0.102:11212': 1,
   '192.168.0.103:11212': 2, '192.168.0.104:11212': 1 }` would generate a
   25/50/25 distribution of the keys.

If you would implement one of the above formats, your constructor would
something like this:

```js
var memcached = new Memcached({ '192.168.0.102:11212': 1, '192.168.0.103:11212': 2, '192.168.0.104:11212': 1 });
var memcached = new Memcached([ '192.168.0.102:11212', '192.168.0.103:11212', '192.168.0.104:11212' ]);
var memcached = new Memcached('192.168.0.102:11212');
```

### Options

There 2 kinds of options that can be configured. A global configuration that
will be inherited by all Memcached servers instances and a client specific
configuration that can be used to overwrite the globals. The options should be
formatted in an JavaScript `object`. They both use the same object structure:

* `maxKeySize`: *250*, the max size of they key allowed by the Memcached server.
* `maxExpiration`: *2592000*, the max expiration of keys by the Memcached server
  in seconds.
* `maxValue`: *1048576*, the max size of a value that is allowed by the
  Memcached server.
* `poolSize`: *10*, the maximum connections we can allocate in our connection pool.
* `algorithm`: *crc32*, the hashing algorithm that should be used to generate
  the hashRing values.
* `reconnect`: *18000000*, when the server is marked as dead we will attempt to
  reconnect every x milliseconds.
* `timeout`: *5000*, after x ms the server should send a timeout if we can't
  connect. This will also be used close the connection if we are idle.
* `retries`: *5*, How many times to retry socket allocation for given request
* `failures`: *5*, Number of times a server may have issues before marked dead.
* `retry`: *30000*, time to wait between failures before putting server back in
  service.
* `remove`: *false*, when the server is marked as dead you can remove it from
  the pool so all other will receive the keys instead.
* `failOverServers`: *undefined*, the ability use these servers as failover when
  the dead server get's removed from the consistent hashing scheme. This must be
  an array of servers confirm the server_locations specification.
* `keyCompression`: *true*, compress keys using md5 if they exceed the
  maxKeySize option.
* `idle`: *5000*, the idle timeout for the connections.

Example usage:

```js
var memcached = new Memcached('localhost:11212', {retries:10,retry:10000,remove:true,failOverServers:['192.168.0.103:11212']});
```

If you wish to configure the options globally:

```js
var Memcached = require('memcached');
// all global configurations should be applied to the .config object of the Client.
Memcached.config.poolSize = 25;
```

## API

### Public methods

#### memcached.touch(key, lifetime, callback);

Touches the given key.

**Arguments**

`key`: **String** The key
`lifetime`: **Number** After how long should the key expire measured in `seconds`
`callback`: **Function**

```js
memcached.touch('key', 10, function (err) {
  // stuff
});
```

#### memcached.get(key, callback);

Get the value for the given key.

**Arguments**

`key`: **String**, the key
`callback`: **Function**, the callback.

```js
memcached.get('foo', function (err, data) {
  console.log(data);
});
```

#### memcached.gets(key, callback);

Get the value and the CAS id.

**Arguments**

`key`: **String**, the key
`callback`: **Function**, the callback.

```js
memcached.gets('foo', function (err, data) {
  console.log(data.foo);
  console.log(data.cas);

  // Please note that the data is stored under the name of the given key.
});
```

#### memcached.getMulti(keys, callback);

Retrieves a bunch of values from multiple keys.

**Arguments**

`keys`: **Array**, all the keys that needs to be fetched
`callback`: **Function**, the callback.

```js
memcached.getMulti(['foo', 'bar'], function (err, data) {
  console.log(data.foo);
  console.log(data.bar);
});
```

#### memcached.set(key, value, lifetime, callback);

Stores a new value in Memcached.

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`lifetime`: **Number**, how long the data needs to be stored measured in `seconds`
`callback`: **Function** the callback

```js
memcached.set('foo', 'bar', 10, function (err) {
  // stuff
});
```

#### memcached.replace(key, value, lifetime, callback);

Replaces the value in memcached. 

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`lifetime`: **Number**, how long the data needs to be replaced measured in `seconds`
`callback`: **Function** the callback

```js
memcached.replace('foo', 'bar', 10, function (err) {
  // stuff
});
```

#### memcached.add(key, value, lifetime, callback);

Add the value, only if it's not in memcached already.

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`lifetime`: **Number**, how long the data needs to be replaced measured in `seconds`
`callback`: **Function** the callback

```js
memcached.add('foo', 'bar', 10, function (err) {
  // stuff
});
```

#### memcached.cas(key, value, cas, lifetime, callback);

Add the value, only if it matches the given CAS value.

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`lifetime`: **Number**, how long the data needs to be replaced measured in `seconds`
`cas`: **String** the CAS value
`callback`: **Function** the callback

```js
memcached.gets('foo', function (err, data) {
  memcached.cas('foo', 'bar', data.cas, 10, function (err) {
    // stuff
  });
});
```

#### memcached.append(key, value, callback);

Add the given value string to the value of an existing item.

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`callback`: **Function** the callback

```js
memcached.append('foo', 'bar', function (err) {
  // stuff
});
```

#### memcached.prepend(key, value, callback);

Add the given value string to the value of an existing item.

**Arguments**

`key`: **String** the name of the key
`value`: **Mixed** Either a buffer, JSON, number or string that you want to store.
`callback`: **Function** the callback

```js
memcached.preprend('foo', 'bar', function (err) {
  // stuff
});
```

#### memcached.incr(key, amount, callback);

Increment a given key.

**Arguments**

`key`: **String** the name of the key
`amount`: **Number** The increment
`callback`: **Function** the callback

```js
memcached.incr('foo', 10, function (err) {
  // stuff
});
```

#### memcached.decr(key, amount, callback);

Decrement a given key.

**Arguments**

`key`: **String** the name of the key
`amount`: **Number** The increment
`callback`: **Function** the callback

```js
memcached.incr('foo', 10, function (err) {
  // stuff
});
```

#### memcached.del(key, callback);

Remove the key from memcached.

**Arguments**

`key`: **String** the name of the key
`callback`: **Function** the callback

```js
memcached.del('foo', function (err) {
  // stuff
});
```

#### memcached.version(callback);

Retrieves the version number of your server.

#### memcached.flush(callback);

Flushes the memcached server.

#### memcached.stats(callback);

Retrieves stats from your memcached server.

#### memcached.settings(callback);

Retrieves your `stats settings`.

#### memcached.slabs(callback);

Retrieves `stats slabs` information.

#### memcached.items(callback);

Retrieves `stats items` information.

#### memcached.cachedump(server, slabid, number, callback);

Inspect cache, see examples for a detailed explanation.

#### memcached.end();

Closes all active memcached connections.

### Private methods
The following methods are intended for private usage:

---------------------------------------
#### .connect
Fetches or generates a connection for the given server. The supplied callback
function will receive a reference to the connection as argument.
If there are issues with the server connection, we are going to respond with cache-miss pattern.

**Arguments**

`server`: *String*, The server that needs a connection, the format must be
confirm the server_locations specification.

`callback`: *Function*, The callback function that receives the net.Stream
connection. It will be called with 2 arguments `error` and `connection`.

Example:

``` js
memcached.connect( '192.168.0.103:11212', function( err, conn ){
  if( err ) throw new Error( err );
  console.log( conn.server );
});
```

---------------------------------------

#### .multi
A small wrapper function that makes it easier to query multiple Memcached
servers. It will return the location for each key or the complete list of
servers.

**Arguments**

`keys`: *Array* **(optional)**, They keys that needs to be converted to a server.

`callback`: *Function*, The callback function for the data, it will be called
for **each** key. It will be called with 4 arguments:

1. `server`: *String*, The server location.
2. `key`: *String*, The key associated with the server, if you didn't specify
   keys, this variable will be undefined.
3. `index`: *Number*, The current index of the loop
4. `total`: *Number*, The total amount server retrieved.

Example:

``` js
memcached.multi( false, function( server, key, index, totals ){
  if( err ) throw new Error( err );

  this.connect( server, function( err, conn ){
    console.log( "connection ready" )
  })
});
```

---------------------------------------
#### .command

This is the core functionality of the `memcached` client. All public API's are
routed through this function. It takes care of the argument validations Server
retrieval ( If the server argument isn't specified ). After all data ready a
connection is asked for the private `connect` method and the command is written
to the Memcached server.

**Arguments**

`query`: *Object*, The metaData object, see the `Callbacks` section for the
specification.

`server`: *String*, The server the to connect. This is only needed when the
metaData object doesn't contain a key property to retrieve the server from.

Example:

``` js
memcached.command({
  key: 'key', callback: function(){ console.dir( arguments ); },

  // validate the arguments
  validate: [[ 'key', String ], [ 'callback', Function ]],

  // used for the query
  type: 'delete',
  command: 'delete key'
});
```

---------------------------------------
#### .connectionIssue

A internal function for logging issues with connections. As there can be various
of ways that an error occurs we need solid issue manager to handle all these
cases. For example server could crash or the Memcached server could respond with
`SERVER ERROR <broken>`.

**Arguments**

`error`: *String*, The actual error message.

`Stream`: *net.Stream*, A reference to the connection stream where the error
occurred on.

`callback`: *Function* **(optional)**, The callback function of a potential
request, it will be marked as cache miss if it was provided

Example:

``` js
memcached.connectionIssue( "Server down", connectionReference );
```

## Callbacks

Each method requires a callback function. Once this function get executed there
will be 2 variables applied:

* `error`: A error response if something went wrong while retrieving data from
  the Memcached server. Depending on the type of request this will either be an
  string or an Array with multiple errors.
* `response`: The actual result from the Memcached server. If the response is
  `false` or `undefined` than a cache miss occurred. Cache misses will also
  occur when there is an error. So you might want to check on errors first.

When we have a successful response, the context of the callback function will
shift to a metaData object. The metaData object contains all information that we
used to generate the request for the Memcached server. The metaData object
contains the following properties:

* `start`: Date in milliseconds when the request was received
* `execution`: Total execution time for the request, including response parsing.
* `callback`: Reference to the callback function
* `type`: The type of Memcached command
* `command`: The compiled command that was send through the sockets
* `validate`: The properties of metaData object that needs type validation.

And all the arguments you have send to the method, this depends on the method
you have called.

## Events

When connection issues occur we send out different notifications using the
`EventEmitter` protocol. This can be useful for logging, notification and
debugging purposes. Each event will receive details Object containing detailed
information about the issues that occurred.

### Details Object

The details Object contains the various of error messages that caused, the
following 3 will always be present in all error events:

* `server`: the server where the issue occurred on
* `tokens`: a array of the parsed server string in `[port, hostname]` format.
* `messages`: a array containing all error messages that this server received.
  As messages are added to the array using .push(), the first issue will at the
  beginning and the latest error at the end of the array.

The following properties depend on the type of event that is send. If we are
still in our retry phase the details will also contain:

* `failures`: the amount of failures left before we mark the server as dead.
* `totalFailures`: the total amount of failures that occurred on this server, as when the
  server has been reconnected after it's dead the `failures` will be rest to
  defaults and messages will be removed.

If the server is dead these details will be added:

* `totalReconnectsAttempted`: the total reconnects we have attempted. This is
the success and failure combined.
* `totalReconnectsSuccess`: the total successful reconnects we have made.
* `totalReconnectsFailed`: the total failed reconnects we have made.
* `totalDownTime`: the total down time that was generated. Formula: (
  totalReconnectsFailed * reconnect_timeout ) + ( totalRetries * retry_timeout).

### Events

There are `5` different events that the `memcached` client emits when connection
issues occur.

* `issue`: a issue occurred on one a server, we are going to attempt a retry next.
* `failure`: a server has been marked as failure or dead.
* `reconnecting`: we are going to attempt to reconnect the to the failed server.
* `reconnected`: successfully reconnected to the memcached server.
* `remove`: removing the server from our consistent hashing.

Example implementations:

```js
var memcached = new Memcached([ '192.168.0.102:11212', '192.168.0.103:11212' ]);
memcached.on('failure', function( details ){ sys.error( "Server " + details.server + "went down due to: " + details.messages.join( '' ) ) });
memcached.on('reconnecting', function( details ){ sys.debug( "Total downtime caused by server " + details.server + " :" + details.totalDownTime + "ms")});
```

# Contributors

This project wouldn't be possible without the hard work of our amazing
contributors. See the contributors tab in Github for an up to date list of
[contributors](/3rd-Eden/node-memcached/graphs/contributors).

Thanks for all your hard work on this project!

# License

The driver is released under the MIT license. See the
[LICENSE](/3rd-Eden/node-memcached/blob/master/LICENSE) for more information.
