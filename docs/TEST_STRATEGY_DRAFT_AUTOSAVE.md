# Test Strategy: Draft & Autosave System

**Document Version**: 1.0  
**Date**: 2024  
**Author**: QA Automation Architect  
**Status**: Draft for Review

---

## Executive Summary

This document outlines a comprehensive test strategy for the Draft & Autosave System, covering backend integration, frontend logic, hook behavior, and end-to-end user flows. The system handles two distinct draft types (lineup for Scheduled games, reports for Played games) through a polymorphic API endpoint with complex data merging logic.

---

## 1. Backend Integration Test Scenarios (Supertest)

### 1.1 Polymorphic API Endpoint Testing

#### Test Suite: `PUT /api/games/:gameId/draft`

| Test ID | Scenario | Game Status | Request Body | Expected Result | Priority |
|---------|----------|-------------|--------------|-----------------|----------|
| **BE-001** | Save lineup draft for Scheduled game | `Scheduled` | `{ rosters: {...}, formation: {...}, formationType: "1-4-4-2" }` | 200 OK, `lineupDraft` saved | P0 |
| **BE-002** | Save report draft for Played game | `Played` | `{ teamSummary: {...}, finalScore: {...} }` | 200 OK, `reportDraft` saved | P0 |
| **BE-003** | Attempt to save report draft for Scheduled game | `Scheduled` | `{ teamSummary: {...} }` | 400 Bad Request, error message | P1 |
| **BE-004** | Attempt to save lineup draft for Played game | `Played` | `{ rosters: {...} }` | 400 Bad Request, error message | P1 |
| **BE-005** | Attempt to save draft for Done game | `Done` | `{ teamSummary: {...} }` | 400 Bad Request, "Cannot save draft for game with status: Done" | P1 |
| **BE-006** | Attempt to save draft for Cancelled game | `Cancelled` | `{ teamSummary: {...} }` | 400 Bad Request, error message | P2 |
| **BE-007** | Save draft without authentication | `Played` | `{ teamSummary: {...} }` | 401 Unauthorized | P0 |
| **BE-008** | Save draft without game access | `Played` | `{ teamSummary: {...} }` | 403 Forbidden | P0 |

### 1.2 Differential Saving (Partial Updates) - Report Drafts

| Test ID | Scenario | Existing Draft | Request Body | Expected Result | Priority |
|---------|----------|----------------|--------------|-----------------|----------|
| **BE-009** | Partial update: Only teamSummary | `{ finalScore: { ourScore: 2, opponentScore: 1 } }` | `{ teamSummary: { defenseSummary: "Test" } }` | Draft merged: both fields preserved | P0 |
| **BE-010** | Partial update: Only finalScore | `{ teamSummary: { defenseSummary: "Old" } }` | `{ finalScore: { ourScore: 3, opponentScore: 2 } }` | Draft merged: both fields preserved | P0 |
| **BE-011** | Partial update: Only matchDuration | `{ teamSummary: {...}, finalScore: {...} }` | `{ matchDuration: { firstHalfExtraTime: 3 } }` | Draft merged: all fields preserved | P0 |
| **BE-012** | Partial update: Only playerReports | `{ teamSummary: {...} }` | `{ playerReports: { "player1": {...} } }` | Draft merged: both fields preserved | P0 |
| **BE-013** | Overwrite existing field: teamSummary | `{ teamSummary: { defenseSummary: "Old" } }` | `{ teamSummary: { defenseSummary: "New" } }` | Draft updated: "New" value saved | P0 |
| **BE-014** | Overwrite existing field: finalScore | `{ finalScore: { ourScore: 1 } }` | `{ finalScore: { ourScore: 2, opponentScore: 1 } }` | Draft updated: both scores saved | P0 |
| **BE-015** | Nested partial update: Only defenseSummary | `{ teamSummary: { midfieldSummary: "Mid", attackSummary: "Att" } }` | `{ teamSummary: { defenseSummary: "Def" } }` | Draft merged: all three summaries preserved | P0 |
| **BE-016** | Empty nested object removal | `{ teamSummary: { defenseSummary: "Test" } }` | `{ teamSummary: {} }` | Draft updated: teamSummary removed | P1 |
| **BE-017** | Multiple partial updates in sequence | `{}` | 1st: `{ teamSummary: {...} }`, 2nd: `{ finalScore: {...} }`, 3rd: `{ matchDuration: {...} }` | All updates merged correctly | P0 |

