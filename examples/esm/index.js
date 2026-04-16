import http from "node:http";

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.url === "/api") {
    const upstream = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    const data = await upstream.json();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello from TSW 3.0 (ESM)", upstream: data }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from TSW 3.0 (ESM)\n");
});

server.listen(3000, () => {
  console.log("ESM server is listening on http://localhost:3000");
});
