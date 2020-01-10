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
      absolutePath = path.resolve(basePath, "node_modules", pluginPath);
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
  const configAbsolutePath = path.resolve(basePath, configPath);
  global.tswConfig = await import(configAbsolutePath);

  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();

  await loadPlugins(path.dirname(configAbsolutePath), global.tswConfig);

  await import(path.resolve(basePath, mainPath));
};
