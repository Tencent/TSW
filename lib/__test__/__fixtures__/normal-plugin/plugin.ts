export class NormalPlugin {
  name: string;

  constructor() {
    this.name = "normal-plugin";
  }

  // eslint-disable-next-line class-methods-use-this
  async init(): Promise<void> {
    // do nothing
  }
}
