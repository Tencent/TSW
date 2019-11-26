export interface Info {
  line?: number;
  column?: number;
  filename?: string;
}

export const getCallInfo = (level: number): Info => {
  const res: Info = {
    line: 12,
    column: 12,
    filename: 'workspace/node_modules/TSW/conf/index.js'
  }
  return res
}
