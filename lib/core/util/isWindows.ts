const isOSX = process.platform === 'darwin';
const isWindows = process.platform === 'win32' || isOSX;
export const isLinux = !(isWindows || isOSX);
