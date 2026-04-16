#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const DEFAULT_ENDPOINT = "https://mcp.veyra.to/sse";
const require = createRequire(import.meta.url);

// ── Flag parsing ─────────────────────────────────────────────────────

let endpoint = process.env.VEYRA_ENDPOINT ?? DEFAULT_ENDPOINT;
const passthrough = [];
const argv = process.argv.slice(2);

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];

  if ((a === "--endpoint" || a === "-e") && argv[i + 1]) {
    endpoint = argv[++i];
    continue;
  }
  if (a.startsWith("--endpoint=")) {
    endpoint = a.slice("--endpoint=".length);
    continue;
  }

  if (a === "--help" || a === "-h") {
    process.stderr.write(
      [
        "veyrahq — local stdio proxy for the Veyra Hosted MCP Pack",
        "",
        "Usage: npx veyrahq [options]",
        "",
        "Options:",
        "  --endpoint <url>   Override the remote SSE endpoint",
        `                     Default: ${DEFAULT_ENDPOINT}`,
        "  --help, -h         Show this help",
        "",
        "MCP config (Claude Desktop / Cursor / any MCP client):",
        "",
        '  { "mcpServers": { "veyra": { "command": "npx", "args": ["veyrahq"] } } }',
        "",
        "48 functional tools. 24 free reads. 24 protected writes.",
        "https://veyra.to",
        "",
      ].join("\n"),
    );
    process.exit(0);
  }

  passthrough.push(a);
}

// ── Resolve mcp-remote binary ────────────────────────────────────────

let mcpRemoteBin;
try {
  const pkgPath = require.resolve("mcp-remote/package.json");
  const pkg = JSON.parse(
    (await import("node:fs")).default.readFileSync(pkgPath, "utf8"),
  );
  const binEntry =
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.["mcp-remote"];
  if (!binEntry) throw new Error("mcp-remote bin entry missing in package.json");
  mcpRemoteBin = path.join(path.dirname(pkgPath), binEntry);
} catch (err) {
  process.stderr.write(
    `[veyrahq] failed to locate mcp-remote: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}

// ── Spawn ────────────────────────────────────────────────────────────

const child = spawn(
  process.execPath,
  [mcpRemoteBin, endpoint, ...passthrough],
  { stdio: "inherit" },
);

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