### 1.3 Validation & Security

| Test ID | Scenario | Request Body | Expected Result | Priority |
|---------|----------|--------------|-----------------|----------|
| **BE-018** | Empty request body (Scheduled) | `{}` | 400 Bad Request, "Invalid request format" | P1 |
| **BE-019** | Empty request body (Played) | `{}` | 400 Bad Request, "Expected at least one of: { teamSummary?, finalScore?, matchDuration?, playerReports? }" | P1 |
| **BE-020** | Missing rosters field (Scheduled) | `{ formation: {...} }` | 400 Bad Request, "Expected { rosters: {...} }" | P1 |
| **BE-021** | Invalid rosters type (Scheduled) | `{ rosters: "invalid" }` | 400 Bad Request | P1 |
| **BE-022** | Invalid teamSummary type (Played) | `{ teamSummary: "invalid" }` | 400 Bad Request | P1 |
| **BE-023** | Invalid finalScore type (Played) | `{ finalScore: "invalid" }` | 400 Bad Request | P1 |
| **BE-024** | Invalid matchDuration type (Played) | `{ matchDuration: "invalid" }` | 400 Bad Request | P1 |
| **BE-025** | Invalid playerReports type (Played) | `{ playerReports: "invalid" }` | 400 Bad Request | P1 |
| **BE-026** | Malformed JSON | `{ teamSummary: { defenseSummary: } }` | 400 Bad Request | P1 |
| **BE-027** | SQL injection attempt | `{ teamSummary: { defenseSummary: "'; DROP TABLE games; --" } }` | 200 OK (handled by MongoDB), no SQL execution | P0 |
| **BE-028** | XSS attempt | `{ teamSummary: { defenseSummary: "<script>alert('xss')</script>" } }` | 200 OK (sanitization handled by frontend) | P2 |
| **BE-029** | Extremely large payload | `{ teamSummary: { defenseSummary: "A".repeat(1000000) } }` | 413 Payload Too Large or 200 OK (with size limits) | P2 |
| **BE-030** | Special characters in data | `{ teamSummary: { defenseSummary: "Test\nNewline\tTab\"Quote" } }` | 200 OK, data preserved correctly | P1 |

### 1.4 Draft Cleanup Logic

| Test ID | Scenario | Initial State | Action | Expected Result | Priority |
|---------|----------|---------------|---------|-----------------|----------|
| **BE-031** | Clear reportDraft on status → Done | `{ status: "Played", reportDraft: {...} }` | `PUT /games/:id { status: "Done" }` | `reportDraft: null` | P0 |
| **BE-032** | Clear lineupDraft on game start | `{ status: "Scheduled", lineupDraft: {...} }` | `POST /games/:id/start` | `lineupDraft: null` | P0 |
| **BE-033** | Preserve reportDraft on status → Played | `{ status: "Scheduled", reportDraft: {...} }` | `PUT /games/:id { status: "Played" }` | `reportDraft` preserved | P1 |
| **BE-034** | Preserve lineupDraft on status update | `{ status: "Scheduled", lineupDraft: {...} }` | `PUT /games/:id { opponent: "New" }` | `lineupDraft` preserved | P1 |

---

## 2. Frontend Logic Test Scenarios (Unit Tests)

### 2.1 Data Merging Logic - Priority Rules

#### Test Suite: `GameDetailsPage - Draft Loading & Merging`

