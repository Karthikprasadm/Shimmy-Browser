# How to Run Shimmy Browser (BrowserOS) Local Development Environment

This guide explains how to properly configure, run, and troubleshoot the Shimmy Browser project locally.

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
1. **Bun**: The primary package manager and runtime used in this project.
2. **BrowserOS Chromium**: A custom Chromium fork that contains the necessary BrowserOS-specific APIs and permissions (like `"browserOS"`).
   * **Default Windows Path:** `C:\Users\<Your_Username>\AppData\Local\Chromium\Application\chrome.exe`

---

## ⚙️ Environment Configuration

For the development stack to run, you must configure the environment variables and ports correctly.

### 1. The Environment Files (`.env.development`)
There are three synced `.env.development` files in the repository that you need to configure (copying from `.env.development.example`):
* `packages/browseros-agent/.env.development`
* `packages/browseros-agent/apps/app/.env.development`
* `packages/browseros-agent/apps/server/.env.development`

Make sure **`BROWSEROS_BINARY`** points to the custom Chromium build path (use forward slashes `/`):
```env
# Example for Windows:
BROWSEROS_BINARY=C:/Users/<Your_Username>/AppData/Local/Chromium/Application/chrome.exe

# Ports configuration
BROWSEROS_CDP_PORT=9005
BROWSEROS_SERVER_PORT=9105
BROWSEROS_EXTENSION_PORT=9305
```

### 2. The Sidecar Configuration (`config.dev.json`)
The BrowserOS Server reads its ports directly from the sidecar JSON file located at:
`packages/browseros-agent/config.dev.json`

Ensure the ports in this JSON file match the ports defined in your `.env.development` files:
```json
{
  "ports": {
    "server": 9105,
    "cdp": 9005,
    "proxy": 9105
  },
  "directories": {
    "resources": "./resources",
    "execution": "./out"
  },
  "flags": {
    "allow_remote_in_mcp": false
  }
}
```

---

## 🚀 How to Run

1. Open a PowerShell/Terminal window.
2. Navigate to the root directory of the workspace:
   ```powershell
   cd D:\Shimmy-Browser
   ```
3. Run the development stack:
   ```powershell
   bun run dev
   ```

---

## 🛠️ How it Works & Troubleshooting

### Automatic Process Cleanup
If you exit the development stack or it crashes, Chromium background processes might stay running and lock the remote debugging port `9005` or your user data profile.
* **Solution:** The stack runner (`stack.ts`) automatically cleans up any dangling custom Chromium instances running from `AppData/Local/Chromium` at startup.

### Seamless Startup (Blank Page Redirect)
Starting Chromium directly with `--app=chrome-extension://...` on the command line often causes a race condition where Chromium loads the URL before it has finished registering the unpacked extension directory, resulting in an `ERR_BLOCKED_BY_CLIENT` page.
* **Solution:** The stack runner launches Chromium pointing to `about:blank`, waits until the Chrome DevTools Protocol (CDP) port is open and the extension is fully registered, and then automatically redirects the window to the correct extension URL.

---

## 📂 Project Structure

* **`packages/browseros-agent/scripts/dev/stack.ts`**: The orchestrator script that starts WXT, launches the custom Chromium browser, waits for CDP, and spawns the backend server.
* **`packages/browseros-agent/apps/app/`**: The frontend Chrome extension.
* **`packages/browseros-agent/apps/server/`**: The backend MCP endpoints and orchestrator server.

---

## 💡 Troubleshooting & Key Architectural Fixes

If you or a future developer runs into issues, please reference the following solutions for known platform quirks:

### 1. Sidebar Layout Lock / Connection Hang
* **Symptom:** Opening the browser results in a locked/frozen side-panel UI that never finishes loading.
* **Cause:** If the browser extension APIs (`chrome.browserOS`) fail to initialize or load slowly, the extension falls back to a developer port (historically set to `9111`). However, the local development backend server listens on port `9105` (`BROWSEROS_SERVER_PORT`). This mismatch caused the WebSocket handshake to hang indefinitely.
* **Solution:** 
  1. We exposed `VITE_BROWSEROS_SERVER_PORT` to the client app bundle.
  2. The developer fallback helper (`helpers.ts`) now prioritizes matching this port (defaulting to `9105`).
  3. We wrapped key layout containers in React `<Suspense>` boundaries to ensure that even if a connection is slow, the UI gracefully renders loaders instead of freezing.

### 2. New Tab Loop (Auto-Close Quirks)
* **Symptom:** Opening a new tab (Ctrl+T or clicking `+`) immediately closes the tab automatically.
* **Cause:** The background worker (`background.js`) tracks and monitors tabs, automatically closing blank/unused agent-spawned tabs to conserve resources. However, Chromium default new tabs (e.g. `chrome://newtab/` or blank pages) were mistakenly flagged as agent-spawned junk.
* **Solution:** We whitelisted `chrome://newtab/`, `chrome://new-tab-page/`, and `about:blank` in `isLikelyUserInitiatedBlankOrChildTab()` inside `entrypoints/background/index.ts` to ensure user-opened blank pages are never auto-closed.

### 3. Zod API Schema Validation Errors
* **Symptom:** Sending prompts to the agent results in a `ZodError` response with message `"Invalid input"`.
* **Cause:** The server merges schemas from different package boundaries (`shared` and `server` packages) using `.merge()`. Due to duplicate installations of `zod` in different `node_modules` folders, the instance validation checks (e.g. `instanceof ZodNever`) failed cross-boundary, causing Zod to reject LLM request parameters (such as `providerType`, `providerName`, and `temperature`) instead of stripping them.
* **Solution:** Avoid using `schemaA.merge(schemaB)` across package boundary imports. Instead, destructure the shapes locally:
  ```typescript
  const LocalMergedSchema = z.object({
    ...schemaA.shape,
    ...schemaB.shape
  })
  ```

### 4. Agent Spawns New Tab and Fragmented Chat History
* **Symptom:** Initiating a prompt on the Home/New Tab page forces the agent to open a new tab (`tabs action="new"`). Because chat sessions are tracked per-tab, this new tab has an empty chat history, hiding previous context.
* **Cause:** The agent instructions/guidelines warn the model not to touch user-owned tabs and instead open its own. Additionally, because the Home page is hosted on an internal extension URL (`chrome-extension://.../app.html`), it matched the `EXCLUDED_URL_PREFIXES` array and was completely hidden from the page list, preventing the agent from resolving its Page ID or navigating it.
* **Solution:**
  1. Updated the prompt system templates, tool descriptions, and skills guides to instruct the agent to prioritize executing and navigating directly in the current active tab.
  2. Bypassed the URL exclusion filter in `PageManager.list()` if `tab.isActive` is `true`. This lets the agent see and target the Home page, allowing it to navigate the active window directly.

