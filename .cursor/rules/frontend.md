Frontend Development Rules (Squad Up)
🧠 Context Awareness

Stack: React 18, Vite, Tailwind CSS, React Query, JavaScript (ES2020+)
Architecture: Feature-Sliced Design (Lite)
Goal: STRICT component decoupling. No files over 300 lines.


🏗️ Project Structure & Dependencies
Directory Hierarchy
src/
├── app/                       # App shell, providers, router (Entry point)
├── features/                  # Domain-specific logic
│   ├── {feature-name}/
│   │   ├── api/               # API endpoints & React Query keys
│   │   ├── components/        # UI specific to this feature
│   │   ├── hooks/             # Logic extracted from UI
│   │   ├── schemas/           # Zod validation schemas
│   │   └── index.js           # ONLY public exports
├── shared/                    # Reusable code (No domain logic)
│   ├── api/                   # Base HTTP client
│   ├── components/            # Dumb UI components
│   ├── hooks/                 # Generic hooks (useDebounce, etc.)
│   ├── lib/                   # Utils (date, math, formatting)
│   └── ui/                    # Radix/Tailwind primitives
🛑 Dependency Rules (Strict)

App imports from Features and Shared
Features imports from Shared only
Shared imports from Libraries only
❌ Features CANNOT import from other Features (Use URL/Context/Events)
❌ Shared CANNOT import from Features

┌────────────────────────────┐
│   Dependency Flow          │
├────────────────────────────┤
│  App → Features → Shared   │
│         ↓          ↓       │
│      Shared    Libraries   │
└────────────────────────────┘

📏 File Size Limits (Zero Tolerance)
File TypeSoft LimitHard LimitActionUI Primitive100 lines150 linesSplit into sub-componentsComponent150 lines200 linesExtract logic to hooksPage200 lines250 linesExtract sections to modulesANY FILE250 lines300 linesREFACTOR IMMEDIATELY
ESLint Enforcement:
javascript'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }]

🧩 Component Architecture
The "Anatomy" of a Component
Always follow this exact ordering:
jsx// ==========================================
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
export function GameDetailsPage({ gameId }) {
  
  // ========================================
  // 3. HOOKS & DATA (Logic Layer)
  // ========================================
  // React Query
  const { data: game, isLoading, error } = useGameQuery(gameId);
  
  // Custom hooks
  const { updateScore, isUpdating } = useGameActions(gameId);
  
  // Local state
  const [viewState, setViewState] = useState('summary');

  // ========================================
  // 4. DERIVED STATE (Variables)
  // ========================================
  const isLive = game?.status === 'live';
  const canEdit = game?.canEdit && !isLive;

  // ========================================
  // 5. HANDLERS (Interaction Layer)
  // ========================================
  const handleScoreUpdate = async (newScore) => {
    try {
      await updateScore(newScore);
    } catch (error) {
      console.error('Score update failed:', error);
    }
  };

  const handleViewChange = (view) => setViewState(view);

  // ========================================
  // 6. EARLY RETURNS (Loading/Error)
  // ========================================
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!game) return <NotFound />;

  // ========================================
  // 7. RENDER (Layout Layer - MINIMAL logic)
  // ========================================
  return (
    <div className="p-4 space-y-6">
      <GameHeader 
        game={game} 
        isLive={isLive} 
        onScoreUpdate={handleScoreUpdate}
      />
      
      <ViewTabs 
        active={viewState} 
        onChange={handleViewChange} 
      />
      
      {viewState === 'summary' && <GameSummary game={game} />}
      {viewState === 'stats' && <GameStats game={game} />}
    </div>
  );
}
⚠️ When to Split a Component?
TriggerAction> 3 useEffect hooksCreate a Custom HookJSX indentation 4+ levels deepExtract a Component> 5 useState callsUse useReducer or Custom HookWriting raw fetch callsMove to API layerComponent does 2+ thingsSplit by responsibilitySame code in 2+ placesExtract to shared component/hook

📦 State Management Strategy
TypeSolutionExampleWhen NOT to UseServer DataReact QueryuseQuery(keys.game(id))Never use useEffect for fetchLocal UIuseStateOpen/Close modals, tabsIf shared across routesGlobal UIContextAuthUser, Theme, ToastsFor server data (use RQ)Form StateReact Hook FormComplex forms with validationSimple 1-2 field formsURL StateuseSearchParamsFilters, Current View, IDsFor non-shareable state
React Query Standards
✅ DO:
jsx// features/games/api/keys.js
export const gameKeys = {
  all: ['games'],
  lists: () => [...gameKeys.all, 'list'],
  list: (filters) => [...gameKeys.lists(), { filters }],
  detail: (id) => [...gameKeys.all, 'detail', id],
  roster: (id) => [...gameKeys.detail(id), 'roster'],
};

