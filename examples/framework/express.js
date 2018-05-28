

const express = require('express');
const app = express();

// http://127.0.0.1/express
app.all('/express', function(req, res) {
    res.end('hello express~');
});

// app.listen(80);
// 划重点
module.exports = app;
