import { consoleHack } from "./core/runtime/console.hack";
import { httpCreateServerHack } from "./core/runtime/create-server.hack";
import { dnsHack } from "./core/runtime/dns.hack";

export default async (absolutePath2Main: string): Promise<void> => {
  httpCreateServerHack();
  dnsHack();
  consoleHack();

  await import(absolutePath2Main);
};
