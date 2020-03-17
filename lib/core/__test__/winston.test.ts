import * as winston from "winston";
import { winstonHack } from "../winston";
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


  test("test winstonHack while config with Console Transports ", () => {
    global.tswConfig.winstonTransports = [
      new winston.transports.Console()
    ];

    winstonHack();
    expect(logger.winstonLogger.transports.length).toBe(1);
  });
});
