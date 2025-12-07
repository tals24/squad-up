# Testing Guide

Comprehensive testing strategy for the SquadUp application.

## 🎯 Testing Philosophy

We follow the **Testing Trophy** approach:
- **70%** Integration Tests (how features work together)
- **20%** Unit Tests (individual functions/components)
- **10%** E2E Tests (critical user flows)

## 📦 Test Types

### 1. Unit Tests

Test individual units in isolation (functions, components, hooks).

**What to test:**
- API functions
- Utility functions
- React hooks
- Simple components

**Example:**
```javascript
// API unit test
describe('getGames', () => {
  it('should fetch all games', async () => {
    const games = await getGames();
    expect(games.success).toBe(true);
  });
});
```

### 2. Integration Tests

Test how multiple units work together.

**What to test:**
- Component interactions
- Data flow between components
- Form submissions with API calls
- State management

**Example:**
```javascript
// Integration test
describe('Game Creation Flow', () => {
  it('should create game and update list', async () => {
    render(<GameManagementPage />);
    
    fireEvent.click(screen.getByText('Add Game'));
    fireEvent.change(screen.getByLabelText('Opponent'), {
      target: { value: 'Real Madrid' }
    });
    fireEvent.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(screen.getByText('vs Real Madrid')).toBeInTheDocument();
    });
  });
});
```

### 3. End-to-End Tests

Test complete user journeys in a real browser.

**What to test:**
- Critical paths (login → create game → finalize)
- User workflows
- Cross-page interactions

**Example:**
```javascript
// E2E test with Playwright
test('coach can manage game lifecycle', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'coach@test.com');
  await page.click('button[type="submit"]');
  
  await page.click('text=Games');
  await page.click('text=Add Game');
  // ... complete flow
});
```

## 📁 Test Organization

```
frontend/src/
├── features/
│   ├── game-management/
│   │   ├── __tests__/
│   │   │   ├── gameApi.test.js          ← API tests
│   │   │   ├── useGameData.test.js      ← Hook tests
│   │   │   └── GameDetailsPage.test.jsx ← Component tests
│   │   ├── api/
│   │   ├── components/
│   │   └── hooks/
│   │
│   ├── player-management/
│   │   ├── __tests__/                   ← Same structure
│   │   └── ...
│   │
│   └── [other features]/
│
├── shared/
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useGames.test.js        ← Shared hook tests
│   │   │   └── usePlayers.test.js
│   │   └── queries/
│   │
│   ├── components/
│   │   ├── __tests__/
│   │   │   └── OptimizedImage.test.jsx ← Shared component tests
│   │   └── ...
│   │
│   └── utils/
│       ├── __tests__/
│       │   └── dateUtils.test.js        ← Utility tests
│       └── ...
│
└── __tests__/
    ├── integration/                     ← Integration tests
    │   ├── gameCreationFlow.test.jsx
    │   └── playerManagement.test.jsx
    │
    └── e2e/                            ← E2E tests (Playwright)
        ├── auth.spec.js
        ├── gameManagement.spec.js
        └── playerManagement.spec.js
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- gameApi.test.js

# Run tests for a feature
npm test -- game-management

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

## 🛠️ Testing Tools

### Jest
- Test runner and assertion library
- Mocking capabilities
- Coverage reports

### React Testing Library
- Component testing
- User-centric testing
- DOM queries

### Playwright
- E2E browser testing
- Multiple browser support
- Visual regression testing

### React Query Testing
- Hook testing utilities
- Cache management testing

## 📝 Writing Good Tests

### 1. Arrange-Act-Assert Pattern

```javascript
it('should add two numbers', () => {
  // Arrange - Set up test data
  const a = 2;
  const b = 3;
  
  // Act - Perform the action
  const result = add(a, b);
  
  // Assert - Verify the result
  expect(result).toBe(5);
});
```

### 2. Test Behavior, Not Implementation

```javascript
// ❌ Bad - Testing implementation
it('should call setState', () => {
  const component = render(<Counter />);
  component.setState({ count: 1 });
  expect(component.state.count).toBe(1);
});

// ✅ Good - Testing behavior
it('should increment counter when button clicked', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 3. Descriptive Test Names

```javascript
// ❌ Bad
it('works', () => { /* ... */ });

// ✅ Good
it('should display error message when API call fails', () => { /* ... */ });
```

### 4. Mock External Dependencies

```javascript
// Mock API calls
jest.mock('@/features/game-management/api/gameApi');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();
```

### 5. Clean Up After Tests

```javascript
describe('MyComponent', () => {
  beforeEach(() => {
    // Set up before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
  });

  it('should...', () => {
    // Test code
  });
});
```

## 🎯 Coverage Goals

| Layer | Target | Priority |
|-------|--------|----------|
| **API Functions** | 90%+ | High |
| **Utility Functions** | 90%+ | High |
| **React Hooks** | 80%+ | High |
| **Components** | 70%+ | Medium |
| **Integration Flows** | Key paths | High |
| **E2E Tests** | Critical paths | Medium |

## 📊 Current Test Status

### Features with Tests
- ✅ **Game Management**
  - API tests: 100%
  - Hook tests: 100%
  - Component tests: 0% (TODO)
  
- ⏳ **Player Management**
  - API tests: TODO
  - Hook tests: TODO
  - Component tests: TODO

- ⏳ **Team Management**
  - API tests: TODO
  - Hook tests: TODO
  - Component tests: TODO

### Shared Code Tests
- ✅ **Query Hooks**
  - useGames: 100%
  - usePlayers: TODO
  - useTeams: TODO

- ⏳ **Components**
  - VirtualList: TODO
  - OptimizedImage: TODO
  - ConfirmationModal: TODO

## 💡 Testing Examples

### API Test Example

```javascript
import { getGames } from '../api/gameApi';

global.fetch = jest.fn();

describe('getGames', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should fetch all games successfully', async () => {
    const mockGames = { success: true, data: [...] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGames,
    });

    const result = await getGames();

    expect(result).toEqual(mockGames);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/games',
      expect.any(Object)
    );
  });

  it('should throw error when fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(getGames()).rejects.toThrow('Failed to fetch games');
  });
});
```

### Component Test Example

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from '../components/GameCard';

describe('GameCard', () => {
  const mockGame = {
    _id: '1',
    opponent: 'Team A',
    date: '2024-01-01',
    status: 'Scheduled',
  };

  it('should render game information', () => {
    render(<GameCard game={mockGame} />);

    expect(screen.getByText('vs Team A')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    render(<GameCard game={mockGame} onEdit={handleEdit} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(handleEdit).toHaveBeenCalledWith(mockGame);
  });
});
```

### Hook Test Example

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useGames } from '../hooks/useGames';
import { QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useGames', () => {
  it('should fetch games on mount', async () => {
    const { result } = renderHook(() => useGames(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## 🔍 Debugging Tests

### Run Tests with Debugging

```bash
# Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code debugging
# Add breakpoint → Run "Jest Debug" configuration
```

### Common Issues

**Tests timeout:**
```javascript
// Increase timeout
jest.setTimeout(10000); // 10 seconds
```

**Async issues:**
```javascript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

**Component not found:**
```javascript
// Use screen.debug() to see rendered output
render(<MyComponent />);
screen.debug(); // Prints DOM to console
```

## 📚 Resources

- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Status:** ✅ Framework Setup Complete  
**Coverage:** ~15% (API + Hooks)  
**Next:** Component tests, Integration tests, E2E tests  
**Date:** December 2025

