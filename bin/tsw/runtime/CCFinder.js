/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const config = require('config');
const logger = require('logger');
const lang = require('i18n/lang.js');
const httpUtil = require('util/http');
const serverInfo = require('serverInfo.js');
const isTST = require('util/isTST.js');
const mail = require('util/mail/mail.js');
const tnm2 = require('api/tnm2');
const CCIPSize = 1000;                        // 统计周期
const CCIPLimit = config.CCIPLimit;            // 限制
let ipConut = CCIPSize;
let cache = {
    ipCache: {},
    whiteList: {},
    blackList: {},
    ipCacheLast: {}
};

if (global[__filename]) {
    cache = global[__filename];
} else {
    global[__filename] = cache;
}

this.addWhiteList = function (userIp) {
    cache.whiteList[userIp] = true;
};

this.addBlackList = function (userIp) {
    cache.blackList[userIp] = true;
};


this.checkHost = function (req, res) {

    const hostAllow = config.allowHost || [];
    const host = req.headers['host'];
    let i,
        len,
        v;

    if (hostAllow.length === 0) {
        return true;
    }

    if (host === serverInfo.intranetIp) {
        return true;
    }

    for (i = 0, len = hostAllow.length; i < len; i++) {
        v = hostAllow[i];

        if (typeof v === 'string') {
            if (v === host) {
                return true;
            }
        } else if (typeof v === 'object') {
            if (v.test && v.test(host)) {
                return true;
            }
        }
    }

    logger.debug('limit by config.allowHost');

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.writeHead(508);
    res.end();

    return false;
};

// 计算标准方差
this.StdX10 = function(ipCache) {

    let res = 0;
    let sum = 0;
    let avg = 0;
    const arr = Object.keys(ipCache).filter(function (item) {
        const tmp = ipCache[item];
        if (tmp && typeof tmp === 'object' && tmp.list) {
            sum += tmp.list.length;
            return true;
        }
        return false;
    });

    if (arr.length <= 1) {
        return 0;
    }

    avg = sum / arr.length;

    const sumXsum = arr.reduce(function (pre, key) {
        const item = ipCache[key];
        const value = item.list.length;
        item.avg = avg;

        return pre + (value - avg) * (value - avg);
    }, 0);

    res = parseInt(Math.sqrt(sumXsum / (arr.length - 1)) * 10, 10);

    return res;
};

