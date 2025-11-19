# Critical Test Suite: Draft & Autosave System

**Document Version**: 1.0 (Lean/ROI-Focused)  
**Date**: 2024  
**Author**: Senior QA Lead  
**Total Tests**: 18 Critical Scenarios

---

## Executive Summary

This condensed test suite focuses exclusively on **preventing data loss** and **critical bugs** that would impact users. We've eliminated boilerplate tests, standard React behavior checks, and low-probability edge cases. Every test in this suite addresses a **high-risk failure mode** that could result in:

1. **User data loss** (most critical)
2. **Security/integrity violations**
3. **API spam/performance issues**

---

## Test Suite Overview

| Category | Test Count | Risk Level | Why Critical |
|----------|------------|------------|--------------|
| **Data Loss Prevention** | 7 tests | 🔴 CRITICAL | Wrong merge = user data vanishes |
| **Security/Integrity** | 7 tests | 🟠 HIGH | Wrong API behavior = data corruption |
| **Spam Prevention** | 2 tests | 🟡 MEDIUM | No debounce = API overload |
| **E2E Critical Flow** | 2 tests | 🔴 CRITICAL | Real-world data loss scenarios |
| **Total** | **18 tests** | | |

---

## 1. Data Loss Prevention Tests (7 Tests)

**Why This Category is Critical**: If the merge logic fails, users lose their work. This is the #1 risk.

### Test DL-001: Draft Completely Overrides Saved Data
**Risk**: User edits a field that was previously saved → draft should win  
**Scenario**: 
- Saved: `{ defenseSummary: "Saved value" }`
- Draft: `{ defenseSummary: "Draft value" }`
- Expected: `{ defenseSummary: "Draft value" }` (draft wins)

**Why Critical**: If saved data overwrites draft, user loses current work.

---

### Test DL-002: Partial Draft Preserves Saved Fields
**Risk**: User edits one field → other saved fields should persist  
**Scenario**:
- Saved: `{ defenseSummary: "Saved", midfieldSummary: "Saved", attackSummary: "Saved" }`
- Draft: `{ defenseSummary: "Draft" }` (only one field)
- Expected: `{ defenseSummary: "Draft", midfieldSummary: "Saved", attackSummary: "Saved" }`

**Why Critical**: If partial draft clears other fields, user loses data they didn't edit.

---

### Test DL-003: Empty Draft Doesn't Overwrite Saved Data
**Risk**: Loading empty/null draft should not clear existing saved data  
**Scenario**:
- Saved: `{ defenseSummary: "Saved" }`
- Draft: `null` or `{}`
- Expected: `{ defenseSummary: "Saved" }` (saved persists)

**Why Critical**: If empty draft clears saved data, user loses everything.

---

### Test DL-004: Nested Merge - teamSummary Fields
**Risk**: Partial teamSummary draft should merge correctly  
**Scenario**:
- Saved: `{ teamSummary: { defenseSummary: "D1", midfieldSummary: "M1", attackSummary: "A1" } }`
- Draft: `{ teamSummary: { defenseSummary: "D2", generalSummary: "G2" } }`
- Expected: `{ defenseSummary: "D2", midfieldSummary: "M1", attackSummary: "A1", generalSummary: "G2" }`

**Why Critical**: Nested objects are complex; wrong merge = partial data loss.

---

### Test DL-005: Player Reports Deep Merge
**Risk**: Partial player report should merge with existing report  
**Scenario**:
- Saved: `{ playerReports: { "p1": { rating_physical: 3, rating_technical: 4, notes: "Old" } } }`
- Draft: `{ playerReports: { "p1": { rating_physical: 5, notes: "New" } } }`
- Expected: `{ "p1": { rating_physical: 5, rating_technical: 4, notes: "New" } }`

**Why Critical**: Deep nested merge is error-prone; wrong merge = lost ratings.

---

### Test DL-006: Multiple Draft Loads - Last Load Wins
**Risk**: If draft loads twice, second load should overwrite first  
**Scenario**:
- Load 1: `{ defenseSummary: "Draft 1" }`
- Load 2: `{ defenseSummary: "Draft 2" }`
- Expected: Final state = `{ defenseSummary: "Draft 2" }`

**Why Critical**: Race conditions in draft loading = inconsistent state.

---

