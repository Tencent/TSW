const isInspect = (): boolean => {
  const nodeOptions = process.env.NODE_OPTIONS;
  return Boolean(nodeOptions && (
    nodeOptions.includes("--inspect")
    || nodeOptions.includes("--inspect-brk")));
};

export default isInspect;
