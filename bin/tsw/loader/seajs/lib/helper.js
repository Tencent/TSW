/**
 * Helpers for sea-node.js
 * @author lifesinger@gmail.com
 */

let aliasCache = {};
let url = require('url');


exports.parseAlias = function (id) {
    // #xxx means xxx is already alias-parsed.
    if (id.charAt(0) === '#') {
        return id.substring(1);
    }

    let alias = aliasCache;

    // Only top-level id needs to parse alias.
    if (alias && isTopLevel(id)) {
        let parts = id.split('/');
        let first = parts[0];

        if (alias.hasOwnProperty(first)) {
            parts[0] = alias[first];
            id = parts.join('/');
        }
    }

    return id;
};


exports.configFn = function(o) {
    if (o && o.alias) {
        let alias = o.alias;

        for (let p in alias) {
            if (alias.hasOwnProperty(p)) {
                aliasCache[p] = alias[p];
            }
        }

    }
};


// Reads content from http(s)/local filesystem
exports.readFile = function(uri, callback) {
    let options = url.parse(uri);
    let connect = require(options.protocol.slice(0, -1));

    connect.get(options, function(res) {
        if (res.statusCode !== 200) {
            throw 'Error: No data received from ' + uri;
        }

        let ret = [], length = 0;

        res.on('data', function(chunk) {
            length += chunk.length;
            ret.push(chunk);
        });

        callback && res.on('end', function() {
            let buf = Buffer.alloc(length), index = 0;

            ret.forEach(function(chunk) {
                chunk.copy(buf, index, 0, chunk.length);
                index += chunk.length;
            });

            let data = buf.toString();
            callback(data);
        });

    });
};


// Helpers
// -------

function isTopLevel(id) {
    let c = id.charAt(0);
    return id.indexOf('://') === -1 && c !== '.' && c !== '/';
}
