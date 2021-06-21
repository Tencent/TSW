const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem'))
};

https.createServer(options, function (req, res) {
  console.log("hello world");

  res.writeHead(200);
  res.end("hello world\n");
}).listen(8000);

console.log("origin node server is listening on 8000");

