export interface Log{
  showLineNumber?: boolean;
  arr?: Array<any>;
  json?: {
    curr: object;
    ajax: Array<object>;
  };
  key?: string | null;
  group?: string | null;
  force?: any;
  ERROR?: any;
}
export interface Window{
  request?: string | undefined | null;
}

export const currentContext = () => {
  const log: Log = {}
  const window: Window = {}
  const SN = 0
  const beforeLogClean = (): void =>{

  }
  return {
    log, window,
    SN,
    beforeLogClean
  }
}
