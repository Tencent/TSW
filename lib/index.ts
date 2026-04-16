import path from "node:path";
import { pathToFileURL } from "node:url";
import { consoleHack, consoleRestore } from "./core/runtime/console.hack.js";
import {
  httpCreateServerHack,
  httpsCreateServerHack,
  httpCreateServerRestore,
  httpsCreateServerRestore
} from "./core/runtime/create-server.hack.js";
import { dnsHack, dnsRestore } from "./core/runtime/dns.hack.js";
import { requestHack, requestRestore } from "./core/runtime/capture/index.js";
import { winstonHack, winstonRestore } from "./core/winston.js";
import { eventBus } from "./core/bus.js";
import logger from "./core/logger/index.js";

export const installHacks = (): void => {
  httpCreateServerHack();
  httpsCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();
  winstonHack();
};

export const uninstallHacks = (): void => {
  httpCreateServerRestore();
  httpsCreateServerRestore();
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
  const configModule = await import(pathToFileURL(configAbsolutePath).href);
  global.tswConfig = configModule.default || configModule;

  logger.setCleanLog(global.tswConfig.cleanLog);
  logger.setLogLevel(global.tswConfig.logLevel);

  if (global.tswConfig.plugins) {
    for (const plugin of global.tswConfig.plugins) {
      try {
        await plugin.init(eventBus, global.tswConfig);
      } catch (e) {
        console.error(`${plugin.name} 插件初始化失败: ${e.message}`);
        process.exit(-1);
      }
    }
  }

  installHacks();
  await import(pathToFileURL(path.resolve(basePath, mainPath)).href);
};
