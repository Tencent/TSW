import * as winston from "winston";
import { winstonHack, winstonRestore } from "../winston";
import logger from "../../core/logger/index";

global.tswConfig = {
  plugins: [],
  winstonTransports: undefined
};

describe("test winstonHack env", () => {
  test("test logger's winstonLogger when it hasn't hacked", () => {
    expect(logger.winstonLogger).toBe(undefined);
  });

  test("test winstonHack while config without winstonTransports ", () => {
    winstonHack();
    expect(logger.winstonLogger).toBe(undefined);
  });

  test("test winstonHack while the length of winstonTransports is 0", () => {
    winstonHack();
    expect(logger.winstonLogger).toBe(undefined);
  });

  test("test winstonHack while config with Console Transports ", () => {
    global.tswConfig.winstonTransports = [
      new winston.transports.Console()
    ];

    winstonHack();
    expect(logger.winstonLogger.transports.length).toBe(1);
  });

  test("test logger's winstonLogger when it has restored", () => {
    winstonHack();
    winstonRestore();
    expect(logger.winstonLogger).toBe(undefined);
  });
});
