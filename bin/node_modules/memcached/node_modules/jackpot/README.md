# whooohoo jackpot

[![build status](https://secure.travis-ci.org/3rd-Eden/jackpot.png?branch=master)](http://travis-ci.org/3rd-Eden/jackpot)

Jackpot is a fault tolerant connection pool for Node.js, it automatically cleans
up after it self and detects broken connections. It does not need to be
released, as it will allocate connections based on their readyState / write
abilities.

## API

```js
var ConnectionPool = require('jackpot');

// First argument: size of the connection pool.
// Second argument: optional connection factory.
// Third argument: optional options.
var pool = new ConnectionPool(100);
```

The following options can be configured:

- `retries` the amount of retries the pull method should do.
- `factor` exponential backoff factor.
- `min` minimal delay for the backoff.
- `max` maximum delay for the backoff.
- `randomize` randomize the connection.

```js
var pool = new ConnectionPool(100, {
  min: 100
  max: 50000
});
```

But you can also set the properties:

```js
// you can optionally boost the amount of retries after you have
// constructed a new instance
pool.retries = 5 // allow 5 failures for the #pull method
```

You can set the required factory at the contructor but also through a helper
method:

```js
// every connection pool requires a factory which is used to generate / setup
// the initial net.Connection
//
// it should return a new net.Connection instance..
pool.factory(function () {
  return net.connect(port, host)
});
```

There are 2 ways to retrieve a connection, using `allocate`:

``js`
// now that the pool is setup we can allocate a connection, the allocate
// requires a callback as it can be async..
pool.allocate(function (err, connection) {
  // error: when we failed to get a connection
  // connection: the allocated net.connection if there isn't an error
});
```

And `pull`;

```js
// in addition to the #allocate method, there is also the pull method, which is
// fault tolerant wrapper around the allocate function as it can give back an
// error if the pool is full, so the pull will then retry to get a new
connection.pull(function (err, connection) {
  // same arguments as the #allocate method
});
```

And some misc methods:

```js
// call pool.free if you want to free connections from the pool, the arugment
// you supply is the amount of connections you want to keep
pool.free(10); // keep only 10 healthy connections kill the rest.

// kill the whole connection pool:
pool.end();
```

For more API information, fork this repo and add more.. or look at the test
file.

## LICENSE (MIT)

Copyright (c) 2013 Observe.it (http://observe.it) <opensource@observe.it>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions: 

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
