import * as path from "path";
import { consoleHack } from "./core/runtime/console.hack";
import { httpCreateServerHack } from "./core/runtime/create-server.hack";
import { dnsHack } from "./core/runtime/dns.hack";
import { requestHack } from "./core/runtime/capture/index";
import { eventBus } from "./core/bus";
import { winstonHack } from "./core/winston";

export default async (
  basePath: string,
  mainPath: string,
  configPath: string
): Promise<void> => {
  const configAbsolutePath = path.resolve(basePath, configPath);
  global.tswConfig = await import(configAbsolutePath);
  // eslint-disable-next-line no-restricted-syntax
  for (const plugin of global.tswConfig.plugins) {
    // eslint-disable-next-line no-await-in-loop
    await plugin.init(eventBus, global.tswConfig).catch((e) => {
      console.error(`${plugin.name} 插件初始化失败: ${e.message}`);
      process.exit(-1);
    });
  }

  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();
  winstonHack();

  await import(path.resolve(basePath, mainPath));
};
