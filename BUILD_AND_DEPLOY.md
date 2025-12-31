# Build & Deploy BrowserOS Browser

**Everything you need to build and launch BrowserOS.**

## 🎯 Overview

**BrowserOS** = Browser (Chromium fork)  
**BrowserOS Agent** = AI Agent (Chrome extension + server)

## 📋 Prerequisites Checklist

### ✅ Already Installed
- [x] Git
- [x] Python 3.12+
- [x] Visual Studio 2026 (with C++ workload)
- [x] Depot Tools (`C:\Users\manju\depot_tools`)
- [x] Git config optimized for Chromium

### ⏳ Still Needed
- [ ] Chromium source code (~100GB, 2-3 hours download)
- [ ] Bun runtime (for agent)
- [ ] ~100GB free disk space
- [ ] 16GB+ RAM

## 🚀 Step-by-Step Build Process

### Phase 1: Get Chromium Source Code

**This is the big download (~100GB, 2-3 hours)**

```powershell
# 1. Create a directory for Chromium (needs ~100GB free space)
# Choose a drive with enough space (D: drive recommended)
New-Item -ItemType Directory -Force -Path "D:\chromium"

# 2. Navigate to it
cd D:\chromium

# 3. Create .gclient file (depot_tools configuration)
# This tells depot_tools which Chromium version to fetch
# You'll need to check what version BrowserOS uses
# Check: packages/browseros/CHROMIUM_VERSION

# 4. Fetch Chromium source (this takes 2-3 hours!)
# Make sure depot_tools is in your PATH first
gclient sync

# This will download ~100GB of Chromium source code
```

**Important:** Check `packages/browseros/CHROMIUM_VERSION` to see which Chromium version you need!

### Phase 2: Build the Browser

```powershell
# 1. Navigate to BrowserOS build system
cd D:\Shimmy-Browser\packages\browseros

# 2. Install Python dependencies
pip install -r requirements.txt
# OR if using uv:
# uv pip install -r requirements.txt

# 3. Build BrowserOS (Windows Debug)
python build/build.py `
  --config build/config/debug.windows.yaml `
  --chromium-src D:\chromium\src `
  --build

# This will take 1-3 hours depending on your hardware
```

**Build Output:**
- Windows: `out\Default_x64\BrowserOS.exe`
- The executable will be in the Chromium source output directory

### Phase 3: Build the Agent (BrowserOS Agent)

```powershell
# 1. Navigate to agent directory
cd D:\Shimmy-Browser\Sup-agent

# 2. Install Bun (if not already installed)
# powershell -c "irm bun.sh/install.ps1 | iex"

# 3. Install dependencies
bun install

# 4. Build agent extension
bun run build:agent

# 5. Build controller extension
bun run build:ext

# 6. Build server
bun run build:server
```

**Build Output:**
- Agent extension: `Sup-agent/apps/agent/dist/chrome-mv3/`
- Controller extension: `Sup-agent/apps/controller-ext/dist/`
- Server: `Sup-agent/apps/server/dist/` (or executable)

### Phase 4: Test Locally

```powershell
# 1. Start the BrowserOS server
cd D:\Shimmy-Browser\Sup-agent
bun run start:server

# 2. In another terminal, run BrowserOS browser
# Navigate to the built executable
cd D:\chromium\src\out\Default_x64
.\BrowserOS.exe

# 3. Load the agent extensions
# - Open chrome://extensions/
# - Enable Developer mode
# - Click "Load unpacked"
# - Load TWO extensions:
#   1. Agent UI: D:\Shimmy-Browser\Sup-agent\apps\agent\dist\chrome-mv3
#   2. Controller: D:\Shimmy-Browser\Sup-agent\apps\controller-ext\dist

# 4. Test the agent
# - Click the extension icon or press Alt+A to open side panel
# - Configure an AI provider in Options → AI Settings
# - Start chatting with the agent!
```

## 🌐 Deployment Options

### Option 1: Self-Hosted Distribution

**For personal use or small distribution:**

1. **Package the Browser:**
   ```powershell
   # Create installer (Windows)
   # Use the build system's package module
   python build/build.py `
     --config build/config/release.windows.yaml `
     --chromium-src D:\chromium\src `
     --package
   ```

