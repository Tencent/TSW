/* eslint-disable @typescript-eslint/no-var-requires */

const http = require("http");

const server = http.createServer((req, res) => {
  res.end("hello world");
});

server.listen(3000);
console.log("origin node server is listening on 3000");
