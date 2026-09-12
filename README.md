# Shimmy-Browser

<div align="center">
<img width="693" height="415" alt="BrowserOS neo: the missing browser for your AI agents" src="https://github.com/user-attachments/assets/8129f9c8-e8f4-4afe-834a-91397121d833" />

<br></br>
<a href="https://discord.gg/YKwjt5vuKr"><img src="https://img.shields.io/badge/Discord-555?logo=discord" alt="Discord" /></a>
<a href="https://dub.sh/browserOS-slack"><img src="https://img.shields.io/badge/Slack-555?logo=slack" alt="Slack" /></a>
<a href="https://x.com/browserOS_ai"><img src="https://img.shields.io/badge/@browserOS__ai-555?logo=x" alt="X / Twitter" /></a>
<a href="https://github.com/browseros-ai/BrowserOS"><img src="https://img.shields.io/github/stars/browseros-ai/BrowserOS?style=flat&logo=github&label=stars&color=4c71f2" alt="GitHub stars" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-555" alt="AGPL-3.0" /></a>
<br></br>

<a href="https://www.producthunt.com/products/browseros_ai?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-browseros-neo" target="_blank" rel="noopener noreferrer"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1031913&amp;theme=dark&amp;t=1786088428884" /><img alt="BrowserOS neo - The Missing Browser for Claude, Cowork &amp; Codex | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1031913&amp;theme=light&amp;t=1786088428884" /></picture></a>
<a href="https://trendshift.io/repositories/16468?utm_source=trendshift-badge&amp;utm_medium=badge&amp;utm_campaign=badge-trendshift-16468" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/trendshift/repositories/16468/daily?language=TypeScript" alt="browseros-ai%2FBrowserOS | Trendshift" width="250" height="55"/></a>
<br></br>

<a href="https://cdn.browseros.com/download/BrowserOS_neo.dmg"><img src="https://img.shields.io/badge/Download-macOS-black?style=for-the-badge&logo=apple&logoColor=white" alt="Download for macOS" /></a>
<a href="https://cdn.browseros.com/download/BrowserOS_neo_installer.exe"><img src="https://img.shields.io/badge/Download-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download for Windows" /></a>

