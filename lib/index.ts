import * as path from "path";
import { consoleHack, consoleRestore } from "./core/runtime/console.hack";
import {
  httpCreateServerHack,
  httpCreateServerRestore
} from "./core/runtime/create-server.hack";
import { dnsHack, dnsRestore } from "./core/runtime/dns.hack";
import { requestHack, requestRestore } from "./core/runtime/capture/index";
import { winstonHack, winstonRestore } from "./core/winston";
import { eventBus } from "./core/bus";

export const installHacks = (): void => {
  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();
  winstonHack();
};

export const uninstallHacks = (): void => {
  httpCreateServerRestore();
  dnsRestore();
  consoleRestore();
  requestRestore();
  winstonRestore();
};

export default async (
  basePath: string,
  mainPath: string,
  configPath: string
): Promise<void> => {
  const configAbsolutePath = path.resolve(basePath, configPath);
  global.tswConfig = await import(configAbsolutePath);
  // eslint-disable-next-line no-restricted-syntax
  for (const plugin of global.tswConfig.plugins) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await plugin.init(eventBus, global.tswConfig);
    } catch (e) {
      console.error(`${plugin.name} 插件初始化失败: ${e.message}`);
      process.exit(-1);
    }
  }

  installHacks();
  await import(path.resolve(basePath, mainPath));
};
