export class NormalPlugin {
  name: string;

  constructor() {
    this.name = "normal-plugin";
  }

  // eslint-disable-next-line class-methods-use-this
  async init(eventBus: any, config: any): Promise<void> {
    // do nothing
  }
}
