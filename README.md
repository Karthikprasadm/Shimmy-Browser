<div align="center">
<img width="693" height="379" alt="github-banner" src="https://github.com/user-attachments/assets/1e37941c-4dbc-4662-9c8c-3bbe9971301d" />

<br></br>
[![Discord](https://img.shields.io/badge/Discord-Join%20us-blue)](https://discord.gg/YKwjt5vuKr)
[![Slack](https://img.shields.io/badge/Slack-Join%20us-4A154B?logo=slack&logoColor=white)](https://dub.sh/browserOS-slack)
[![Twitter](https://img.shields.io/twitter/follow/browserOS_ai?style=social)](https://twitter.com/browseros_ai)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
<br></br>
<a href="https://files.browseros.com/download/BrowserOS.dmg">
  <img src="https://img.shields.io/badge/Download-macOS-black?style=flat&logo=apple&logoColor=white" alt="Download for macOS (beta)" />
</a>
<a href="https://files.browseros.com/download/BrowserOS_installer.exe">
  <img src="https://img.shields.io/badge/Download-Windows-0078D4?style=flat&logo=windows&logoColor=white" alt="Download for Windows (beta)" />
</a>
<a href="https://files.browseros.com/download/BrowserOS.AppImage">
  <img src="https://img.shields.io/badge/Download-Linux-FCC624?style=flat&logo=linux&logoColor=black" alt="Download for Linux (beta)" />
</a>
<a href="https://cdn.browseros.com/download/BrowserOS.deb">
  <img src="https://img.shields.io/badge/Download-Debian-D70A53?style=flat&logo=debian&logoColor=white" alt="Download Debian package" />
</a>
<br />
</div>

## 
🌐 BrowserOS is an open-source chromium fork that runs AI agents natively. **Your open-source, privacy-first alternative to ChatGPT Atlas, Perplexity Comet, Dia**.

🔒 Privacy first - use your own API keys or run local models with Ollama. Your data stays on your computer.

💡 Join our [Discord](https://discord.gg/YKwjt5vuKr) or [Slack](https://dub.sh/browserOS-slack) and help us build! Have feature requests? [Suggest here](https://github.com/browseros-ai/BrowserOS/issues/99).

## Quick start

1. Download and install BrowserOS:
   - macOS: Coming soon
   - Windows: Coming soon
   - Linux: Coming soon

2. Import your Chrome data (optional)

3. Connect your AI provider (OpenAI, Anthropic, or local models via Ollama/LMStudio)
   - **Important**: Use a model that supports tool use (see AI Model Requirements above)
   - Configure in extension Options → AI Settings

4. Start automating!
   - Click the extension icon or press **Alt+A** to open the AI agent
   - Use keyboard shortcuts for quick access (Alt+A/K to toggle, Alt+L to cycle providers)

## ⚠️ Important: AI Model Requirements

**The BrowserOS AI agent requires models that support tool use (function calling).** Not all AI models support this feature.

### ✅ Supported Models
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo (all support tool use)
- **Anthropic**: Claude 3 (all variants support tool use)
- **Google**: Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 (all support tool use)
- **OpenRouter**: Models with "tools" in their Supported Parameters
- **Local Models**: Ollama/LM Studio models that support function calling

### How to Filter for Tool Use on OpenRouter

1. Go to [OpenRouter Models](https://openrouter.ai/models)
2. Look for the **"Supported Parameters"** filter section
3. Check the **"tools"** checkbox (you'll see a checkmark when selected)
4. The models list will update to show only models that support tool use
5. Select a model from the filtered list and use its model ID in the extension configuration

### ❌ Not Supported
- Models without tool use/function calling capabilities
- Text-only models that cannot execute browser automation tools

**How to check:** When using OpenRouter or other providers, ensure the model lists "tools" or "function calling" in its supported features. Models without this capability will show errors like "No endpoints found that support tool use."

**📋 Verified Models:** See [validated_agents.md](validated_agents.md) for a list of tested and verified models that work well with BrowserOS.

## 🎯 Keyboard Shortcuts

The BrowserOS agent includes convenient keyboard shortcuts for quick access:

- **Alt+A** or **Alt+K**: Toggle the AI agent side panel
- **Alt+L**: Cycle between configured LLM providers

These shortcuts work from any tab and provide instant access to the AI agent without clicking the extension icon.

## 🔧 Recent Fixes & Improvements

### Extension & UI
- ✅ Fixed side panel opening issues (user gesture requirement)
- ✅ Added keyboard shortcuts for quick access (Alt+A/K/L)
- ✅ Improved fallback compatibility for regular Chrome
- ✅ Fixed CSP issues with SVG imports
- ✅ Fixed accessibility warnings (aria-labelledby)

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

### Model Configuration
- ✅ Added validation for tool use support
- ✅ Created `validated_agents.md` with tested models
- ✅ Improved error messages for incompatible models
- ✅ Added OpenRouter filtering instructions
- ⚠️ **Vision Support**: Some models require vision/image input support for screenshots (see `validated_agents.md`)

### Developer Experience
- ✅ Improved WebSocket error handling and logging
- ✅ Enhanced troubleshooting documentation
- ✅ Updated build and setup instructions
- ✅ Added comprehensive fallback implementations for all browser actions
- ✅ Protected page handling (returns safe defaults instead of errors)

## What makes BrowserOS special
- 🏠 Feels like home - same familiar interface as Google Chrome, works with all your extensions
- 🤖 AI agents that run on YOUR browser, not in the cloud
- 🔒 Privacy first - bring your own keys or use local models with Ollama. Your browsing history stays on your computer
- 🚀 Open source and community driven - see exactly what's happening under the hood
- 🤝 BrowserOS as MCP server - you can install our MCP server and use the browser from within `claude-code` or `gemini-cli`.
- 🛡️ Built-in AI ad blocker that works across more scenarios!  

## Demos

### 🤖 BrowserOS agent in action
[![BrowserOS agent in action](docs/videos/browserOS-agent-in-action.gif)](https://www.youtube.com/watch?v=SoSFev5R5dI)
<br/><br/>

### 🎇 Install BrowserOS as MCP and control it from `claude-code`

https://github.com/user-attachments/assets/c725d6df-1a0d-40eb-a125-ea009bf664dc

<br/><br/>

### 💬 Use BrowserOS to chat

https://github.com/user-attachments/assets/726803c5-8e36-420e-8694-c63a2607beca

<br/><br/>

### ⚡ Use BrowserOS to scrape data

https://github.com/user-attachments/assets/9f038216-bc24-4555-abf1-af2adcb7ebc0

<br/><br/>

## Why We're Building BrowserOS

For the first time since Netscape pioneered the web in 1994, AI gives us the chance to completely reimagine the browser. We've seen tools like Cursor deliver 10x productivity gains for developers—yet everyday browsing remains frustratingly archaic.

You're likely juggling 70+ tabs, battling your browser instead of having it assist you. Routine tasks, like ordering something from amazon or filling a form should be handled seamlessly by AI agents.

At BrowserOS, we're convinced that AI should empower you by automating tasks locally and securely—keeping your data private. We are building the best browser for this future!

## How we compare

<details>
<summary><b>vs Chrome</b></summary>
<br>
While we're grateful for Google open-sourcing Chromium, but Chrome hasn't evolved much in 10 years. No AI features, no automation, no MCP support.
</details>

<details>
<summary><b>vs Brave</b></summary>
<br>
We love what Brave started, but they've spread themselves too thin with crypto, search, VPNs. We're laser-focused on AI-powered browsing.
</details>

<details>
<summary><b>vs Arc/Dia</b></summary>
<br>
Many loved Arc, but it was closed source. When they abandoned users, there was no recourse. We're 100% open source - fork it anytime!
</details>

<details>
<summary><b>vs Perplexity Comet</b></summary>
<br>
They're a search/ad company. Your browser history becomes their product. We keep everything local.
</details>

<details>
<summary><b>vs ChatGPT Atlas</b></summary>
<br>
Your browsing data could be used for ads or to train their models. We keep your history and agent interactions strictly local.
</details>

## Contributing

We'd love your help making BrowserOS better!

- 🐛 Report bugs (create issues in this repo)
- 💡 Suggest features (create issues in this repo)
- 💬 Join our community
- 🐦 Follow us on social media

## License

BrowserOS is open source under the [AGPL-3.0 license](LICENSE).

## Credits

- [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium) - BrowserOS uses some patches for enhanced privacy. Thanks to everyone behind this project!
- [The Chromium Project](https://www.chromium.org/) - At the core of BrowserOS, making it possible to exist in the first place.
  
## Stargazers
Thank you to all our supporters!

[![Star History Chart](https://api.star-history.com/svg?repos=browseros-ai/BrowserOS&type=Date)](https://www.star-history.com/#browseros-ai/BrowserOS&Date)

## 
<p align="center">
Built with ❤️ from San Francisco
</p>


