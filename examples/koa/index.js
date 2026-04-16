const Koa = require("koa");
const axios = require("axios");

const app = new Koa();

app.use(async (ctx) => {
  const { data } = await axios.get(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  console.log("upstream response:", data);

  ctx.body = { message: "Hello from TSW 3.0 (Koa)", upstream: data };
  ctx.status = 200;
});

app.listen(4443);
console.log("Koa server is listening on http://localhost:4443");