### Test DL-007: Draft Loading Only for Played Games
**Risk**: Draft should NOT load for wrong game status  
**Scenario**:
- Game status: `Scheduled` or `Done`
- Draft exists: `{ reportDraft: { teamSummary: {...} } }`
- Expected: Draft NOT loaded (wrong status)

**Why Critical**: Loading wrong draft type = data corruption.

---

## 2. Security/Integrity Tests (7 Tests)

**Why This Category is Critical**: Wrong API behavior = data saved to wrong place or not cleaned up.

### Test SI-001: Polymorphic API - Scheduled → lineupDraft
**Risk**: Scheduled game draft should save to `lineupDraft`, not `reportDraft`  
**Scenario**:
- Game status: `Scheduled`
- Request: `PUT /draft { rosters: {...}, formation: {...} }`
- Expected: `game.lineupDraft` updated, `game.reportDraft` unchanged

**Why Critical**: Wrong field = draft lost or corrupted.

---

### Test SI-002: Polymorphic API - Played → reportDraft
**Risk**: Played game draft should save to `reportDraft`, not `lineupDraft`  
**Scenario**:
- Game status: `Played`
- Request: `PUT /draft { teamSummary: {...}, finalScore: {...} }`
- Expected: `game.reportDraft` updated, `game.lineupDraft` unchanged

**Why Critical**: Wrong field = draft lost or corrupted.

---

### Test SI-003: Wrong Status Rejection - Done Game
**Risk**: Done games should reject draft saves  
**Scenario**:
- Game status: `Done`
- Request: `PUT /draft { teamSummary: {...} }`
- Expected: `400 Bad Request`, error message, no draft saved

**Why Critical**: Allowing drafts on Done games = data inconsistency.

---

### Test SI-004: Wrong Status Rejection - Cancelled Game
**Risk**: Cancelled games should reject draft saves  
**Scenario**:
- Game status: `Cancelled`
- Request: `PUT /draft { teamSummary: {...} }`
- Expected: `400 Bad Request`, error message

**Why Critical**: Same as above - data integrity.

---

### Test SI-005: Cleanup - reportDraft Cleared on Status → Done
**Risk**: When game finalized, draft must be cleared  
**Scenario**:
- Initial: `{ status: "Played", reportDraft: { teamSummary: {...} } }`
- Action: `PUT /games/:id { status: "Done" }`
- Expected: `reportDraft: null`

**Why Critical**: Stale drafts = confusion and data inconsistency.

---

### Test SI-006: Cleanup - lineupDraft Cleared on Game Start
**Risk**: When game starts, lineup draft must be cleared  
**Scenario**:
- Initial: `{ status: "Scheduled", lineupDraft: { rosters: {...} } }`
- Action: `POST /games/:id/start`
- Expected: `lineupDraft: null`

**Why Critical**: Stale lineup drafts = wrong players in game.

---

### Test SI-007: Partial Update Merges with Existing Draft
**Risk**: Partial updates should merge, not replace entire draft  
**Scenario**:
- Existing draft: `{ teamSummary: { defenseSummary: "Old" }, finalScore: { ourScore: 1 } }`
- Request: `PUT /draft { teamSummary: { defenseSummary: "New" } }`
- Expected: `{ teamSummary: { defenseSummary: "New" }, finalScore: { ourScore: 1 } }`

**Why Critical**: Replacing entire draft = data loss for fields not in request.

---

## 3. Spam Prevention Tests (2 Tests)

**Why This Category is Critical**: No debounce = API overload and poor performance.

### Test SP-001: Debounce Prevents Rapid API Calls
**Risk**: Rapid changes should trigger only ONE API call after debounce  
**Scenario**:
- Action: Change data 5 times rapidly (within 1 second)
- Wait: 2.5 seconds after last change
- Expected: **1 API call** total (not 5)

**Why Critical**: Without debounce, API gets hammered on every keystroke.

---

### Test SP-002: Change Detection Prevents Unnecessary Calls
**Risk**: Unchanged data should NOT trigger API calls  
**Scenario**:
- Action: Change data → wait for save → make same change again
- Expected: **No API call** on second change (data unchanged)

**Why Critical**: Unnecessary calls = wasted resources and potential race conditions.

---

## 4. End-to-End Critical Flows (2 Tests)

**Why This Category is Critical**: Real-world scenarios where data loss actually happens.

