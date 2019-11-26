export const isOSX = process.platform === 'darwin';
export const isWindows = process.platform === 'win32' || isOSX;
export const isWin32Like = isWindows;
export const isLinux = !(isWindows || isOSX);
