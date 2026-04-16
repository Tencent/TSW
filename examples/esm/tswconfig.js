import { createRequire } from "node:module";
import winston from "winston";

// @tswjs/open-platform-plugin 是 CJS 包，ESM 项目中需通过 createRequire 导入
const require = createRequire(import.meta.url);
const OpenPlatformPlugin = require("@tswjs/open-platform-plugin");

export default {
  plugins: [
    new OpenPlatformPlugin({
      reportStrategy: "proxied",
      // 只支持同步写法
      getUid: (request) => "xxx",
      getProxyInfo: () => {
        return {
          "port": 80,
          "name": "3.0demo",
          "group": "TSW",
          "groupName": "TSW团队",
          "desc": "3.0demo测试环境",
          "order": 30,
          "owner": "demoUser",
          "alphaList": ["xxx"]
        };
      }
    })
  ],
  winstonTransports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "debug.log", level: "debug" })
  ]
};
