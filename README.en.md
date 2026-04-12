# aeira

A CLI tool that structures markdown wikilink relationships without app dependency.

[English](README.en.md) [한국어](README.md)

## Why

Wikilinks (`[[]]`) in markdown documents express relationships between documents.
But as wikilinks accumulate, the full picture of those relationships remains invisible. Which documents reference which, and how many steps connect two documents -- you cannot know without tracing them yourself.

aeira builds these relationships into a directed graph, navigable from the command line.

## Commands

aeira operates through four commands.

### init

Register a document collection by specifying a source path.

```sh
aeira init ./my-docs
```

### sync

Parse wikilinks to build and update the graph. Only changed documents are processed incrementally.

```sh
aeira sync                  # use cwd as source
aeira sync -s ./my-docs     # specify source path
```

### search

Search documents by keyword and display outgoing links alongside each result.

```sh
aeira search "keyword"
aeira search -s ./my-docs "keyword"
```

### graph

Three primitives for navigating the graph.

```sh
# List 1-hop neighbors
aeira graph neighbors node-name

# Find all paths between two nodes
aeira graph path from-node to-node

# Show entire graph
aeira graph all

# Specify source path
aeira graph neighbors -s ./my-docs node-name
```

All query commands support JSON output with the `--json` flag.

## Getting Started

### Prerequisites

- Node.js >= 22
- [ir](https://github.com/vlwkaos/ir) -- `brew install vlwkaos/tap/ir`

### Installation

```sh
npm install -g aeira
```

### First Use

Build the graph by specifying a source path.

```sh
aeira init ./my-docs
cd ./my-docs
aeira sync
```

After sync, you can navigate the graph.

```sh
aeira graph neighbors some-document
aeira search "query"
```
