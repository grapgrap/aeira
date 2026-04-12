#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { init } from "./commands/init";
import { sync } from "./commands/sync";
import { search } from "./commands/search";
import { graph } from "./commands/graph";

const main = defineCommand({
  meta: {
    name: "aeira",
    version: "0.0.0",
    description: "위키링크 기반 문서 관계 그래프 도구",
  },
  subCommands: { init, sync, search, graph },
});

runMain(main);
