import * as http from "http";

const attaid = "07500056550";
const token = "5953169376";

export const attaReport = (data) => {
  let url = `https://h.trace.qq.com/kv?
    attaid=${attaid}&token=${token}&_dc=${Math.random().toFixed(5)}`;

  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(data)) {
    url += `&${key}=${data[key]}`;
  }

  http.get(encodeURI(url), (res) => {
    console.log(`atta report response: ${res.statusCode}`);
  }).on("error", (e) => {
    console.log(`atta report error: ${e.message}`);
  });
};
