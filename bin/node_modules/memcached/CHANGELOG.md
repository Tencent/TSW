### 0.2.6
  - Handle error when unable to establish connection #155
  - Document lifetime parameter #156
  - Reformat tests to use two-space indents
  - Corrent maxkeysize #153

### 0.2.5
  - Fix for two bugs in Issuelog #137 and #141
  - Add new `failuresTimeout` option

### 0.2.4
  - Tons of fixes have been made to the way we do error handling and failover,
    this includes better reconnect, server failure detection, timeout handling
    and much more.
  - Introduction of a new `idle` timeout option.
  - Documentation improvements.

### 0.2.3
  - Added documentation for public api's
  - new namespace option added that namespaces all your keys.
  - minor parser fixes and some thrown errors.

### 0.2.2
 - Support for touch command #86
 - Fix for chunked responses from the server #84

### 0.2.1
 - Supports for a queued callback limit so it would crash the process when we queue
   to much callbacks. #81

### 0.2.0
 - [breaking] We are now returning Error instances instead of strings for errors
 - Dependency bump for a critical bug in our connection pool.

### 0.1.5
 - Don't execute callbacks multiple times if the connection fails
 - Parser fix for handling server responses that contain Memcached Protocol
   keywords
 - Make sure that the retry option is set correctly

### 0.1.4
 - Added missing error listener to the 3rd-Eden/jackpot module, this prevents crashes
   when it's unable to connect to a server.

### 0.1.3
 - Handle Memcached responses that contain no value.
 - Travis CI integration.

### 0.1.2
 - Returning an error when the Memcached server issues a `NOT_STORED` response.

### 0.1.1
 - Now using 3rd-Eden/jackpot as connection pool, this should give a more stable
   connection.

### 0.1.0
 - Storing numeric values are now returned as numeric values, they are no
   longer strings.

### 0.0.12
 - Added `.setEncoding` to the connections, this way UTF-8 chars will not be
   chopped in to multiple pieces and breaking binary stored data or UTF-8 text

### 0.0.11
 - Added more useful error messages instead of returning false. Please note
   that they are still strings instead of Error instances (legacy)

### 0.0.10
 - Compatibility with Node.js 0.8
 - Don't saturate the Node process by retrying to connect if pool is full #43
 - Minor code formatting

### 0.0.9
 - Code style refactor, named the functions, removed tabs
 - Added Mocha test suite
