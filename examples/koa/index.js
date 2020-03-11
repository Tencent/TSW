const Koa = require("koa");
const axios = require("axios");

const app = new Koa();

app.use(async ctx => {
  // await axios.get(
  //   "http://jsonplaceholder.typicode.com/todos/1"
  // ).then(res => {
  //   console.log(res.data);
  // });

  // await axios.post("http://jsonplaceholder.typicode.com/posts", {
  //   body: JSON.stringify({
  //     title: 'foo',
  //     body: 'bar',
  //     userId: 1
  //   }),
  //   headers: {
  //     "Content-type": "application/json; charset=UTF-8"
  //   }
  // }).then(res => {
  //   console.log(res.data);
  // });


  ctx.body = "Hello, tsw 2.0";
  ctx.status = 200;
}).listen(4443);