### Test E2E-001: The Interrupted Session (Data Persistence)
**Risk**: User closes browser mid-edit → data should persist  
**Scenario**:
1. User fills Defense Summary: "Test defense"
2. Wait 2.5s → autosave succeeds
3. User fills Midfield Summary: "Test midfield"
4. **Close browser** (simulate interruption)
5. **Reopen browser**, navigate to same game
6. Expected: Both summaries present in draft

**Why Critical**: This is the #1 real-world data loss scenario.

---

### Test E2E-002: Partial Draft Recovery (Merge on Reload)
**Risk**: User has saved data, creates partial draft → merge must work  
**Scenario**:
1. Setup: Game with saved `{ defenseSummary: "Saved", midfieldSummary: "Saved" }`
2. User edits Defense Summary: "Draft"
3. Wait 2.5s → autosave saves only `{ teamSummary: { defenseSummary: "Draft" } }`
4. Refresh page
5. Expected: `{ defenseSummary: "Draft", midfieldSummary: "Saved" }` (merged correctly)

**Why Critical**: This tests the complete merge flow end-to-end.

---

## Test Execution Summary

| Category | Tests | Execution Time | Priority |
|----------|-------|----------------|----------|
| Data Loss Prevention | 7 | ~1 hour | 🔴 P0 |
| Security/Integrity | 7 | ~1 hour | 🟠 P0 |
| Spam Prevention | 2 | ~15 min | 🟡 P1 |
| E2E Critical Flows | 2 | ~30 min | 🔴 P0 |
| **Total** | **18** | **~2.5 hours** | |

---

## Why These Tests Were Chosen

### ✅ Included (High ROI)

1. **Data Loss Prevention (7 tests)**: Every test prevents a specific data loss scenario. These are the most critical because user data is irreplaceable.

2. **Security/Integrity (7 tests)**: Polymorphic API logic is complex and error-prone. Wrong behavior = data corruption.

3. **Spam Prevention (2 tests)**: Minimal tests but critical - debounce is either working or it's not.

4. **E2E Flows (2 tests)**: Real-world scenarios where data loss actually occurs.

### ❌ Excluded (Low ROI)

1. **Standard React Behavior**: Component lifecycle, useMemo dependencies - these are React's responsibility, not ours.

2. **Boilerplate Validation**: Empty request body, invalid types - these are standard API validation tests.

3. **Edge Cases**: Circular references, Unicode, timezone issues - low probability, high maintenance cost.

4. **Redundant Scenarios**: Multiple tests for same behavior (e.g., 5 different debounce scenarios → 1 is enough).

5. **Error Handling Details**: Network errors, timeouts - important but not critical path. One test is sufficient.

6. **Callback Testing**: onSuccess/onError callbacks - nice to have but not critical.

---

## Test Implementation Priority

### Phase 1: Critical Path (Week 1)
- **DL-001** through **DL-007** (Data Loss Prevention)
- **SI-001**, **SI-002**, **SI-005**, **SI-006** (Core API & Cleanup)
- **E2E-001** (Interrupted Session)

**Rationale**: These prevent the most severe bugs (data loss).

### Phase 2: Security & Performance (Week 2)
- **SI-003**, **SI-004**, **SI-007** (Security & Merge)
- **SP-001**, **SP-002** (Spam Prevention)
- **E2E-002** (Partial Draft Recovery)

**Rationale**: These prevent data corruption and performance issues.

---

## Success Criteria

✅ **All 18 tests passing** = System is safe for production  
✅ **Data Loss Prevention tests** = Highest priority, must pass 100%  
✅ **Security/Integrity tests** = Must pass 100%  
✅ **Spam Prevention tests** = Must pass (performance requirement)  
✅ **E2E tests** = Must pass (real-world validation)

---

## Maintenance Strategy

- **Review quarterly**: Add tests only if new data loss vectors discovered
- **Keep lean**: Resist adding "nice to have" tests
- **Focus on ROI**: Every test must prevent a real bug or data loss scenario

---

**Document Status**: ✅ Ready for Implementation  
**Next Steps**: 
1. Review with team
2. Set up test infrastructure
3. Implement Phase 1 tests
4. Execute and verify

---

**Key Principle**: *"Test what breaks, not what works."* These 18 tests cover the critical failure modes that would cause real user impact.

