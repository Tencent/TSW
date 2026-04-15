#!/usr/bin/env node

import * as yargs from "yargs";
import tsw from "./index";

const args = yargs
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
  .argv as { _: (string | number)[]; config: string; verbose: boolean; $0: string };

const { _, config } = args;
const [main] = _;

tsw(process.cwd(), main as string, config);
