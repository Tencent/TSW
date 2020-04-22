/* eslint-disable @typescript-eslint/no-var-requires */
const { spawn } = require("child_process");

spawn(
  "sh",
  [
    "-c",
    "npx xl_close_port -p 3000 && node ./originServer.js"
  ], {
    stdio: ["pipe", "inherit", "inherit"]
  }
);
