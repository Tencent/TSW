const nodeOptions = process.env.NODE_OPTIONS;
const isInspect = nodeOptions && (
  nodeOptions.includes("--inspect=")
  || nodeOptions.includes("--inspect-brk=")
);

export default isInspect;
