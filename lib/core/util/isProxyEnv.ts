const isProxyEnv = (): boolean => {
  const nodeOptions = process.env.NODE_OPTIONS;
  return Boolean(nodeOptions && (
    nodeOptions.includes("--proxy")));
};

export default isProxyEnv;
