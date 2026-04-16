export class ErrorPlugin {
  name: string;

  constructor() {
    this.name = "error-plugin";
  }

  async init(): Promise<void> {
    throw new Error("throw a error");
  }
}