| Test ID | Scenario | Saved Data (DB) | Draft Data | Expected Merged Result | Priority |
|---------|----------|-----------------|------------|------------------------|----------|
| **FE-001** | Draft overrides saved: teamSummary | `{ defenseSummary: "Saved" }` | `{ defenseSummary: "Draft" }` | `{ defenseSummary: "Draft" }` | P0 |
| **FE-002** | Draft overrides saved: finalScore | `{ ourScore: 1, opponentScore: 1 }` | `{ ourScore: 2, opponentScore: 1 }` | `{ ourScore: 2, opponentScore: 1 }` | P0 |
| **FE-003** | Draft overrides saved: matchDuration | `{ regularTime: 90 }` | `{ regularTime: 90, firstHalfExtraTime: 3 }` | `{ regularTime: 90, firstHalfExtraTime: 3 }` | P0 |
| **FE-004** | Draft overrides saved: playerReports | `{ "player1": { rating_physical: 3 } }` | `{ "player1": { rating_physical: 5 } }` | `{ "player1": { rating_physical: 5 } }` | P0 |
| **FE-005** | Partial draft: Only defenseSummary | `{ defenseSummary: "Saved", midfieldSummary: "Saved" }` | `{ defenseSummary: "Draft" }` | `{ defenseSummary: "Draft", midfieldSummary: "Saved" }` | P0 |
| **FE-006** | Partial draft: Only finalScore.ourScore | `{ ourScore: 1, opponentScore: 1 }` | `{ ourScore: 2 }` | `{ ourScore: 2, opponentScore: 1 }` | P0 |
| **FE-007** | Partial draft: Only player1 report | `{ "player1": {...}, "player2": {...} }` | `{ "player1": { rating_physical: 5 } }` | `{ "player1": { rating_physical: 5 }, "player2": {...} }` | P0 |
| **FE-008** | Empty draft: No draft data | `{ defenseSummary: "Saved" }` | `null` or `{}` | `{ defenseSummary: "Saved" }` | P0 |
| **FE-009** | Empty saved: No saved data | `{}` | `{ defenseSummary: "Draft" }` | `{ defenseSummary: "Draft" }` | P0 |
| **FE-010** | Nested merge: teamSummary fields | `{ defenseSummary: "D1", midfieldSummary: "M1" }` | `{ defenseSummary: "D2", attackSummary: "A2" }` | `{ defenseSummary: "D2", midfieldSummary: "M1", attackSummary: "A2" }` | P0 |
| **FE-011** | Deep nested merge: playerReports | `{ "p1": { rating_physical: 3, rating_technical: 4 } }` | `{ "p1": { rating_physical: 5, notes: "Test" } }` | `{ "p1": { rating_physical: 5, rating_technical: 4, notes: "Test" } }` | P1 |
| **FE-012** | Draft with empty string overrides saved | `{ defenseSummary: "Saved" }` | `{ defenseSummary: "" }` | `{ defenseSummary: "" }` | P1 |
| **FE-013** | Draft with null overrides saved | `{ defenseSummary: "Saved" }` | `{ defenseSummary: null }` | `{ defenseSummary: null }` | P1 |
| **FE-014** | Multiple draft loads: Second load overwrites first | Load 1: `{ defenseSummary: "D1" }`, Load 2: `{ defenseSummary: "D2" }` | N/A | Final: `{ defenseSummary: "D2" }` | P1 |

### 2.2 Edge Cases - Data Loading

| Test ID | Scenario | Initial State | Action | Expected Result | Priority |
|---------|----------|---------------|---------|-----------------|----------|
| **FE-015** | Draft loading for Scheduled game | `{ status: "Scheduled", reportDraft: {...} }` | Component mount | Draft NOT loaded (wrong status) | P1 |
| **FE-016** | Draft loading for Done game | `{ status: "Done", reportDraft: {...} }` | Component mount | Draft NOT loaded (wrong status) | P1 |
| **FE-017** | Draft loading when game is null | `game: null` | Component mount | No error, no loading | P1 |
| **FE-018** | Draft loading when gameId is missing | `gameId: null` | Component mount | No error, no loading | P1 |
| **FE-019** | Draft with invalid structure | `{ reportDraft: "invalid" }` | Component mount | No error, draft skipped | P1 |
| **FE-020** | Draft with circular reference (if possible) | `{ reportDraft: { self: [circular] } }` | Component mount | No infinite loop | P2 |
| **FE-021** | Concurrent draft updates | Two simultaneous draft loads | Component mount | Last load wins, no race condition | P1 |

### 2.3 State Management - useMemo Dependencies

| Test ID | Scenario | State Change | Expected Behavior | Priority |
|---------|----------|--------------|-------------------|----------|
| **FE-022** | reportDataForAutosave updates on teamSummary change | `teamSummary.defenseSummary` changes | `reportDataForAutosave` recreated | P0 |
| **FE-023** | reportDataForAutosave updates on finalScore change | `finalScore.ourScore` changes | `reportDataForAutosave` recreated | P0 |
| **FE-024** | reportDataForAutosave updates on matchDuration change | `matchDuration.firstHalfExtraTime` changes | `reportDataForAutosave` recreated | P0 |
| **FE-025** | reportDataForAutosave updates on playerReports change | `localPlayerReports["player1"]` changes | `reportDataForAutosave` recreated | P0 |
| **FE-026** | reportDataForAutosave doesn't update on unrelated state | `game.opponent` changes | `reportDataForAutosave` NOT recreated | P1 |

