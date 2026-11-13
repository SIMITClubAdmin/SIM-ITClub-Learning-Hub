import type { Files } from "./mini-git";

/** Files with their own tab in the studio editor. Anything else lives only in the sandbox. */
export const EDITOR_FILES = ["index.html", "app.js", "package.json"] as const;
export type EditorFile = (typeof EDITOR_FILES)[number];

/** Folders the Git engine never tracks. */
export const IGNORED_DIRS = [".git", ".studio", "node_modules"];

export const DEV_PORT = 5173;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ITClub Portal</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #070913; color: #f8fafc; }
    main { max-width: 640px; margin: 48px auto; padding: 0 20px; }
    h1 { color: #38bdf8; letter-spacing: -0.02em; }
    button { background: #38bdf8; color: #070913; border: 0; padding: 10px 16px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <!-- navbar -->
  <main>
    <h1>ITClub Member Portal</h1>
    <p id="status">Loading...</p>
    <button id="hello">Say hello</button>
  </main>
  <!-- footer -->
  <script src="app.js"></script>
</body>
</html>
`;

const APP_JS = `// app.js runs in the browser after the page loads.
const statusEl = document.getElementById("status");
statusEl.textContent = "Portal online. Edit me, then commit and push!";

document.getElementById("hello").addEventListener("click", () => {
  statusEl.textContent = "Hello from the ITClub portal!";
});
`;

const PACKAGE_JSON = `{
  "name": "itclub-portal",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  }
}
`;

const SERVER_JS = `// A tiny static file server, so "npm run dev" needs nothing from the internet.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = ${DEV_PORT};
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(__dirname, url === "/" ? "index.html" : url);
  fs.readFile(file, (err, data) => {
    const headers = {
      "Cache-Control": "no-store",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    };
    if (err) {
      res.writeHead(404, { ...headers, "Content-Type": "text/plain" });
      res.end("404: " + url + " not found");
      return;
    }
    res.writeHead(200, { ...headers, "Content-Type": TYPES[path.extname(file)] || "text/plain" });
    res.end(data);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") console.log("Dev server is already running on port " + PORT + ".");
  else console.error(err);
});

server.listen(PORT, () => {
  console.log("");
  console.log("  \\x1b[36mITClub portal\\x1b[0m dev server ready");
  console.log("  ➜  Local:   http://localhost:" + PORT + "/");
  console.log("");
});
`;

/** The project every student starts from, and what C0 (the clone from GitHub) contains. */
export const STARTER_FILES: Files = {
  "index.html": INDEX_HTML,
  "app.js": APP_JS,
  "package.json": PACKAGE_JSON,
  "server.js": SERVER_JS,
};

export type Preset = { id: string; label: string; file: EditorFile; apply: (content: string) => string };

function insertAtMarker(content: string, marker: string, snippet: string) {
  if (content.includes(snippet.trim().split("\n")[0])) return content;
  if (content.includes(marker)) return content.replace(marker, snippet.trimEnd());
  return content.includes("</body>") ? content.replace("</body>", `${snippet}</body>`) : `${content}\n${snippet}`;
}

const NAVBAR = `<nav style="display:flex;gap:16px;align-items:center;padding:14px 24px;border-bottom:1px solid #152238;background:#0b101e;font-family:monospace">
    <strong style="color:#38bdf8">SIM ITCLUB</strong>
    <a href="#" style="color:#f8fafc">Learn</a>
    <a href="#" style="color:#f8fafc">Challenge</a>
    <a href="#" style="color:#a855f7;margin-left:auto">Sign in</a>
  </nav>
`;

const FOOTER = `<footer style="margin-top:64px;padding:18px 24px;border-top:1px solid #152238;color:#10b981;font-family:monospace;font-size:12px;letter-spacing:.08em">
    &gt; BUILT_BY_ITCLUB // STATUS: ONLINE // v1.1
  </footer>
`;

const OAUTH = `
// GitHub OAuth: send the member to GitHub to approve the login.
function loginWithGitHub() {
  const params = new URLSearchParams({
    client_id: "Iv1.itclub-demo",
    redirect_uri: location.origin + "/auth/callback",
    scope: "read:user",
  });
  statusEl.textContent = "Redirecting to github.com/login/oauth/authorize?" + params;
}
document.getElementById("hello").addEventListener("dblclick", loginWithGitHub);
`;

export const PRESETS: Preset[] = [
  { id: "navbar", label: "+ Add Navbar Component", file: "index.html", apply: (c) => insertAtMarker(c, "<!-- navbar -->", NAVBAR) },
  {
    id: "oauth",
    label: "⚡ Add GitHub OAuth Logic",
    file: "app.js",
    apply: (c) => (c.includes("function loginWithGitHub") ? c : `${c.trimEnd()}\n${OAUTH}`),
  },
  { id: "footer", label: "🎨 Add Cyber Footer", file: "index.html", apply: (c) => insertAtMarker(c, "<!-- footer -->", FOOTER) },
];

/**
 * The `git` command mounted in the WebContainer: the shared engine plus Node glue that
 * reads the real sandbox files. After every run it prints a private OSC escape
 * (ESC ] 7777 ; sync BEL) that xterm.js swallows and the studio uses to refresh the graph.
 */
export function buildGitCli(engineSource: string) {
  return `#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const createMiniGit = ${engineSource};
const git = createMiniGit();
const SKIP = new Set(${JSON.stringify(IGNORED_DIRS)});

function findRoot(dir) {
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git", "studio.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

const root = findRoot(process.cwd());
if (!root) {
  process.stdout.write("fatal: not a git repository (or any of the parent directories): .git\\n");
  process.exit(128);
}

function walk(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const rel = prefix ? prefix + "/" + entry.name : entry.name;
    if (entry.isDirectory()) walk(path.join(dir, entry.name), rel, out);
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

const io = {
  list: () => walk(root, "", []),
  read: (p) => {
    try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return null; }
  },
  write: (p, content) => {
    const file = path.join(root, p);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  },
  remove: (p) => {
    try { fs.unlinkSync(path.join(root, p)); } catch {}
  },
  now: () => Date.now(),
};

const statePath = path.join(root, ".git", "studio.json");
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const result = git.run(process.argv.slice(2), state, io);
if (result.changed) fs.writeFileSync(statePath, JSON.stringify(result.state));
process.stdout.write(result.out);
process.stdout.write("\\x1b]7777;sync\\x07");
process.exitCode = result.code;
`;
}
