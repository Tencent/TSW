const isUseTsNode = (): boolean => {
  const nodeOptions = process.env.NODE_OPTIONS;
  return Boolean(nodeOptions && (
    nodeOptions.includes("--require=ts-node/register")));
};

export default isUseTsNode;