---

## 3. Hook Behavior Test Scenarios (Unit Tests)

### 3.1 Debounce Logic

#### Test Suite: `useAutosave Hook`

| Test ID | Scenario | Actions | Expected API Calls | Priority |
|---------|----------|---------|-------------------|----------|
| **HOOK-001** | Single change triggers debounce | Change data → wait 2.5s | 1 call after 2.5s | P0 |
| **HOOK-002** | Rapid changes trigger single debounce | Change 5 times in 1s → wait 2.5s | 1 call after last change + 2.5s | P0 |
| **HOOK-003** | Debounce timer resets on new change | Change → wait 1s → change → wait 2.5s | 1 call after second change + 2.5s | P0 |
| **HOOK-004** | Custom debounce time | `debounceMs: 1000` → change → wait 1s | 1 call after 1s | P1 |
| **HOOK-005** | Multiple rapid changes with pauses | Change → wait 3s → change → wait 1s → change → wait 2.5s | 2 calls (after 3s, after last + 2.5s) | P1 |

### 3.2 Change Detection

| Test ID | Scenario | Previous Data | Current Data | Expected Behavior | Priority |
|---------|----------|---------------|--------------|-------------------|----------|
| **HOOK-006** | Data unchanged: Same object reference | `{ teamSummary: {...} }` | `{ teamSummary: {...} }` (same ref) | No API call | P0 |
| **HOOK-007** | Data unchanged: Same values, different ref | `{ teamSummary: { defenseSummary: "Test" } }` | `{ teamSummary: { defenseSummary: "Test" } }` (new ref) | No API call (JSON comparison) | P0 |
| **HOOK-008** | Data changed: Different values | `{ teamSummary: { defenseSummary: "Old" } }` | `{ teamSummary: { defenseSummary: "New" } }` | API call triggered | P0 |
| **HOOK-009** | Data changed: Added field | `{ teamSummary: {...} }` | `{ teamSummary: {...}, finalScore: {...} }` | API call triggered | P0 |
| **HOOK-010** | Data changed: Removed field | `{ teamSummary: {...}, finalScore: {...} }` | `{ teamSummary: {...} }` | API call triggered | P0 |
| **HOOK-011** | Data changed: Nested field change | `{ teamSummary: { defenseSummary: "Old" } }` | `{ teamSummary: { defenseSummary: "New" } }` | API call triggered | P0 |
| **HOOK-012** | Data changed: Array order (if applicable) | `{ playerReports: { "p1": {...}, "p2": {...} } }` | `{ playerReports: { "p2": {...}, "p1": {...} } }` | No API call (order doesn't matter) | P1 |
| **HOOK-013** | Data changed: Whitespace only | `{ teamSummary: { defenseSummary: "Test" } }` | `{ teamSummary: { defenseSummary: "Test " } }` | API call triggered | P1 |

### 3.3 Initial Mount & Draft Loading Detection

| Test ID | Scenario | Initial Data | Expected Behavior | Priority |
|---------|----------|--------------|-------------------|----------|
| **HOOK-014** | Initial mount: Empty data | `{}` | No API call, `previousDataRef` not set | P0 |
| **HOOK-015** | Initial mount: Data present | `{ teamSummary: {...} }` | No API call, `previousDataRef` not set | P0 |
| **HOOK-016** | Draft loading detection: First change with data | `null` → `{ teamSummary: { defenseSummary: "Draft" } }` | No API call, `previousDataRef` synced | P0 |
| **HOOK-017** | Draft loading detection: First change empty | `null` → `{}` | No API call, `previousDataRef` not set | P1 |
| **HOOK-018** | After draft load: User makes change | Draft loaded → user changes data | API call triggered | P0 |

### 3.4 Enabled/Disabled State

| Test ID | Scenario | `enabled` Value | Action | Expected Behavior | Priority |
|---------|----------|-----------------|--------|-------------------|----------|
| **HOOK-019** | Hook disabled: No autosave | `enabled: false` | Change data | No API call | P0 |
| **HOOK-020** | Hook enabled: Autosave works | `enabled: true` | Change data | API call triggered | P0 |
| **HOOK-021** | Dynamic enable/disable | `enabled: false` → `true` | Change data after enable | API call triggered | P1 |
| **HOOK-022** | Dynamic disable during debounce | Change data → `enabled: false` → wait 2.5s | No API call (timer cleared) | P1 |

### 3.5 shouldSkip Logic

| Test ID | Scenario | Data | `shouldSkip` Result | Expected Behavior | Priority |
|---------|----------|------|---------------------|-------------------|----------|
| **HOOK-023** | shouldSkip returns true: Empty data | `{ teamSummary: {}, finalScore: { ourScore: 0, opponentScore: 0 } }` | `true` | No API call | P0 |
| **HOOK-024** | shouldSkip returns false: Has data | `{ teamSummary: { defenseSummary: "Test" } }` | `false` | API call triggered | P0 |
| **HOOK-025** | shouldSkip: Only default matchDuration | `{ matchDuration: { regularTime: 90, firstHalfExtraTime: 0, secondHalfExtraTime: 0 } }` | `true` | No API call | P1 |
| **HOOK-026** | shouldSkip: Modified matchDuration | `{ matchDuration: { regularTime: 90, firstHalfExtraTime: 3 } }` | `false` | API call triggered | P1 |

### 3.6 Component Lifecycle

| Test ID | Scenario | Action | Expected Behavior | Priority |
|---------|----------|--------|-------------------|----------|
| **HOOK-027** | Component unmount during debounce | Change data → unmount after 1s | Timer cleared, no API call | P0 |
| **HOOK-028** | Component unmount after save | Change data → wait 2.5s → save → unmount | No errors, cleanup successful | P0 |
| **HOOK-029** | Multiple mounts/unmounts | Mount → change → unmount → mount → change | Each mount independent | P1 |
| **HOOK-030** | Game finalization stops autosave | `isFinalizingGame: false` → `true` | No new API calls | P0 |

### 3.7 Error Handling

| Test ID | Scenario | API Response | Expected Behavior | Priority |
|---------|----------|--------------|-------------------|----------|
| **HOOK-031** | Network error | 500 Internal Server Error | `autosaveError` set, `isAutosaving: false` | P0 |
| **HOOK-032** | Network timeout | Request timeout | `autosaveError` set, retry on next change | P0 |
| **HOOK-033** | 400 Bad Request | 400 with error message | `autosaveError` contains message | P0 |
| **HOOK-034** | 401 Unauthorized | 401 Unauthorized | `autosaveError` set, user notified | P0 |
| **HOOK-035** | Error recovery: Retry on next change | Error → fix issue → change data | API call succeeds | P0 |
| **HOOK-036** | Error doesn't update previousDataRef | Error occurs → data unchanged | `previousDataRef` not updated, retry possible | P0 |

### 3.8 Callback Functions

| Test ID | Scenario | Callback | Expected Behavior | Priority |
|---------|----------|----------|-------------------|----------|
| **HOOK-037** | onSuccess callback invoked | `onSuccess` provided | Called with API response | P1 |
| **HOOK-038** | onError callback invoked | `onError` provided | Called with error object | P1 |
| **HOOK-039** | Callbacks not provided | No callbacks | No errors, hook works normally | P1 |

### 3.9 Return Values

| Test ID | Scenario | Expected Return Values | Priority |
|---------|----------|------------------------|----------|
| **HOOK-040** | Initial state | `{ isAutosaving: false, autosaveError: null, lastSavedAt: null }` | P0 |
| **HOOK-041** | During debounce | `{ isAutosaving: true, autosaveError: null, lastSavedAt: null }` | P0 |
| **HOOK-042** | After successful save | `{ isAutosaving: false, autosaveError: null, lastSavedAt: Date }` | P0 |
| **HOOK-043** | After error | `{ isAutosaving: false, autosaveError: "error message", lastSavedAt: null }` | P0 |

---

## 4. End-to-End (E2E) User Flows

### 4.1 Critical User Journey: "The Interrupted Session"

**Flow Description**: User starts filling out a report, gets interrupted, comes back later, and continues editing.

| Step | Action | Expected Result | Validation Points |
|------|--------|-----------------|-------------------|
| 1 | Navigate to Played game | Game details page loads | Draft loading logic runs |
| 2 | Fill Defense Summary: "Solid defense" | State updated | `teamSummary.defenseSummary` set |
| 3 | Wait 2.5 seconds | Autosave triggers | API call to `/draft`, draft saved |
| 4 | Fill Midfield Summary: "Good control" | State updated | `teamSummary.midfieldSummary` set |
| 5 | Wait 2.5 seconds | Autosave triggers | Draft merged with previous draft |
| 6 | **Close browser tab** (simulate interruption) | No errors | Cleanup successful |
| 7 | **Reopen browser, navigate to same game** | Page loads | Draft loading detects `reportDraft` |
| 8 | Verify Defense Summary | Shows "Solid defense" | Draft data loaded correctly |
| 9 | Verify Midfield Summary | Shows "Good control" | Draft data loaded correctly |
| 10 | Fill Attack Summary: "Great finishing" | State updated | New field added |
| 11 | Wait 2.5 seconds | Autosave triggers | Draft merged with existing draft |
| 12 | Finalize report | Status → Done | `reportDraft` cleared in backend |

**Test Assertions**:
- ✅ Draft persists across browser sessions
- ✅ Draft merges correctly on subsequent saves
- ✅ No data loss during interruption
- ✅ Draft cleared on finalization

---

### 4.2 Critical User Journey: "Concurrent Editing"

**Flow Description**: User opens same game in two tabs, makes different edits, verifies last-write-wins behavior.

| Step | Action (Tab 1) | Action (Tab 2) | Expected Result |
|------|----------------|----------------|-----------------|
| 1 | Navigate to Played game | Navigate to same game | Both tabs load game |
| 2 | Fill Defense Summary: "Tab 1 defense" | Fill Defense Summary: "Tab 2 defense" | Both tabs update state |
| 3 | Wait 2.5 seconds | Wait 2.5 seconds | Both tabs trigger autosave |
| 4 | Refresh Tab 1 | Refresh Tab 2 | Both tabs load latest draft |
| 5 | Verify Defense Summary | Verify Defense Summary | Shows last saved value (Tab 1 or Tab 2) |

**Test Assertions**:
- ✅ Both tabs can edit independently
- ✅ Last write wins (no conflicts)
- ✅ No data corruption
- ✅ Draft reflects most recent save

---

### 4.3 Critical User Journey: "Partial Draft Recovery"

**Flow Description**: User has saved data in DB, creates partial draft, verifies merge on reload.

| Step | Action | Expected Result | Validation Points |
|------|--------|-----------------|-------------------|
| 1 | Setup: Game with saved data | `{ defenseSummary: "Saved", midfieldSummary: "Saved" }` | Saved in `game.defenseSummary`, etc. |
| 2 | Navigate to game | Page loads | Saved data loaded first |
| 3 | Edit Defense Summary: "Draft defense" | State updated | Only `defenseSummary` changed |
| 4 | Wait 2.5 seconds | Autosave triggers | Draft saved: `{ teamSummary: { defenseSummary: "Draft defense" } }` |
| 5 | Refresh page | Page reloads | Draft loading runs |
| 6 | Verify Defense Summary | Shows "Draft defense" | Draft overrides saved |
| 7 | Verify Midfield Summary | Shows "Saved" | Saved data preserved (not in draft) |

**Test Assertions**:
- ✅ Draft fields override saved fields
- ✅ Saved fields not in draft are preserved
- ✅ Merge logic works correctly
- ✅ No data loss

---

### 4.4 Critical User Journey: "Network Failure Recovery"

**Flow Description**: User makes changes while offline, goes online, verifies autosave retry.

| Step | Action | Expected Result | Validation Points |
|------|--------|-----------------|-------------------|
| 1 | Navigate to Played game | Page loads | Normal operation |
| 2 | **Disable network** (DevTools) | Network offline | Connection lost |
| 3 | Fill Defense Summary: "Offline edit" | State updated | Local state updated |
| 4 | Wait 2.5 seconds | Autosave attempts | API call fails, error logged |
| 5 | Fill Midfield Summary: "Another edit" | State updated | More local changes |
| 6 | Wait 2.5 seconds | Autosave attempts | API call fails again |
| 7 | **Enable network** | Network online | Connection restored |
| 8 | Make small change (add space) | State updated | Triggers autosave |
| 9 | Wait 2.5 seconds | Autosave succeeds | All accumulated changes saved |

**Test Assertions**:
- ✅ Errors handled gracefully
- ✅ User can continue editing during network failure
- ✅ Autosave retries when network restored
- ✅ All changes saved (no data loss)

---

## 5. Test Data Requirements

### 5.1 Test Game States

| Game ID | Status | Saved Data | Draft Data | Purpose |
|---------|--------|------------|------------|---------|
| `test-scheduled-001` | `Scheduled` | None | `{ rosters: {...}, formation: {...} }` | Lineup draft testing |
| `test-played-001` | `Played` | None | `{ teamSummary: {...} }` | Report draft testing |
| `test-played-002` | `Played` | `{ defenseSummary: "Saved" }` | `{ defenseSummary: "Draft" }` | Merge testing |
| `test-played-003` | `Played` | `{ defenseSummary: "Saved", midfieldSummary: "Saved" }` | `{ defenseSummary: "Draft" }` | Partial merge testing |
| `test-done-001` | `Done` | `{ defenseSummary: "Final" }` | `null` | Cleanup verification |
| `test-cancelled-001` | `Cancelled` | None | None | Status validation |

### 5.2 Test Users

| User | Role | Team Access | Purpose |
|------|------|-------------|---------|
| `test-coach-1` | Coach | Team A | Normal autosave testing |
| `test-coach-2` | Coach | Team B | Access control testing |
| `test-admin` | Admin | All teams | Security testing |

---

## 6. Test Execution Strategy

### 6.1 Test Priority Matrix

| Priority | Count | Execution Order | Time Estimate |
|---------|-------|----------------|---------------|
| **P0 (Critical)** | 45 tests | Run first, must pass | ~4 hours |
| **P1 (High)** | 35 tests | Run second, should pass | ~3 hours |
| **P2 (Medium)** | 5 tests | Run third, nice to have | ~1 hour |
| **Total** | **85 tests** | | **~8 hours** |

### 6.2 Test Environment Requirements

- **Backend**: Node.js test server with MongoDB test database
- **Frontend**: Jest + React Testing Library + MSW (Mock Service Worker)
- **E2E**: Playwright or Cypress
- **Coverage Target**: 80%+ for critical paths

### 6.3 Test Execution Phases

1. **Phase 1**: Backend Integration Tests (Supertest)
   - Run in isolation
   - Mock database operations
   - Verify API contracts

2. **Phase 2**: Frontend Unit Tests (Jest)
   - Test merge logic in isolation
   - Mock API calls
   - Verify state management

3. **Phase 3**: Hook Unit Tests (Jest)
   - Test `useAutosave` hook in isolation
   - Mock timers (jest.useFakeTimers)
   - Verify debounce and change detection

4. **Phase 4**: E2E Tests (Playwright/Cypress)
   - Full browser automation
   - Real API calls (test environment)
   - Verify complete user flows

---

## 7. Risk Areas & Edge Cases

### 7.1 High-Risk Scenarios

1. **Race Conditions**: Multiple rapid autosaves
2. **Data Loss**: Component unmount during save
3. **Merge Conflicts**: Concurrent edits in multiple tabs
4. **Memory Leaks**: Timer cleanup on unmount
5. **Performance**: Large playerReports objects

### 7.2 Edge Cases Requiring Special Attention

1. **Circular References**: Deep nested objects
2. **Unicode Characters**: Special characters in summaries
3. **Timezone Issues**: Date handling in `lastSavedAt`
4. **Browser Storage**: localStorage token expiration
5. **Network Interruption**: Mid-request failures

---

## 8. Success Criteria

### 8.1 Definition of Done

- ✅ All P0 tests passing
- ✅ 80%+ code coverage on critical paths
- ✅ No memory leaks detected
- ✅ Performance benchmarks met (< 100ms merge time)
- ✅ E2E flows complete successfully
- ✅ Documentation updated

### 8.2 Performance Benchmarks

- Draft merge: < 50ms for typical data
- Autosave API call: < 500ms response time
- Draft loading: < 100ms on page load
- Memory usage: < 10MB for typical game data

---

## 9. Next Steps

1. **Review this document** with the team
2. **Prioritize test scenarios** based on business value
3. **Set up test infrastructure** (Jest, Supertest, Playwright)
4. **Create test data fixtures** (games, users, drafts)
5. **Begin implementation** starting with P0 tests
6. **Iterate** based on findings

---

## Appendix A: Test Scenario Summary

**Total Test Scenarios**: 85
- Backend Integration: 34 scenarios
- Frontend Logic: 26 scenarios
- Hook Behavior: 25 scenarios
- E2E User Flows: 4 scenarios

**Estimated Implementation Time**: 8-10 hours
**Estimated Execution Time**: 1-2 hours (automated)

---

**Document Status**: ✅ Ready for Review  
**Next Review Date**: TBD  
**Owner**: QA Automation Architect

