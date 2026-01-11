# Integration Tests

Tests for how multiple features and components work together.

## 🎯 What We Test

Integration tests verify that different parts of the app work correctly together:
- Component interactions
- Data flow between features
- API calls with UI updates
- State management across components

## 📁 Test Files

- `gameCreationFlow.test.jsx` - Creating a game and seeing it in the list
- `playerManagement.test.jsx` - Player CRUD operations (TODO)
- `gameLifecycle.test.jsx` - Complete game workflow (TODO)
- `dataSync.test.jsx` - Data synchronization between features (TODO)

## 🚀 Running Integration Tests

```bash
# Run all integration tests
npm test -- integration

# Run specific integration test
npm test -- gameCreationFlow.test.jsx

# Watch mode
npm test -- --watch integration
```

## 📝 Writing Integration Tests

### Template

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AllProviders } from '@/test-utils';

describe('Feature Integration', () => {
  it('should integrate feature A with feature B', async () => {
    // 1. Render the app/feature
    render(<MyFeature />, { wrapper: AllProviders });

    // 2. Interact with UI
    fireEvent.click(screen.getByText('Action'));

    // 3. Verify cross-feature effects
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });
});
```

### Key Patterns

1. **Use All Providers** - Wrap with QueryClient, Router, Data providers
2. **Mock API Calls** - Control API responses
3. **Test User Flows** - Simulate real user actions
4. **Verify Side Effects** - Check that related features update

## 🎯 Test Scenarios

### High Priority
- ✅ **Game Creation** - Create game → appears in list
- ⏳ **Player Addition** - Add player → appears in roster
- ⏳ **Game Finalization** - Finalize → stats update
- ⏳ **Data Sync** - Update in one place → reflects everywhere

### Medium Priority
- ⏳ **Form Validation** - Invalid data → error messages
- ⏳ **Navigation** - Page transitions → state persists
- ⏳ **Search/Filter** - Filter players → list updates
- ⏳ **Bulk Operations** - Select multiple → bulk action

### Low Priority
- ⏳ **Edge Cases** - Empty states, errors, loading
- ⏳ **Performance** - Large datasets, many components

## 📊 Coverage

| Flow | Tests | Coverage |
|------|-------|----------|
| Game Creation | ✅ 1 test | 100% |
| Player Management | ⏳ TODO | 0% |
| Data Sync | ⏳ TODO | 0% |
| Navigation | ⏳ TODO | 0% |

**Goal:** 70% coverage of critical flows

---

**Status:** ✅ Framework Setup  
**Tests:** 1/10 planned tests  
**Date:** December 2025

