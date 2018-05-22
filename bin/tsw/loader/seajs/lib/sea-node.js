/**
 * Adds the capability to load SeaJS modules in node environment.
 * @author lifesinger@gmail.com
 */

var Module = module.constructor;
var helper = require('./helper');
var vm = require('vm');


var _compile = Module.prototype._compile;
var _resolveFilename = Module._resolveFilename;
var moduleStack = [];

Module._resolveFilename = function(request, parent) {
    var res;
    //request = request.replace(/\?.*$/, '') // remove timestamp etc.
  
    //性能优化
    if(parent.resolveFilenameCache){
        if(parent.resolveFilenameCache[request]){
            return parent.resolveFilenameCache[request];
        }
    }else{
        parent.resolveFilenameCache = {};
    }
  
    res = _resolveFilename(request, parent);
  
    parent.resolveFilenameCache[request] = res;
  
    return res;
};

Module.prototype._compile = function(content, filename) {
    moduleStack.push(this);
    try {
        if(filename.indexOf(plug.parent) === 0){
            this.paths = plug.paths.concat(this.paths);
        }
        return _compile.call(this, content, filename);
    }catch(err){
        process.nextTick(function(){
            process.emit('warning',err);
        });
        throw err;
    }finally {
        moduleStack.pop();
    }
};


/* eslint-disable no-console */
global.seajs = {
    config: helper.configFn,
    use: createAsync(module),
    cache: require.cache,
    log: console.log,
    version: require('../package.json').version
};
/* eslint-enable no-console */

global.define = function() {
    var factory = arguments[arguments.length - 1];
    var ret = factory;
    var module = moduleStack[moduleStack.length - 1] || require.main;

    // define(function(require, exports, module) { ... })
    if (typeof factory === 'function') {
        module.uri = module.id;

        var req = function(id) {
            return module.require(id);
        };
        req.async = createAsync(module);

        ret = factory.call(
            global,
            req,
            module.exports,
            module);

        if (ret !== undefined) {
            module.exports = ret;
        }
    }
    // define(object)
    else {
        module.exports = factory;
    }
};

function createAsync(module) {

    return function(ids, callback) {
        if (typeof ids === 'string') ids = [ids];

        var args = [];
        var remain = ids.length;

        ids.forEach(function(id, index) {

            // http or https file
            if (/^https?:\/\//.test(id)) {
                helper.readFile(id, function(data) {
                    var m = {
                        id: id,
                        exports: {}
                    };

                    moduleStack.push(m);
                    vm.runInThisContext(data, id);
                    moduleStack.pop();

                    done(m.exports, index);
                });
            }
            // local file
            else {
                done(module.require(id), index);
            }
        });

        function done(data, index) {
            args[index] = data;
            if (--remain === 0 && callback) {
                callback.apply(null, args);
            }
        }
    };

}


module.exports = global.seajs;

/**
 * Thanks to
 *  - https://github.com/joyent/node/blob/master/lib/module.js
 *  - https://github.com/ajaxorg/node-amd-loader/blob/master/lib/amd-loader.js
 */
