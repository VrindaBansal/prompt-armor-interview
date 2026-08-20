import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

const repositoryRoot = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "build", "coverage", "dist", "node_modules", "out"]);
const markdownExtension = /\.(?:md|mdown|markdown|mdx|mkd)$/i;
const allowedDocument = "README.md";
const violations = [];

function inspectDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      inspectDirectory(absolutePath);
      continue;
    }

    const repositoryPath = relative(repositoryRoot, absolutePath);
    if (markdownExtension.test(entry.name) && repositoryPath !== allowedDocument) {
      violations.push(repositoryPath);
    }
  }
}

inspectDirectory(repositoryRoot);

if (violations.length > 0) {
  console.error("Markdown policy violation: README.md is the only permitted Markdown file.");
  for (const violation of violations.sort()) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Markdown policy passed: README.md is the only Markdown file.");
}
