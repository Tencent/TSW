
//tmpl file list:
//html302/src/jump.tmpl.html
define(function(require, exports, module){
    var tmpl = { 
        'jump': function(data){

            var __p=[],_p=function(s){__p.push(s);};
            __p.push('<!doctype html>\n<html>\n<head>\n<meta http-equiv="X-UA-Compatible" content="edge">\n<meta charset="utf-8">\n\n<meta name="x5-pagetype" content="webapp">\n<meta name="HandheldFriendly" content="True">\n<meta name="viewport" content="width=device-width, initial-scale=1,minimum-scale=1, maximum-scale=1, user-scalable=no" />\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black">\n<meta content="telephone=no" name="format-detection" />\n<title>');
            _p(data.title || '');
            __p.push('</title>\n\n<scr');
            __p.push('ipt type="text/javascript">\n    window.location.replace(');
            _p(JSON.stringify(data.url));
            __p.push(');\n</scr');
            __p.push('ipt>\n</head>\n<body>\n</body>\n</html>');

            return __p.join('');
        }
    };
    return tmpl;
});
