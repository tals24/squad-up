# Frontend Guide (Official) — Squad Up

This is the **source of truth** for how we build and refactor the frontend.

- **Stack**: React 18, Vite, JavaScript (ES2020+), Tailwind CSS, React Query (TanStack Query)
- **Architecture**: Feature-Sliced Design (Lite)
- **Core Goal**: **Strict decoupling + small files** (no “mega components”)

---

## Non‑Negotiables (read this first)

- **No cross-feature imports**: `features/*` **must not** import from other `features/*`.
- **Prefer public APIs**: Import from a slice’s `index.js` when available; avoid deep imports unless explicitly allowed.
- **Server data**: Use **React Query** (`useQuery`, `useMutation`). **No `fetch` in `useEffect`.**
- **UI logic split**: Business/async logic goes in **hooks**, rendering stays in **components**.
- **File size**: If a file is trending large, **split early** (rules below).
- **Handlers naming**: Event handlers are `handleX` (e.g., `handleSubmit`, `handleKeyDown`).
- **React events only**: Use `onClick`, `onChange`, etc. **Never** `on:click`.
- **Tailwind-first styling**: Use utilities; avoid ad-hoc CSS unless it’s truly global.
- **Accessibility**: Buttons are `<button>`, inputs have `<label>`, status uses `aria-live`.
- **Imports flow**: Higher layers may import lower layers; never the opposite.

---

## Architecture: FSD (Lite) in this repo

### Current repo mapping (what exists today)

- **App**: `src/app/` (providers, router, layout)
- **Features**: `src/features/` (domain modules: game-management, drill-system, etc.)
- **Shared**: `src/shared/` (reusable UI, hooks, libs, api client)

Also present (needs clear ownership rules):

- `src/lib/` (utility TS/TSX files)
- `src/services/` (e.g., auth service)
- `src/styles/` (global CSS)

**Official policy going forward**:

- New reusable utilities should live in `src/shared/lib/` (not `src/lib/`).
- App-wide services can live in `src/app/` or `src/shared/` (pick one and be consistent; see Open Questions).
- Global styles live in `src/index.css` (and optionally `src/styles/` while migrating).

### Dependency rules (strict)

- **App** → can import from **Features** and **Shared**
- **Features** → can import from **Shared** only
- **Shared** → can import from external libraries only

Forbidden:

- ❌ `features/A` importing from `features/B`
- ❌ `shared/*` importing from `features/*`

If you need cross-feature behavior, use:

- **URL/Router state**, **events**, **shared abstractions**, or **backend API composition**.

---

## Project structure (canonical)

### Feature folder template

Every feature uses the same internal shape:

```
src/features/{feature-name}/
  api/           # endpoints + React Query keys
  components/    # UI (feature-specific)
  hooks/         # logic hooks (feature-specific)
  schemas/       # zod schemas (feature-specific)
  utils/         # pure helpers (feature-specific)
  index.js       # PUBLIC EXPORTS ONLY
```

**Rule**: `index.js` exports only what other layers are allowed to use.

### Shared folder template

```
src/shared/
  api/           # shared API client + shared endpoints
  ui/            # primitives + composed UI
  components/    # reusable dumb components
  hooks/         # reusable hooks (non-domain)
  lib/           # pure utilities (formatting, helpers)
  utils/         # simple helpers (keep minimal; prefer lib/)
```

---

## Imports & module boundaries

### Path alias

Use `@` for absolute imports (configured in `frontend/vite.config.js`):

- `@` → `frontend/src`

Example:

```js
import { Button } from '@/shared/ui/primitives';
```

### Import order standard

1. React
2. External libraries
3. Internal absolute imports (`@/...`)
4. Same-feature imports (`../api`, `../hooks`, etc.)
5. Local relative imports (`./components`, `./modules`, etc.)

### Avoid deep imports (recommended)

Prefer:

- `import { usePlayersData } from '@/shared/hooks';`

Avoid (unless feature explicitly allows it):

- `import { usePlayersData } from '@/shared/hooks/usePlayersData';`

---

## File size rules (zero tolerance)

| Type | Soft limit | Hard limit | Action |
|---|---:|---:|---|
| UI primitive | 100 | 150 | Split into smaller components |
| Component | 150 | 200 | Extract logic to hooks + split UI modules |
| Page / Route component | 200 | 250 | Extract sections to modules/widgets |
| Any file | 250 | 300 | **Refactor immediately** |

### Enforcement (current vs target)

- **Current**: ESLint does **not** enforce `max-lines` today (see `frontend/eslint.config.js`).
- **Target**: Add ESLint `max-lines` (and optionally boundaries) once we agree on the thresholds.

---

## Component architecture (the “anatomy”)

### Required component ordering

1. Imports
2. Component definition
3. Hooks & data
4. Derived state
5. Handlers
6. Early returns (loading/error/empty)
7. Render (minimal logic)

### When to split

Split **now** if any of these are true:

- > 200 lines
- > 3 `useEffect`
- > 5 local state values (consider `useReducer` / custom hook)
- JSX nesting 4+ levels deep
- Component is doing 2+ responsibilities (data + layout + dialogs + form logic, etc.)

### Recommended pattern: `modules/` inside a component folder

For large pages, keep a thin `index.jsx` and push UI sections into `modules/`:

```
GameDetailsPage/
  index.jsx
  modules/
    Header.jsx
    Sidebar.jsx
    Content.jsx
```

---

## State management decision table

| Data type | Use | Example |
|---|---|---|
| Server state | React Query | game details, players list |
| Local UI | `useState` | dialog open/close, tabs |
| Complex local UI | `useReducer` or custom hook | multi-step flows |
| URL state | router params/search params | filters, selected id |
| Global UI | Context (sparingly) | theme, auth user, toasts |

