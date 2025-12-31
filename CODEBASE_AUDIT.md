# Codebase Audit Report - Conflicts & Inconsistencies

**Date:** 2025-01-31  
**Scope:** Sup-agent monorepo

## 🔴 Critical Issues

### 1. **Zod Version Mismatch (Major Version Conflict)**
**Severity:** HIGH - Breaking changes between v3 and v4

| Package | Zod Version | Issue |
|---------|-------------|-------|
| `apps/server` | `^3.24.2` | Using Zod v3 |
| `apps/controller-ext` | `^4.1.12` | Using Zod v4 |
| `apps/agent` | `^4.1.13` | Using Zod v4 |

**Impact:** 
- Server and controller/agent use incompatible Zod versions
- Type definitions may not match
- Runtime errors possible when sharing Zod schemas

**Recommendation:** 
- Standardize on Zod v4 (newer, more features)
- Update server to use `zod: ^4.1.13`
- Test all shared schemas

---

### 2. **Hardcoded Port Values (Inconsistent with Shared Config)**
**Severity:** MEDIUM - Configuration drift

**Location:** `apps/agent/lib/browseros/helpers.ts`
```typescript
// Lines 48, 68 - Hardcoded values
return 9105  // Should use TEST_PORTS.server from @browseros/shared/ports
```

**Location:** `apps/controller-ext/src/utils/ConfigHelper.ts`
```typescript
// Line 35 - Hardcoded value
const testPort = 9305  // Should use TEST_PORTS.extension from @browseros/shared/ports
```

**Issue:** 
- Ports are hardcoded instead of using centralized `@browseros/shared/ports`
- Violates DRY principle
- Makes port changes error-prone

**Recommendation:**
- Import `TEST_PORTS` from `@browseros/shared/ports`
- Replace hardcoded values with `TEST_PORTS.server` and `TEST_PORTS.extension`

---

## ⚠️ Medium Issues

### 3. **TypeScript Version Inconsistency**
**Severity:** LOW - Minor version difference

| Package | TypeScript Version |
|---------|-------------------|
| Root, Server, Agent | `^5.9.2` |
| Controller-ext | `^5.9.3` |

**Impact:** 
- Minor, but inconsistent
- Could cause subtle type checking differences

**Recommendation:**
- Standardize on `^5.9.3` (newer patch version)

---

### 4. **Biome Version Mismatch**
**Severity:** LOW - Linter version inconsistency

| Location | Biome Version |
|----------|---------------|
| Root `package.json` | `2.3.10` |
| Agent `package.json` | `2.3.9` |
| Agent `biome.json` schema | `2.3.9` |

**Impact:**
- Different linting rules may apply
- Schema validation warnings

**Recommendation:**
- Update agent to use `@biomejs/biome: 2.3.10`
- Update `apps/agent/biome.json` schema to `2.3.10`

---

### 5. **Config File Port Inconsistency**
**Severity:** LOW - Unused config value

**Location:** `config.dev.json`
```json
{
  "ports": {
    "cdp": 9005,
    "http_mcp": 9105,
    "agent": 9205,  // ⚠️ This port is deprecated/unused
    "extension": 9305
  }
}
```

**Issue:**
- `agent` port (9205) is defined but deprecated
- Code uses `serverPort` (9105) instead
- Could cause confusion

**Recommendation:**
- Remove `agent` port from config (it's deprecated)
- Or add comment explaining it's deprecated

---

## 🟡 Minor Issues

### 6. **Missing Test Dependencies**
**Severity:** LOW - TypeScript errors in test files

**Location:** `apps/server/src/agent/agent/gemini-vercel-sdk-adapter/strategies/*.test.ts`

**Error:**
```
Cannot find module 'vitest' or its corresponding type declarations
```

**Impact:**
- TypeScript compilation fails
- Tests may not run properly

**Recommendation:**
- Add `vitest` to server devDependencies
- Or configure TypeScript to ignore test files

---

### 7. **Package Naming Consistency**
**Status:** ✅ GOOD

All packages correctly use `@browseros/*` naming:
- `@browseros/server` ✅
- `@browseros/shared` ✅
- `browseros-controller` ✅ (no @ prefix, but consistent)

---

## ✅ Good Practices Found

1. **Centralized Port Configuration** ✅
   - `packages/shared/src/ports.ts` provides `DEFAULT_PORTS` and `TEST_PORTS`
   - Most code correctly imports from shared package

2. **Consistent Import Patterns** ✅
   - All packages correctly import from `@browseros/shared/*`
   - No leftover `@sup/*` references found

3. **Environment Variable Usage** ✅
   - Consistent use of `BROWSEROS_*` prefix
   - Proper fallback chains in helpers

---

## 📋 Summary

### Critical (Fix Immediately)
1. ✅ **Zod version mismatch** - Standardize on v4
2. ✅ **Hardcoded ports** - Use shared config

### Medium Priority
3. ⚠️ TypeScript version - Standardize on 5.9.3
4. ⚠️ Biome version - Update to 2.3.10
5. ⚠️ Config cleanup - Remove deprecated agent port

### Low Priority
6. 🔧 Add vitest to devDependencies
7. ✅ Package naming is consistent

---

## 🔧 Recommended Fix Order

1. **Fix Zod versions** (Critical - may cause runtime issues)
2. **Fix hardcoded ports** (Medium - configuration drift)
3. **Update TypeScript** (Low - consistency)
4. **Update Biome** (Low - tooling)
5. **Clean config** (Low - documentation)
6. **Add vitest** (Low - test infrastructure)

---

**Generated:** 2025-01-31  
**Next Review:** After fixes applied

