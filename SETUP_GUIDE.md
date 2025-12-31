# Manual Installation Requirements for BrowserOS

This guide lists everything you need to install manually to run both the BrowserOS browser and the AI agent.

## 📋 Quick Overview

| Component | Requirements | Time to Setup |
|-----------|-------------|---------------|
| **Browser (Chromium Build)** | ~100GB disk, 16GB+ RAM, Build tools | 3+ hours |
| **AI Agent** | Bun runtime, ~500MB disk | 10 minutes |

---

## 🤖 AI Agent Setup (BrowserOS-agent)

### Required Installations

#### 1. **Bun Runtime** (Required)
- **Version**: 1.3.5 (as specified in package.json)
- **Installation**:
  ```bash
  # Windows (PowerShell)
  powershell -c "irm bun.sh/install.ps1 | iex"
  
  # macOS/Linux
  curl -fsSL https://bun.sh/install | bash
  ```
- **Why**: The agent uses Bun instead of Node.js/npm/yarn
- **Verify**: `bun --version` should show 1.3.5+

#### 2. **Git** (Required)
- **Why**: To clone and manage the repository
- **Installation**: 
  - Windows: Download from [git-scm.com](https://git-scm.com/download/win)
  - macOS: `xcode-select --install`
  - Linux: `sudo apt install git` (Ubuntu/Debian)

#### 3. **Chrome/Chromium Browser** (Required)
- **Why**: To load and test the extension
- **Note**: BrowserOS itself can be used, or any Chromium-based browser for development

### Optional (for full functionality)

#### 4. **Python 3.12+** (Optional - for build scripts)
- **Why**: Some utility scripts may use Python
- **Installation**: 
  - Windows: [python.org/downloads](https://www.python.org/downloads/)
  - macOS: `brew install python@3.12`
  - Linux: `sudo apt install python3.12`

---

## 🌐 Browser Build Setup (BrowserOS)

### Required Installations

#### 1. **Python 3.12+** (Required)
- **Why**: Build system is written in Python
- **Installation**: Same as above
- **Verify**: `python --version` or `python3 --version`

#### 2. **Platform-Specific Build Tools**

##### **Windows:**
- **Visual Studio 2022** (Community, Professional, or Enterprise)
  - Download: [Visual Studio Community 2022](https://visualstudio.microsoft.com/downloads/) (Free)
  
- **Required Workload:**
  - **"Desktop development with C++"** (This is the main workload you need to select)
  
- **Required Components** (automatically included with the workload, but verify these are selected):
  - **MSVC v143 - VS 2022 C++ x64/x86 build tools** (latest)
  - **Windows 10 SDK** (version 10.0.19041.0 or later) - or Windows 11 SDK
  - **Windows 11 SDK** (recommended, includes Windows 10 SDK compatibility)
  - **C++ CMake tools for Windows** (optional but recommended)
  
- **Installation Steps:**
  1. Download and run Visual Studio Installer
  2. Select "Desktop development with C++" workload
  3. In the "Installation details" panel on the right, ensure:
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
     - ✅ Windows 11 SDK (or Windows 10 SDK 10.0.19041.0+)
     - ✅ C++ CMake tools for Windows (recommended)
  4. Click "Install" or "Modify"
  
- **Disk Space:** ~6-8 GB for the C++ workload

##### **macOS:**
- **Xcode** (latest version)
  - Install from App Store
- **Command Line Tools**
  ```bash
  xcode-select --install
  ```

##### **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
  build-essential \
  git \
  python3 \
  python3-dev \
  python3-pip \
  curl \
  lsb-release \
  gnupg \
  ca-certificates
```

#### 3. **Depot Tools** (Required for Chromium)
- **Why**: Google's toolchain for Chromium development
- **Where to Clone**: You can clone it anywhere, but recommended locations:
  - **Windows**: `C:\dev\depot_tools` or `D:\dev\depot_tools` (create a `dev` folder for development tools)
  - **macOS/Linux**: `~/depot_tools` or `~/dev/depot_tools`
  
- **Installation Steps**:

  **Windows (PowerShell):**
  ```powershell
  # 1. Create a directory for development tools (if it doesn't exist)
  New-Item -ItemType Directory -Force -Path "C:\dev"
  
  # 2. Navigate to it
  cd C:\dev
  
  # 3. Clone depot_tools
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
  
  # 4. Add to PATH permanently (PowerShell as Administrator)
  # Option A: Using System Properties GUI (Recommended)
  # - Press Win + X, select "System"
  # - Click "Advanced system settings"
  # - Click "Environment Variables"
  # - Under "System variables", select "Path" and click "Edit"
  # - Click "New" and add: C:\dev\depot_tools
  # - Click "OK" to save
  # - IMPORTANT: Put it at the TOP of the list (use "Move Up" button)
  
  # Option B: Using PowerShell (Run as Administrator)
  [Environment]::SetEnvironmentVariable(
    "Path",
    "C:\dev\depot_tools;" + [Environment]::GetEnvironmentVariable("Path", "Machine"),
    "Machine"
  )
  
  # 5. Close and reopen your terminal/PowerShell
  # 6. Verify installation
  gclient --version
  ```

  **macOS/Linux:**
  ```bash
  # 1. Clone to home directory
  cd ~
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
  
  # 2. Add to PATH (add to ~/.bashrc or ~/.zshrc)
  echo 'export PATH="$HOME/depot_tools:$PATH"' >> ~/.bashrc
  # OR for zsh:
  # echo 'export PATH="$HOME/depot_tools:$PATH"' >> ~/.zshrc
  
  # 3. Reload shell configuration
  source ~/.bashrc  # or source ~/.zshrc
  
  # 4. Verify installation
  gclient --version
  ```

- **Important Notes**:
  - **Depot tools MUST be at the BEGINNING of your PATH** (highest priority)
  - This prevents conflicts with other Python/Node.js tools
  - After adding to PATH, **close and reopen** your terminal
  - The first run of `gclient` will download additional dependencies

#### 4. **Chromium Source Code** (Required)
- **Size**: ~100GB disk space
- **Time**: 2-3 hours to download
- **Setup**: Follow [Chromium: Get the Code](https://www.chromium.org/developers/how-tos/get-the-code/)
- **Why**: BrowserOS patches Chromium source code

### System Requirements

- **Disk Space**: ~100GB free (for Chromium source + build artifacts)
- **RAM**: 16GB+ recommended (8GB minimum)
- **Time**: 3+ hours for first build (depends on hardware)

---

## 📦 Python Dependencies (Auto-installed)

These will be installed automatically when you run setup commands:

### Browser Build System (`packages/browseros/`)
```bash
cd packages/browseros
pip install -r requirements.txt
# Or using uv (if available)
uv pip install -r requirements.txt
```

**Dependencies:**
- click>=8.0.0
- typer>=0.12.0
- PyYAML>=5.4.1
- requests>=2.25.1
- boto3>=1.34.0 (for AWS S3 uploads)
- python-dotenv>=1.0.0
- Pillow>=10.0.0 (for image processing)

**Dev Dependencies:**
- ruff>=0.14.7 (linter)
- pyright>=1.1.390 (type checker)

### Agent Dependencies (Auto-installed via Bun)
All Node.js/TypeScript dependencies are automatically installed when you run:
```bash
cd Sup-agent
bun install
```

---

## ⚠️ AI Model Requirements

**Important:** The BrowserOS AI agent and browser only support AI models that meet specific parameters:

### Required Feature: Tool Use (Function Calling)

The agent requires models that support **tool use** (also called "function calling"). This is essential for the agent to:
- Execute browser automation tasks
- Interact with web pages
- Use MCP (Model Context Protocol) tools
- Perform complex multi-step operations

### ✅ Compatible Models

**Cloud Providers:**
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 (all variants: Haiku, Sonnet, Opus)
- **Google**: Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0
- **OpenRouter**: Any model with "tools" in Supported Parameters (check [OpenRouter Models](https://openrouter.ai/models))

**Local Models:**
- **Ollama**: Models that support function calling (check model documentation)
- **LM Studio**: Models with function calling support

### ❌ Incompatible Models

Models that **do not** support tool use will not work and will show errors like:
- `"No endpoints found that support tool use"`
- `"[404] No endpoints found that support tool use"`

### How to Verify Model Support

#### On OpenRouter:

1. Go to [OpenRouter Models](https://openrouter.ai/models)
2. Look for the **"Supported Parameters"** filter section (usually on the left sidebar or in the filter area)
3. Check the **"tools"** checkbox - you'll see a checkmark (✓) appear when it's selected
4. The models list will automatically filter to show only models that support tool use
5. Look for models with "(free)" in the name if you want free options
6. Click on a model to see its details and copy the model ID
7. Use this model ID when configuring the provider in the extension

**Example:** After filtering, you might see models like:
- `google/gemini-1.5-flash` (if available)
- `anthropic/claude-3-haiku` (if available)
- Other models with tool use support

#### Other Providers:

- **Provider Documentation**: Check if the model supports "function calling" or "tool use"
- **Test in Extension**: Configure the model and check for tool use errors

### Configuration

Configure your model in the extension:
1. Open extension Options
2. Go to AI Settings
3. Add a provider with a tool-use-compatible model
4. Set as default provider

**📋 Verified Models:** See [validated_agents.md](../validated_agents.md) for a list of tested and verified models that work well with BrowserOS.

## 🚀 Quick Start Commands

### For AI Agent Only:
```bash
# 1. Install Bun (if not installed)
# See Bun installation above

# 2. Navigate to agent
cd Sup-agent

# 3. Install dependencies
bun install

# 4. Create environment file (if not exists)
# The .env.development file should already exist with default ports
# Edit it if you need to change ports or add API keys

# 5. Start server
bun run start:server

# 6. Build extensions (in another terminal or after server starts)
bun run build:agent    # Build agent UI extension
bun run build:ext      # Build controller extension

# 7. Load extensions in Chrome/Chromium
# - Open chrome://extensions/
# - Enable Developer mode
# - Load unpacked:
#   1. Agent UI: Sup-agent/apps/agent/dist/chrome-mv3
#   2. Controller: Sup-agent/apps/controller-ext/dist

# 8. Test the agent
# - Click extension icon or press Alt+A to open side panel
# - Configure AI provider in Options → AI Settings
# - Try keyboard shortcuts: Alt+A/K (toggle), Alt+L (cycle providers)
# - Start chatting!
```

### For Browser Build:
```bash
# 1. Install all prerequisites above
# 2. Get Chromium source (follow Chromium guide)
# 3. Navigate to build system
cd packages/browseros

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Build (example for Windows debug)
python build/build.py \
  --config build/config/debug.windows.yaml \
  --chromium-src /path/to/chromium/src \
  --build
```

---

## ✅ Verification Checklist

Before starting development, verify you have:

### For Agent:
- [ ] Bun 1.3.5+ installed (`bun --version`)
- [ ] Git installed (`git --version`)
- [ ] Chrome/Chromium browser installed
- [ ] Dependencies installed (`cd Sup-agent && bun install`)

### For Browser:
- [ ] Python 3.12+ installed (`python --version`)
- [ ] Platform build tools installed (VS2022/Xcode/build-essential)
- [ ] Depot tools installed and in PATH
- [ ] Chromium source downloaded (~100GB)
- [ ] Python dependencies installed (`pip install -r requirements.txt`)

---

## 🔧 Troubleshooting

### Bun not found
- Make sure Bun is in your PATH
- Restart terminal after installation
- Windows: May need to restart PowerShell/CMD

### Python version issues
- Use `python3` instead of `python` on some systems
- Consider using `pyenv` to manage Python versions

### Build failures
- Ensure you have enough disk space (100GB+)
- Check RAM availability (16GB+ recommended)
- Verify all build tools are properly installed
- Check Chromium build requirements for your platform

### Port conflicts
The agent uses these ports (configurable via environment):
- **9105**: Server HTTP port (default in development)
- **9005**: CDP port (default in development)
- **9305**: Extension WebSocket port (default in development)

Make sure these ports are available or configure different ports in `.env.development`.

### Extension Loading Issues

**Side panel not opening:**
1. Ensure both extensions are loaded (Agent UI and Controller)
2. Reload both extensions in `chrome://extensions/`
3. Try keyboard shortcuts: **Alt+A** or **Alt+K** to toggle side panel
4. Check browser console (F12) for errors

**Keyboard shortcuts not working:**
1. Reload the Agent extension
2. Check `chrome://extensions/shortcuts` to verify shortcuts are registered
3. Disable conflicting extensions temporarily
4. Restart the browser if issues persist

**WebSocket connection errors:**
1. Verify server is running: `curl http://localhost:9105/health`
2. Check `.env.development` port configuration matches server
3. Ensure firewall allows localhost connections
4. Check browser console for specific error messages

### Model Configuration Issues

**"No endpoints found that support tool use":**
- The model doesn't support function calling
- Use a model from [validated_agents.md](validated_agents.md)
- Filter OpenRouter models by "tools" parameter

**Rate limiting errors:**
- Free models may have rate limits
- Wait a few minutes and try again
- Consider using a different free model or upgrading to a paid tier

**API key errors:**
- Verify your API key is correct
- Check key has sufficient credits/quota
- For OpenRouter, ensure key is valid and active

**"[404] No endpoints found that support image input":**
- The model doesn't support vision/image inputs
- Use a model that supports vision (e.g., Gemini models)
- Check [validated_agents.md](validated_agents.md) for vision-capable models
- Filter OpenRouter models by "vision" or "image" parameter

### Browser Action Issues

**Actions fail in regular Chrome:**
- All actions now have fallback implementations for regular Chrome
- The controller extension automatically uses fallbacks when BrowserOS APIs aren't available
- No special configuration needed - works out of the box

**"No focusable element found" (typeAtCoordinates):**
- Ensure coordinates point to an actual input field
- Try using `browser_type_text` with nodeId instead (requires `getInteractiveSnapshot` first)
- Verify element is visible and not disabled

**"Content Security Policy (CSP) blocks JavaScript execution":**
- Some pages have strict CSP that blocks `eval()` and `Function()` constructor
- This is a browser security feature and cannot be bypassed
- Error message will clearly indicate CSP violation
- Try executing JavaScript on a different page without strict CSP

**Actions fail on protected pages (chrome://, extension://):**
- Protected pages automatically return safe defaults instead of errors
- `getPageLoadStatus` returns tab status
- `getSnapshot` returns empty snapshot
- `executeJavaScript` returns clear error message
- This is expected behavior due to browser security restrictions

**Element not found errors:**
- Always call `getInteractiveSnapshot` first to populate element cache
- NodeIds are only valid for the current page state
- Refresh snapshot if page content changes dynamically
- Ensure element is visible and not hidden by CSS

---

## 📚 Additional Resources

- [BrowserOS Contributing Guide](CONTRIBUTING.md)
- [Agent README](Sup-agent/README.md)
- [Chromium Build Instructions](https://www.chromium.org/developers/how-tos/get-the-code/)
- [Bun Documentation](https://bun.sh/docs)

---

## 🎯 Recommended Development Path

1. **Start with Agent** (easier, faster setup)
   - Install Bun
   - Clone repository
   - Run `bun install` in `Sup-agent`
   - Start developing!

2. **Browser Build** (only if needed)
   - Only necessary if modifying Chromium patches
   - Requires significant time and resources
   - Most contributors work on agent only

