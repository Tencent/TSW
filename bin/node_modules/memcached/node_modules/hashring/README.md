## hashring [![BuildStatus](https://secure.travis-ci.org/3rd-Eden/node-hashring.png)](http://travis-ci.org/3rd-Eden/node-hashring)

Hash ring provides consistent hashing based on the `libketema` library.

### Installation

You can either install it using the Node Package Manager (NPM)

    npm install hashring

Or fork this repository to your machine

    git clone git://github.com/3rd-Eden/node-hashring.git hashring

### Basic usage

The constructor is designed to handle multiple arguments types as the hash ring
can be used for different use cases. You have the ability to use a `String` to
add a single server, a `Array` to provide multiple servers or an `Object` to
provide servers with a custom weight. The weight can be used to give a server a
bigger distribution in the hash ring. For example you have 3 machines, 2 of
those machines have 8 gig memory and one has 32 gig of memory because the last
server has more memory you might it to handle more keys than the other server.
So you can give it a weight of 2 and the other servers a weight of 1.

Creating a hash ring with only one server

```javascript
var hashring = require('hashring');

var ring = new hashring('192.168.0.102:11212');
```

Creating a hash ring with multiple servers

```javascript
var hashring = require('hashring');

var ring = new hashring([ '192.168.0.102:11212', '192.168.0.103:11212', '192.168.0.104:11212']);
```

Creating a hash ring with multiple servers and weights

```javascript
var hashring = require('hashring');

var ring = new hashring({
  '192.168.0.102:11212': 1
, '192.168.0.103:11212': 2
, '192.168.0.104:11212': 1
});
```

Creating a hash ring with multiple servers an vnodes selected per nodes

```javascript
var hashring = require('hashring');

var ring = new hashring({
  '192.168.0.102:11212': {"vnodes": 5}
, '192.168.0.103:11212': {"vnodes": 10}
, '192.168.0.104:11212': {"vnodes": 7}
});
```
Optionaly you could add the weigth property to the object.

By default the hash ring uses a JavaScript crc32 implementation hashing
algorithm. But this can be overwritten by adding a second argument to the
constructor. This can be anything that is supported as hashing algorithm by the
crypto module.

```javascript
var hashring = require('hashring');

var ring = new hashring('192.168.0.102:11212', 'md5');
```

I have chosen crc32 as default algorithm because a creates a nice dense ring
distribution. Another good alternative and common used hashing algorithm is md5.
The JavaScript crc32 algorithm is faster than md5. So If you are doing allot of
operations per seconds these small differences can really matter.

### Small API

In these examples I assume that you already setup a `hashring` instance, with
the variable name `ring` like I did the in the examples illustrated above.

#### Getting a node by key
a.k.a key -> node look up, this is where all the magic is happening.

```javascript
ring.get('foo'); // => '192.168.0.104:11212'
ring.get('pewpew'); // => '192.168.0.103:11212'
```

#### Replacing a server
If you are experiencing downtime with one of your servers, you might want to
`hot swap` with a new server.

```javascript
ring.replace('192.168.0.104:11212','192.168.0.112:11212');
ring.get('foo'); // => '192.168.0.112:11212'
```

#### Add a server
Adds a new server to the hash ring, but please note that this could cause a
shift in current key -> server distribution.

```javascript
ring.add('192.168.0.102:11212');
```

#### Remove a server
Remove a server from the generated hash ring.

```javascript
ring.remove('192.168.0.102:11212');
```

#### Creating a range
Iterates over the nodes for a give key, can be used to create redundancy support.

```javascript
ring.range('key', 3);
```

#### Ending
Clean up the internal hash ring, kill the cache, kill nodes, nuke the planet.

```javascript
range.end();
```

For a more extensive documentation: Read the source, it's not rocket sience.
