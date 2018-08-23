module.exports = function(req, res) {

    const url = require('url');
    const config = require('./config');

    const origin = req.headers['origin'];
    const allowOriginHost = config.allowOriginHost;

    let obj,
        i,
        originDomain,
        allowOrigin;
    if (origin && allowOriginHost) {
        allowOrigin = false;
        try {
            obj = {};
            obj = url.parse(origin, true);
        } catch (e) {}

        if (obj.hostname) {
            originDomain = obj.hostname;

            for (i = 0; i < allowOriginHost.length; i++) {
                if (allowOriginHost[i].host === undefined || allowOriginHost[i].host && hostMatch(req.headers.host, allowOriginHost[i].host)) {
                    if (allowOriginHost[i].origin === undefined || hostMatch(originDomain, allowOriginHost[i].origin)) {
                        // 允许跨域
                        allowOrigin = true;
                        break;
                    }
                }
            }
        }

        if (!res) {
            return allowOrigin;
        }

        if (allowOrigin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', true);

            if (req.method === 'OPTIONS') {
                res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
                if (req.headers['access-control-request-headers']) {
                    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                res.end();

            }
        } else {
            res.writeHead(403, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end();
        }

    }

    return allowOrigin;
};


function hostMatch(source, expList) {
    if (!source || !expList) {
        return false;
    }

    if (typeof expList === 'string') {
        expList = [expList];
    }

    for (let i = 0; i < expList.length; i++) {
        if (shExpMatch(source, expList[i])) {
            return true;
        }
    }

    return false;
}

function shExpMatch(source, exp) {
    if (!source || !exp) {
        return false;
    }

    if (typeof exp === 'string') {
        if (exp.startsWith('*.')) {
            // *.xxxx 开头的
            return '*.' + source.split('.').slice(1).join('.') === exp;
        } else if (exp.startsWith('.')) {
            // .xxx开头的,右对齐匹配就ok
            return source.endsWith(exp);
        } else if (exp === '*') {
            return true;
        } else {
            // 字符串全等
            return source === exp;
        }
    } else if (typeof exp === 'object' && exp.test) {
        // 正则表达式
        return exp.test(source);
    }

    return false;
}
