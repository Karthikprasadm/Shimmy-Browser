# Contributing to BrowserOS

Hey there! Thanks for your interest in BrowserOS. Whether you're fixing bugs, adding features, improving docs, or just poking around the code, we're glad you're here.

BrowserOS is a monorepo with two main parts:
- **Agent** - The Chrome extension with AI features (TypeScript/React)
- **Browser** - The custom Chromium build (C++/Python)

Most folks start with the agent since it's way easier to set up and iterate on.

## Pick Your Path

<table>
<tr>
<td width="50%">

### 🤖 Agent Development

**What you'll work on:**
- AI agent features & tools
- UI/UX improvements
- Browser automation
- Testing & docs

**What you need:**
- Bun 1.3.5+ (not Node.js)
- ~500MB disk space
- 10 minutes to set up

**Skills:** TypeScript, React, Chrome APIs, Bun runtime

**[→ Agent Setup](#agent-development)**

</td>
<td width="50%">

### 🌐 Browser Development

**What you'll work on:**
- Chromium patches
- Build system
- Platform features
- Core browser stuff

**What you need:**
- ~100GB disk space
- 16GB+ RAM (recommended)
- 3+ hours for first build

**Skills:** C++, Python, Chromium internals

**[→ Browser Setup](#browser-development)**

</td>
</tr>
</table>

## Agent Development

The agent is a Chrome extension that provides AI-powered automation. Most contributors work here.

### Quick Setup

```bash
# 1. Navigate to agent directory
cd Sup-agent

# 2. Install dependencies
bun install

# 3. Set up environment (if needed)
# The .env.development file should already exist
# Edit it to configure ports or add API keys

# 4. Build the extensions
bun run build:agent    # Build agent UI extension
bun run build:ext      # Build controller extension

# 5. Start the server
bun run start:server
```

### Load in Browser/Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Load **TWO extensions**:
   - Agent UI: `Sup-agent/apps/agent/dist/chrome-mv3`
   - Controller: `Sup-agent/apps/controller-ext/dist`
5. Open the agent panel:
   - Click the "Ask BrowserOS" icon, OR
   - Press **Alt+A** or **Alt+K** (keyboard shortcuts)

### Development Workflow

```bash
# Start server in one terminal
bun run start:server

# In another terminal, build extensions (watch mode available)
bun run build:agent    # One-time build
bun run build:ext      # One-time build

# Or use dev mode (if available)
bun run start:agent    # Dev mode with hot reload
```

**For detailed setup, architecture, and code standards, see [Agent README](Sup-agent/README.md).**

## Browser Development

Building the custom Chromium browser requires significant disk space and time. Only go down this path if you're working on browser-level features like patches to Chromium itself.

### Prerequisites

- **~100GB disk space** for Chromium source
- **16GB+ RAM** (recommended)
- **Platform tools:**
  - macOS: Xcode + Command Line Tools
  - Linux: build-essential and dependencies
  - Windows: Visual Studio Build Tools

### Quick Setup

**1. Checkout Chromium source**

First, follow the official Chromium guide for your platform:
- **[Chromium: Get the Code](https://www.chromium.org/developers/how-tos/get-the-code/)**

This will set up `depot_tools` and fetch the ~100GB Chromium source tree. This typically takes 2-3 hours depending on your internet speed.

**2. Build BrowserOS**

Once you have Chromium checked out, navigate to our build system:

```bash
cd packages/browseros

# Debug build (for development)
# macOS
python build/build.py --config build/config/debug.macos.yaml --chromium-src /path/to/chromium/src --build

# Linux
python build/build.py --config build/config/debug.linux.yaml --chromium-src /path/to/chromium/src --build

# Windows
python build/build.py --config build/config/debug.windows.yaml --chromium-src /path/to/chromium/src --build

# Release build (for production)
# macOS
python build/build.py --config build/config/release.macos.yaml --chromium-src /path/to/chromium/src --build

# Linux
python build/build.py --config build/config/release.linux.yaml --chromium-src /path/to/chromium/src --build

# Windows
python build/build.py --config build/config/release.windows.yaml --chromium-src /path/to/chromium/src --build
```

The build typically takes 1-3 hours on modern hardware (M4 Max, Ryzen 9, etc.).

**For detailed instructions, see [Browser Build Guide](docs/BUILD.md).**

## Making Your First Contribution

Open a PR on GitHub with:
- **Clear title** in conventional commit format
- **Description** explaining what changed and why
- **Screenshots/videos** for UI changes
- **Link to related issues** (e.g., "Fixes #123")

### Sign the CLA

On your first PR, our bot will ask you to sign the Contributor License Agreement:

1. Read the [CLA document](CLA.md)
2. Comment on your PR: `I have read the CLA Document and I hereby sign the CLA`
3. The bot will record your signature (one-time thing)

## Code Standards

### TypeScript (Agent)

- **Strict typing** - Always declare types, avoid `any`
- **Zod schemas** - Use Zod instead of TypeScript interfaces
- **Path aliases** - Use `@/lib` not relative paths like `../`
- **Naming:**
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPERCASE`
  - Private methods: prefix with `_`

Example:
```typescript
import { z } from 'zod'

// Good: Zod schema with inline comments
export const ToolInputSchema = z.object({
  action: z.enum(['click', 'type']),  // Action to perform
  target: z.string().min(1),  // Element selector
  timeout: z.number().default(5000)  // Timeout in ms
})

export type ToolInput = z.infer<typeof ToolInputSchema>
```

### React (Agent UI)

- **Styling:** Tailwind CSS only (no SCSS or CSS modules)
- **Hooks:** Only at top level
- **Props:** Define with Zod schemas
- **Testing:** Vitest (not Jest)

### General

- Keep functions short (<20 lines ideally)
- Write tests for new features
- Use descriptive variable names
- Handle errors gracefully

**For detailed standards:**
- Agent: [packages/browseros-agent/CLAUDE.md](packages/browseros-agent/CLAUDE.md)
- Browser: Follow Chromium style guide

## Project Structure

```
monorepo/
├── packages/
│   └── browseros/              # Chromium build system
│       ├── build/             # Python build scripts
│       ├── chromium_patches/  # Patches to Chromium source
│       └── resources/         # Icons, configs
│
├── Sup-agent/                  # AI Agent (Git submodule)
│   ├── apps/
│   │   ├── server/            # Bun server (MCP + agent loop)
│   │   ├── agent/             # Agent UI (Chrome extension)
│   │   └── controller-ext/    # Controller extension
│   └── packages/
│       └── shared/            # Shared constants
│
├── docs/                       # General documentation
└── CONTRIBUTING.md            # This file
```

## Recent Fixes & Improvements

### Side Panel & Keyboard Shortcuts
- ✅ Fixed side panel opening issues (user gesture requirement)
- ✅ Added keyboard shortcuts: Alt+A/K (toggle), Alt+L (cycle providers)
- ✅ Improved fallback for regular Chrome (BrowserOS-specific APIs gracefully degrade)

### Browser Automation Actions (Regular Chrome Support)
- ✅ **Screenshot**: Works in regular Chrome via `chrome.tabs.captureVisibleTab()`
- ✅ **Interactive Elements**: Fallback using content scripts for DOM querying
- ✅ **Page Content**: Fallback for text and links extraction
- ✅ **Page Load Status**: Fallback using tab status and `document.readyState`
- ✅ **Click Element**: Fallback using content scripts and element matching
- ✅ **Type Text**: Fallback for input/textarea/contenteditable elements
- ✅ **Clear Input**: Fallback for clearing input fields
- ✅ **Scroll**: Fallback using keyboard events and `window.scrollBy()`
- ✅ **Click Coordinates**: Fallback using MouseEvent simulation
- ✅ **Type at Coordinates**: Fallback with element finding and typing
- ✅ **Execute JavaScript**: Fallback with CSP-aware execution (limited by page CSP)
- ✅ **Protected URL Detection**: Automatic detection of `chrome://`, `extension://`, etc.

### Extension Loading
- ✅ Fixed CSP issues with SVG imports (using `?url` suffix)
- ✅ Fixed accessibility warnings (aria-labelledby)
- ✅ Improved WebSocket error handling
- ✅ Protected page handling (returns safe defaults instead of errors)

### Model Configuration
- ✅ Added validation for tool use support
- ✅ Created validated_agents.md with tested models
- ✅ Improved error messages for incompatible models
- ⚠️ **Vision Support**: Some models require vision/image input support for screenshots

## Ways to Contribute

You don't need to write code to help out! Here are other ways:

### 🐛 Report Bugs

Found a bug? [Open an issue](https://github.com/browseros-ai/BrowserOS/issues/new) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos
- Environment details (OS, browser version, BrowserOS version)
- Console errors (F12 → Console tab)

### 💡 Suggest Features

Have an idea? [Share it here](https://github.com/browseros-ai/BrowserOS/issues/99) or chat with us on [Discord](https://discord.gg/YKwjt5vuKr).

### 📚 Improve Documentation

- Write blog posts or guides

### 🧪 Test & Provide Feedback

- Try new features
- Test on different platforms
- Report edge cases
- Share your use cases

### 🎨 Design & UX

- Suggest UI improvements
- Create mockups
- Improve accessibility
- Enhance user experience

## Getting Help

Stuck? Need clarification? We're here to help.

- **[Discord](https://discord.gg/YKwjt5vuKr)** - Real-time chat and support
- **[GitHub Issues](https://github.com/browseros-ai/BrowserOS/issues)** - Bug reports and features
- **[GitHub Discussions](https://github.com/browseros-ai/BrowserOS/discussions)** - General questions

## Recognition

We appreciate all contributors! You'll get:
- Credits in release notes
- Name in README

## License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.

---

Built with ❤️ from San Francisco

Questions? Hit us up on [Discord](https://discord.gg/YKwjt5vuKr) or [Twitter](https://twitter.com/browseros_ai).