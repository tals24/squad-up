# Refactor Gates — Quality Checklist

Every PR in the refactor execution plan MUST pass these gates before merging.

---

## 🚦 Definition of "Refactor Gates"

Gates are **automated and manual checks** that verify:
1. **Behavior parity**: Nothing breaks, nothing changes from user's perspective
2. **Code health**: Technical debt reduced, architecture improved
3. **Safety**: Tests pass, no regressions introduced

---

## ✅ Gate 1: Automated Tests (BLOCKING)

All automated tests must pass. Zero tolerance for test failures.

### Requirements
- [ ] **E2E Smoke Tests**: All scenarios in `gameDetails.smoke.spec.js` pass
  - Scheduled game flow ✅
  - Played game flow ✅
  - Done game flow ✅
  - Error handling ✅

- [ ] **Integration Tests**: All tests in `gameDetailsPage.test.jsx` pass
  - Scheduled status tests ✅
  - Played status tests ✅
  - Done status tests ✅
  - Edge cases ✅

- [ ] **Unit Tests**: All feature-specific unit tests pass (if added)

- [ ] **No new console errors**: Console should be clean during test runs

### How to Run
```bash
# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# All tests
npm run test
```

### Failure = PR BLOCKED
If any test fails:
1. Fix the regression immediately
2. OR revert the change
3. Do NOT merge until green

---

## ✅ Gate 2: Manual Smoke Test (BLOCKING)

Run the manual smoke checklist to verify behavior parity.

### Requirements
- [ ] **Complete checklist**: `tasks/phase0-manual-smoke-checklist.md`
- [ ] **All flows tested**: Scheduled → Played → Done
- [ ] **Edge cases verified**: Validation, out-of-position, autosave, draft persistence
- [ ] **Zero behavior changes**: UI, validation, network calls identical to baseline

### When to Run
- Run manual smoke for every PR that touches GameDetailsPage
- Run for every PR in Phase 1 (incremental decomposition)
- Run for the final cutover PR (Phase 1 end)

### Documentation
Record results in PR description:
```markdown
## Manual Smoke Test Results
- Tester: [Name]
- Date: YYYY-MM-DD
- Commit: [hash]
- Result: ✅ PASS / ❌ FAIL
- Issues: [if any]
```

### Failure = PR BLOCKED
If manual test fails:
1. Investigate the discrepancy
2. Fix the bug
3. Re-run full checklist
4. Do NOT merge until PASS

---

## ✅ Gate 3: Code Health Metrics (WARNING)

These are improvement targets, not blockers. Track progress over time.

### File Size Targets
- [ ] **GameDetailsPage main file**: < 300 lines (target: < 250)
- [ ] **Extracted hooks**: Each < 150 lines
- [ ] **Extracted modules**: Each < 150 lines
- [ ] **API files**: Each < 200 lines

### Complexity Metrics
- [ ] **useEffect count**: ≤ 5 per component (target: ≤ 3)
- [ ] **useState count**: ≤ 5 per component (target: ≤ 3)
- [ ] **JSX nesting depth**: ≤ 4 levels
- [ ] **Function length**: ≤ 50 lines

### How to Check
```bash
# Line count
wc -l frontend/src/features/game-management/components/GameDetailsPage/index.jsx

# Manual review
- Count useEffect hooks
- Count useState hooks
- Check JSX nesting depth
```

### Outcome
- **Green**: All targets met → Celebrate! 🎉
- **Yellow**: Some targets missed → Document, continue
- **Red**: Worse than baseline → Reconsider approach

---

## ✅ Gate 4: Architecture Compliance (BLOCKING)

Verify code follows `frontendImproved.md` standards.

### Requirements
- [ ] **No cross-feature imports**: Features don't import from other features
- [ ] **React Query for server data**: No fetch in useEffect
- [ ] **Shared API client**: Uses `apiClient.get/post/put/patch/delete`
- [ ] **Component structure**: Correct ordering (imports → hooks → handlers → render)
- [ ] **Handler naming**: All event handlers use `handleX` pattern
- [ ] **Import order**: Standard order enforced
- [ ] **Tailwind-first styling**: No new per-component CSS files

### How to Verify
1. **Manual Code Review**: Check PR diff for violations
2. **ESLint**: Run linter (once rules are enforced)
3. **Peer Review**: Second set of eyes on architecture

### Failure = PR BLOCKED
If architecture violations found:
1. Refactor code to comply
2. Update PR
3. Do NOT merge until compliant

---

## ✅ Gate 5: Deployment Safety (BLOCKING)

Verify branch is safe to deploy.

### Requirements
- [ ] **Build succeeds**: `npm run build` completes without errors
- [ ] **No linter errors**: `npm run lint` passes (warnings OK for now)
- [ ] **No TypeScript errors**: If using TS (currently N/A)
- [ ] **Bundle size check**: No massive bundle size increase (< 10% growth)

### How to Run
```bash
# Build
npm run build

# Lint
npm run lint

# Bundle size
npm run build -- --report
```

### Failure = PR BLOCKED
If build/lint fails:
1. Fix errors
2. Commit fixes
3. Re-run checks
4. Do NOT merge until green

---

## ✅ Gate 6: Peer Review (BLOCKING)

