import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const outputRoot = path.join(root, "artifacts", "connectors");
const bun = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "bun.exe" : "bun");
const requestedTarget = process.argv.find((value) => value.startsWith("--target="))?.slice(9);
const buildAll = process.argv.includes("--all");

const targets = {
  "darwin-arm64": {
    bunTarget: "bun-darwin-arm64",
    directory: "macos-arm64",
    app: true,
  },
  "darwin-x64": {
    bunTarget: "bun-darwin-x64",
    directory: "macos-x64",
    app: true,
  },
  "windows-x64": {
    bunTarget: "bun-windows-x64",
    directory: "windows-x64",
    filename: "Night-Shift-Connector.exe",
    windows: true,
  },
  "linux-x64": {
    bunTarget: "bun-linux-x64",
    directory: "linux-x64",
    filename: "Night-Shift-Connector",
  },
};

const currentTarget = `${process.platform}-${process.arch}`;
const selectedTargets = buildAll
  ? Object.keys(targets)
  : [requestedTarget ?? currentTarget];

for (const target of selectedTargets) {
  const config = targets[target];
  if (!config) {
    throw new Error(`Unsupported Connector target "${target}". Use ${Object.keys(targets).join(", ")}.`);
  }
  const directory = path.join(outputRoot, config.directory);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });

  let output;
  if (config.app) {
    const contents = path.join(directory, "Night Shift Connector.app", "Contents");
    const executableDirectory = path.join(contents, "MacOS");
    await mkdir(executableDirectory, { recursive: true });
    output = path.join(executableDirectory, "Night Shift Connector");
    await writeFile(path.join(contents, "Info.plist"), infoPlist(target), "utf8");
  } else {
    output = path.join(directory, config.filename);
  }

  const args = [
    "build",
    path.join(root, "apps", "connector", "main.ts"),
    "--compile",
    `--target=${config.bunTarget}`,
    "--minify",
    `--outfile=${output}`,
  ];
  // Bun can only rewrite the PE subsystem bit from a Windows host. Cross-built
  // CI artifacts keep the console; a native Windows build hides it.
  if (config.windows && process.platform === "win32") args.push("--windows-hide-console");
  process.stdout.write(`Building ${target}…\n`);
  const result = await execFileAsync(bun, args, {
    cwd: root,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function infoPlist(target) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key><string>Night Shift Connector</string>
  <key>CFBundleExecutable</key><string>Night Shift Connector</string>
  <key>CFBundleIdentifier</key><string>chatgpt.ryuko233.night-shift.connector</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Night Shift Connector</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>LSArchitecturePriority</key>
  <array><string>${target === "darwin-arm64" ? "arm64" : "x86_64"}</string></array>
</dict>
</plist>
`;
}
