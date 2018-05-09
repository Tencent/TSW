
//tmpl file list:
//group/src/main.tmpl.html
define(function(require, exports, module){
var tmpl = { 
'encodeHtml': function(s){return (s+'').replace(/[\x26\x3c\x3e\x27\x22\x60]/g,function($0){return '&#'+$0.charCodeAt(0)+';';});},

'body': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;
__p.push('    <h1>TSW 测试环境分组</h1>\n    <h2>加入</h2>\n    <p>测试机采用自动发现机制，配置为测试环境后自动出现在这里</p>\n    <p>测试机定义 <code>config.isTest = true</code></p>\n    <p>测试机个性配置参见 <code>config.testInfo = {...}</code></p>\n    <h2>分组</h2>');
if(data.allGroup.length === 0){__p.push('    <p>还没有发现测试机</p>');
}else{__p.push('    <p>点击你喜欢的分组</p>');
}__p.push('\n    <ul>');

        data.allGroup.forEach(function(v){
        __p.push('        <li><a href="/h5test/page/');
_p(v.group);
__p.push('">');
_p(v.group);
__p.push(' -- ');
_p(v.groupName || '未知');
__p.push('</a></li>');

        });
        __p.push('    </ul>');

return __p.join("");
},

'html': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;
__p.push('    ');

    var
    data	= data || {},
    body	= data.body || '',
    head	= data.head || {},
    undefined;
    __p.push('    <!DOCTYPE html>\n    <html>\n    <head>\n        <meta charset="UTF-8">\n        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n        <meta http-equiv="X-UA-Compatible" content="IE=edge" />\n        <title>');
_p(tmpl.encodeHtml(head.title || ''));
__p.push('</title>\n        <meta name="description" itemprop="description" content="');
_p(tmpl.encodeHtml(head.description || ''));
__p.push('" />\n        <meta itemprop="name" content="');
_p(tmpl.encodeHtml(head.share_name || ''));
__p.push('">');
 if(head.share_image){__p.push('        <meta itemprop="image" content="');
_p( head.share_image );
__p.push('">');
}__p.push('        <meta name="robots" content="none" />\n        <meta name="format-detection" content="telephone=no" />\n        <meta name="HandheldFriendly" content="True" />\n        <meta name="MobileOptimized" content="320" />\n        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n        <meta name="x5-fast-scroller" content="disable" />\n        <meta name="apple-mobile-web-app-status-bar-style" content="black" />\n        <link rel="stylesheet" type="text/css" href="/static/tsw/styles/semantic-ui/dist/semantic.min.css">\n        <link rel="stylesheet" type="text/css" href="/static/tsw/styles/semantic-ui/stylesheets/docs.css">\n    </head>\n    <body>');
_p(data.header || '');
__p.push('    <div class="ui grid container">\n        <div class="row" style="margin-top: 30px">\n            <div class="column">');
_p(body);
__p.push('            </div>\n        </div>\n    </div>\n    </body>\n    </html>');

return __p.join("");
}
};
return tmpl;
});
