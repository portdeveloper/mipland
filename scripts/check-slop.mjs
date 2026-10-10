#!/usr/bin/env node
// Fails if banned AI-slop phrasing appears in tracked copy.
// Rules are documented in NOSLOP.md; add new ones to RULES below and there.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Apostrophe forms seen in copy: ASCII, curly, and JSX-escaped.
const APOS = "(?:'|’|&apos;|&#39;)";

const RULES = [
  {
    id: "not-just",
    why: '"X, not just Y" / "doesn\'t just X, it Y" contrast framing',
    pattern: new RegExp(
      String.raw`\b(?:not|(?:is|are|was|does|do|did|won)n${APOS}t)\s+(?:just|merely|simply|only)\b|\bmore\s+than\s+just\b`,
      "gi",
    ),
  },
  {
    id: "reality",
    why: '"reality" standing in for a concrete fact ("hardware reality")',
    pattern: /\brealit(?:y|ies)\b/gi,
  },
];

const INCLUDE_DIRS = ["src", "content", "public"];
const INCLUDE_ROOT_FILES = ["README.md", "CONTRIBUTING.md"];
const EXTENSIONS = /\.(ts|tsx|js|jsx|md|mdx|txt)$/;
// zh.ts is maintained separately; test files assert on copy, not author it.
const EXCLUDE = /(^|\/)zh\.ts$|\.test\.tsx?$/;

const files = execFileSync(
  "git",
  ["ls-files", ...INCLUDE_DIRS, ...INCLUDE_ROOT_FILES],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((f) => f && EXTENSIONS.test(f) && !EXCLUDE.test(f));

let failures = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.pattern)) {
      const line = text.slice(0, m.index).split("\n").length;
      const snippet = m[0].replace(/\s+/g, " ");
      console.log(`${file}:${line}  [${rule.id}] "${snippet}"  ${rule.why}`);
      failures++;
    }
  }
}

if (failures) {
  console.log(`\n${failures} slop match(es). See NOSLOP.md for rewrites.`);
  process.exit(1);
}
console.log(`check-slop: ${files.length} files clean.`);
