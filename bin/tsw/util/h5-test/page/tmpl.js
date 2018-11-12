
// tmpl file list:
// page/src/main.tmpl.html
// page/src/new.tmpl.html
// page/src/new_body.tmpl.html
define(function(require, exports, module) {
    var tmpl = {
        'encodeHtml': function(s) {
            return (String(s)).replace(/[\x26\x3c\x3e\x27\x22\x60]/g, function($0) {
                return '&#' + $0.charCodeAt(0) + ';';
            });
        },

        'new_main': function(data) {

            var __p = [],
                _p = function(s) {
                    __p.push(s);
                },
                out = _p;

            data = data || {};

            var body = data.body || '',
                head = data.head || {};
            __p.push('<!DOCTYPE html>\n<html>\n    <head>\n        <meta charset="UTF-8">\n        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n        <meta http-equiv="X-UA-Compatible" content="IE=edge" />\n        <title>');
            _p(tmpl.encodeHtml(head.title || ''));
            __p.push('</title>\n        <meta name="description" itemprop="description" content="');
            _p(tmpl.encodeHtml(head.description || ''));
            __p.push('" />\n        <meta itemprop="name" content="');
            _p(tmpl.encodeHtml(head.share_name || ''));
            __p.push('">');
            if (head.share_image) {
                __p.push('        <meta itemprop="image" content="');
                _p(tmpl.encodeHtml(head.share_image));
                __p.push('">');
            }__p.push('        <meta name="robots" content="none" />\n        <meta name="format-detection" content="telephone=no" />\n        <meta name="HandheldFriendly" content="True" />\n        <meta name="MobileOptimized" content="320" />\n        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n        <meta name="x5-fast-scroller" content="disable" />\n        <meta name="apple-mobile-web-app-status-bar-style" content="black" />\n        <link rel="stylesheet" type="text/css" href="/static/tsw/styles/semantic-ui/dist/semantic.min.css">\n        <link rel="stylesheet" type="text/css" href="/static/tsw/styles/semantic-ui/stylesheets/docs.css">\n    </head>\n<body id="example">');
            if (body === undefined || body === null || body == '') {
                __p.push('<p style="height: 200px; line-height: 200px;text-align: center;font-size: 14px;color: #666">加载中，请稍候...</p>');
            } else {
                _p(body);
            }__p.push('</body>\n</html>');

            return __p.join('');
        },

        'new_header': function(data) {

            var __p = [],
                _p = function(s) {
                    __p.push(s);
                },
                out = _p;
            __p.push('<style type="text/css">\nhtml{\n    overflow-x: hidden;\n    overflow-y: scroll;\n}\n#header.header{\n    height: 50px;\n    margin: 0 auto;\n    overflow: hidden;\n    background-color: rgba(0,0,0,0.8);\n    *background-color: #000;\n    border-top: 2px solid #F00;\n    z-index: 88;\n    width: 100%;\n    font-size: 16px;\n    box-sizing: border-box;\n}\n\n#header .nav{\n    width: 1100px;\n    margin: 0 auto;\n    padding: 0;\n}\n\n#header .nav li{\n    list-style: none;\n    float: right;\n    display: block;\n    height: 50px;\n    line-height: 50px;\n    overflow: hidden;\n    cursor: pointer;\n}\n\n#header .nav li:hover{\n    background-color: rgba(255,0,0,0.9);\n    color: #fff;\n}\n\n#header .nav li a{\n    display: block;\n    padding: 0 20px;\n    text-decoration: none;\n    color: #FFF;\n    font-family: "Microsoft YaHei";\n}\n\n#header .nav li a:hover,\n#header .nav li a:active{\n    text-decoration: none;\n}\n.tooltips {\n    color: red;\n    text-align: center;\n    background-color: rgba(215, 215, 215, 0.8);\n    border-bottom: 2px solid #fff;\n    position: fixed;\n    top: 50px;\n    z-index: 999;\n    width: 100%;\n}\n\n.top-tip{\n    width: 100%;\n    height: 100px;\n    position: fixed;\n    background-color: rgba(33, 186, 69, 0.75);\n    z-index: 999;\n    top: 0;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    color: #fff;\n    font-size: 30px;\n}\n</style>\n<div id="header" class="header">\n    <ul class="nav">');

            var navMenus = data,
                i;
            if (navMenus && navMenus.length > 0) {
                for (i = 0; i < navMenus.length; i++) {
                    if (navMenus[i].href && navMenus[i].title) {
                        __p.push('                    <li><a href="');
                        _p(tmpl.encodeHtml(navMenus[i].href));
                        __p.push('">');
                        _p(tmpl.encodeHtml(navMenus[i].title));
                        __p.push('</a></li>');
                    }
                }
            }
            __p.push('    </ul>\n</div>');
            if (context.noticeMessage) {
                __p.push('<div class="tooltips">');
                _p(context.noticeMessage);
                __p.push('</div>');
            } __p.push('');

            return __p.join('');
        },

        'new_body_sync': function(data) {

            var __p = [],
                _p = function(s) {
                    __p.push(s);
                },
                out = _p;
            __p.push('    ');
            _p(tmpl.new_body(data));
            __p.push('    <scr');
            __p.push('ipt src="/static/tsw/zepto/zepto.min.js"></scr');
            __p.push('ipt>\n    <scr');
            __p.push('ipt type="text/javascript">\n        window.getUrlParam = function(name, loc) {\n            loc = loc || window.location;\n            var r = new RegExp(\'(\\\\?|#|&)\' + name + \'=(.*?)(&|#|$)\');\n            var m = (loc.href || \'\').match(r);\n            return decodeURIComponent(m ? m[2] : \'\');\n        };\n        window.getCookie = function(key){\n            var cookies = document.cookie ? document.cookie.split(\'; \') : [], tmp;\n            for(var i=0;i<cookies.length;i++){\n                tmp = cookies[i].split(\'=\');\n                if(tmp[0] == key){\n                    return tmp[1];\n                }\n            }\n            return \'\';\n        };\n        window.api = (function(){\n            var commomData = {\n                appid: \'');
            _p(data.appid);
            __p.push('\',\n                uid: getCookie(\'uid\'),\n                token: getCookie(\'token\')\n            };\n            var _api = {};\n            /*\n            * 添加白名单\n            * */\n            _api.addTestUser = function(params){\n                var defer =$.Deferred();\n                $.ajax({\n                    url: \'/api/h5test/add\',\n                    data:$.extend({},commomData,{\n                        uin: params.uin,\n                        val: params.val\n                    }),\n                    success: function(data){\n                        if(data && data.code === 0 ) {\n                            defer.resolve(data);\n                        }else {\n                            var message = (data && data.msg && data.msg != "") ? data.msg : "系统繁忙，请稍后再试";\n                            defer.reject( message);\n                        }\n                    },\n                    fail: function(err){\n                        var message = "系统繁忙，请稍后再试";\n                        if(err && err.msg) {\n                            message = err.msg;\n                        }\n                        defer.reject( message);\n                    }\n                });\n\n                return defer;\n            };\n            _api.addTestUsers = function(params){\n                var defer =$.Deferred();\n                $.ajax({\n                    url: \'/api/h5test/add\',\n                    type: \'POST\',\n                    contentType : "application/json",\n                    dataType : "json",\n                    data: JSON.stringify($.extend({},commomData,{\n                        uinval: params\n                    })),\n                    success: function(data){\n                        if(data && data.code === 0 ) {\n                            defer.resolve(data);\n                        }else {\n                            defer.reject( data && data.msg || "系统繁忙，请稍后再试");\n                        }\n                    },\n                    fail: function(err){\n                        defer.reject( err && err.msg || "系统繁忙，请稍后再试");\n                    }\n                });\n\n                return defer;\n            };\n\n            /*\n             * 删除白名单\n             */\n            _api.delTestUser = function(params){\n                var defer =$.Deferred();\n                $.ajax({\n                    url: \'/api/h5test/del\',\n                        data:$.extend({},commomData,{\n                            uin: params.uin\n                        }),\n                        success: function(data){\n                            if(data && data.code === 0 ) {\n                                defer.resolve(data);\n                            }else {\n                                var message = (data && data.msg && data.msg != "") ? data.msg : "系统繁忙，请稍后再试";\n                                defer.reject( message);\n                            }\n                        },\n                        fail: function(err){\n                            var message = "系统繁忙，请稍后再试";\n                            if(err && err.msg) {\n                                message = err.msg;\n                            }\n                            defer.reject( message);\n                        }\n                    });\n\n                    return defer;\n                };\n                _api.getTestUser = function(params){\n                    var defer =$.Deferred();\n\n                    $.ajax({\n                        url: \'/api/h5test/get\',\n                        data:$.extend({},commomData),\n                        success: function(data){\n                            if(data && data.code === 0 ) {\n                                defer.resolve(data);\n                            }else {\n                                var message = (data && data.msg && data.msg != "") ? data.msg : "系统繁忙，请稍后再试";\n                                defer.reject( message);\n                            }\n                        },\n                        fail: function(err){\n                            var message = "系统繁忙，请稍后再试";\n                            if(err && err.msg) {\n                                message = err.msg;\n                            }\n                            defer.reject( message);\n                        }\n                    });\n\n                    return defer;\n                };\n                return _api;\n        })()\n    </scr');
            __p.push('ipt>\n    <scr');
            __p.push('ipt type="text/javascript">\n    (function() {\n        var handlerNums = function(val){\n            var arr = [];\n            val.replace(/(\\b[0-9a-zA-Z_\\-]{1,64}\\b)/g, function(uin){arr.push(uin); return uin;});\n            return arr;\n        };\n        $(\'#join-submit2\').click(function(e){\n            var val = $(\'#join-textarea\').val();\n            var arr = handlerNums(val);\n            var param = {};\n            var selectVal = $(\'.selected\')[0].value;\n            for(var i = 0; i < arr.length; i++) {\n                param[arr[i]] = selectVal;\n            }\n            api.addTestUsers(param).done(function(){\n                alert("你的号码，现已加入H5测试环境");\n            }).fail(function(errMsg){\n                alert(errMsg || "出了点小问题，请联系系统管理员处理");\n            });\n            return false;\n        });\n        $(\'#remove-submit2\').click(function(e){\n            var val = $(\'#join-textarea\').val();\n            api.delTestUser({\n                uin : handlerNums(val).join(\',\')\n            }).done(function(){\n                alert("H5测试环境删除成功");\n            }).fail(function(errMsg){\n                alert(errMsg || "出了点小问题，请联系系统管理员处理");\n            });\n            return false;\n        });\n        $(\'#update-submit2\').on(\'change\', function(e){\n            var val = $(this).find(\'option:selected\').val();\n            document.cookie = \'_expiresTest=\' + (val || 1) + \'; path=/\';\n        });\n        $(\'#number-get\').click(function(event){\n            var self = this;\n            if($(self).is(\'.expended\')){\n                $(self).removeClass(\'expended\').text(\'查看H5测试号码列表\');\n                $(\'#number-list\').html(\'\');\n                return;\n            }\n            var request = api.getTestUser();\n            request.done(function(data) {\n                var html = "";\n                var num = 0;\n                for (var i in data.data) {\n                    num++;\n                    var val = data.data[i];\n                    html += \'<p><a href="/log/view/\' + i + \'" target="_blank" class="link">\' + i + \'</a>\' + \':\' + val + \'</p>\';\n                }\n                if (num == 0) {\n                    html = "还没有测试号码~"\n                }\n                $(\'#number-list\').html(html);\n                $(self).addClass(\'expended\').text(\'收起H5测试号码列表\');\n            }).fail(function(errMsg) {\n                errMsg = errMsg || "出了点小问题，请联系系统管理员处理";\n                alert(errMsg);\n            });\n            return false;\n        });\n\n        $(document).on(\'click\', \'.js-select-btn\', function(event){\n            var target = $(this);\n            $(\'.js-select-btn\').removeClass(\'btn-primary positive\');\n            $(\'.js-select-btn\').removeClass(\'selected positive\');\n            target.addClass(\'btn-primary positive\');\n            target.addClass(\'selected\');\n            if (history.replaceState) {\n                var server = target.attr(\'value\');\n                var newUrl = location.protocol + \'//\' + location.host + location.pathname + \'?server=\' + encodeURIComponent(server);\n                history.replaceState({server: server}, \'\', newUrl);\n            }\n        });\n        var server = getUrlParam(\'server\');\n        if (server) {\n            $(\'.js-select-btn\').each(function(i, el) {\n                var $el = $(el);\n                if ($el.attr(\'value\') === server) {\n                    var $box = $el.closest(\'.column>div\');\n                    $box.scrollTop(el.offsetTop - 140);\n                    $el.trigger(\'click\');\n                    return false;\n                }\n            });\n        }\n    })();\n    </scr');
            __p.push('ipt>');

            return __p.join('');
        },

        'new_body': function(data) {

            var __p = [],
                _p = function(s) {
                    __p.push(s);
                },
                out = _p;

            var allGroup = data.allGroup || [],
                i;
            __p.push('<style>\n.group-menu {\n    position: absolute;\n    width: 100%;\n    text-align: right;\n    top: 0;\n    right: .5em;\n}\n.group-menu .group-item {\n    padding: 0.3em 0.6em;\n    cursor: pointer;\n    background: #FFF;\n    box-shadow: 0 1px 2px 0 rgba(34,36,38,.15);\n    margin: 0 1em 1em 0;\n    border-radius: .28571429rem;\n    border: 1px solid rgba(34,36,38,.15);\n    font-size: 50%;\n}\n.group-menu .group-item.cur{\n    background: #21BA45 !important;\n    color: white !important;\n}\n\n.group-menu .group-item:hover{\n    background: #eee;\n}\n.group-menu a.group-item {\n    color: rgba(0,0,0,.6);\n    font-weight: 700;\n    text-transform: none;\n}\n.h5test-envs {\n    max-height: 400px;\n    overflow-y: auto;\n}\n.action-buttons button{\n    margin-right: 1em;\n}\n.expire-selector-con {\n    display: inline-block;\n    height: 40px;\n    border-radius: 5px;\n    box-shadow: 0 0 5px #ccc;\n    position: relative;\n}\n.expire-selector {\n    border: none;\n    outline: none;\n    width: auto;\n    height: 40px;\n    line-height: 40px;\n    appearance: none;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    padding: 0 20px; \n}\n.expire-selector option {\n    text-align: center;\n}\n\n</style>\n<div class="ui grid container">');
            if (!data.project) {
                __p.push('    <div class="row" style="margin-top: 30px">\n        <h1>TSW 测试环境配置</h1>\n    </div>');
            } __p.push('    <div class="row">\n        <div class="column">\n            <div class="ui raised segment">\n                <a class="ui blue ribbon label">#1 选择测试环境</a>');
            if (allGroup.length > 0) {
                __p.push('                <p class="group-menu">');
                for (i = 0; i < allGroup.length; i++) {
                    __p.push('                    <a class="');
                    _p(data.groupName == allGroup[i].group ? 'cur ' : '');
                    __p.push('group-item" href="/h5test/page/');
                    _p(tmpl.encodeHtml(allGroup[i].group));
                    __p.push('" title="');
                    _p(tmpl.encodeHtml(allGroup[i].group));
                    __p.push('">');
                    _p(tmpl.encodeHtml(allGroup[i].groupName));
                    __p.push('                    </a>');
                } __p.push('                </p>');
            } __p.push('                <br>\n                <br>\n                <div class="h5test-envs">');

            data = data.group;
            var item,
                val,
                name,
                desc,
                owner,
                module,
                isShow,
                isShowDesc;
            for (i = 0; i < data.length; i++) {
                item = data[i];
                val = item['ip'] + (item['port'] && (':' + item['port']) || '');
                name = item['name'];
                desc = item['desc'];
                owner = item['owner'];
                module = item['moduleName'];
                isShow = false;

                if (val && val != '') {
                    isShow = true;
                }

                if (!name) {
                    if (module && module != '') {
                        name = module;
                    } else {
                        name = val;
                    }
                }

                isShowDesc = false;
                if (desc && desc != '') {
                    if (owner && owner != '') {
                        desc += '，负责人：' + owner;
                    }
                } else {
                    desc = '';
                    if (owner && owner != '') {
                        desc += '负责人：' + owner;
                    }
                }
                if (desc && desc != '') {
                    isShowDesc = true;
                }

                __p.push('                    ');
                if (isShow) {
                    __p.push('                    <div class="row">\n                        <button title="');
                    _p(tmpl.encodeHtml(val));
                    __p.push('" type="button" value="');
                    _p(tmpl.encodeHtml(val));
                    __p.push('" class="ui button btn  js-select-btn ');
                    if (i == 0) {
                        __p.push(' selected positive ');
                    } __p.push('">');
                    _p(tmpl.encodeHtml(name));
                    __p.push('</button>');
                    if (/^[0-9.:]+$/.test(val)) {
                        __p.push('                        <a class="ui tag label" href="http://');
                        _p(tmpl.encodeHtml(val));
                        __p.push('/l5" title="点击修改L5" target="_blank">');
                        _p(tmpl.encodeHtml(val));
                        __p.push('</a>');
                        if (isShowDesc) {
                            __p.push('<a class="ui tag label">');
                            _p(tmpl.encodeHtml(desc));
                            __p.push('</a>');
                        } __p.push('                        ');
                    } else {
                        __p.push('                        <a class="ui tag label">');
                        _p(tmpl.encodeHtml(val));
                        __p.push('</a>');
                        if (isShowDesc) {
                            __p.push('<a class="ui tag label">');
                            _p(tmpl.encodeHtml(desc));
                            __p.push('</a>');
                        } __p.push('                        ');
                    } __p.push('                    </div>\n                    <br>');
                } __p.push('                ');
            } __p.push('                </div>\n            </div>\n        </div>\n    </div>\n    <div class="row">\n        <div class="column">\n            <div class="ui raised segment">\n                <a class="ui blue ribbon label">#2 输入用户id（支持批量，换行即可）</a>\n                <p class="ui">\n                    <textarea style="width:100%;height:80px;" id="join-textarea" ></textarea>\n                <p class="ui action-buttons">\n                    <button id="join-submit2" class="ui button large primary">添加</button>\n                    <button id="remove-submit2" class="ui button primary large">删除</button>\n                    <span class="expire-selector-con">\n                        <select name="expiresData" id="update-submit2" class="expire-selector">\n                            <option value="1" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 1 ? 'selected' : '');
            __p.push('>1天有效期</option>\n                            <option value="2" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 2 ? 'selected' : '');
            __p.push('>2天有效期</option>\n                            <option value="3" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 3 ? 'selected' : '');
            __p.push('>3天有效期</option>\n                            <option value="7" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 7 ? 'selected' : '');
            __p.push('>7天有效期</option>\n                            <option value="30" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 30 ? 'selected' : '');
            __p.push('>30天有效期</option>\n                            <option value="365" ');
            _p((window.request.cookies['_expiresTest'] || 1) == 365 ? 'selected' : '');
            __p.push('>1年有效期</option>\n                        </select>\n                    </span>                    \n                </p>\n            </div>\n        </div>\n    </div>\n    <div class="row">\n        <div class="column">\n            <div class="ui raised segment">\n                <button id="number-get" class="ui button primary large">查看H5测试号码列表</button>\n                <div class="ui divider"></div>\n                <div id="number-list" class="row">\n                    <p></p>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n\n\n<scr');
            __p.push('ipt type="text/javascript">\n    window.alert = function(msg){\n        $(\'.top-tip\').remove();\n        $(\'<div class="top-tip">\' + msg + \'</div>\').appendTo(\'body\');\n        setTimeout(function(){\n            $(\'.top-tip\').remove()\n        }, 3000);\n    }\n</scr');
            __p.push('ipt>\n');

            return __p.join('');
        }
    };
    return tmpl;
});