2. **Host Files:**
   - Upload to your web server
   - Create download page
   - Provide direct download links

### Option 2: GitHub Releases

**For open-source distribution:**

1. **Create Release Build:**
   ```powershell
   python build/build.py `
     --config build/config/release.windows.yaml `
     --chromium-src D:\chromium\src `
     --build
   ```

2. **Package for Distribution:**
   - Windows: Create installer (.exe or .msi)
   - macOS: Create .dmg
   - Linux: Create .AppImage or .deb

3. **Upload to GitHub:**
   - Create a new release on GitHub
   - Upload the packaged files
   - Add release notes

### Option 3: Website Distribution

**For public launch:**

1. **Set up hosting:**
   - Domain name (e.g., `browseros.com`)
   - Web hosting (Vercel, Netlify, or your own server)
   - CDN for fast downloads (Cloudflare, AWS CloudFront)

2. **Create download page:**
   - Landing page with features
   - Download buttons for each platform
   - Installation instructions

3. **Auto-update system:**
   - Set up appcast/update server (like BrowserOS uses)
   - Configure auto-update mechanism

## 📦 Packaging for Distribution

### Windows Installer

```powershell
# The build system should handle this, but you may need:
# - Code signing certificate (for trusted installs)
# - Installer builder (NSIS, Inno Setup, or WiX)

# Check: packages/browseros/build/modules/package/windows.py
```

### macOS DMG

```powershell
# macOS builds require:
# - macOS machine or CI/CD
# - Code signing certificate
# - Notarization (for Gatekeeper)

# Check: packages/browseros/build/modules/package/macos.py
```

### Linux Packages

```powershell
# AppImage (universal):
# - Already portable, just distribute the file

# Debian/Ubuntu (.deb):
# - Use the build system's package module
# - Or use dpkg-deb manually
```

## 🔧 Configuration for Deployment

### Update Version Numbers

```powershell
# Edit version file
notepad packages\browseros\resources\BROWSEROS_VERSION
# Update version numbers
```

### Update Download URLs

You'll need to update references to download URLs in:
- Build configuration files
- Update server configuration
- Documentation

### Set Up Update Server

If you want auto-updates:
1. Host appcast XML files (like `docs/appcast.xml`)
2. Configure update server endpoint
3. Update browser code to point to your server

## ⚠️ AI Model Requirements

**Important:** The BrowserOS AI agent requires models that support **tool use (function calling)**. Not all AI models support this feature.

### Supported Models
- Models must support function calling/tool use to work with BrowserOS agent
- Check provider documentation for tool use support
- Common supported models: GPT-4, Claude 3, Gemini 1.5+, and compatible local models

### How to Filter for Tool Use on OpenRouter

1. Go to [OpenRouter Models](https://openrouter.ai/models)
2. Look for the **"Supported Parameters"** filter section (usually on the left sidebar or top filters)
3. Check the **"tools"** checkbox (you'll see a checkmark ✓ when selected)
4. The models list will automatically update to show only models that support tool use
5. Look for models with "(free)" in the name if you want free options
6. Copy the model ID (e.g., `google/gemini-1.5-flash`) and use it in the extension configuration

### Configuration
Users must configure a compatible model in the extension's AI Settings:
- Options → AI Settings → Add Provider
- Select a model that supports tool use
- Models without tool use will show: "No endpoints found that support tool use"

**📋 Verified Models:** See [validated_agents.md](validated_agents.md) for a list of tested and verified models that work well with BrowserOS.

## 🚢 Launch Checklist

Before launching publicly:

- [ ] All branding updated and consistent
- [ ] Version numbers set correctly
- [ ] Build tested on target platforms
- [ ] Extensions load correctly
- [ ] Server runs properly
- [ ] Download links working
- [ ] Website/landing page ready
- [ ] Documentation updated
- [ ] License compliance checked (AGPL-3.0)
- [ ] Privacy policy (if collecting data)
- [ ] Terms of service (if needed)

## 🐛 Troubleshooting

### Build Fails

1. **Check Chromium version:**
   ```powershell
   type packages\browseros\CHROMIUM_VERSION
   ```
   Make sure your Chromium source matches this version.

2. **Check disk space:**
   - Build needs additional ~50GB during compilation
   - Ensure you have enough free space

3. **Check Visual Studio:**
   - Verify C++ workload is installed
   - Try building a simple C++ project to test

### Agent Doesn't Load

1. **Check server is running:**
   ```powershell
   cd Sup-agent
   bun run start:server
   ```

2. **Check extension manifest:**
   - Verify extension ID matches
   - Check permissions in manifest.json

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors

### Side Panel Not Opening

**Issue**: Side panel doesn't open when clicking extension icon or using keyboard shortcuts.

**Solutions**:
1. **Ensure both extensions are loaded:**
   - Agent UI extension (`apps/agent/dist/chrome-mv3`)
   - Controller extension (`apps/controller-ext/dist`)

2. **Check keyboard shortcuts:**
   - Press **Alt+A** or **Alt+K** to toggle side panel
   - If shortcuts don't work, reload the extension

3. **Verify side panel is configured:**
   - The extension automatically configures the side panel on load
   - Check `chrome://extensions/` → Agent extension → Details → Check for errors

