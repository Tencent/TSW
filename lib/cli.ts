#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import tsw from "./index.js";

const args = yargs(hideBin(process.argv))
  .alias("h", "help")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
    default: false
  })
  .option("config", {
    alias: "c",
    type: "string",
    description: "Config file path",
    default: "tswconfig.js"
  })
  .parseSync() as { _: (string | number)[]; config: string; verbose: boolean; $0: string };

const { _, config } = args;
const [main] = _;

tsw(process.cwd(), main as string, config);
