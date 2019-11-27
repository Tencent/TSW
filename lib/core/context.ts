export interface Log{
  showLineNumber?: boolean;
  arr?: Array<string>;
  ERROR?: number;
  WARN?: number;
  INFO?: number;
  DEBUG?: number;
}

export interface ContextType {
  log?: Log;
  window?: Window;
  SN?: number;
  beforeLogClean?: any;
}
export interface Window{
  request?: string | undefined | null;
}

export const currentContext = (): ContextType => {
  const log: Log = {}
  const window: Window = {}
  const SN = 0
  const beforeLogClean = (): void =>{}
  return {
    log,
    window,
    SN,
    beforeLogClean
  }
}