4. **User gesture requirement:**
   - Side panel must open in response to a direct user action (click or keyboard shortcut)
   - Programmatic opening from content scripts may not work in regular Chrome

### Keyboard Shortcuts Not Working

**Issue**: Alt+A, Alt+K, or Alt+L don't trigger the agent.

**Solutions**:
1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Click the reload icon on the Agent extension

2. **Check for conflicts:**
   - Other extensions or browser shortcuts may conflict
   - Try disabling other extensions temporarily

3. **Verify shortcuts are registered:**
   - Go to `chrome://extensions/shortcuts`
   - Look for "Toggle Agent side panel", "Toggle LLM Chat side panel", and "Switch providers"

### Model Configuration Errors

**Issue**: "No endpoints found that support tool use" or similar errors.

**Solutions**:
1. **Verify model supports tool use:**
   - Check [validated_agents.md](validated_agents.md) for tested models
   - Use OpenRouter filter to find models with "tools" parameter

2. **Check API key:**
   - Verify your API key is correct and has sufficient credits
   - For OpenRouter, ensure the key is valid

3. **Try a different model:**
   - Switch to a verified model from the validated list
   - Free models may have rate limits - try again later if rate limited

### WebSocket Connection Errors

**Issue**: Controller extension can't connect to server.

**Solutions**:
1. **Check server is running:**
   - Default port: 9105 (configurable via `.env.development`)
   - Verify with: `curl http://localhost:9105/health`

2. **Check port configuration:**
   - Ensure `BROWSEROS_SERVER_PORT` in `.env.development` matches server port
   - Ensure `BROWSEROS_EXTENSION_PORT` matches WebSocket port (default: 9305)

3. **Check firewall:**
   - Ensure localhost connections aren't blocked
   - Windows Firewall may need to allow the connection

## 📚 Next Steps

1. **Complete rebranding** (we're doing this now)
2. **Get Chromium source** (when ready)
3. **Test build locally** (verify everything works)
4. **Create release build** (for distribution)
5. **Set up hosting** (website, downloads)
6. **Launch!** 🚀

## 💡 Tips

- **Start with debug build** - Faster to compile, easier to debug
- **Test agent separately** - Can test BrowserOS agent in regular Chrome first
- **Incremental approach** - Get browser working, then add agent
- **CI/CD later** - Manual builds first, automate later
- **Community feedback** - Get beta testers before public launch

## 🆘 Need Help?

- Check build logs for specific errors
- Review Chromium build documentation
- Test components individually (browser, agent, server)
- Start with simpler builds (debug, single platform)

---

**You're building something awesome!** Take it step by step, and you'll have your own browser soon! 🎉

