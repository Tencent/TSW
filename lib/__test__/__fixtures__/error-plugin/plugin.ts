export class ErrorPlugin {
  name: string;

  constructor() {
    this.name = "error-plugin";
  }

  // eslint-disable-next-line class-methods-use-this
  async init(): Promise<void> {
    throw new Error("throw a error");
  }
}
