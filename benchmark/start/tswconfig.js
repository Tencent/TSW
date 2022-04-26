/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const winston = require("winston");
const OpenPlatformPlugin = require("@tswjs/open-platform-plugin");

module.exports = {
  plugins: [
    new OpenPlatformPlugin({
      reportStrategy: "always",
      // 只支持同步写法
      getUid: (request) => "xxx",
      getProxyInfo: () => ({
        port: 80,
        name: "benchmark",
        group: "TSW",
        groupName: "TSW团队",
        desc: "benchmark测试环境",
        order: 30,
        owner: "demoUser",
        alphaList: ["demoUser"]
      })
    })
  ],
  winstonTransports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "debug.log", level: "debug" })
  ]
  // logLevel: "ERROR",
  // cleanLog: true
};
