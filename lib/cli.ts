#!/usr/bin/env node

import * as yargs from "yargs";
import tsw from "./index";

const { argv } = yargs
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
  });

const { _, config } = argv;
const [main] = _;

tsw(process.cwd(), main, config);
