#!/usr/bin/env node

import * as yargs from "yargs";
import tsw from "./index";
import * as path from "path";

const { argv } = yargs
  .alias("h", "help")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
    default: false
  });

const { _ } = argv;
const [main] = _;

tsw(path.resolve(process.cwd(), main));
