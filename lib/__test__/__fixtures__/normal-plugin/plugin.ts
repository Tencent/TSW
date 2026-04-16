export class NormalPlugin {
  name: string;

  constructor() {
    this.name = "normal-plugin";
  }

  async init(): Promise<void> {
    // do nothing
  }
}
