/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const winston = require("winston");
const OpenPlatformPlugin = require("@tswjs/open-platform-plugin");

module.exports = {
  plugins: [
    new OpenPlatformPlugin({
      appid: "tsw1844",
      appkey: "fTctzeCnBHKJZyBYmBAB3H5R",
      reportStrategy: "never"
    })
  ],
  winstonTransports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "debug.log", level: "debug" })
  ]
};