Human review of code quality and logic.

### Requirements
- [ ] **At least 1 approval**: From team member familiar with architecture
- [ ] **All comments resolved**: No unaddressed review feedback
- [ ] **Breaking changes documented**: If API contracts change
- [ ] **Migration notes added**: If data structures change

### Review Checklist for Reviewer
- [ ] Code is readable and maintainable
- [ ] Follows `frontendImproved.md` standards
- [ ] No obvious bugs or logic errors
- [ ] Test coverage is adequate
- [ ] PR description explains "why" not just "what"
- [ ] Behavior parity maintained (no user-visible changes)

### Failure = PR BLOCKED
If concerns raised:
1. Address reviewer feedback
2. Update PR
3. Request re-review
4. Do NOT merge without approval

---

## ✅ Gate 7: Git Hygiene (ADVISORY)

Keep git history clean and navigable.

### Requirements
- [ ] **Atomic commits**: Each commit is a logical unit
- [ ] **Conventional commits**: Use `feat:`, `refactor:`, `fix:`, `test:`, `docs:` prefixes
- [ ] **Descriptive messages**: Explain "why" in commit body
- [ ] **No merge conflicts**: Rebase on main before merge
- [ ] **Small PRs**: Prefer small, focused PRs over giant changes

### Example Commit Message
```
refactor(game-details): extract useGameDetailsData hook

Extract game loading and fallback logic into dedicated hook.
Reduces GameDetailsPage component from 2,400 → 2,200 lines.
No behavior changes - existing tests pass.

Related to: Phase 1, Task 2.1
```

### Outcome
- **Good hygiene**: Easier to review, easier to revert, easier to understand
- **Poor hygiene**: Not blocking, but makes life harder

---

## 📋 PR Template (Use This)

```markdown
## Description
Brief summary of what this PR does and why.

## Related Task
Phase [X] - Task [Y.Z]: [Task Name]

## Changes
- Change 1
- Change 2
- Change 3

## Refactor Gates Checklist

### ✅ Gate 1: Automated Tests
- [ ] E2E smoke tests pass
- [ ] Integration tests pass
- [ ] No new console errors

### ✅ Gate 2: Manual Smoke Test
- Tester: [Name]
- Date: [YYYY-MM-DD]
- Result: ✅ PASS / ❌ FAIL
- Issues: [if any]

### ✅ Gate 3: Code Health Metrics
- GameDetailsPage lines: [before] → [after]
- Extracted hooks: [list with line counts]
- Extracted modules: [list with line counts]

### ✅ Gate 4: Architecture Compliance
- [ ] No cross-feature imports
- [ ] React Query for server data
- [ ] Shared API client used
- [ ] Component structure correct
- [ ] Handler naming correct
- [ ] Import order correct
- [ ] Tailwind-first styling

### ✅ Gate 5: Deployment Safety
- [ ] Build succeeds
- [ ] Linter passes
- [ ] Bundle size acceptable

### ✅ Gate 6: Peer Review
- [ ] At least 1 approval
- [ ] All comments resolved

### ✅ Gate 7: Git Hygiene
- [ ] Atomic commits
- [ ] Conventional commit messages
- [ ] No merge conflicts

## Behavior Parity Verification
[Explain how you verified that user-facing behavior is unchanged]

## Screenshots / Demo
[If UI changes, provide before/after screenshots]
[Note: Should have NO UI changes during refactor - this is for reference only]

## Rollback Plan
[How to revert this change if something goes wrong]
```

---

## 🚨 When to Apply Gates

### Every PR (Always)
- Gate 1: Automated Tests ✅
- Gate 4: Architecture Compliance ✅
- Gate 5: Deployment Safety ✅
- Gate 6: Peer Review ✅

### Phase 1 PRs (Incremental Decomposition)
- Gate 2: Manual Smoke Test ✅
- Gate 3: Code Health Metrics ✅

### Final Cutover PR (Phase 1 End)
- **ALL GATES** ✅✅✅
- Extra scrutiny on behavior parity
- Consider feature flag for rollback

---

## 🎯 Success Criteria

A PR is **ready to merge** when:
1. ✅ All blocking gates pass
2. ✅ Manual smoke test complete
3. ✅ Peer approval received
4. ✅ No outstanding comments
5. ✅ Build and tests green
6. ✅ Behavior parity verified

A PR is **NOT ready** if:
1. ❌ Any test fails
2. ❌ Manual smoke test fails
3. ❌ Architecture violations present
4. ❌ Build or lint errors
5. ❌ Unresolved review comments
6. ❌ Merge conflicts

---

## 🔄 Continuous Improvement

After each PR:
1. **Retrospect**: What went well? What was hard?
2. **Update gates**: Add checks if new issues found
3. **Automate**: Convert manual checks to automated when possible
4. **Document**: Update `phase0-refactor-gates.md` with learnings

---

## 📞 Escalation

If you're blocked by a gate:
1. **Discuss with team**: Is the gate too strict?
2. **Document exception**: Why is this gate being waived?
3. **Add mitigation**: Extra testing, monitoring, feature flag
4. **Update gates**: Adjust for next PR if needed

**Never silently skip a gate.** If a gate is unreasonable, change the gate, don't ignore it.

