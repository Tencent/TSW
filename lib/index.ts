import * as path from "path";
import { consoleHack } from "./core/runtime/console.hack";
import { httpCreateServerHack } from "./core/runtime/create-server.hack";
import { dnsHack } from "./core/runtime/dns.hack";
import { requestHack } from "./core/runtime/capture/index";
import { eventBus } from "./core/bus";

const loadPlugins = async (
  basePath: string,
  config: typeof global.tswConfig
): Promise<void> => {
  // eslint-disable-next-line no-restricted-syntax
  for (const pluginPath of config.plugins) {
    if (!pluginPath.trim()) {
      return;
    }

    let absolutePath = "";
    if (path.isAbsolute(pluginPath)) {
      absolutePath = pluginPath;
    } else if (pluginPath.startsWith(".")) {
      absolutePath = path.resolve(basePath, pluginPath);
    } else {
      absolutePath = pluginPath;
    }

    // eslint-disable-next-line no-await-in-loop
    (await import(absolutePath))(eventBus, config);
  }
};

export default async (
  basePath: string,
  mainPath: string,
  configPath: string
): Promise<void> => {
  global.tswConfig = await import(path.resolve(basePath, configPath));

  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();

  await loadPlugins(basePath, global.tswConfig);

  await import(path.resolve(basePath, mainPath));
};
