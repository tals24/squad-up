# Testing Guide — Frontend Refactor Project

Complete guide to all tests in the project, how to run them, and what they verify.

**Last Updated**: 2024-12-28  
**Related**: Task 1.0 (Phase 0 Safety Net)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Overview](#test-overview)
3. [How to Run Tests](#how-to-run-tests)
4. [Existing Tests (Pre-Phase 0)](#existing-tests-pre-phase-0)
5. [New Tests (Phase 0)](#new-tests-phase-0)
6. [Complete Test Catalog](#complete-test-catalog)
7. [Test Data Setup](#test-data-setup)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Run all unit + integration tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Run E2E tests (requires backend + frontend servers running)
npx playwright test

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run specific E2E test file
npx playwright test gameDetails.smoke.spec.js
```

---

## 📊 Test Overview

### Test Pyramid

```
        E2E (Smoke Tests)
          15+ scenarios
       /              \
      /                \
     /   Integration    \
    /    18+ scenarios   \
   /                      \
  /________________________\
        Unit Tests
      30+ scenarios
```

### Test Distribution

| Test Type | Files | Tests | Coverage Focus | Status |
|---|---:|---:|---|---|
| **E2E Smoke** | 2 | 15+ | Critical user flows (GameDetails) | ✅ Complete |
| **Integration** | 2 | 18+ | Component + API + State integration | ✅ Complete |
| **Unit (Hooks)** | 2 | 8+ | useAutosave, useGames behavior | ✅ Complete |
| **Unit (Utils)** | 3 | 12+ | Validation logic (squad, minutes, position) | ✅ Complete |
| **Unit (API)** | 1 | 4+ | API client functions | ✅ Complete |
| **Unit (Components)** | 4 | 10+ | GameDetailsPage specific logic | ✅ Complete |
| **TOTAL** | **14** | **67+** | — | ✅ |

---

## 🔧 How to Run Tests

### Unit + Integration Tests (Jest + React Testing Library)

```bash
# From frontend directory
cd frontend

# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Run specific test file
npm test -- useAutosave.test.js

# Run tests matching a pattern
npm test -- GameDetails

# Run integration tests only
npm test -- integration

# Run unit tests only
npm test -- __tests__

# Run in CI mode (no watch, generates coverage)
npm test:ci
```

**Output**: Results displayed in terminal, coverage report in `coverage/` directory

---

### E2E Tests (Playwright)

**Prerequisites**:
1. Backend server running on `http://localhost:3001`
2. Frontend server running on `http://localhost:5173` (or Playwright will auto-start)
3. Test database with seed data

```bash
# From frontend directory
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run in headed mode (see browser actions)
npx playwright test --headed

# Run in debug mode (step through tests)
npx playwright test --debug

# Run specific test file
npx playwright test gameDetails.smoke.spec.js

# Run specific test suite
npx playwright test --grep "Scheduled Status"

# Generate HTML report
npx playwright show-report

# Run with slow motion (helpful for debugging)
npx playwright test --headed --slow-mo=1000
```

**Output**: HTML report generated in `playwright-report/`, screenshots on failures

---

### Manual Smoke Tests

**Purpose**: Verify behavior parity after refactor PRs

**Location**: `tasks/phase0-manual-smoke-checklist.md`

**When to Run**: After each Phase 1 PR (incremental decomposition) and before merging to main

**Steps**:
1. Start backend server: `cd backend && npm run dev`
2. Start frontend server: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`
4. Follow checklist step-by-step
5. Record results in PR description

---

## 📂 Existing Tests (Pre-Phase 0)

These tests existed before Task 1.0 was implemented.

### E2E Tests

| File | What | Scenarios | Status |
|---|---|---:|---|
| `e2e/gameManagement.spec.js` | Complete game management workflow | 6 | ✅ |

### Integration Tests

| File | What | Scenarios | Status |
|---|---|---:|---|
| `integration/gameCreationFlow.test.jsx` | Create game → appears in list | 2 | ✅ |

### Unit Tests (GameDetailsPage Specific)

| File | What | Scenarios | Status |
|---|---|---:|---|
| `GameDetailsPage/__tests__/validation.integration.test.jsx` | Validation flows (lineup, bench, goalkeeper) | 8 | ✅ |
| `GameDetailsPage/__tests__/draftMerge.test.jsx` | Draft load precedence logic | 3 | ✅ |
| `GameDetailsPage/__tests__/draftE2E.test.jsx` | Draft save/load end-to-end | 2 | ✅ |

### Unit Tests (Shared Hooks)

| File | What | Scenarios | Status |
|---|---|---:|---|
| `shared/hooks/__tests__/useAutosave.test.js` | Debounce, change detection, spam prevention | 5 | ✅ |
| `shared/hooks/__tests__/useGames.test.js` | Games data fetching | 3 | ✅ |

### Unit Tests (Utilities)

| File | What | Scenarios | Status |
|---|---|---:|---|
| `game-management/utils/__tests__/squadValidation.test.js` | Starting lineup validation logic | 4 | ✅ |
| `game-management/utils/__tests__/minutesValidation.test.js` | Match minute validation | 3 | ✅ |

### Unit Tests (API Layer)

| File | What | Scenarios | Status |
|---|---|---:|---|
| `game-management/__tests__/gameApi.test.js` | Game API functions | 4 | ✅ |

### Unit Tests (Components)

| File | What | Scenarios | Status |
|---|---|---:|---|
| `shared/components/__tests__/ConfirmationModal.test.jsx` | Modal open/close/confirm behavior | 3 | ✅ |

**Total Existing**: 12 files, 37+ test scenarios

---

## ✨ New Tests (Phase 0)

Tests added during Task 1.0 to establish safety net for refactoring.

### E2E Smoke Tests

| File | What | Scenarios | Status |
|---|---|---:|---|
| `e2e/gameDetails.smoke.spec.js` | **NEW**: GameDetailsPage critical flows | 15+ | ✅ |

### Integration Tests

| File | What | Scenarios | Status |
|---|---|---:|---|
| `integration/gameDetailsPage.test.jsx` | **NEW**: GameDetailsPage behavior parity | 18+ | ✅ |

**Total New**: 2 files, 33+ test scenarios

---

## 📖 Complete Test Catalog

### E2E Tests (Playwright)

#### 1. Game Management E2E (`e2e/gameManagement.spec.js`)

**Purpose**: Verify complete game management workflow

**Path**: `frontend/src/__tests__/e2e/gameManagement.spec.js`

**Prerequisites**: Backend + frontend running, test user (`coach@test.com` / `password123`)

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Create new game | Fill form → Submit | Game appears in schedule | L32-55 |
| View game details | Click game card | Details page loads | L57-68 |
| Update game status | Change status dropdown | Status updates | L70-81 |
| Finalize game with score | Enter scores → Finalize | Game marked as "Played" | L83-102 |
| Add goal during game | Open dialog → Select player → Save | Goal appears in timeline | L104-125 |
| Handle substitution | Select players out/in → Save | Substitution recorded | L127-151 |
| Validation error (past date) | Submit with past date | Error message shown | L164-175 |
| Network error handling | Block API → Navigate | Error state displayed | L177-185 |

**Run**:
```bash
npx playwright test gameManagement.spec.js
```

---

#### 2. GameDetails Smoke Tests (`e2e/gameDetails.smoke.spec.js`) ⭐ **NEW**

**Purpose**: Safety net for GameDetailsPage refactor — verify behavior parity across all 3 game states

**Path**: `frontend/src/__tests__/e2e/gameDetails.smoke.spec.js`

**Prerequisites**: Backend + frontend running, games in Scheduled/Played/Done status

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| **Scheduled Game** ||||
| Load scheduled game | Navigate to game | Page loads, roster sidebar visible | L42-59 |
| Persist roster changes | Change player status → Wait → Refresh | Changes persist after reload | L61-82 |
| Validate lineup | Click "Game Was Played" with invalid lineup | Validation blocks transition | L84-114 |
| **Played Game** ||||
| Load played game | Navigate to game | Events section visible | L122-145 |
| Open goal dialog | Click "+ Goal" | Dialog opens with form | L147-162 |
| Open player report | Click player card | Performance dialog opens | L164-180 |
| Show submit button | Verify UI | "Submit Final Report" button visible | L182-186 |
| **Done Game** ||||
| Load done game | Navigate to game | Read-only mode, final score shown | L194-206 |
| Read-only enforcement | Try editing | Buttons disabled/hidden | L208-224 |
| View finalized reports | Click player | Dialog opens in read-only | L226-240 |
| **Error Handling** ||||
| Handle missing game | Navigate to invalid ID | Error state (no crash) | L248-263 |
| Handle network error | Block API → Navigate | Error shown (no white screen) | L265-283 |

**Run**:
```bash
npx playwright test gameDetails.smoke.spec.js

# Run only Scheduled tests
npx playwright test gameDetails.smoke.spec.js --grep "Scheduled Status"

# Run only Played tests
npx playwright test gameDetails.smoke.spec.js --grep "Played Status"

# Run only Done tests
npx playwright test gameDetails.smoke.spec.js --grep "Done Status"
```

---

### Integration Tests (React Testing Library + Jest)

#### 3. Game Creation Flow (`integration/gameCreationFlow.test.jsx`)

**Purpose**: Verify game creation updates list

**Path**: `frontend/src/__tests__/integration/gameCreationFlow.test.jsx`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Create game flow | Fill form → Submit | Game appears in list | L50-109 |
| Creation failure | Mock API error → Submit | Error message shown | L111-132 |

**Run**:
```bash
npm test -- gameCreationFlow.test.jsx
```

---

#### 4. GameDetailsPage Integration (`integration/gameDetailsPage.test.jsx`) ⭐ **NEW**

**Purpose**: Safety net for refactor — verify GameDetailsPage behavior with mocked APIs

**Path**: `frontend/src/__tests__/integration/gameDetailsPage.test.jsx`

**Mocks**: All API modules, DataProvider, React Query

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| **Scheduled Status** ||||
| Load game | Render with Scheduled game | Game header + tactical board visible | L214-228 |
| Persist draft | Change status → Wait | Draft autosave API called | L230-245 |
| Block invalid transition | Click "Game Was Played" with < 11 players | Error shown, API not called | L247-270 |
| Allow valid transition | 11 players → Click "Game Was Played" | API called, game transitions | L272-315 |
| **Played Status** ||||
| Load played game | Render with Played game | Events section visible | L323-336 |
| Open goal dialog | Click "+ Goal" button | Dialog renders | L338-353 |
| Save goal | Fill form → Save | API called, timeline refreshes | L355-384 |
| Open player report | Click player card | Performance dialog opens | L386-403 |
| Persist report draft | Edit summary → Save | Draft autosave API called | L405-426 |
| Block incomplete report | Submit with missing summaries | Validation blocks, API not called | L428-456 |
| **Done Status** ||||
| Load done game | Render with Done game | Status "Done", final score shown | L464-478 |
| No submit button | Check UI | "Submit Final Report" not present | L480-487 |
| Read-only dialog | Click player | Dialog opens, inputs disabled | L489-504 |
| No event additions | Check UI | Event buttons disabled/hidden | L506-518 |
| **Error Handling** ||||
| Game not found | Mock 404 error | Error message shown | L526-534 |
| API error | Mock network error | Error state (no crash) | L536-544 |
| Missing draft | Render with no draft | Empty formation (no crash) | L546-560 |

**Run**:
```bash
npm test -- gameDetailsPage.test.jsx

# Run only Scheduled tests
npm test -- gameDetailsPage.test.jsx -t "Scheduled Status"

# Run only Played tests
npm test -- gameDetailsPage.test.jsx -t "Played Status"

# Run only Done tests
npm test -- gameDetailsPage.test.jsx -t "Done Status"
```

---

### Unit Tests (GameDetailsPage Specific)

#### 5. Validation Integration (`GameDetailsPage/__tests__/validation.integration.test.jsx`)

**Purpose**: Verify validation logic integrates correctly with UI

**Path**: `frontend/src/features/game-management/components/GameDetailsPage/__tests__/validation.integration.test.jsx`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Block incomplete formation | < 11 players → "Game Was Played" | Error modal shown | L247-294 |
| Allow complete formation | 11 players → "Game Was Played" | API called | L296-357 |
| Small bench warning | 11 starting + < 3 bench → Click | Confirmation modal shown | L361-410 |
| Confirm small bench | Confirm modal | API proceeds | L412-474 |
| Cancel small bench | Cancel modal | API not called | L476-534 |
| Block missing goalkeeper | 11 non-goalkeepers → Click | Error shown | L561-621 |
| Handle API errors | Mock API error → Click | Error handled gracefully | L623-672 |
| Handle network errors | Mock 500 error → Click | Error shown | L673-722 |

**Run**:
```bash
npm test -- validation.integration.test.jsx
```

---

#### 6. Draft Merge Logic (`GameDetailsPage/__tests__/draftMerge.test.jsx`)

**Purpose**: Verify draft load precedence (draft → gameRosters → default)

**Path**: `frontend/src/features/game-management/components/GameDetailsPage/__tests__/draftMerge.test.jsx`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Draft precedence | Draft exists + gameRosters exist | Draft data loads | — |
| Fallback to rosters | No draft + gameRosters exist | Rosters load | — |
| Default state | No draft + no rosters | Empty formation loads | — |

**Run**:
```bash
npm test -- draftMerge.test.jsx
```

---

#### 7. Draft E2E (`GameDetailsPage/__tests__/draftE2E.test.jsx`)

**Purpose**: Verify draft save/load workflow end-to-end

**Path**: `frontend/src/features/game-management/components/GameDetailsPage/__tests__/draftE2E.test.jsx`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Save draft | Change roster → Wait 2.5s | Draft saved to API | — |
| Load draft | Refresh page | Draft loads from API | — |

**Run**:
```bash
npm test -- draftE2E.test.jsx
```

---

### Unit Tests (Shared Hooks)

#### 8. Autosave Hook (`shared/hooks/__tests__/useAutosave.test.js`)

**Purpose**: Verify autosave debounce and spam prevention

**Path**: `frontend/src/shared/hooks/__tests__/useAutosave.test.js`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Debounce rapid changes | 5 changes in 1s | Only 1 API call after 2.5s | L46-100 |
| Ignore identical changes | Same data multiple times | No API calls | L108-154 |
| Skip when disabled | enabled=false | No API calls | L161-189 |
| Skip when shouldSkip true | Custom skip function | No API calls | L196-239 |
| Handle API errors | Mock fetch error | Error handled gracefully | L246-287 |

**Run**:
```bash
npm test -- useAutosave.test.js
```

---

#### 9. Games Hook (`shared/hooks/__tests__/useGames.test.js`)

**Purpose**: Verify games data fetching logic

**Path**: `frontend/src/shared/hooks/__tests__/useGames.test.js`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Fetch games | Call hook | Games array returned | — |
| Handle loading | Initial state | Loading indicator shown | — |
| Handle errors | API fails | Error state returned | — |

**Run**:
```bash
npm test -- useGames.test.js
```

---

### Unit Tests (Utilities)

#### 10. Squad Validation (`game-management/utils/__tests__/squadValidation.test.js`)

**Purpose**: Verify starting lineup validation rules

**Path**: `frontend/src/features/game-management/utils/__tests__/squadValidation.test.js`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Valid formation | 11 players, 1 GK | Validation passes | — |
| Missing players | < 11 players | Error: "Must have 11 players" | — |
| Missing goalkeeper | 11 players, 0 GK | Error: "Must have goalkeeper" | — |
| Too many players | > 11 players | Error: "Cannot exceed 11" | — |

**Run**:
```bash
npm test -- squadValidation.test.js
```

---

#### 11. Minutes Validation (`game-management/utils/__tests__/minutesValidation.test.js`)

**Purpose**: Verify match minute validation

**Path**: `frontend/src/features/game-management/utils/__tests__/minutesValidation.test.js`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Valid minute | Minute 1-90 | Validation passes | — |
| Negative minute | Minute < 0 | Error: "Minute cannot be negative" | — |
| Excessive minute | Minute > 120 | Error: "Minute exceeds match duration" | — |

**Run**:
```bash
npm test -- minutesValidation.test.js
```

---

### Unit Tests (API Layer)

#### 12. Game API (`game-management/__tests__/gameApi.test.js`)

**Purpose**: Verify game API functions

**Path**: `frontend/src/features/game-management/__tests__/gameApi.test.js`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Fetch games | Call getGames() | Returns games array | — |
| Create game | Call createGame(data) | Returns created game | — |
| Update game | Call updateGame(id, data) | Returns updated game | — |
| Delete game | Call deleteGame(id) | Returns success | — |

**Run**:
```bash
npm test -- gameApi.test.js
```

---

### Unit Tests (Components)

#### 13. Confirmation Modal (`shared/components/__tests__/ConfirmationModal.test.jsx`)

**Purpose**: Verify modal open/close/confirm behavior

**Path**: `frontend/src/shared/components/__tests__/ConfirmationModal.test.jsx`

| Test Case | Scenario | Expected Result | Line Ref |
|---|---|---|---|
| Render open modal | isOpen=true | Modal visible | — |
| Render closed modal | isOpen=false | Modal hidden | — |
| Confirm action | Click confirm button | onConfirm called | — |
| Cancel action | Click cancel button | onCancel called | — |

**Run**:
```bash
npm test -- ConfirmationModal.test.jsx
```

---

## 🗄️ Test Data Setup

### E2E Test Data Requirements

For E2E tests to pass, the following test data must exist in the database:

#### Test User
- **Email**: `coach@test.com`
- **Password**: `password123`
- **Role**: Coach or Admin

#### Test Games (At Least 3)
1. **Scheduled Game**
   - Status: "Scheduled"
   - Has team with 15+ players
   - No gameRosters yet

2. **Played Game**
   - Status: "Played"
   - Has starting lineup (11 players)
   - May have goals/substitutions/cards

3. **Done Game**
   - Status: "Done"
   - Has final score
   - Has player reports
   - All fields finalized

### Creating Test Data

```bash
# Option 1: Run database seed script (if available)
cd backend
npm run seed:test

# Option 2: Use the app UI to create test games manually
# 1. Start backend + frontend
# 2. Login as test user
# 3. Create games with different statuses

# Option 3: Use MongoDB Compass to insert test documents
# Import test data from backend/seeds/ directory (if available)
```

---

## 🐛 Troubleshooting

### Issue: E2E Tests Fail with "Navigation timeout"

**Cause**: Backend or frontend not running

**Solution**:
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run E2E tests
cd frontend
npx playwright test
```

---

### Issue: E2E Tests Fail with "Test user not found"

**Cause**: Test database doesn't have test user

**Solution**:
1. Create test user in database:
   - Email: `coach@test.com`
   - Password: `password123`
   - Role: Coach
2. OR update test file with existing user credentials

---

### Issue: Unit Tests Fail with "Cannot find module '@/...'"

**Cause**: Jest path alias not configured

**Solution**:
Check `frontend/jest.config.js` has:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

### Issue: "module is not defined in ES module scope" Error

**Cause**: Babel configuration file using CommonJS syntax in ESM project

**Error Message**:
```
ReferenceError: module is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension 
and 'package.json' contains "type": "module"
```

**Solution**:
The project has both `.babelrc.js` (CommonJS) and `.babelrc.cjs` files. Delete `.babelrc.js`:

```bash
cd frontend
rm .babelrc.js
npm test
```

Already fixed in this branch ✅

---

### Issue: Tests Pass Locally but Fail in CI

**Cause**: Timing differences or environment issues

**Solution**:
```bash
# Run tests in CI mode locally
npm test:ci

# Check for timing issues (increase timeouts if needed)
# Check for hardcoded paths or environment variables
```

---

### Issue: Playwright Tests Show "Browser not installed"

**Cause**: Playwright browsers not installed

**Solution**:
```bash
npx playwright install
```

---

### Issue: Tests Are Slow

**Optimization**:
```bash
# Run specific test file instead of all
npm test -- fileName.test.js

# Run tests in parallel (Jest does this by default)
npm test -- --maxWorkers=4

# For E2E, use --workers flag
npx playwright test --workers=2
```

---

## 📚 Additional Resources

- **Frontend Architecture**: `docs/frontendImproved.md`
- **Backend Architecture**: `docs/official/backendSummary.md`
- **Manual Smoke Checklist**: `tasks/phase0-manual-smoke-checklist.md`
- **User Flows Specification**: `tasks/phase0-pilot-user-flows.md`
- **Refactor Gates**: `tasks/phase0-refactor-gates.md`
- **Task List**: `tasks/tasks-frontend-refactor-execution-plan.md`

---

## ✅ Next Steps

After understanding the test suite:

1. **Run all tests** to establish baseline (should all pass)
2. **Review manual smoke checklist** to understand user flows
3. **Proceed to Phase 1** (Task 2.0: Decomposition Map)
4. **Use refactor gates** for every PR during refactoring

---

**Last Updated**: 2024-12-28  
**Maintained By**: Frontend Refactor Team  
**Questions?**: Review test files directly or check README files in each test directory