this.check = function (req, res) {

    const userIp = httpUtil.getUserIp(req);
    const userIp24 = httpUtil.getUserIp24(req);
    const info = {
        userIp: userIp,
        hostname: req.headers.host,
        pathname: req.REQUEST.pathname
    };

    if (cache.blackList[userIp]) {
        tnm2.Attr_API('SUM_TSW_CC_LIMIT', 1);
        logger.report();
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end();
        return false;
    }

    if (cache.whiteList[userIp]) {
        return true;
    }

    if (cache.whiteList[userIp24]) {
        return true;
    }

    // 忽略TST请求
    if (isTST.isTST(req)) {
        return true;
    }

    ipConut = ipConut - 1;

    if (ipConut <= 0) {
        ipConut = CCIPSize;
        cache.ipCache.end = Date.now();
        cache.ipCache.StdX10 = this.StdX10(cache.ipCache);
        cache.ipCacheLast = cache.ipCache;
        cache.ipCache = {};
        cache.whiteList = {};

        // 上报标准方差
        tnm2.Attr_API_Set('AVG_TSW_IP_STD_X10', cache.ipCacheLast.StdX10);
    }

    if (!cache.ipCache.start) {
        cache.ipCache.start = Date.now();
    }

    if (Date.now() - cache.ipCache.start > 60000) {
        // 时间太长
        ipConut = 0;
        return true;
    }

    if (!cache.ipCache[userIp]) {
        cache.ipCache[userIp] = {
            isSendMail: false,
            list: []
        };
    }

    const curr = cache.ipCache[userIp];

    curr.list.push(info);

    if (CCIPLimit <= -1) {
        return true;
    }

    if (config.isTest) {
        // 测试环境
        return true;
    }

    if (config.devMode) {
        // 开发环境
        return true;
    }

    if (!cache.ipCacheLast.StdX10) {
        return true;
    }

    if (cache.ipCacheLast.StdX10 <= CCIPLimit) {
        return true;
    }

    if (cache.ipCacheLast.hasSendMail) {
        return true;
    }

    // 确认没发送过邮件
    cache.ipCacheLast.hasSendMail = true;

    // 发现目标，发邮件
    const content = formatIP(cache.ipCacheLast);
    const maxArr = findAllMaxIP(cache.ipCacheLast);
    const blackIPList = [];
    let blackIPListText = '';


    maxArr.forEach((max, i) => {
        blackIPListText += `<pre>[${max.StdX10}%]${max.ip} [${i + 1}/${max.count}]</pre>`;
        blackIPList.push(max.ip);
    });

    const key = `v6.AVG_TSW_IP_STD_X10.${serverInfo.intranetIp}`;
    let title = '';

    if (config.CCIPLimitAutoBlock) {
        title = `[${lang.__('mail.IPAggregationNotice')}][${cache.ipCacheLast.StdX10}%]${serverInfo.intranetIp}`;
        blackIPList.forEach((ip) => {
            logger.info(`addBlackList: ${ip}`);
            this.addBlackList(ip);
        });
    } else {
        title = `[${lang.__('mail.IPAggregationWarning')}][${cache.ipCacheLast.StdX10}%]${serverInfo.intranetIp}`;
    }

    mail.SendMail(key, 'TSW', 3600, {
        'to': config.mailTo,
        'cc': config.mailCC,
        'title': title,
        'content': `<p><strong>${lang.__('mail.viewDocsForIPAggregation')}： </strong> https://tswjs.org/doc/api/ipCCFinder </p>`
        + `<p><strong>${lang.__('mail.serverIP')}：</strong>${serverInfo.intranetIp}</p>`
        + `<p><strong>${lang.__('mail.maliciousIP')}：</strong></p>`
        + blackIPListText
        + `<p><strong>${lang.__('mail.autoIntoBlackList')}：</strong>` + (config.CCIPLimitAutoBlock ? `${'mail.yes'}` : `${'mail.no'}`) + '</p>'
        + `<p><strong>${lang.__('mail.IPAggregationDegree')}：</strong>${cache.ipCacheLast.StdX10}%</p>`
        + `<p><strong>${lang.__('mail.warningThreshold')}：</strong>${CCIPLimit}</p>`
        + `<p><strong>${lang.__('mail.normalValue')}：</strong>5-50</p>`
        + `<p><strong>${lang.__('mail.testingTimeConsuming')}：</strong>${parseInt((cache.ipCacheLast.end - cache.ipCacheLast.start) / 1000, 10)}s</p>`
        + `<p><strong>${lang.__('mail.evidenceList')}：</strong></p>`
        + content
    });


    return true;
};


this.getIpCache = function () {
    return cache.ipCacheLast;
};


this.getIpSize = function () {
    return CCIPSize;
};


const findAllMaxIP = function(ipCache, last) {
    const result = last || [];
    const max = findMaxIPOnce(ipCache);
    const ipCacheNext = Object.assign({}, ipCache);

    ipCacheNext[max.ip] = null;
    max.StdX10 = module.exports.StdX10(ipCacheNext);
    result.push(max);

    if (result.length >= max.count * 3 - 1) {
        return result;
    }

    if (max.StdX10 < CCIPLimit) {
        return result;
    }

    return findAllMaxIP(ipCacheNext, result);
};

const findMaxIPOnce = function(ipCache) {
    const max = {
        num: 0,
        count: 0,
        ip: ''
    };

    Object.keys(ipCache).forEach(function (ip, i) {
        if (ipCache[ip] && ipCache[ip].list && ipCache[ip].list.length > 1) {
            const num = ipCache[ip].list.length;
            max.count += 1;
            if (num > max.num) {
                max.num = num;
                max.ip = ip;
            }
        }
    });

    return max;
};


const formatIP = function(ipCache) {
    let content = '';
    const arr = [];

    Object.keys(ipCache).forEach(function (ip, i) {
        if (ipCache[ip] && ipCache[ip].list && ipCache[ip].list.length > 1) {
            const num = ipCache[ip].list.length;
            arr.push({
                num: num,
                ip: ip
            });
        }
    });

    arr.sort(function(a, b) {
        return b.num - a.num;
    });

    arr.forEach(function(info) {
        const tmp = (info.num + '--------').slice(0, 8);
        if (tmp.isMax) {
            content += `<pre>${tmp}${info.ip}</pre>`;
        } else {
            content += `<pre>${tmp}${info.ip}</pre>`;
        }
    });

    return content;
};
