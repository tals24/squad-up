# Game Management Tests

Feature-specific test suite for game management functionality.

## 🧪 Test Structure

```
game-management/
├── __tests__/
│   ├── gameApi.test.js           ← API layer tests
│   ├── GameDetailsPage.test.jsx  ← Component tests (to be added)
│   └── README.md                 ← This file
├── api/
├── components/
└── utils/
```

## 📋 Test Coverage

### API Tests (gameApi.test.js)
- ✅ Get all games
- ✅ Get single game by ID
- ✅ Create game
- ✅ Update game
- ✅ Delete game
- ✅ Error handling

### Hook Tests (useGames.test.js)
- ✅ useGames hook with caching
- ✅ useGame hook with ID
- ✅ useCreateGame mutation
- ✅ Cache invalidation
- ✅ Error states

### Component Tests (TODO)
- ⏳ GameDetailsPage rendering
- ⏳ Game form validation
- ⏳ Game status updates
- ⏳ Player substitutions

### Utils Tests (TODO)
- ⏳ Game time calculations
- ⏳ Minutes validation
- ⏳ Score calculations

## 🚀 Running Tests

```bash
# Run all game management tests
npm test -- game-management

# Run specific test file
npm test -- gameApi.test.js

# Run with coverage
npm test -- --coverage game-management

# Watch mode
npm test -- --watch game-management
```

## 📝 Writing New Tests

### API Test Template

```javascript
import { functionToTest } from '../api/someApi';

describe('API Function', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should do something', async () => {
    const mockData = { success: true, data: [] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await functionToTest();

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(/* ... */);
  });
});
```

### Hook Test Template

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMyHook } from '../hooks/useMyHook';

const createWrapper = () => {
  // ... QueryClient setup
};

describe('useMyHook', () => {
  it('should fetch data', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### Component Test Template

```javascript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalled();
  });
});
```

## 🎯 Best Practices

1. **Arrange-Act-Assert** - Structure tests clearly
2. **Mock External Dependencies** - API calls, localStorage, etc.
3. **Test User Behavior** - Not implementation details
4. **Descriptive Names** - "should do X when Y"
5. **Clean Up** - Use beforeEach/afterEach

## 📊 Coverage Goals

- **API Layer:** 90%+ coverage
- **Hooks:** 80%+ coverage
- **Components:** 70%+ coverage
- **Utils:** 90%+ coverage

---

**Status:** ✅ In Progress  
**Coverage:** ~30% (API tests done, hooks tests done)  
**Date:** December 2025

