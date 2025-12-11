# Feature Structure Template

This document defines the standard structure for all features in the Squad Up frontend application.

## Overview

All features **MUST** follow this structure to maintain consistency, enforce dependency boundaries, and enable scalability.

## Standard Feature Structure

```
features/{feature-name}/
├── api/                    # API endpoints (1 file per resource)
│   ├── {resource}Api.js    # Example: gameApi.js, playerApi.js
│   └── index.js            # Re-export all API functions
├── components/             # UI components
│   ├── {PageName}Page/     # Main page component folder
│   │   ├── index.jsx       # Main page component (~150-200 lines max)
│   │   ├── hooks/          # Custom hooks specific to this page
│   │   │   ├── use{Feature}.js
│   │   │   └── index.js    # Re-export hooks
│   │   └── modules/        # Sub-components (UI breakdown)
│   │       ├── {Section}.jsx
│   │       └── {Module}.jsx
│   └── shared/             # Components shared within this feature only
│       └── {SharedComponent}.jsx
├── hooks/                  # Hooks shared across multiple pages in this feature
│   ├── use{FeatureName}.js
│   └── index.js            # Re-export hooks
├── schemas/                # Zod validation schemas
│   ├── {resource}Schema.js
│   └── index.js
├── utils/                  # Pure utility functions (no React, no side effects)
│   ├── {utility}.js
│   └── index.js
└── index.js                # PUBLIC API - ONLY export what other features need
```

## File Size Limits

**STRICTLY ENFORCED** - Automated via ESLint

| File Type | Soft Limit | Hard Limit | Action Required |
|-----------|-----------|-----------|-----------------|
| UI Primitive | 100 lines | 150 lines | Split into sub-components |
| Component | 150 lines | 200 lines | Extract logic to hooks |
| Page | 200 lines | 250 lines | Extract sections to modules |
| **ANY FILE** | **250 lines** | **300 lines** | **REFACTOR IMMEDIATELY** |

### ESLint Rule

```javascript
'max-lines': ['error', { 
  max: 300, 
  skipBlankLines: true, 
  skipComments: true 
}]
```

## Component Anatomy

Every React component **MUST** follow this structure:

```javascript
// ==========================================
// 1. IMPORTS (Grouped & Ordered)
// ==========================================
import { useState } from 'react';                    // React
import { useQuery } from '@tanstack/react-query';    // External libs
import { Button } from '@/shared/ui/primitives';     // Shared UI
import { useGameQuery } from '../hooks/useGameQuery';// Feature hooks
import { GameHeader } from './modules/GameHeader';   // Local components

// ==========================================
// 2. COMPONENT DEFINITION
// ==========================================
export function MyComponent({ prop1, prop2 }) {
  
  // ========================================
  // 3. HOOKS & DATA (Logic Layer)
  // ========================================
  const { data, isLoading } = useQuery(...);
  const { customLogic } = useCustomHook();
  const [localState, setLocalState] = useState(null);

  // ========================================
  // 4. DERIVED STATE (Variables)
  // ========================================
  const computedValue = useMemo(() => data?.field, [data]);

  // ========================================
  // 5. HANDLERS (Interaction Layer)
  // ========================================
  const handleClick = () => {
    // Handle user interaction
  };

  // ========================================
  // 6. EARLY RETURNS (Loading/Error)
  // ========================================
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <NotFound />;

  // ========================================
  // 7. RENDER (Layout Layer - MINIMAL logic)
  // ========================================
  return (
    <div>
      <GameHeader data={data} onClick={handleClick} />
    </div>
  );
}
```

## Dependency Rules (STRICTLY ENFORCED)

### The Dependency Flow

```
┌────────────────────────────┐
│   Dependency Flow          │
├────────────────────────────┤
│  App → Features → Shared   │
│         ↓          ↓       │
│      Shared    Libraries   │
└────────────────────────────┘
```

### Rules

1. **App** imports from **Features** and **Shared**
2. **Features** import from **Shared** only
3. **Shared** imports from **Libraries** only
4. ❌ **Features CANNOT import from other Features** (Use URL/Context/Events)
5. ❌ **Shared CANNOT import from Features**

### Cross-Feature Communication

If Feature A needs data from Feature B:

- **Option 1:** Pass via URL params/query string
- **Option 2:** Use Context API (for shared state like auth)
- **Option 3:** Use events/pub-sub pattern
- **❌ NOT ALLOWED:** Direct imports between features

## Public API (index.js)

Each feature **MUST** have an `index.js` that exports **ONLY** what other parts of the app need:

```javascript
// features/game-management/index.js

// Export page components (for routing)
export { default as GameDetailsPage } from './components/GameDetailsPage';
export { default as AddGamePage } from './components/AddGamePage';

// Export hooks (if needed by other features - RARE)
// Only export if truly reusable across features

// Export types/schemas (if needed by other features)
export * from './schemas';

// ❌ DO NOT export internal components
// ❌ DO NOT export utilities (keep internal)
// ❌ DO NOT export API functions (use hooks instead)
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `GameCard.jsx`, `PlayerList.jsx` |
| Hooks | `use` + PascalCase | `useGameState.js`, `useAuth.js` |
| Utils | camelCase | `formatDate.js`, `calculateScore.js` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS.js`, `GAME_STATUS.js` |
| Event Handlers | `handle` + Action | `handleClick`, `handleSubmit` |
| Boolean Props/Vars | `is`/`has`/`can` + State | `isLoading`, `hasError`, `canEdit` |
| Async Functions | verb + Resource | `fetchGames`, `createPlayer` |

