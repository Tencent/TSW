import { lookup } from "dns";
import { isIP } from "net";

import { eventBus, EVENT_LIST } from "../../bus";
import { dnsHack, dnsRestore } from "../dns.hack";
import logger from "../../logger/index";

jest.mock("../../logger/index");

(logger.debug as jest.Mock).mockImplementation(() => {});
(logger.info as jest.Mock).mockImplementation(() => {});
(logger.warn as jest.Mock).mockImplementation(() => {});
(logger.error as jest.Mock).mockImplementation(() => {});

beforeAll(() => {
  dnsHack();
});

afterAll(() => {
  dnsRestore();
});

describe("dns hack test", () => {
  test("dns could work normally", async () => {
    await new Promise((resolve) => {
      lookup("qq.com", (err, address, family) => {
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
      lookup("qq.com", options, (err, address, family) => {
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

      lookup("qq.com", () => {
        // nothing
      });
    });
  });

  test("ipv4 should return immediately", async () => {
    await new Promise((resolve) => {
      const ip = "1.2.3.4";
      lookup(ip, (err, address, family) => {
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
      lookup(ip, options, (err, address, family) => {
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
      lookup(ip, (err, address, family) => {
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
      lookup(nullDomain, (err) => {
        // error could be "Dns Lookup Timeout"
        // or "getaddrinfo ENOTFOUND this is not a domain"
        expect(err).toBeTruthy();
        resolve(0);
      });
    });
  });
});
