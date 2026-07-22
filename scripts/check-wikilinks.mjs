import { access, readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const roots = ["AGENTS.md", "PLANS.md", "README.md", "docs", "plans"];

async function markdownFiles(path) {
  const absolute = resolve(root, path);
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    const nested = await Promise.all(entries.map((entry) => markdownFiles(join(path, entry.name))));
    return nested.flat();
  } catch {
    return extname(path) === ".md" ? [absolute] : [];
  }
}

const files = (await Promise.all(roots.map(markdownFiles))).flat();
const problems = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const links = content.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g);
  for (const match of links) {
    const rawTarget = match[1].trim();
    const target = extname(rawTarget) ? rawTarget : `${rawTarget}.md`;
    const targetPath = resolve(root, target);
    if (!targetPath.startsWith(`${root}/`)) {
      problems.push(`${relative(root, file)}: link escapes repository: [[${rawTarget}]]`);
      continue;
    }
    try {
      await access(targetPath);
    } catch {
      problems.push(`${relative(root, file)}: missing target: [[${rawTarget}]]`);
    }
  }
}

if (problems.length) {
  console.error(`Found ${problems.length} broken wiki link(s):\n${problems.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} Markdown files: all wiki links resolve.`);
}

