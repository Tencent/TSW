this.skyMode   = true;

//http监听地址
this.httpAddress = '0.0.0.0';

//http监听地址
this.httpPort = 80;

//logger
this.logger = {
    logLevel: 'debug'
};

this.memcached = {host:'127.0.0.1:11211', timeout: 500,	poolSize: 20,	retries: 1, maxQueueSize: 1000};
