#!/usr/bin/env node
import { createRequire } from "node:module";
import { defineCommand, runMain } from "citty";
import { init } from "./commands/init";
import { sync } from "./commands/sync";
import { search } from "./commands/search";
import { graph } from "./commands/graph";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const main = defineCommand({
  meta: {
    name: "aeira",
    version,
    description: "위키링크 기반 문서 관계 그래프 도구",
  },
  subCommands: { init, sync, search, graph },
});

runMain(main);
