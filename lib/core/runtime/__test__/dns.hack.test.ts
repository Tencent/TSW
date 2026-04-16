import { createRequire } from "node:module";
import type * as dnsTypes from "node:dns";
import { isIP } from "node:net";

const require = createRequire(import.meta.url);
const dns = require("node:dns") as typeof dnsTypes;

vi.mock("../../logger/index.js", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    writeLog: vi.fn(),
    setLogLevel: vi.fn(),
    setCleanLog: vi.fn()
  },
  Logger: vi.fn()
}));

import { eventBus, EVENT_LIST } from "../../bus.js";
import { dnsHack, dnsRestore } from "../dns.hack.js";

beforeAll(() => {
  dnsHack();
});

afterAll(() => {
  dnsRestore();
});

describe("dns hack test", () => {
  test("dns could work normally", async () => {
    await new Promise((resolve) => {
      dns.lookup("qq.com", (err, address, family) => {
        expect(err).toBeNull();
        expect(isIP(address)).toBeTruthy();
        expect(family).toEqual(4);
        resolve(0);
      });
    });
  });

  test("dns could work with options normally", async () => {
    await new Promise((resolve) => {
      const options = { family: 4 };
      dns.lookup("qq.com", options, (err, address, family) => {
        expect(err).toBeNull();
        expect(isIP(address)).toBeTruthy();
        expect(family).toEqual(4);
        resolve(0);
      });
    });
  });

  test("eventBus was informed", async () => {
    await new Promise((resolve, reject) => {
      eventBus.on(EVENT_LIST.DNS_LOOKUP_SUCCESS, (data) => {
        resolve(data);
      });

      eventBus.on(EVENT_LIST.DNS_LOOKUP_ERROR, (err) => {
        reject(err);
      });

      dns.lookup("qq.com", () => {
        // nothing
      });
    });
  });

  test("ipv4 should return immediately", async () => {
    await new Promise((resolve) => {
      const ip = "1.2.3.4";
      dns.lookup(ip, (err, address, family) => {
        expect(err).toBeNull();
        expect(address).toEqual(ip);
        expect(family).toEqual(4);
        resolve(0);
      });
    });
  });

  test("ipv4 should return with options immediately", async () => {
    await new Promise((resolve) => {
      const ip = "1.2.3.4";
      const options = { family: 4 };
      dns.lookup(ip, options, (err, address, family) => {
        expect(err).toBeNull();
        expect(address).toEqual(ip);
        expect(family).toEqual(4);
        resolve(0);
      });
    });
  });

  test("ipv6 should return immediately", async () => {
    await new Promise((resolve) => {
      const ip = "::ffff:192.0.2.128";
      dns.lookup(ip, (err, address, family) => {
        expect(err).toBeNull();
        expect(address).toEqual(ip);
        expect(family).toEqual(6);
        resolve(0);
      });
    });
  });

  test("a wrong domain should fail", async () => {
    await new Promise((resolve) => {
      const nullDomain = "this is not a domain";
      dns.lookup(nullDomain, (err) => {
        expect(err).toBeTruthy();
        resolve(0);
      });
    });
  });
});
