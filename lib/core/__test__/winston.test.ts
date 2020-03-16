import { winstonHack } from "../winston";
import logger from "../../core/logger/index";

describe("test winstonHack env", () => {
  test("test logger's winstonLogger when it hasn't hacked", () => {
    expect(logger.winstonLogger).toBe(undefined);
  });

  global.tswConfig.winstonTransports = undefined;
  winstonHack();
  test("test winstonHack while config without winstonTransports ", () => {
    expect(logger.winstonLogger.log).toBe(undefined);
  });
});