**[Website](https://www.browseros.com)** · **[Docs](https://docs.browseros.com)** · **[Enterprise](mailto:founders@browseros.com?subject=Enterprise%3A%20BrowserOS%20neo&body=Hi%2C%0A%0AWe%27re%20looking%20at%20BrowserOS%20neo%20for%20our%20team.%0A%0ACompany%3A%0ATeam%20size%3A%0AWhat%20we%20want%20to%20automate%3A)**

Free · Open source · Everything runs on your machine

</div>

A second browser, just for your AI agents. Import your logins from Chrome in one click, connect Claude Code, Codex, or any MCP agent, and hand off your web tasks. Agents run in parallel in their own tabs. You watch live, or replay any session like a video.

BrowserOS neo is not a Chrome replacement. It is a secondary browser that sits next to Chrome, made friendly to agents.

## Get started

### 1. Install BrowserOS neo

```sh
brew tap browseros-ai/tap
brew install --cask browseros-neo
```

Prefer a direct download? Grab it for [macOS](https://cdn.browseros.com/download/BrowserOS_neo.dmg) or [Windows](https://cdn.browseros.com/download/BrowserOS_neo_installer.exe).

### 2. Import from Chrome

One click brings over your logins, bookmarks and extensions. Your agents work with your real accounts from the first task.

### 3. Connect your agent

BrowserOS neo finds Claude Code, Codex, Cursor, VS Code, OpenClaw and Hermes on your machine. Connect any of them with one click.

### 4. Give it a task

From your agent, not from the browser:

> Book me the cheapest flight to London.

Watch it happen live in your new tab, or replay it later.

## What can your agents do?

Anything that needs a logged-in browser:

- Post content to your social media (LinkedIn, Twitter/X), queue posts, pull engagement numbers
- Clear your inbox, unsubscribe from junk email
- Update your CRM, file expenses, pull reports from internal tools

## Key features

For **local development**, you typically run three cooperating pieces:

- **Your logins.** Agents automate your real work using your logged-in accounts, not a blank sandbox. [How it works](https://docs.browseros.com/neo/how-it-works)
- **Parallel agents.** Fire off several tasks at once. Each agent works in its own tab while you keep browsing.
- **Fewer tokens.** For the same task, BrowserOS neo uses fewer tokens than the alternatives, such as Claude's Chrome extension or the Codex browser.
- **Local-only, privacy-first.** Sessions, screenshots, and history live under `~/.browserclaw/` and never leave your machine. [Privacy](https://docs.browseros.com/neo/privacy)

## Why BrowserOS neo over the alternatives?

- **Not a headless driver.** Playwright and agent-browser spin up a fresh Chrome subprocess with no logins. Great for CI, useless for real work which requires your logged-in state like "read my inbox." BrowserOS neo imports your logins with one click and persists them across sessions.
- **Not a cloud browser.** Cloud browsers (like browser-use, browserbase) run in a datacenter, so logging into your accounts is a pain, and sites like Twitter and LinkedIn block you because you are on a datacenter IP. BrowserOS neo runs on your machine, on `127.0.0.1`.
- **Not a locked-in AI browser.** Atlas, Comet, and Dia only work with their own AI. BrowserOS neo works with the agents you already use and pay for: Claude Code, Cowork, Codex, Cursor, and others.

## Also in this repo: BrowserOS

<table>
<tr>
<td width="110" align="center" valign="middle">
<img src="packages/browseros/resources/browseros/icons/product_logo_192.png" alt="" width="72" />
</td>
<td valign="middle">
<h3>BrowserOS, the AI browser for humans</h3>
A Chromium fork with an AI agent built into every new tab, for when <b>you</b> are the one browsing. Bring your own AI keys or run everything locally with Ollama.
<br><br>
<b><a href="README.BrowserOS.md">Read about BrowserOS</a></b> &nbsp;·&nbsp; <a href="https://www.browseros.com/browseros/">Website</a> &nbsp;·&nbsp; <a href="https://docs.browseros.com/browseros">Docs</a>
</td>
</tr>
</table>

## FAQ

**What's the difference between BrowserOS neo and BrowserOS?**
BrowserOS neo is a browser your AI drives. BrowserOS is a browser you drive, with an AI agent built in. Both ship from this repo and run side by side. Keep your daily browser, and let agents work in neo.

**Which AI tools work with BrowserOS neo?**
Any AI that speaks MCP. Claude Code, Codex, Cursor, VS Code, Zed, OpenCode, Hermes, OpenClaw and Antigravity connect with one click.

**Does anything leave my machine?**
Your sessions, screenshots, history, and settings live under `~/.browserclaw/` and never upload. BrowserOS neo sends anonymous product-usage events (agent connect/disconnect, version, OS) to help us improve the app; it never sends URLs, page content, prompts, tool results, or screenshots. Off with one toggle in Settings. [Full policy](https://docs.browseros.com/neo/privacy).

**Do my Chrome extensions and bookmarks work?**
Yes. Both browsers are Chromium forks, so Chrome extensions work and your bookmarks, passwords, and settings import in one click.

**What platforms are supported?**
BrowserOS neo runs on macOS and Windows. BrowserOS runs on macOS, Windows, and Linux. System requirements match Google Chrome.

## Get help

- [Discord](https://discord.gg/YKwjt5vuKr) · [Slack](https://dub.sh/browserOS-slack)
- [Report a bug](https://github.com/browseros-ai/BrowserOS/issues)
- [BrowserOS neo docs](https://docs.browseros.com) · [BrowserOS docs](https://docs.browseros.com/browseros)
- Enterprise deployment: [founders@browseros.com](mailto:founders@browseros.com?subject=Enterprise%3A%20BrowserOS%20neo&body=Hi%2C%0A%0AWe%27re%20looking%20at%20BrowserOS%20neo%20for%20our%20team.%0A%0ACompany%3A%0ATeam%20size%3A%0AWhat%20we%20want%20to%20automate%3A)

## For developers

Both browsers ship from this monorepo. Two main subsystems: the **browser** (Chromium fork, C++ and Python) and the **agent platform** (TypeScript, Rust and Go).

### Architecture

```
BrowserOS/
├── packages/browseros/              # Chromium fork + build system (Python)
│   ├── chromium_patches/            # Patches applied to Chromium source
│   ├── build/                       # Build CLI and modules
│   └── resources/                   # Icons, entitlements, signing
│
└── packages/browseros-agent/        # Agent platform (TypeScript / Rust / Go)
    ├── apps/
    │   ├── claw-server-rust/        # BrowserOS neo backend: MCP endpoint + JSON API (Rust)
    │   ├── claw-app/                # BrowserOS neo dashboard extension (WXT + React)
    │   ├── claw-onboard/            # BrowserOS neo onboarding flow (Vite)
    │   ├── server/                  # BrowserOS MCP server + AI agent loop (Bun)
    │   ├── app/                     # BrowserOS extension UI (WXT + React)
    │   ├── app-onboard/             # BrowserOS onboarding flow (Vite)
    │   └── cli/                     # CLI tool (Go)
    │
    ├── packages/                    # Shared TypeScript packages
    │   ├── acpx-ai-provider/        # AI SDK provider over the acpx ACP runtime
    │   ├── agent-mcp-manager/       # Add, link and unlink MCP servers across coding agents
    │   ├── browser-core/            # Core browser control primitives
    │   ├── browser-mcp/             # Browser MCP tool surface
    │   ├── build-server-tools/      # Shared build tooling for server binaries and assets
    │   ├── cdp-protocol/            # CDP type bindings
    │   ├── claw-api/                # Generated BrowserOS neo wire types
    │   ├── claw-api-client/         # Contract-typed BrowserOS neo HTTP client
    │   ├── onboarding-video/        # Remotion compositions for the first-run demo
    │   └── shared/                  # Shared constants
    │
    └── crates/                      # Shared Rust crates
        ├── browseros-cdp/           # CDP bindings
        ├── browseros-core/          # Core primitives
        ├── browseros-mcp/           # MCP server implementation
        ├── claw-api/                # Wire types, shared with the TypeScript package
        └── harness-integrations/    # Managed integrations for AI coding harnesses
```

| Package | What it does |
|---------|-------------|
| [`packages/browseros`](packages/browseros/) | Chromium fork: patches, build system, signing |
| [`apps/claw-server-rust`](packages/browseros-agent/apps/claw-server-rust/) | BrowserOS neo backend: MCP endpoint agents connect to, plus the API behind the dashboard |
| [`apps/claw-app`](packages/browseros-agent/apps/claw-app/) | BrowserOS neo new-tab dashboard: watch, replay, and manage agent sessions |
| [`apps/claw-onboard`](packages/browseros-agent/apps/claw-onboard/) | BrowserOS neo first-run onboarding |
| [`apps/server`](packages/browseros-agent/apps/server/) | Bun server exposing the browser MCP tools and running the BrowserOS AI agent loop |
| [`apps/app`](packages/browseros-agent/apps/app/) | BrowserOS extension: new tab, side panel chat, onboarding, settings |
| [`apps/app-onboard`](packages/browseros-agent/apps/app-onboard/) | BrowserOS first-run onboarding |
| [`apps/cli`](packages/browseros-agent/apps/cli/) | Go CLI: control BrowserOS from the terminal or AI coding agents |

### Contributing

We'd love your help making BrowserOS neo and BrowserOS better. Start with the [Contributing Guide](CONTRIBUTING.md), which routes you to the right path.

- **BrowserOS neo** (TypeScript, React, Rust): [setup guide](packages/browseros-agent/CONTRIBUTING.md). Around 15 minutes.
- **BrowserOS** (TypeScript, React, Bun): [setup guide](packages/browseros-agent/CONTRIBUTING.BrowserOS.md). Around 15 minutes.
- **Browser** (C++, Python): requires ~100GB of disk. See the [root guide](CONTRIBUTING.md#browser-development).

## Quick start (full agent stack)

From the **repository root**:

```bash
cd packages/browseros-agent
bun install
cp apps/server/.env.example apps/server/.env.development
cp apps/agent/.env.example apps/agent/.env.development
# Edit BOTH files so BROWSEROS_SERVER_PORT, BROWSEROS_CDP_PORT (and Vite URL/port) agree.
```

Then either:

BrowserOS neo and BrowserOS are open source under the [AGPL-3.0 license](LICENSE).

```bash
# From repo root
bun run dev
```

This runs `packages/browseros-agent/scripts/dev/stack.ts`, which:

1. Loads `packages/browseros-agent/apps/agent/.env.development`.
2. Starts **`bun run --filter @browseros/agent dev`** (WXT dev server + Chromium with the extension).
3. Waits until **CDP** responds on `http://127.0.0.1:<BROWSEROS_CDP_PORT>/json/version`.
4. Starts **`bun run --filter @browseros/server start`**.

Press **Ctrl+C** to stop both processes.

**Option B — from `packages/browseros-agent` only**

```bash
cd packages/browseros-agent
bun run dev
```

(`dev`, `start`, and `dev:stack` in that `package.json` point at the same stack script.)

**VS Code:** Run the task **“Dev: full stack (agent + browser + server)”** (`.vscode/tasks.json`) which executes `bun run dev` at the workspace root.

---

## Agent platform (`packages/browseros-agent`)

The agent monorepo follows upstream BrowserOS structure. Official package READMEs with extra detail:

- [`packages/browseros-agent/README.md`](packages/browseros-agent/README.md)
- [`packages/browseros-agent/apps/server/README.md`](packages/browseros-agent/apps/server/README.md)
- [`packages/browseros-agent/apps/agent/README.md`](packages/browseros-agent/apps/agent/README.md)

### Apps and packages

| Path | Technology | Purpose |
|------|------------|---------|
| `apps/server` | Bun, Hono, Vercel AI SDK | HTTP API, MCP surfaces, agent loop, CDP client, SQLite sessions, skills/memory tooling |
| `apps/agent` | WXT, Vite, React | Extension UI: `app` full page, side panel, background worker, new tab, onboarding, options |
| `apps/cli` | Go + npm shim | `browseros-cli` — terminal control of a running BrowserOS instance |
| `apps/eval` | TypeScript | Benchmarks / evaluation harness |
| `packages/shared` | TypeScript | Cross-package constants (e.g. limits, public URLs) |
| `packages/cdp-protocol` | TypeScript | CDP typings / codegen consumed by the server |
| `packages/agent-sdk` | TypeScript | Published SDK for automation scenarios |

### Ports and environment variables

Upstream docs often cite defaults like **9100** (HTTP) and **9000** (CDP). **Your fork may use different values** (for example **9111** / **9333**) as long as **server** and **agent** configs **match**.

**Keep in sync:**

- `packages/browseros-agent/apps/server/.env.development`
- `packages/browseros-agent/apps/agent/.env.development`

**Important variables:**

| Variable | Typical role |
|----------|----------------|
| `BROWSEROS_SERVER_PORT` | Port for the Bun server (MCP, chat, health, …). |
| `BROWSEROS_CDP_PORT` | Remote debugging port for Chromium — server connects **to** this. |
| `BROWSEROS_EXTENSION_PORT` | Legacy CLI compatibility; may still be passed to launches. |
| `VITE_PUBLIC_BROWSEROS_API` | Used by the extension for auth/GraphQL/product URLs in production-like setups; in local dev, **the hostname/port must be consistent** with where the server listens. |
| `VITE_BROWSEROS_SERVER_PORT` | Used by the Vite bundle for API base URL construction in development; the stack script sets it from your env when starting. |
| `BROWSEROS_BINARY` | Path to BrowserOS/Chromium binary when not using pure stock Chrome. |

The extension resolves local server port with precedence implemented in `apps/agent/lib/browseros/helpers.ts`: prefer the port embedded in **`VITE_PUBLIC_BROWSEROS_API`**, then **`VITE_BROWSEROS_SERVER_PORT`**, then adapter defaults — so **avoid contradicting URLs** between env vars.

Copy examples:

- `apps/server/.env.example` → `apps/server/.env.development`
- `apps/agent/.env.example` → `apps/agent/.env.development`

### Development workflows

1. **Full stack (this fork):** `bun run dev` from repo root or `packages/browseros-agent` (see [Quick start](#quick-start-full-agent-stack)).

2. **Manual two-process:**  
   - Terminal A: `bun run start:agent` (under `packages/browseros-agent`)  
   - Terminal B: after CDP is up, `bun run start:server`  

3. **process-compose:** If you use [process-compose](https://github.com/F1bonacc1/process-compose), see `packages/browseros-agent/process-compose.yaml`. Note: the checked-in file may only define a subset of processes; you can extend it locally to mirror the stack script.

### Useful scripts

Run from **`packages/browseros-agent`** unless noted:

| Script | Purpose |
|--------|---------|
| `bun run dev` / `start` / `dev:stack` | Full stack via `scripts/dev/stack.ts` |
| `bun run start:server` | Server only |
| `bun run start:agent` | WXT + browser dev only |
| `bun run build` | Build pipeline as defined in this fork’s `package.json` (includes Windows-oriented server build + agent build) |
| `bun run build:agent` | Codegen + production agent build |
| `bun run lint` / `lint:fix` | Biome |
| `bun run typecheck` | TypeScript across workspaces |
| `bun run test` | Server tests (see package.json for filters) |

---

## Browser (`packages/browseros`)

This package is the **Chromium-based BrowserOS browser**: patch set, **Python** CLI (`browseros`), resources, and packaging.

### What the build system needs

- **A full Chromium checkout** at a path you provide (`chromium_src` in config, or `--chromium-src`, or `CHROMIUM_SRC` environment variable). There is **no** supported path to produce the real BrowserOS browser **without** Chromium sources — disk and time costs are significant.

### Typical CLI flow

```bash
cd packages/browseros
pip install -e .
# or: uv pip install -e .

browseros setup    # fetch/prepare Chromium (per project docs)
browseros apply    # apply patches
browseros build    # compile
browseros package  # DMG / installer / AppImage / etc.
browseros sign     # platform-specific signing
```

Pinned version files:

- `CHROMIUM_VERSION` — e.g. **146.0.7680.31** (see file for current pin)
- `BASE_COMMIT` — exact Chromium baseline

### Windows note (Python console)

When running Python CLI output that emits Unicode, set UTF-8 mode if you hit encoding errors, e.g. PowerShell:

```powershell
$env:PYTHONUTF8 = '1'
```

More detail: [`packages/browseros/README.md`](packages/browseros/README.md).

---

## Sup-agent submodule

**Sup-agent** is a **separate Git repository** linked as a submodule at:

`packages/browseros-agent/vendor/sup-agent`

### Why it exists here

- **Default skill content** for the agent is imported from paths under the submodule, e.g. `apps/server/src/skills/defaults/index.ts` imports `SKILL.md` files from  
  `vendor/sup-agent/apps/server/src/skills/defaults/...`.
- Scripts such as `packages/browseros-agent/scripts/upload-skills-catalog.ts` reference the same tree.
- Memory tooling may keep **legacy naming** compatible with Sup-agent workflows (see server `tools/memory` sources).

### Initializing and updating

After clone:

```bash
git submodule update --init --recursive
```

To move the submodule forward when you intend to track newer commits:

```bash
git submodule update --remote --merge packages/browseros-agent/vendor/sup-agent
# Then commit the updated submodule pointer in the parent repo.
```

**Canonical workflow** (independent repos, pointer commits): see **[`docs/submodule-workflow.md`](docs/submodule-workflow.md)**.

### Tests

`packages/browseros-agent/bunfig.toml` sets test `pathIgnorePatterns` to ignore `**/vendor/**` so Bun does **not** run Sup-agent’s own tests inside this monorepo; skill **files** are still loaded for BrowserOS.

---

## Documentation in this repo

| Doc | Topic |
|-----|--------|
| [`docs/submodule-workflow.md`](docs/submodule-workflow.md) | Sup-agent submodule rules |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Upstream contribution paths (agent vs browser) |
| [`packages/browseros/README.md`](packages/browseros/README.md) | Chromium build |
| [`packages/browseros-agent/README.md`](packages/browseros-agent/README.md) | Agent monorepo |
| [`CLAUDE.md`](CLAUDE.md) (repo / packages) | Project-specific AI assistant notes |

Public product documentation for end users remains at **[docs.browseros.com](https://docs.browseros.com)**.

---

## Quality checks (Biome, Lefthook)

- **Biome** — formatting and lint (`bun run lint` in `packages/browseros-agent`).
- **Lefthook** — Git hooks (see `lefthook.yml`): Conventional Commits for commit messages, Biome on pre-commit, branch name hints on pre-push.

On **Windows**, corporate **Application Control** may block `lefthook.exe`; you may need an admin allowlist. Hooks often assume a Unix-like shell for some commands — using **Git Bash** or **WSL** for git commits can avoid edge cases.

---

## Git: fork, upstream, and submodules

This repo is suitable as a **personal or team fork** of BrowserOS.

| Remote | Typical use |
|--------|-------------|
| `origin` | Your fork (e.g. **Shimmy-Browser** on GitHub). |
| `upstream` | Optional second remote if you merge changes from another BrowserOS fork or the original project (use that project’s documented clone URL). |

Submodule URL is recorded in `.gitmodules` (Sup-agent). After pulling parent changes, run **`git submodule update --init --recursive`** so `vendor/sup-agent` matches the committed SHA.

---

## Troubleshooting

| Symptom | Likely cause | What to check |
|---------|----------------|---------------|
| “Connection failed” / Failed to fetch in Connect Apps | Server not running or **wrong port** vs extension | Same `BROWSEROS_SERVER_PORT` / API URL in agent + server env; hit `/health` on the server port. |
| Health: CDP not connected | Browser closed, wrong `BROWSEROS_CDP_PORT`, or server started before CDP | Start order: browser with debugging port **before** or **with** server; use `stack.ts` |
| Blank extension UI | Stale Vite client, uncaught React error, or unresolved imports | Re-run `bun install` in `packages/browseros-agent`; restart dev stack; check browser console |
| Vite “Failed to resolve import `@browseros/shared/...`” | Workspace deps out of date | `bun install` at `packages/browseros-agent` |
| Browser build: “chromium_src required” | No Chromium tree configured | Provide Chromium source path per `packages/browseros` README |
| `UnicodeEncodeError` in Python on Windows | Console encoding | `PYTHONUTF8=1` |

---

## License and credits

- **Shimmy-Browser** inherits licensing from upstream BrowserOS; see the **[`LICENSE`](LICENSE)** file in this repository (AGPL-3.0).
- BrowserOS credits **ungoogled-chromium** and **The Chromium Project**; see the upstream README and `LICENSE.ungoogled_chromium` where applicable.

---

## Relationship to upstream BrowserOS

Feature lists, download badges, and comparisons in the **upstream** BrowserOS README still apply at a product level. This file focuses on **this repo’s layout**, **fork-specific automation** (`bun run dev` / `stack.ts`), **Sup-agent**, and **how the browser package and agent monorepo fit together**. For this fork’s source and releases, see **[Karthikprasadm/Shimmy-Browser](https://github.com/Karthikprasadm/Shimmy-Browser)** and **[docs.browseros.com](https://docs.browseros.com)**.