// features/games/hooks/useGameQuery.js
export function useGameQuery(gameId) {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => gameApi.getById(gameId),
    staleTime: 30000, // 30 seconds
    enabled: !!gameId,
  });
}

// features/games/hooks/useGameMutation.js
export function useGameMutation(gameId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => gameApi.update(gameId, data),
    onSuccess: (updatedGame) => {
      // Update cache
      queryClient.setQueryData(gameKeys.detail(gameId), updatedGame);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
    onError: (error) => {
      console.error('Update failed:', error);
      toast.error(error.message);
    },
  });
}
❌ DON'T:
jsx// ❌ Never fetch in useEffect
useEffect(() => {
  fetch('/api/games').then(res => res.json()).then(setGames);
}, []);

// ❌ Never hardcode query keys
useQuery({ queryKey: ['games', id], ... });

// ❌ Never skip staleTime (causes waterfall requests)
useQuery({ queryKey: gameKeys.all }); // Missing staleTime

🌐 API Integration
API Client Pattern
javascript// shared/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function apiClient(endpoint, { body, ...config } = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
    ...config,
  });

  // Handle auth errors globally
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
Resource API Pattern
javascript// features/games/api/gameApi.js
import { apiClient } from '@/shared/api/client';

export const gameApi = {
  getAll: (filters) => {
    const params = new URLSearchParams(filters);
    return apiClient(`/games?${params}`);
  },
  
  getById: (id) => apiClient(`/games/${id}`),
  
  create: (data) => apiClient('/games', { 
    method: 'POST', 
    body: data 
  }),
  
  update: (id, data) => apiClient(`/games/${id}`, { 
    method: 'PUT', 
    body: data 
  }),
  
  delete: (id) => apiClient(`/games/${id}`, { 
    method: 'DELETE' 
  }),
};

🎨 Styling & UI (Tailwind)
Core Rules

Utility First: No .css files (except globals.css for animations)
Responsive: Mobile-first (w-full md:w-1/2 lg:w-1/3)
Variants: Use cva for complex components
Spacing: Use standard scale (p-4, m-2, gap-3)
Colors: Use semantic tokens (bg-destructive vs bg-red-500)

Component Variants with CVA
jsximport { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button 
      className={cn(buttonVariants({ variant, size }), className)} 
      {...props} 
    />
  );
}
Responsive Patterns
jsx// ✅ Mobile-first responsive grid
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4 
  p-4 
  md:p-6
">

// ✅ Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// ✅ Hide/show on breakpoints
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>

⚡ Performance Rules
Code Splitting
jsx// ✅ ALWAYS lazy load routes
import { lazy } from 'react';

const GameDetailsPage = lazy(() => 
  import('@/features/games/components/GameDetailsPage')
);

const routes = [
  {
    path: '/games/:id',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <GameDetailsPage />
      </Suspense>
    ),
  },
];
Memoization
jsx// ✅ React.memo for list items that receive same props often
export const PlayerCard = React.memo(function PlayerCard({ player, onSelect }) {
  return (
    <Card onClick={() => onSelect(player.id)}>
      <h3>{player.name}</h3>
      <p>{player.position}</p>
    </Card>
  );
});

// ✅ useMemo for expensive calculations
const sortedPlayers = useMemo(() => 
  players
    .filter(p => p.status === 'active')
    .sort((a, b) => b.rating - a.rating),
  [players]
);

// ✅ useCallback for stable function references
const handleSelect = useCallback((playerId) => {
  setSelected(playerId);
  onPlayerSelect(playerId);
}, [onPlayerSelect]);
When NOT to optimize:

❌ Don't memo everything (premature optimization)
❌ Don't memo if props change every render
❌ Don't useMemo for simple calculations


🧪 Testing & Quality
Test Colocation
Tests live NEXT TO the component:
components/
├── PlayerCard.jsx
├── PlayerCard.test.jsx
└── GameHeader.jsx
Behavior Testing (Not Implementation)
jsx// ✅ GOOD: Test behavior
describe('GameCard', () => {
  it('shows game details when clicked', () => {
    render(<GameCard game={mockGame} />);
    
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    
    expect(screen.getByText('Roster')).toBeInTheDocument();
  });
});

// ❌ BAD: Test implementation
it('calls setIsExpanded when button clicked', () => {
  // Don't test internal state
});
JSDoc for Complex Logic
Since we use JavaScript, use JSDoc for:

