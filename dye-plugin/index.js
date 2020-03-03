module.exports = (event, config) => {
  const { testInfo } = config;
  // 如果使用了open-platform-plugins插件，则上报测试环境到开放平台

  // 根据配置文件拉取testIp
  event.on("RESPONSE_START", (payload) => {
    const { req, res, context } = payload;

    // qus - 用户自定义的 getUin 配置写在哪？
    const uin = "zackguo";

    // 如果使用了open-platform-plugins插件，则同步拉取染色清单

    for( let testIp of Object.keys(testInfo) ){
      if(testInfo[testIp].alphaList.indexOf(uin) !== -1){
        context.testIp = testIp;
        break;
      }
    }
  })

  console.log("loaded dye-plugin");
}
