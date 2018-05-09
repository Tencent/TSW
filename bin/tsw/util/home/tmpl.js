
//tmpl file list:
//home/src/main.tmpl.html
define(function(require, exports, module){
var tmpl = { 
'encodeHtml': function(s){return (s+'').replace(/[\x26\x3c\x3e\x27\x22\x60]/g,function($0){return '&#'+$0.charCodeAt(0)+';';});},

'body': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;
__p.push('    <h1>TSW</h1>\n    <h2>Tencent Server Web</h2>\n    <p>针对web前端开发同学的server端web开发解决方案。</p>');

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
},

'new_header': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;
__p.push('<style type="text/css">\nhtml{\n    overflow-x: hidden;\n    overflow-y: scroll;\n}\n#header.header{\n    height: 50px;\n    margin: 0 auto;\n    overflow: hidden;\n    background-color: rgba(0,0,0,0.8);\n    *background-color: #000;\n    border-top: 2px solid #F00;\n    z-index: 88;\n    width: 100%;\n    font-size: 16px;\n    box-sizing: border-box;\n}\n\n#header .nav{\n    width: 1100px;\n    margin: 0 auto;\n    padding: 0;\n}\n\n#header .nav li{\n    list-style: none;\n    float: right;\n    display: block;\n    height: 50px;\n    line-height: 50px;\n    overflow: hidden;\n    cursor: pointer;\n}\n\n#header .nav li:hover{\n    background-color: rgba(255,0,0,0.9);\n    color: #fff;\n}\n\n#header .nav li a{\n    display: block;\n    padding: 0 20px;\n    text-decoration: none;\n    color: #FFF;\n    font-family: "Microsoft YaHei";\n}\n\n#header .nav li a:hover,\n#header .nav li a:active{\n    text-decoration: none;\n}\n\n</style>\n<div id="header" class="header">\n    <ul class="nav">');
 
            var navMenus = data;
            if(navMenus && navMenus.length>0) {
                for(var i=0;i<navMenus.length;i++){
                    if(navMenus[i].href && navMenus[i].title){ __p.push('                    <li><a href="');
_p(tmpl.encodeHtml(navMenus[i].href));
__p.push('">');
_p(tmpl.encodeHtml(navMenus[i].title));
__p.push('</a></li>');
}
                }
            }
        __p.push('    </ul>\n</div>');

return __p.join("");
}
};
return tmpl;
});
