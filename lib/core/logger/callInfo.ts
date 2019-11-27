export interface Info {
  line?: number;
  column?: number;
  filename?: string;
}

const captureStackTrace = (_, stack) => {
  return stack;
}

export const getCallInfo = (level: number): Info => {
  const res = {
    line: 0,
    column: 0,
    filename: ''
  };

  level = level || 0;

  const orig = Error.prepareStackTrace;
  const origLimit = Error.stackTraceLimit;
  Error.prepareStackTrace = captureStackTrace;
  Error.stackTraceLimit = 5;

  const err = Object.create(null);
  Error.captureStackTrace(err);     // eslint-disable-line no-caller
  const { stack } = err;

  Error.prepareStackTrace = orig;
  Error.stackTraceLimit = origLimit;

  if (stack && stack[level] && typeof stack[level].getLineNumber === 'function') {
    res.line = stack[level].getLineNumber();
    res.column = stack[level].getColumnNumber();
    res.filename = stack[level].getFileName();
  }

  return res;
}
