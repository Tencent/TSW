const https = require("https");
const fs = require("fs");
const path = require("path");

const options = {
  key: fs.readFileSync(path.resolve(__dirname, "key.pem")),
  cert: fs.readFileSync(path.resolve(__dirname, "cert.pem"))
};

https.createServer(options, (req, res) => {
  console.log(`${req.method} ${req.url}`);

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("hello from TSW 3.0 (HTTPS)\n");
}).listen(8000);

console.log("HTTPS server is listening on https://localhost:8000");
