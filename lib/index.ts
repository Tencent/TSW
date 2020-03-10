import * as path from "path";
import { consoleHack } from "./core/runtime/console.hack";
import { httpCreateServerHack } from "./core/runtime/create-server.hack";
import { dnsHack } from "./core/runtime/dns.hack";
import { requestHack } from "./core/runtime/capture/index";
import { eventBus } from "./core/bus";

export default async (
  basePath: string,
  mainPath: string,
  configPath: string
): Promise<void> => {
  const configAbsolutePath = path.resolve(basePath, configPath);
  global.eventBus = eventBus;
  global.tswConfig = await import(configAbsolutePath);

  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();

  await import(path.resolve(basePath, mainPath));
};
