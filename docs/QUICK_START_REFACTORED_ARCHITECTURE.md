# Quick Start: Refactored Frontend Architecture

**New to the refactored codebase?** This guide gets you up to speed in 10 minutes.

## 🎯 Core Principles

1. **No file over 300 lines** (enforced by ESLint)
2. **Features don't import from other features** (use `shared/`)
3. **Extract logic to hooks** (keep components focused on rendering)
4. **Use shared dialog system** (consistent UX)

## 📁 Project Structure

```
src/
├── app/                 # App setup (router, providers)
├── features/            # Domain features (game-management, players, etc.)
│   └── {feature}/
│       ├── api/         # API calls
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks
│       ├── schemas/     # Zod validation
│       └── utils/       # Pure functions
└── shared/              # Reusable across features
    ├── api/             # HTTP client
    ├── components/      # Generic components
    ├── dialogs/         # 🆕 Dialog system
    ├── hooks/           # Generic hooks
    ├── lib/             # Utilities
    └── ui/              # UI primitives (Radix + Tailwind)
```

## 🚀 Common Tasks

### Creating a New Feature

1. **Create feature folder:**
```bash
mkdir -p src/features/my-feature/{api,components,hooks,schemas,utils}
```

2. **Follow the template:** `docs/FEATURE_TEMPLATE.md`

3. **Export public API:** `src/features/my-feature/index.js`

### Creating a New Page Component

```jsx
// ✅ GOOD: ~150-200 lines max
// src/features/my-feature/components/MyPage/index.jsx

import { useMyData } from './hooks/useMyData';
import { MyHeader } from './modules/MyHeader';
import { MyContent } from './modules/MyContent';

export function MyPage() {
  // Hooks & data
  const { data, isLoading } = useMyData();
  
  // Early returns
  if (isLoading) return <PageLoader />;
  
  // Render
  return (
    <div>
      <MyHeader data={data} />
      <MyContent data={data} />
    </div>
  );
}
```

### Extracting a Custom Hook

When your component has > 3 `useEffect` or > 5 `useState`:

```jsx
// ❌ BAD: Logic mixed with UI
function GamePage({ gameId }) {
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/games/${gameId}`)
      .then(res => res.json())
      .then(setGame)
      .finally(() => setIsLoading(false));
  }, [gameId]);
  
  // 200 more lines...
}

// ✅ GOOD: Logic in hook, component renders
// hooks/useGame.js
function useGame(gameId) {
  const { data: game, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameApi.getById(gameId),
  });
  
  return { game, isLoading };
}

// components/GamePage/index.jsx
function GamePage({ gameId }) {
  const { game, isLoading } = useGame(gameId);
  
  if (isLoading) return <LoadingSpinner />;
  
  return <div>{/* Render game */}</div>;
}
```

### Using the Shared Dialog System

```jsx
import { useDialog, ConfirmDialog } from '@/shared/dialogs';

