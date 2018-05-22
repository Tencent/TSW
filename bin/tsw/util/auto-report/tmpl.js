
//tmpl file list:
//auto-report/src/download.tmpl.html
//auto-report/src/mail.tmpl.html
//auto-report/src/view.tmpl.html
//auto-report/src/zenburn.tmpl.html
define(function(require, exports, module){
    var tmpl = { 
        'encodeHtml': function(s){return (s+'').replace(/[\x26\x3c\x3e\x27\x22\x60]/g,function($0){return '&#'+$0.charCodeAt(0)+';';});},

        'download_content_types': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;
            __p.push('<?xml version="1.0" encoding="utf-8" ?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n<Default Extension="htm" ContentType="text/html" />\n<Default Extension="xml" ContentType="application/xml" />\n<Default Extension="txt" ContentType="text/plain" />\n</Types>');

            return __p.join('');
        },

        'download_index': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;

            data = data || [];

            var i, len, entry;
            __p.push('<html>\n    <head>\n        <style>\n            body,thead,td,a,p{font-family:verdana,sans-serif;font-size: 10px;}\n        </style>\n    </head>\n    <body>\n        <table cols=13>\n            <thead>\n                <tr>\n                    <th>&nbsp;</th>\n                    <th>#</th>\n                    <th>Result</th>\n                    <th>Protocol</th>\n                    <th>Host</th>\n                    <th>URL</th>\n                    <th>Body</th>\n                    <th>Caching</th>\n                    <th>Content-Type</th>\n                    <th>Process</th>\n                    <th>Comments</th>\n                    <th>Custom</th>\n                    <th>ServerIP</th>\n                </tr>\n            </thead>\n            <tbody>');

            for(i = 0, len = data.length; i < len; i++){
                entry = (data[i] || {}).curr || {};

                __p.push('                            <tr>\n                                <td>\n                                    <a href=\'raw\\');
                _p(i + 1);
                __p.push('_c.txt\'>C</a>&nbsp;<a href=\'raw\\');
                _p(i + 1);
                __p.push('_s.txt\'>S</a>&nbsp;<a href=\'raw\\');
                _p(i + 1);
                __p.push('_m.xml\'>M</a>\n                                </td>\n                                <td>');
                _p(('0000' + (i + 1)).slice(-3));
                __p.push('</td>\n                                <td>');
                _p(entry.resultCode);
                __p.push('</td>\n                                <td>');
                _p(entry.protocol);
                __p.push('</td>\n                                <td>');
                _p(entry.host);
                __p.push('</td>\n                                <td>');
                _p(entry.url);
                __p.push('</td>\n                                <td>');
                _p(entry.contentLength);
                __p.push('</td>\n                                <td>');
                _p(entry.cache);
                __p.push('</td>\n                                <td>');
                _p(entry.contentType);
                __p.push('</td>\n                                <td>');
                _p(entry.process);
                __p.push('</td>\n                                <td></td>\n                                <td></td>\n                                <td>');
                _p(entry.serverIp);
                __p.push('</td>\n                            </tr>');

            }
            __p.push('            </tbody>\n        </table>\n    </body>\n</html>');

            return __p.join('');
        },

        'download_timestamp': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;

            data = data || {};

            var localISOString = function(d){
                if(!(d && d.getTimezoneOffset)){
                    return d;
                }

                var pad = function(n){return n < 10 ? '0' + n : n;}, 
                    tz  = d.getTimezoneOffset(),
                    tzs = (tz > 0 ? '-' : '+') + pad(parseInt(Math.abs(tz / 60)));

                if (tz === 0){
                    tzs = 'Z';
                }else if (tz % 60 != 0){
                    tzs += pad(Math.abs(tz % 60));
                }else{
                    tzs += ':00';
                }

                return d.getFullYear()+'-'
              + pad(d.getMonth()+1)+'-'
              + pad(d.getDate())+'T'
              + pad(d.getHours())+':'
              + pad(d.getMinutes())+':'
              + pad(d.getSeconds())+'.'
              + pad(d.getMilliseconds()) + tzs;
            };

            var timeStamp   = data.timestamps || {},
                defaultTime = new Date();
        
            __p.push('<?xml version="1.0" encoding="utf-8"?>\n<Session>\n  <SessionTimers \n    ClientConnected     ="');
            _p(localISOString(timeStamp.ClientConnected || defaultTime));
            __p.push('" \n    ClientBeginRequest  ="');
            _p(localISOString(timeStamp.ClientBeginRequest || defaultTime));
            __p.push('" \n    GotRequestHeaders   ="');
            _p(localISOString(timeStamp.GotRequestHeaders || defaultTime));
            __p.push('" \n    ClientDoneRequest   ="');
            _p(localISOString(timeStamp.ClientDoneRequest || defaultTime));
            __p.push('" \n    GatewayTime         ="');
            _p(timeStamp.GatewayTime || 0);
            __p.push('" \n    DNSTime             ="');
            _p(timeStamp.DNSTime || 0);
            __p.push('" \n    TCPConnectTime      ="');
            _p(timeStamp.TCPConnectTime || 0);
            __p.push('" \n    HTTPSHandshakeTime  ="');
            _p(timeStamp.HTTPSHandshakeTime || 0);
            __p.push('" \n    ServerConnected     ="');
            _p(localISOString(timeStamp.ServerConnected || defaultTime));
            __p.push('" \n    FiddlerBeginRequest ="');
            _p(localISOString(timeStamp.FiddlerBeginRequest || defaultTime));
            __p.push('" \n    ServerGotRequest    ="');
            _p(localISOString(timeStamp.ServerGotRequest || defaultTime));
            __p.push('" \n    ServerBeginResponse ="');
            _p(localISOString(timeStamp.ServerBeginResponse || defaultTime));
            __p.push('" \n    GotResponseHeaders  ="');
            _p(localISOString(timeStamp.GotResponseHeaders || defaultTime));
            __p.push('" \n    ServerDoneResponse  ="');
            _p(localISOString(timeStamp.ServerDoneResponse || defaultTime));
            __p.push('" \n    ClientBeginResponse ="');
            _p(localISOString(timeStamp.ClientBeginResponse || defaultTime));
            __p.push('" \n    ClientDoneResponse  ="');
            _p(localISOString(timeStamp.ClientDoneResponse || defaultTime));
            __p.push('"/>\n  <PipeInfo />\n  <SessionFlags>\n    <SessionFlag N="x-clientport" V="');
            _p(data.clientPort);
            __p.push('" />\n    <SessionFlag N="x-responsebodytransferlength" V="');
            _p(data.contentLength);
            __p.push('" />\n    <SessionFlag N="x-egressport" V="');
            _p(data.serverPort);
            __p.push('" />\n    <SessionFlag N="x-hostip" V="');
            _p(data.serverIp);
            __p.push('" />\n    <SessionFlag N="x-processinfo" V="');
            _p(data.process);
            __p.push('" />\n    <SessionFlag N="x-clientip" V="');
            _p(data.clientIp);
            __p.push('" />\n    <SessionFlag N="ui-comments" V="');
            _p(data.sid);
            __p.push('" />\n  </SessionFlags>\n</Session>');

            return __p.join('');
        },

        'errorSummary': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;
            __p.push('<html>\n<head>\n    <meta charset="utf-8" />\n    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n    <meta name="robots" content="none" />\n    <meta name="format-detection" content="telephone=no" />\n    <meta name="HandheldFriendly" content="True" />\n    <meta name="MobileOptimized" content="320" />\n    <meta name="viewport" content="width=320,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n    <meta name="viewport" content="width=319.9,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" media="(device-height: 568px)" />\n    <meta name="x5-fast-scroller" content="disable" />\n\n    <style>\n        p{\n            line-height: 1.5;\n        }\n        code{\n            font-size: 12px;\n        }\n\n        table {\n            border-collapse: collapse;\n            text-align: center;\n            position: relative;\n            white-space: nowrap;\n            background: #FFFFFF;\n            border: 1px solid #BFBFBF;\n            /*table-layout:fixed;*/\n        }\n        thead {\n            white-space: nowrap;\n            background: #EEEFF2;\n\n            border-bottom: 1px solid #BFBFBF;\n            border-top: 1px solid #BFBFBF;\n            border-collapse: separate;\n        }\n        table thead th,\n        table tbody td,\n        table tfoot td{\n            padding-left: 10px;\n            padding-right: 10px;\n            white-space: nowrap;\n            border-collapse: collapse;\n            border: 1px solid #BFBFBF;\n        }\n\n        table thead tr th{\n            border-right: 1px solid #BFBFBF;\n            border-left: 1px solid #BFBFBF;\n            background: #EAEAEA;\n\n        }\n\n        table thead th{\n            height: 30px;\n            background: #EAEAEA;\n        }\n        table tbody td,\n        table tfoot td{\n            height: 25px;\n        }\n\n        table tbody tr,\n        table tfoot tr{\n            border-bottom: 1px solid #BFBFBF;\n        }\n\n        .dimension {\n            text-align: left;\n            white-space: nowrap;\n        }\n        .indicator{\n            text-align: right;\n            white-space: nowrap;\n        }\n        .alt {\n            background:#EFEFEF ;\n        }\n\n    </style>\n\n</head>\n<body>');
            if(data.total_arr.length){__p.push('<table>\n    <thead>\n    <tr>\n        <th>项目名称</th>\n        <th>mod_act</th>\n        <th>报错次数</th>\n        <th>负责人</th>\n    </tr>\n    </thead>\n    <tbody>');
                for(var i = 0,item; i < data.total_arr.length; i++){__p.push('    item = data.total_arr[i++];\n    <tr class="');
                    _p((i % 2 == 0 ? 'alt' : ''));
                    __p.push('">\n        <td class="dimension">');
                    _p(item.config.title);
                    __p.push('</td>\n        <td class="dimension">');
                    _p(item.mod_act);
                    __p.push('</td>\n        <td class="indicator">');
                    _p(item.errorNum);
                    __p.push('</td>\n        <td class="indicator">');
                    _p(item.config.charge);
                    __p.push('</td>\n    </tr>');
                }__p.push('    </tbody>\n</table>');
            }else{__p.push('    <p>没有报错项目~</p>');
            }__p.push('</body>\n</html>');

            return __p.join('');
        },

        'error': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;
            __p.push('<html>\n<head>\n    <meta charset="utf-8" />\n    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n    <meta name="robots" content="none" />\n    <meta name="format-detection" content="telephone=no" />\n    <meta name="HandheldFriendly" content="True" />\n    <meta name="MobileOptimized" content="320" />\n    <meta name="viewport" content="width=320,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n    <meta name="viewport" content="width=319.9,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" media="(device-height: 568px)" />\n    <meta name="x5-fast-scroller" content="disable" />\n\n    <style>\n        p{\n            line-height: 1.5;\n        }\n        code{\n            font-size: 12px;\n        }\n    </style>\n\n</head>\n<body>\n<p><strong>');
            _p(data.mod_act);
            __p.push(' </strong> ');
            _p((data.config.title ? '('+data.config.title+')' : ''));
            __p.push(':1分钟脚本报错超过频率限制（');
            _p(data.minMaxNum);
            __p.push('）</p>\n</body>\n</html>');

            return __p.join('');
        },

        'log_view': function(data){

            var __p=[],_p=function(s){__p.push(s);},out=_p;

            var logArr  = data.logArr || [];
            var groupArr= data.groupArr || [];
            var window  = context.window || {};
            var hls     = require('./highlight-tsw.js');
            var getResultCodeStyle = function (code) {
                code = parseInt(code,10);
                var style = '';
                if(code > 0){
                    code = Math.floor(code / 100);
                    switch (code) {
                    case 2 :
                    case 6 :
                        style = 'color:green;';
                        break;
                    case 3 :
                        style = 'color:#bf00ff;';
                        break;
                    case 4 :
                        style = 'color:orange;';
                        break;
                    case 5 :
                        style = 'color:red;';
                        break;
                    }
                }
                return style+'font-weight:;font-size:18px';
            };

            var appid   = context.appid;
            var group   = context.group;
            var key     = context.key;
            var createLogKey = context.createLogKey;
            var currPath = '/log/view/' + createLogKey(appid,group,key);

            //去重
            var tmp = [{name: '全部',href: '/log/view/' + createLogKey(appid,'',key)}];
            var groupMap= {};
            var nameMap = data.nameMap;

            for(var i in nameMap){
                tmp.push({
                    name : nameMap[i],
                    href : '/log/view/' + createLogKey(appid,i,key)
                });
            }

            groupArr.sort().forEach(function(v){
                if(!v){
                    return;
                }
                if(groupMap[v]){
                    return;
                }
                //默认展示的就去掉
                if(data.nameMap[v])
                    return;

                groupMap[v] = 1;
                var href = '/log/view/' + createLogKey(appid,v,key);
                tmp.push({name: v, href: href});
            });
            groupArr = tmp;

            var XSS = plug('util/xss.js');
            __p.push('<html>\n<head>\n    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n    <title>TSW云抓包&#8482;</title>\n    <link rel="Shortcut Icon" href="/favicon.ico" type="image/x-icon" />\n    <link href="/static/tsw/styles/logview/style.css" rel="stylesheet">\n</head>\n<body>\n    <div class="view-title">\n        <a class="button" href="');
            _p(window && window.request && window.request.REQUEST && window.request.REQUEST.pathname && window.request.REQUEST.pathname.replace('/log/view/','/log/download/'));
            __p.push('" target="_blank">下载全部抓包</a>\n        <a class="button r" href="https://www.telerik.com/fiddler" target="_blank">Fiddler下载</a>\n        <a class="button r" href="https://github.com/avwo/whistle" target="_blank">Whistle下载(mac推荐)</a>\n        <label class="button label" style="cursor:pointer;" id="showErrorLogItem"><input type="checkbox" id="showErrorLogItemChk" value="showErrorLogItem">仅显示有错误的</label>\n        <label class="button label" style="cursor:pointer;" id="showRequestListItem"><input type="checkbox" id="showRequestListChk" value="showRequestList">快速显示请求列表</label>');
            if(appid){__p.push('            <a class="button" href="/app/status" target="_blank">实时监控</a>\n            <a class="button" href="/h5test/page" target="_blank">测试环境</a>');
            }else{__p.push('            <a class="button" href="/h5test/page/alpha" target="_blank">临时染色</a>');
            }__p.push('        <label class="button" target="_blank" title="item/user/userLimit">');
            _p(data.logCount);
            __p.push('/');
            _p(data.logKeyCount);
            __p.push('/');
            _p(data.logNumMax);
            __p.push('</label>\n    </div>');
            if(groupArr.length){__p.push('    <div class="view-title">');
                groupArr.forEach(function(v,i){__p.push('        <a class="button ');
                    _p(currPath === v.href ? 'curr-group' : '');
                    __p.push('" href="');
                    _p(v.href);
                    __p.push('">');
                    _p(XSS.htmlEncode(v.name));
                    __p.push('</a>');
                });__p.push('    </div>');
            }if(logArr.length === 0){__p.push('    <div class="view-title">\n        <p style="height: 50px;line-height: 50px;">还没有实时log</p>\n    </div>');
            }

            logArr.forEach(function(logText,i){
                logText = logText || '';
                var logLineArr = logText.split('\n');
                var reqUrl = logLineArr && logLineArr[0];
                var reqType = '',
                    resultCode = logArr.extInfos[i].resultCode;

                var hasError = false;
                for(var j = 0; j < logLineArr.length; j++){
                    var logTextLine = logLineArr[j];
                    if (!logTextLine) {
                        continue;
                    }

                    //匹配ajax失败的fail log
                    var retCodeReg = new RegExp('isFail:(.*)');
                    if (retCodeReg.exec(logTextLine)) {
                        var retCode = parseInt(RegExp.$1);
                        if (retCode) {
                            hasError = true;
                            break;
                        }
                    }

                    //匹配ERRO log
                    if(!hasError && logTextLine.indexOf(' [ERRO] ') > 0){
                        hasError = true;
                        break;
                    }
                }

                if(i < 2){
                    logText = hls.highlight('tswlog',(logText),true).value;
                }else{
                    logText = XSS.htmlEncode(logText);
                }

                __p.push('        <div class="view-logText error');
                _p(hasError?1:0);
                __p.push('" type="');
                _p(reqType);
                __p.push('" error="');
                _p(hasError?1:0);
                __p.push('">\n            <div class="view-logText-title">\n                <span>&nbsp;statusCode: <span style="');
                _p(getResultCodeStyle(resultCode));
                __p.push('">');
                _p(resultCode);
                __p.push('</span></span>\n\n                <a class="btn" href="');
                _p(window.request.REQUEST.pathname.replace('/log/view/','/log/download/'));
                __p.push('?index=');
                _p(parseInt(logArr.keys[i]));
                __p.push('&SNKey=');
                _p(logArr.SNKeys[i]);
                __p.push('&fileFormat=saz"\n                   target="_blank" title="99%的人都点了这个按钮！">点击下载 云抓包&#8482;.saz</a>\n\n                <a class="btn" href="');
                _p(window.request.REQUEST.pathname.replace('/log/view/','/log/download/'));
                __p.push('?index=');
                _p(parseInt(logArr.keys[i]));
                __p.push('&SNKey=');
                _p(logArr.SNKeys[i]);
                __p.push('&fileFormat=har"\n                   target="_blank" title="99%的人都点了这个按钮！">点击下载 云抓包&#8482;.har</a>\n\n                <span style="display:none">&nbsp;<span class="log_pass_time"></span>前</span>\n                <p style="display: none;" class="firstReq">\n                    <label class="button label expand" style="cursor:pointer;" data-j="expand');
                _p(i);
                __p.push('"><input type="checkbox" class="expandChk">展开</label>');
                _p(XSS.htmlEncode(reqUrl.replace(/\[.*?\]/g, '').replace(/\s+/, ' ')));
                __p.push('                </p>\n            </div>\n            <pre class="view-logText-log expand');
                _p(i);
                __p.push('_code"><code class="tswlog hljs">');
                _p((logText));
                __p.push('</code></pre>\n        </div>');

            });
            __p.push('    <scr');
            __p.push('ipt src="/static/tsw/zepto/zepto.min.js"></scr');
            __p.push('ipt>\n    <scr');
            __p.push('ipt src="/static/tsw/highlightjs/highlight-tsw.js"></scr');
            __p.push('ipt>\n    <scr');
            __p.push('ipt>\n\n        $(\'pre code\').each(function(i, block) {\n            if(i >= 2){\n                setTimeout(function(){\n                    hljs.highlightBlock(block)\n                },0)\n            }\n        });\n\n        var showErrorLogItem = JSON.parse( window.localStorage.getItem(\'showErrorLogItem\') || false ),\n            showRequestListItem = JSON.parse( window.localStorage.getItem(\'showRequestListItem\') || false );\n        \n        $("#showErrorLogItemChk").prop(\'checked\', showErrorLogItem);\n        $("#showRequestListChk").prop(\'checked\', showRequestListItem);\n\n        if(showErrorLogItem){\n            $(".view-logText.error0:visible").hide();\n        }\n\n        if(showRequestListItem){\n            $(".firstReq").show();\n            $(".view-logText-log").hide();\n        }\n        $("#showErrorLogItemChk").click(function () {\n            if ($("#showErrorLogItemChk").prop(\'checked\')) {\n                showErrorLogItem = true;\n                $(".view-logText.error0:visible").hide();\n                window.localStorage.setItem(\'showErrorLogItem\', true);\n            } else {\n                showErrorLogItem = false;\n                $(".view-logText.error0").show();\n                window.localStorage.setItem(\'showErrorLogItem\', false);\n            }\n        });\n        $("#showRequestListChk").click(function () {\n            if ($("#showRequestListChk").prop(\'checked\')) {\n                showRequestListItem = true;\n                $(".firstReq").show();\n                $(".view-logText-log").hide();\n                window.localStorage.setItem(\'showRequestListItem\', true);\n            } else {\n                showRequestListItem = false;\n                $(".firstReq").hide();\n                $(".view-logText-log").show();\n                window.localStorage.setItem(\'showRequestListItem\', false);\n            }\n        });\n        $(".expand").click(function () {\n            var expandChkDom = $(this).find(\'.expandChk\');\n            var codeClass = $(this).data(\'j\') + \'_code\';\n            if (expandChkDom.prop(\'checked\')) {\n                $(\'.\' + codeClass).show();\n            } else {\n                $(\'.\' + codeClass).hide();\n            }\n        });\n        var refreshTime = Date.now();\n        function getPassTimeStr(preTime ,curTime) {\n            var passTime = Math.round( (curTime - preTime) / 1000 );\n            var sec = passTime % 60;\n            passTime = (passTime - sec) / 60;\n            var min = passTime % 60;\n            passTime = (passTime - min) / 60;\n            var hour = passTime;\n            var passTimeStr = \'\';\n            if(hour) passTimeStr = passTimeStr + hour + \'小时\';\n            if(min) passTimeStr = passTimeStr + min + \'分钟\';\n            if(sec) passTimeStr = passTimeStr + sec + \'秒\';\n            return passTimeStr;\n        }\n\n        function updateTime() {\n            var curTime = Date.now();\n            $(\'.view-logText\').each(function (index) {\n                var logItem = $(this);\n                var timeStr = $(logItem.find(\'code.tswlog span.hljs-subst\')[0]).html();\n                logItem.find(\'.log_pass_time\').html(getPassTimeStr( (new Date(timeStr)).getTime(), curTime )).parent().show();\n            });\n        }\n\n        setInterval(updateTime, 1000);\n        updateTime();\n    </scr');
            __p.push('ipt>\n</body>\n</html>');

            return __p.join('');
        }
    };
    return tmpl;
});