Complex utility functions
Business logic
Non-obvious algorithms

javascript/**
 * Calculates match duration including stoppage time.
 * @param {number} regularTime - Minutes played (90 or 120)
 * @param {object} extraTime - Additional time per half
 * @param {number} extraTime.firstHalf - Minutes added in 1st half
 * @param {number} extraTime.secondHalf - Minutes added in 2nd half
 * @returns {number} Total match duration in minutes
 * @example
 * calculateDuration(90, { firstHalf: 2, secondHalf: 4 }) // 96
 */
export const calculateDuration = (regularTime, extraTime) => {
  return regularTime + extraTime.firstHalf + extraTime.secondHalf;
};

🔒 Security Rules
Input Sanitization
jsx// ✅ DO: Sanitize user input before rendering HTML
import DOMPurify from 'dompurify';

<div 
  dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(userBio) 
  }} 
/>

// ❌ DON'T: Never trust user input
<div dangerouslySetInnerHTML={{ __html: userBio }} /> // NEVER!
Token Storage
javascript// ✅ DO: Store JWT tokens in localStorage (OK for public apps)
localStorage.setItem('authToken', token);

// ⚠️ WARN: Never store sensitive data in localStorage
// ❌ passwords, credit cards, PII

// ✅ DO: Clear tokens on logout
const logout = () => {
  localStorage.removeItem('authToken');
  queryClient.clear(); // Clear React Query cache
  window.location.href = '/login';
};
Form Validation
jsx// ✅ ALWAYS validate on both client AND server
import { z } from 'zod';

const gameSchema = z.object({
  opponent: z.string().min(1, 'Opponent required').max(100),
  date: z.date().min(new Date(), 'Date must be in future'),
  location: z.string().min(1, 'Location required'),
});

// Client validation
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(gameSchema),
});

// Server MUST also validate (never trust client)

♿ Accessibility Standards
Always Include
jsx// ✅ Semantic HTML
<button onClick={handleClick}>Submit</button>  // Not <div>
<nav aria-label="Main navigation">...</nav>

// ✅ Alt text for images
<img src={player.avatar} alt={`${player.name}'s profile photo`} />

// ✅ Labels for inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" required />

// ✅ ARIA for icons/actions
<button aria-label="Close dialog" onClick={onClose}>
  <X aria-hidden="true" />
</button>

// ✅ Keyboard navigation
<Dialog onClose={onClose} trapFocus>
  {/* Focus trapped inside dialog */}
</Dialog>
Interactive Elements
jsx// ✅ Accessible form
<form role="form" aria-label="Create game">
  <fieldset>
    <legend>Game Details</legend>
    {/* ... */}
  </fieldset>
</form>

// ✅ Accessible status messages
<div role="status" aria-live="polite">
  {loading ? 'Loading games...' : `${games.length} games found`}
</div>

🐛 Error Handling
Error Boundaries
jsx// shared/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">
            Something went wrong
          </h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Use in App
<ErrorBoundary>
  <Routes />
</ErrorBoundary>
API Error Handling
jsx// ✅ Handle errors in mutations
const createGameMutation = useMutation({
  mutationFn: gameApi.create,
  onSuccess: (newGame) => {
    toast.success('Game created!');
    navigate(`/games/${newGame.id}`);
  },
  onError: (error) => {
    // Specific error handling
    if (error.message.includes('duplicate')) {
      toast.error('A game already exists at this time');
    } else {
      toast.error(error.message || 'Failed to create game');
    }
  },
});

// ✅ Handle query errors in UI
const { data, error, isError } = useGameQuery(gameId);

if (isError) {
  return (
    <ErrorState 
      title="Failed to load game"
      message={error.message}
      onRetry={refetch}
    />
  );
}

📝 Naming Conventions
TypeConventionExampleComponentsPascalCaseGameCard.jsx, PlayerList.jsxHooksuse + PascalCaseuseGameState.js, useAuth.jsUtilscamelCaseformatDate.js, calculateScore.jsConstantsSCREAMING_SNAKE_CASEAPI_ENDPOINTS.js, GAME_STATUS.jsEvent Handlershandle + ActionhandleClick, handleSubmitBoolean Props/Varsis/has/can + StateisLoading, hasError, canEditAsync Functionsverb + ResourcefetchGames, createPlayer