function MyComponent() {
  const deleteDialog = useDialog();
  
  const handleDelete = async () => {
    await api.deleteItem(itemId);
    // Dialog closes automatically on success
  };
  
  return (
    <>
      <Button onClick={deleteDialog.open}>Delete</Button>
      
      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        title="Delete Item"
        message="Are you sure? This cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
```

### Using FormDialog

```jsx
import { FormDialog } from '@/shared/dialogs';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

function MyForm() {
  const dialog = useDialog();
  
  const handleSubmit = async (data) => {
    await api.createItem(data);
    // FormDialog handles reset and close
  };
  
  return (
    <FormDialog
      open={dialog.isOpen}
      onOpenChange={dialog.setIsOpen}
      title="Create Item"
      onSubmit={handleSubmit}
      defaultValues={{ name: '', email: '' }}
      resolver={zodResolver(schema)}
    >
      <FormField name="name" label="Name" />
      <FormField name="email" label="Email" type="email" />
    </FormDialog>
  );
}
```

## 🔍 Finding Examples

**Best reference:** `src/features/game-management/components/GameDetailsPage/`

This component demonstrates:
- ✅ 9 custom hooks extracted
- ✅ 2,589 lines → 1,079 lines (58% reduction)
- ✅ Clear separation of concerns
- ✅ Dialog system usage
- ✅ Validation patterns

**Other good examples:**
- `src/features/drill-system/` - Clean feature structure
- `src/shared/dialogs/` - Reusable dialog patterns

## 📏 File Size Guidelines

| If your file is... | Then... |
|-------------------|---------|
| > 150 lines | Consider extracting logic to hooks |
| > 200 lines | Extract UI sections to modules |
| > 250 lines | **Refactor now** (approaching hard limit) |
| > 300 lines | ❌ **ESLint error** (will not pass CI) |

## ⚠️ Common Mistakes

### ❌ DON'T: Cross-Feature Imports
```jsx
// ❌ BAD: Importing from another feature
import { PlayerCard } from '@/features/players/components/PlayerCard';
```

### ✅ DO: Use Shared or Recreate
```jsx
// ✅ GOOD: Import from shared
import { PlayerCard } from '@/shared/ui/composed/PlayerCard';

// ✅ OR: Create feature-specific component
import { PlayerCard } from '../shared/PlayerCard';
```

### ❌ DON'T: Direct Fetch Calls
```jsx
// ❌ BAD: Direct fetch in useEffect
useEffect(() => {
  fetch('/api/games').then(res => res.json()).then(setGames);
}, []);
```

### ✅ DO: Use API Layer + React Query
```jsx
// ✅ GOOD: API layer + React Query
const { data: games } = useQuery({
  queryKey: gameKeys.all,
  queryFn: () => gameApi.getAll(),
});
```

### ❌ DON'T: Inline Complex Logic
```jsx
// ❌ BAD: Complex logic in JSX
<button onClick={() => {
  // 50 lines of logic...
}}>
  Click
</button>
```

### ✅ DO: Extract Handlers
```jsx
// ✅ GOOD: Named handler
const handleClick = async () => {
  // 50 lines of logic...
};

<button onClick={handleClick}>Click</button>
```

## 🛠️ ESLint Integration

Your code **will not pass CI** if it violates these rules:

```javascript
// Enforced automatically
'max-lines': ['error', { max: 300 }]
'no-restricted-imports': ['error', { /* cross-feature imports */ }]
```

**Run locally:**
```bash
npm run lint
```

**Fix auto-fixable issues:**
```bash
npm run lint -- --fix
```

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| `docs/FEATURE_TEMPLATE.md` | Standard feature structure |
| `docs/REFACTORING_SUMMARY.md` | What changed & why |
| `.cursor/rules/frontend.md` | Complete frontend standards |
| `shared/dialogs/README.md` | Dialog system usage |

## 🎓 Learning Path

**Day 1:** Read `FEATURE_TEMPLATE.md` (20 min)

**Day 2:** Study `GameDetailsPage/` structure (30 min)
- Look at `hooks/` folder - see how logic is extracted
- Look at main `index.jsx` - see how hooks are composed

**Day 3:** Try refactoring a small component:
1. Find a component > 200 lines
2. Extract 1-2 hooks
3. Reduce file size by 30%+

**Day 4:** Create a new feature using the template
- Follow `FEATURE_TEMPLATE.md`
- Use shared dialog system
- Keep files under 200 lines

**Week 2:** You're now an expert! 🎉

## 💡 Pro Tips

1. **Start with hooks:** Extract logic before UI
2. **Use search:** Find `useGame` or `useDialog` to see examples
3. **Check line count:** Many editors show line count in status bar
4. **Run ESLint often:** `npm run lint` catches issues early
5. **Ask for reviews:** Complex refactors benefit from peer review

## 🆘 Need Help?

1. **Check examples:** `GameDetailsPage/`, `drill-system/`
2. **Read docs:** `FEATURE_TEMPLATE.md`, `frontend.md`
3. **Search codebase:** Look for similar patterns
4. **Ask the team:** We're building this together!

## ✅ Pre-Commit Checklist

Before committing:

- [ ] All files ≤ 300 lines
- [ ] No cross-feature imports
- [ ] Imports ordered correctly
- [ ] Logic extracted to hooks (if > 3 `useEffect`)
- [ ] `npm run lint` passes
- [ ] Component follows anatomy pattern

## 🚦 Quick Decision Tree

**"Where does this code go?"**

```
Is it React?
├─ Yes: Feature-specific?
│  ├─ Yes → features/{feature}/components/
│  └─ No → shared/components/
└─ No: Is it a hook?
   ├─ Yes: Feature-specific?
   │  ├─ Yes → features/{feature}/hooks/
   │  └─ No → shared/hooks/
   └─ No: Pure function?
      ├─ Yes → features/{feature}/utils/ or shared/lib/
```

**"When do I split this component?"**

```
Check any:
├─ > 200 lines? → Split now
├─ > 3 useEffect? → Extract hook
├─ > 5 useState? → Use useReducer or custom hook
├─ JSX 4+ levels deep? → Extract component
├─ Doing 2+ things? → Split by responsibility
└─ Reused elsewhere? → Move to shared/
```

---

**Welcome to the refactored architecture!** 🎉

You're now working with a **cleaner, more maintainable, and more scalable** codebase. The patterns you follow today will make everyone's life easier tomorrow.

Happy coding! 🚀

