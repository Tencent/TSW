
//tmpl file list:
//mail/src/mail.tmpl.html
define(function(require, exports, module){
var tmpl = { 
'encodeHtml': function(s){return (s+'').replace(/[\x26\x3c\x3e\x27\x22\x60]/g,function($0){return '&#'+$0.charCodeAt(0)+';';});},

'email': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;


var window = context.window || {};
__p.push('<html>\n<head>\n<meta charset="utf-8" />\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n<meta name="robots" content="none" />\n<meta name="format-detection" content="telephone=no" />\n<meta name="HandheldFriendly" content="True" />\n<meta name="MobileOptimized" content="320" />\n<meta name="viewport" content="width=320,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n<meta name="viewport" content="width=319.9,initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" media="(device-height: 568px)" />\n<meta name="x5-fast-scroller" content="disable" />\n\n<style>\np{\n	line-height: 1.5;\n}\ncode{\n	font-size: 12px;\n}\n</style>\n\n</head>\n<body>\n	<p>');
_p(data.Content);
__p.push('</p>\n	<p><strong>服务器IP:</strong> ');
_p(data.intranetIp);
__p.push('</p>\n\n	<p><strong>进程名字:</strong> ');
_p(tmpl.encodeHtml(data.processTitle));
__p.push('</p>\n	<p><strong>进程ID:</strong> ');
_p(data.processPid.pid);
__p.push('</p>\n	<p><strong>mod_act:</strong> ');
_p(context.mod_act || 'null');
__p.push('</p>');
if(window.request){__p.push('	<p><strong>域名:</strong> ');
_p(window.request && window.request.headers.host);
__p.push('</p>\n	<p><strong>path:</strong> ');
_p(window.request && window.request.REQUEST.pathname);
__p.push('</p>');
}__p.push('	<p><strong>idc:</strong> ');
_p(data.idc);
__p.push('</p>\n	<p><strong>发送间隔:</strong> ');
_p(data.second);
__p.push('s</p>');
if(data.headerText){__p.push('	<p><strong>请求头:</strong></p>\n	<div style="font-size:12px">');
_p(tmpl.encodeHtml(data.headerText || '').replace(/\r\n|\r|\n/gmi,'<br>'));
__p.push('</div>');
}__p.push('	');
if(data.logText){__p.push('	<p><strong>全息日志:</strong></p>\n	<pre style="font-size:12px">');
_p(tmpl.encodeHtml(data.logText || '').replace(/\r\n|\r|\n/gmi,'<br>'));
__p.push('</pre>');
}__p.push('</body>\n</html>');

return __p.join("");
},

'rtx': function(data){

var __p=[],_p=function(s){__p.push(s)},out=_p;


var window = context.window || {};
_p(data.MsgInfo);
_p('\r\n\r\n');
__p.push('服务器IP:');
_p(data.intranetIp);
_p('\r\n');
__p.push('进程名字: ');
_p(tmpl.encodeHtml(process.title));
_p('\r\n');
__p.push('进程ID: ');
_p(process.pid);
_p('\r\n');
__p.push('mod_act: ');
_p(context.mod_act || 'null');
_p('\r\n');
__p.push('域名:');
_p(window.request && window.request.headers.host);
_p('\r\n');
__p.push('path:');
_p(window.request && window.request.REQUEST.pathname);
_p('\r\n');
__p.push('发送间隔: ');
_p(data.second);
__p.push('s');
_p('\r\n');
__p.push('');

return __p.join("");
}
};
return tmpl;
});
