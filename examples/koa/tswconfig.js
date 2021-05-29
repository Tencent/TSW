const winston = require("winston");
const OpenPlatformPlugin = require("@tswjs/open-platform-plugin");

module.exports = {
  plugins: [
    new OpenPlatformPlugin({
      appid: "tsw1844",
      appkey: "fTctzeCnBHKJZyBYmBAB3H5R",
      reportStrategy: "proxied",
      // 只支持同步写法
      getUid: (request) => "xxx",
      getProxyInfo: () => {
        return {
          "port": 80,
          "name": "2.0demo",
          "group": "TSW",
          "groupName": "TSW团队",
          "desc": "2.0demo测试环境",
          "order": 30,
          "owner": "demoUser",
          "alphaList": ["xxx"]
        };
      }
    })
  ],
  winstonTransports: [
    new winston.transports.File({ filename: 'error.log', level: 'error'}),
    new winston.transports.File({ filename: 'debug.log', level: 'debug'})
  ]
};
