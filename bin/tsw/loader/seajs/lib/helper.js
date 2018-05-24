/**
 * Helpers for sea-node.js
 * @author lifesinger@gmail.com
 */

const aliasCache = {};
const url = require('url');


exports.parseAlias = function (id) {
    // #xxx means xxx is already alias-parsed.
    if (id.charAt(0) === '#') {
        return id.substring(1);
    }

    const alias = aliasCache;

    // Only top-level id needs to parse alias.
    if (alias && isTopLevel(id)) {
        const parts = id.split('/');
        const first = parts[0];

        if (alias.hasOwnProperty(first)) {
            parts[0] = alias[first];
            id = parts.join('/');
        }
    }

    return id;
};


exports.configFn = function(o) {
    if (o && o.alias) {
        const alias = o.alias;

        for (const p in alias) {
            if (alias.hasOwnProperty(p)) {
                aliasCache[p] = alias[p];
            }
        }

    }
};


// Reads content from http(s)/local filesystem
exports.readFile = function(uri, callback) {
    const options = url.parse(uri);
    const connect = require(options.protocol.slice(0, -1));

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

            const data = buf.toString();
            callback(data);
        });

    });
};


// Helpers
// -------

function isTopLevel(id) {
    const c = id.charAt(0);
    return id.indexOf('://') === -1 && c !== '.' && c !== '/';
}