---

## Data fetching: React Query (official standard)

### Where query logic lives

- **API functions**: `features/{feature}/api/*` (or `shared/api/*` if truly cross-feature)
- **Keys**: `features/{feature}/api/keys.js` (or in same api file if tiny)
- **Hooks**: `features/{feature}/hooks/useXQuery.js` and `useXMutation.js`

### Defaults (as configured today)

`src/app/providers/QueryProvider.jsx` configures defaults:

- `staleTime`: 5 minutes
- retries: 1
- refetch on focus/mount/reconnect: enabled

Override per-query only when you have a reason.

### Rules of thumb

- Always provide stable `queryKey`s (no ad-hoc arrays)
- Use `enabled` for dependent queries
- In `onSuccess`, update cache and invalidate list queries
- Put error-to-toast mapping in the **hook**, not in the component

---

## API client (official standard)

### Use the shared client

Use `src/shared/api/client.js` which exposes:

- `apiClient.get(endpoint)`
- `apiClient.post(endpoint, data)`
- `apiClient.put(endpoint, data)`
- `apiClient.patch(endpoint, data)`
- `apiClient.delete(endpoint)`

### Environment variable (important)

The base URL is:

- `import.meta.env.VITE_BACKEND_URL` (fallback: `http://localhost:3001`)

**Note**: `docs/frontend.md` mentions `VITE_API_URL`, but the code uses `VITE_BACKEND_URL`. The official env var is **`VITE_BACKEND_URL`**.

---

## Forms & validation (recommended baseline)

- Complex forms: **React Hook Form + Zod**
- Zod schemas live in `features/{feature}/schemas/`
- Keep form UI components small; extract field groups to subcomponents

Dialog forms:

- Prefer a shared dialog layout (base dialog) in `shared/components` or `shared/ui/composed` (choose one).

---

## Styling (Tailwind-first, pragmatic)

### Default

- Use Tailwind utilities for component styling.
- Use semantic tokens (e.g. `bg-destructive`) where the design system supports it.

### Existing reality

This repo currently contains global CSS files (e.g. `src/styles/*`, `App.css`).

**Guidance**:

- Don’t add new random CSS files for component styling.
- Keep CSS for global concerns only (layout resets, CSS vars, shared animations).

---

## Accessibility (minimum bar)

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Every input has a `<label htmlFor=...>`
- Icons-only buttons must have `aria-label`
- Use `role="status"` + `aria-live="polite"` for async status text
- Keyboard: dialogs trap focus; lists/actions are reachable by tab

---

## Performance

- Lazy-load route pages (React `lazy` + `Suspense`)
- Use `React.memo` for list items with stable props
- Use `useMemo` only for non-trivial computations
- Use `useCallback` for handlers passed deep (especially into memoized children)

---

## Testing (current structure + expectation)

Current test locations:

- `src/__tests__/integration/*`
- `src/__tests__/e2e/*`
- Feature colocated tests exist (e.g. `features/game-management/__tests__`)

Standards:

- Prefer **behavior** tests (user-visible outcomes) over implementation tests
- Colocate tests near the component/hook when it’s feature-specific

---

## Refactoring playbook (for large components)

If you touch a large file (example: `GameDetailsPage`), you must leave it **smaller** than you found it.

Suggested approach:

1. Identify UI sections → extract to `modules/`
2. Identify business logic → extract to `hooks/`
3. Identify reusable UI patterns (dialogs, form fields) → move to `shared/`
4. Add/adjust query hooks → remove fetching from components

---

## PR checklist (paste into every PR)

- [ ] No cross-feature imports
- [ ] No new `fetch` in components (React Query used)
- [ ] File sizes respected (split if needed)
- [ ] Handler names follow `handleX`
- [ ] Error/loading states handled
- [ ] A11y: labels, semantic elements, aria for icon buttons
- [ ] Tailwind-first styling, no random CSS files

---

## Official decisions (locked)

### CSS policy

**Decision**: Allow `src/styles/*` **for global design system + tokens only**, but **ban new per-component CSS files**.

- Allowed in CSS:
  - CSS variables / theme tokens
  - global base styles (rare)
  - shared animations that Tailwind can’t express cleanly
- Not allowed:
  - `MyComponent.css` / random page CSS for layout tweaks
  - inline styles (unless truly unavoidable; document why)

**Why**: Tailwind remains the default for speed/consistency, but global CSS is still valuable for design tokens and a unified system.

### FSD layers

**Decision**: **Formally add `Pages` (and optionally `Widgets`) as an organizing layer**, but keep **Entities optional** for now.

Practical mapping:

- `src/app/` = App layer (providers/router/layout)
- `src/pages/` = Route composition (thin pages that compose features/widgets)
- `src/widgets/` = Optional reusable route sections (Header, ShellSidebar, etc.)
- `src/features/` = Business actions / user interactions
- `src/entities/` = Optional; introduce only when a domain model is clearly shared across features
- `src/shared/` = Reusable UI + utilities + api client (no domain logic)

**Why**: Pages/widgets improve navigation and reduce “feature pages” becoming monoliths, without forcing a full Entities refactor immediately.

### Enforcement (ESLint)

**Decision**: Yes, we will add ESLint enforcement for **max file size** and **import boundaries**, but we will roll it out in stages to avoid breaking the current repo.

**Stage 1 (now)**:

- Add `max-lines` as **warning** (so mega-files don’t block CI immediately).
- Keep the PR checklist as the hard gate during review.

**Stage 2 (after top offenders are refactored)**:

- Flip `max-lines` to **error**.
- Add import-boundary enforcement (automatic prevention of cross-feature imports).

**Why**: We want strict rules, but we can’t safely turn them on as errors while files like `GameDetailsPage` are still thousands of lines.