📋 Common Patterns
Form Handling (React Hook Form + Zod)
jsximport { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const gameSchema = z.object({
  opponent: z.string().min(1, 'Opponent is required'),
  date: z.date(),
  location: z.string().min(1, 'Location is required'),
});

function CreateGameForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(gameSchema),
  });

  const onFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="opponent">Opponent</label>
        <input 
          id="opponent"
          {...register('opponent')} 
          className="w-full px-3 py-2 border rounded"
        />
        {errors.opponent && (
          <p className="text-sm text-red-600">{errors.opponent.message}</p>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isSubmitting ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}
Dialog/Modal Pattern
jsx// Custom hook for modal state
function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

// Usage in component
function GamePage() {
  const createDialog = useDisclosure();
  const deleteDialog = useDisclosure();

  return (
    <>
      <Button onClick={createDialog.open}>Create Game</Button>
      
      <Dialog open={createDialog.isOpen} onClose={createDialog.close}>
        <DialogHeader>
          <DialogTitle>Create New Game</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <CreateGameForm onSuccess={createDialog.close} />
        </DialogBody>
      </Dialog>
    </>
  );
}

✅ Pre-Refactor Checklist (Cursor)
Before modifying code, Cursor MUST verify:

 File Size: Is this file approaching 200 lines? → Split NOW
 Logic in View: Am I adding logic to a component? → Move to Hook
 API Calls: Am I writing fetch? → Use React Query + API layer
 New Feature: Did I create a new /features/{name} folder?
 Imports: Are imports clean? (No ../../features/other)
 Validation: Is there a Zod schema for this input?
 Handlers: Are event handlers named handleX?
 Dependencies: Am I importing from another feature? → STOP (use Context/URL)
 State: Am I using the right state solution? (See strategy table)
 JSDoc: Did I document complex logic?


🚫 NEVER DO
jsx// ❌ Direct fetch calls (use API layer + React Query)
useEffect(() => {
  fetch('/api/games').then(res => res.json()).then(setGames);
}, []);

// ❌ Inline styles (use Tailwind)
<div style={{ color: 'red', padding: '16px' }}>

// ❌ Inline functions in JSX (extract to handleX)
<button onClick={() => { /* complex logic */ }}>

// ❌ Multiple responsibilities in one file
function GamePage() {
  // 500 lines managing roster, stats, events
}

// ❌ Cross-feature imports
import { PlayerCard } from '@/features/players/components/PlayerCard'; // FORBIDDEN

// ❌ Props drilling 4+ levels
<A x={x}><B x={x}><C x={x}><D x={x} /></C></B></A>

// ❌ Magic numbers/strings
if (status === 3) { ... } // Use GAME_STATUS.LIVE

// ❌ Mutating state directly
state.items.push(item); // Use setState with new array

// ❌ useEffect for data fetching
useEffect(() => {
  loadGames();
}, []); // Use React Query instead

💡 Quick Decision Trees
"Where should this code live?"
Is it React component?
├─ Yes: Is it specific to one feature?
│  ├─ Yes → features/{feature}/components/
│  └─ No → shared/components/
└─ No: Is it a hook?
   ├─ Yes: Is it specific to one feature?
   │  ├─ Yes → features/{feature}/hooks/
   │  └─ No → shared/hooks/
   └─ No: Is it a pure function?
      ├─ Yes → shared/lib/
      └─ No → Review architecture
"What state management do I use?"
What kind of data?
├─ From API? → React Query
├─ Form data? → React Hook Form
├─ In URL? → useSearchParams
├─ Global UI? → Context API
└─ Local UI? → useState/useReducer
"When do I split this component?"
Check one:
├─ > 200 lines? → Split now
├─ > 3 useEffect? → Extract hook
├─ > 5 useState? → Use useReducer
├─ JSX 4+ levels deep? → Extract component
├─ Doing 2+ things? → Split by responsibility
└─ Reused elsewhere? → Move to shared/

🎯 Import Order Standard
jsx// 1. React imports
import { useState, useEffect, useMemo } from 'react';

// 2. External libraries (alphabetical)
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Internal absolute imports (@/...)
import { Button } from '@/shared/ui/primitives';
import { useAuth } from '@/shared/hooks';
import { formatDate } from '@/shared/lib/format';

// 4. Feature imports (same feature only)
import { gameApi } from '../api/gameApi';
import { useGameQuery } from '../hooks/useGameQuery';

// 5. Local relative imports
import { GameHeader } from './GameHeader';
import { GameStats } from './GameStats';

// 6. Styles (if any)
import './styles.css';

📚 Resources

React Query: https://tanstack.com/query/latest/docs/react/overview
Tailwind CSS: https://tailwindcss.com/docs
React Hook Form: https://react-hook-form.com/
Zod Validation: https://zod.dev/
CVA (Class Variance Authority): https://cva.style/docs