# Validated AI Models for BrowserOS

This document lists AI models that have been tested and verified to work well with BrowserOS and its AI agent. All models listed here support **tool use (function calling)**, which is required for the agent to function.

## ⚠️ Important Requirements

**All models must support tool use (function calling)** to work with BrowserOS agent. Models without this capability will show errors like:
- `"No endpoints found that support tool use"`
- `"[404] No endpoints found that support tool use"`

**For screenshot/image features**, models must also support **vision/image input**. Models without vision support will show:
- `"[404] No endpoints found that support image input"`

**Recommended**: Use models that support both **tools** and **vision** for full functionality.

## ✅ Verified Models

### Free Models (OpenRouter)

| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| `xiaomi/mimo-v2-flash:free` | OpenRouter | ✅ Working | Free model, supports tool use, works super well. ⚠️ Does NOT support vision/image input | 2025-01-30 |
| `google/gemini-1.5-flash:free` | OpenRouter | ✅ Expected | Free model, supports tool use AND vision. Recommended for full functionality | - |
| `google/gemini-1.5-pro:free` | OpenRouter | ✅ Expected | Free model, supports tool use AND vision. Recommended for full functionality | - |
| `google/gemini-2.0-flash-exp:free` | OpenRouter | ✅ Expected | Free model, supports tool use AND vision. Recommended for full functionality | - |

### Premium Models (OpenRouter)

| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| *To be tested* | - | - | - | - |

### Direct Provider Models

#### Google Gemini
| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| `gemini-1.5-flash` | Google (Direct) | ✅ Expected | Free tier available, supports tool use | - |
| `gemini-1.5-pro` | Google (Direct) | ✅ Expected | Free tier available, supports tool use | - |
| `gemini-2.0-flash-exp` | Google (Direct) | ✅ Expected | Free tier available, supports tool use | - |

#### OpenAI
| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| `gpt-4` | OpenAI (Direct) | ✅ Expected | Supports tool use, paid | - |
| `gpt-4-turbo` | OpenAI (Direct) | ✅ Expected | Supports tool use, paid | - |
| `gpt-3.5-turbo` | OpenAI (Direct) | ✅ Expected | Supports tool use, paid | - |

#### Anthropic
| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| `claude-3-haiku` | Anthropic (Direct) | ✅ Expected | Supports tool use, paid | - |
| `claude-3-sonnet` | Anthropic (Direct) | ✅ Expected | Supports tool use, paid | - |
| `claude-3-opus` | Anthropic (Direct) | ✅ Expected | Supports tool use, paid | - |

### Local Models

| Model ID | Provider | Status | Notes | Verified Date |
|----------|----------|--------|-------|--------------|
| *To be tested* | Ollama | - | Requires function calling support | - |
| *To be tested* | LM Studio | - | Requires function calling support | - |

## 🔍 How to Verify a Model

1. **Check Tool Use Support:**
   - For OpenRouter: Filter by "tools" in Supported Parameters
   - For direct providers: Check provider documentation for "function calling" or "tool use" support

2. **Check Vision Support (for screenshot features):**
   - For OpenRouter: Filter by "vision" or "image" in Supported Parameters
   - For direct providers: Check if model supports "vision" or "multimodal" inputs
   - Models without vision support will fail when agent tries to send screenshots

3. **Test in BrowserOS:**
   - Configure the model in extension Options → AI Settings
   - Try a simple task that requires tool use (e.g., "list my open tabs")
   - Try a task that uses screenshots (e.g., "take a screenshot of this page")
   - If both work without errors, the model is fully compatible

4. **Add to This List:**
   - Once verified, add the model to this document
   - Include model ID, provider, status, notes (including vision support), and verification date

## 📝 Model Status Legend

- ✅ **Working** - Tested and confirmed working with BrowserOS
- ✅ **Expected** - Should work based on provider documentation (tool use support confirmed)
- ⚠️ **Partial** - Works but has limitations (e.g., tool use but no vision support)
- ❌ **Not Working** - Does not work (will be listed separately if needed)

## 🎯 Model Recommendations

**For Full Functionality (Tool Use + Vision):**
- Use Gemini models (via OpenRouter or direct): `google/gemini-1.5-flash:free`, `google/gemini-1.5-pro:free`, `google/gemini-2.0-flash-exp:free`
- These support both tool use and vision, enabling screenshot-based automation

**For Text-Only Automation (Tool Use Only):**
- `xiaomi/mimo-v2-flash:free` works well but cannot process screenshots
- Use when you don't need visual page analysis

## 🆕 Adding New Models

When you find a new model that works well:

1. Test it thoroughly with various agent tasks
2. Verify tool use support
3. Add it to this document with:
   - Model ID (exact string to use in configuration)
   - Provider (OpenRouter, Direct, Local)
   - Status (Working/Expected/Partial)
   - Notes (free/paid, performance, any quirks)
   - Verification date

## 🔗 Useful Links

- [OpenRouter Models](https://openrouter.ai/models) - Filter by "tools" parameter
- [OpenAI Models](https://platform.openai.com/docs/models) - Check function calling support
- [Anthropic Models](https://docs.anthropic.com/claude/docs) - All Claude 3 models support tool use
- [Google Gemini Models](https://ai.google.dev/models/gemini) - Check model capabilities

## 💡 Tips

- **Free models** may have rate limits - if you hit limits, try again later or use a different free model
- **Direct provider keys** often have better rate limits than free OpenRouter models
- **Local models** (Ollama/LM Studio) require models that specifically support function calling
- **Test before committing** - Always test a model with a simple task before using it for important work

---

**Last Updated:** 2025-01-30  
**Maintained by:** BrowserOS Community