## When to Split a Component

| Trigger | Action |
|---------|--------|
| > 3 `useEffect` hooks | Create a Custom Hook |
| JSX indentation 4+ levels deep | Extract a Component |
| > 5 `useState` calls | Use `useReducer` or Custom Hook |
| Writing raw `fetch` calls | Move to API layer |
| Component does 2+ things | Split by responsibility |
| Same code in 2+ places | Extract to shared component/hook |

## State Management Strategy

| Type | Solution | Example | When NOT to Use |
|------|----------|---------|-----------------|
| Server Data | React Query | `useQuery(keys.game(id))` | Never use `useEffect` for fetch |
| Local UI | `useState` | Open/Close modals, tabs | If shared across routes |
| Global UI | Context | AuthUser, Theme, Toasts | For server data (use RQ) |
| Form State | React Hook Form | Complex forms with validation | Simple 1-2 field forms |
| URL State | `useSearchParams` | Filters, Current View, IDs | For non-shareable state |

## Example: Well-Structured Feature

```
features/game-execution/
├── api/
│   ├── gameApi.js              # ~80 lines
│   ├── goalsApi.js             # ~100 lines
│   ├── substitutionsApi.js     # ~100 lines
│   └── index.js                # Re-exports
├── components/
│   ├── GameDetailsPage/
│   │   ├── index.jsx           # ~200 lines (orchestrator)
│   │   ├── hooks/
│   │   │   ├── useGameCore.js      # ~150 lines
│   │   │   ├── useGameEvents.js    # ~180 lines
│   │   │   └── index.js
│   │   └── modules/
│   │       ├── GameHeader.jsx      # ~80 lines
│   │       ├── EventsPanel.jsx     # ~120 lines
│   │       └── StatsSection.jsx    # ~100 lines
│   └── shared/
│       └── PlayerCard.jsx      # ~70 lines
├── hooks/
│   ├── useGameQuery.js         # ~60 lines
│   └── index.js
├── schemas/
│   ├── gameSchema.js           # ~50 lines
│   └── index.js
├── utils/
│   ├── gameValidation.js       # ~120 lines
│   ├── scoreCalculation.js     # ~80 lines
│   └── index.js
└── index.js                     # Public API
```

## Anti-Patterns to Avoid

### ❌ DON'T

```javascript
// ❌ Cross-feature imports
import { PlayerCard } from '@/features/players/components/PlayerCard';

// ❌ Direct fetch calls (use API layer + React Query)
useEffect(() => {
  fetch('/api/games').then(res => res.json()).then(setGames);
}, []);

// ❌ Inline styles (use Tailwind)
<div style={{ color: 'red', padding: '16px' }}>

// ❌ Multiple responsibilities in one file (500+ lines)
function GamePage() {
  // 500 lines managing roster, stats, events, reports, etc.
}

// ❌ Props drilling 4+ levels
<A x={x}><B x={x}><C x={x}><D x={x} /></C></B></A>

// ❌ Magic numbers/strings
if (status === 3) { ... } // Use GAME_STATUS.LIVE
```

### ✅ DO

```javascript
// ✅ Use shared components or create feature-specific component
import { PlayerCard } from '@/shared/ui/composed/PlayerCard';
// OR
import { PlayerCard } from '../shared/PlayerCard';

// ✅ Use API layer + React Query
const { data: games } = useQuery({
  queryKey: gameKeys.all,
  queryFn: () => gameApi.getAll(),
});

// ✅ Use Tailwind classes
<div className="text-red-500 p-4">

// ✅ Extract logic to hooks
function GamePage() {
  const { roster } = useRosterManagement(gameId);
  const { stats } = useGameStats(gameId);
  const { events } = useGameEvents(gameId);
  // ~150 lines total
}

// ✅ Use Context or composition
<GameContext.Provider value={gameData}>
  <GameLayout>
    <GameContent />
  </GameLayout>
</GameContext.Provider>

// ✅ Use constants
if (status === GAME_STATUS.LIVE) { ... }
```

## Pre-Commit Checklist

Before committing code, verify:

- [ ] All files ≤ 300 lines
- [ ] No cross-feature imports
- [ ] Imports ordered correctly (React → External → Internal → Local)
- [ ] Component follows anatomy pattern
- [ ] Logic extracted to hooks (if > 3 `useEffect` or > 5 `useState`)
- [ ] No direct `fetch` calls (use API layer)
- [ ] Tests included for new hooks/utils
- [ ] No console.log statements (use proper logging)
- [ ] ESLint passes with no violations

## Resources

- [Frontend Rules](./.cursor/rules/frontend.md) - Complete frontend standards
- [GameDetailsPage](./frontend/src/features/game-management/components/GameDetailsPage/) - Reference implementation
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Questions?

If you're unsure where to place code:

1. **Is it React?**
   - Yes → Is it feature-specific?
     - Yes → `features/{feature}/components/`
     - No → `shared/components/`
   - No → Is it a hook?
     - Yes → Is it feature-specific?
       - Yes → `features/{feature}/hooks/`
       - No → `shared/hooks/`
     - No → Is it a pure function?
       - Yes → `shared/lib/` or `features/{feature}/utils/`

2. **Does it need to be imported by other features?**
   - Yes → `shared/`
   - No → Keep in feature

3. **Is it over 200 lines?**
   - Yes → **Split it now** before committing

---

**Remember:** Consistency > Perfection. Follow these patterns, and the codebase will remain maintainable as it scales.

