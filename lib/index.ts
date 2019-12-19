import { consoleHack } from "./core/runtime/console.hack";
import { httpCreateServerHack } from "./core/runtime/create-server.hack";
import { dnsHack } from "./core/runtime/dns.hack";
import { requestHack } from "./core/runtime/capture/index";

export default async (absolutePath2Main: string): Promise<void> => {
  httpCreateServerHack();
  dnsHack();
  consoleHack();
  requestHack();

  await import(absolutePath2Main);
};
