const http = require("http");

console.log("try to start a server");

http.createServer((req, res) => {
  res.status = 200;
  console.log(req.url);
  res.end('Hello World!');
}).listen(4443);
