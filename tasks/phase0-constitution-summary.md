# Constitution Summary — Non-Negotiables

Extracted from `docs/frontendImproved.md` for Phase 0 safety net.

---

## 🚫 Hard Rules (Zero Tolerance)

### 1. Architecture Boundaries
- **No cross-feature imports**: `features/*` MUST NOT import from other `features/*`
  - Use URL/Router state, events, or shared abstractions instead
  - Only import from `shared/*` within features

### 2. Data Fetching
- **Server data via React Query ONLY**: Use `useQuery` / `useMutation`
- **NO `fetch` in `useEffect`**: Extract to API layer + React Query hooks
- **Use shared API client**: `src/shared/api/client.js` (apiClient.get/post/put/patch/delete)
- **Consistent query keys**: Define in `features/{feature}/api/keys.js`

### 3. File Size Limits

| Type | Soft Limit | Hard Limit | Action |
|---|---:|---:|---|
| UI primitive | 100 | 150 | Split into smaller components |
| Component | 150 | 200 | Extract logic to hooks + split UI |
| Page / Route | 200 | 250 | Extract sections to modules |
| **ANY FILE** | **250** | **300** | **REFACTOR IMMEDIATELY** |

### 4. Component Structure
- **Component ordering**: Imports → Definition → Hooks → Derived State → Handlers → Early Returns → Render
- **Handler naming**: Event handlers MUST be `handleX` (e.g., `handleClick`, `handleSubmit`)
- **React events ONLY**: Use `onClick`, `onChange`, etc. (NEVER `on:click`)

### 5. Styling
- **Tailwind-first**: Use utility classes for ALL component styling
- **NO new per-component CSS files**: Only `src/styles/*` for global tokens/system
- **NO inline styles**: Unless truly unavoidable (must document why)

### 6. Accessibility (Minimum Bar)
- Semantic HTML: `<button>`, `<nav>`, `<main>`
- Every input has `<label htmlFor=...>`
- Icons-only buttons must have `aria-label`
- Status messages use `role="status"` + `aria-live="polite"`

### 7. Import Order Standard
1. React imports
2. External libraries (alphabetical)
3. Internal absolute imports (`@/...`)
4. Same-feature imports (`../api`, `../hooks`)
5. Local relative imports (`./components`, `./modules`)

---

## 📐 Architecture Standards

### Feature Folder Template (REQUIRED)
```
src/features/{feature-name}/
  api/           # endpoints + React Query keys
  components/    # UI (feature-specific)
  hooks/         # logic hooks (feature-specific)
  schemas/       # zod schemas (feature-specific)
  utils/         # pure helpers (feature-specific)
  index.js       # PUBLIC EXPORTS ONLY
```

### Dependency Flow (STRICT)
```
App → Features → Shared → External Libraries
       ↓          ↓
    Shared    Libraries
```

**Forbidden**:
- ❌ `features/A` importing from `features/B`
- ❌ `shared/*` importing from `features/*`

---

## 🔧 State Management Decision Table

| Data Type | Use | When NOT to Use |
|---|---|---|
| Server state | React Query | Never use useEffect for fetch |
| Local UI | useState | If shared across routes |
| Complex local UI | useReducer or custom hook | Simple 1-2 state values |
| URL state | useSearchParams | For non-shareable state |
| Global UI | Context (sparingly) | For server data (use React Query) |

---

## 🧪 Testing Standards

- **Behavior over implementation**: Test user-visible outcomes, not internal state
- **Colocate tests**: Keep tests near components/hooks when feature-specific
- **E2E smoke**: Critical paths must have smoke coverage

---

## ⚡ Performance Rules

- **Lazy-load routes**: Use React `lazy` + `Suspense` for all route components
- **Memoization**: Use `React.memo` for list items with stable props
- **useMemo**: Only for non-trivial computations
- **useCallback**: For handlers passed deep into memoized children

---

## 🎯 When to Split a Component (IMMEDIATE ACTION)

Split NOW if any of these are true:
- File > 200 lines
- More than 3 `useEffect` hooks
- More than 5 local state values
- JSX nesting 4+ levels deep
- Component doing 2+ responsibilities

**Recommended pattern**: Extract to `modules/` subdirectory

---

## 🚦 Enforcement (Current State)

### Current (Today)
- ESLint does NOT enforce `max-lines` or import boundaries
- Relies on PR checklist and manual review

### Target (After Refactor)
- Stage 1: `max-lines` as **warning** (non-blocking)
- Stage 2: `max-lines` as **error** + import boundary enforcement

---

## 📚 Official Standards Location

- **Primary**: `docs/frontendImproved.md` (this document's source)
- **Diagnosis**: `docs/refactorUi.txt` (code smells)
- **Backend Context**: `docs/official/backendSummary.md` (preserve behavior)

