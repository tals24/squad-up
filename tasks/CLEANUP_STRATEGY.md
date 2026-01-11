# Tasks Folder Cleanup Strategy

**Date:** January 11, 2026  
**Context:** Frontend refactor is complete (Phases 0-5). Cleaning up task tracking documents.

---

## 📊 File Analysis

### **KEEP (2 files) - Important Reference**

1. ✅ **`tasks-frontend-refactor-execution-plan.md`** (142 lines)
   - **Why Keep:** Master execution plan with all phases marked complete
   - **Status:** Reference document for what was done
   
2. ✅ **`prd-frontend-refactor-execution-plan.md`** (323 lines)
   - **Why Keep:** Original Product Requirements Document
   - **Status:** Historical reference for project scope

---

## 🗄️ ARCHIVE TO docs/official/ (2 files with important knowledge)

### **1. DECOMPOSITION_MAP.md → Integrate key insights**

**Size:** 1,172 lines (39KB)  
**Content:** Detailed GameDetailsPage decomposition strategy from Phase 1

**Important Knowledge:**
- Component decomposition methodology
- Hook extraction patterns
- State analysis techniques
- Extraction priority sequencing

**Action:** Extract key patterns and add to `docs/official/frontendSummary.md` as a new section: "Component Decomposition Case Study"

---

### **2. TESTING_GUIDE.md → Consolidate with existing docs**

**Size:** 771 lines (22KB)  
**Content:** Comprehensive testing guide for refactor project

**Important Knowledge:**
- Test pyramid structure
- How to run all test types
- Test data setup
- Troubleshooting guide

**Action:** `frontend/` already has `TEST_GUIDE.md` (user docs) and `docs/TESTING_DOCUMENTATION.md` (architecture). Check for unique content, then move valuable parts to `docs/official/TESTING_STRATEGY.md`.

---

## 🗑️ REMOVE (33 files) - Completed/Obsolete

### **Phase Task Summaries (15 files)**
All phases are complete. These are incremental task documentation that's now obsolete:

- `PHASE_5_COMPLETE_SUMMARY.md` - Phase 5 summary (incorporated in frontendSummary.md)
- `TASK_5.0_ESLINT_ENFORCEMENT_REPORT.md` - ESLint report (incorporated in frontendSummary.md)
- `TASK_4.3_ADDITIONAL_MIGRATIONS.md`
- `TASK_4.3_COMPLETE.md`
- `TASK_4.3_FORM_PATTERN_ANALYSIS.md`
- `TASK_4.2_ALL_DIALOGS_MIGRATED.md`
- `TASK_4.2_MIGRATION_COMPLETE.md`
- `TASK_4.1_DIALOG_BASE_PLAN.md`
- `TASK_3.3_COMPLETE.md`
- `TASK_3.3_PHASE_A_BASELINE.md`
- `TASK_3.3_MIGRATION_LOG.md`
- `TASK_3.2_SHARED_VS_LOCAL_ANALYSIS.md`
- `TASK_3.2_DOMAIN_SPLIT_PLAN.md`
- `TASK_3.1_PAGES_LAYER_IMPLEMENTATION.md`
- `TASK_2.8_COMPLETE.md`
- `TASK_2.8_IMPLEMENTATION_PLAN.md`
- `TASK_2.8_EXTRACTION_PLAN.md`
- `TASK_2.6_SUMMARY.md`
- `TASK_1.0_SUMMARY.md`
- `SESSION_SUMMARY.md` - Outdated session notes

---

### **Phase 0 Planning Docs (5 files)**
Planning documents that were executed and incorporated into the main plan:

- `phase0-refactor-gates.md`
- `phase0-manual-smoke-checklist.md`
- `phase0-pilot-user-flows.md`
- `phase0-top-offenders.md`
- `phase0-constitution-summary.md`

---

### **Bug Tracking (13 files)**
All bugs are fixed. Individual bug reports no longer needed:

- `BUGFIX_SUBSTITUTION_ISSUES.md`
- `BUGS_FIXED_RM_POSITION.md`
- `bugs/BUG_FIX_DIALOG_PROPS_MISSING.md`
- `bugs/BUG_FIX_DIFFICULTY_ASSESSMENT_FEATURE_FLAG.md`
- `bugs/BUG_FIX_FEATURE_NAME_MISMATCH.md`
- `bugs/BUG_FIX_GAME_ROSTERS_CACHE_NOT_UPDATED.md`
- `bugs/BUG_FIX_PLAYER_REPORT_CRASH.md`
- `bugs/BUG_FIX_PLAYER_REPORT_ISSUES.md`
- `bugs/BUG_FIXES_PLAYER_STATS_AND_DIFFICULTY.md`
- `bugs/BUG_POSITION_CLICK_FIXED.md`
- `bugs/BUG_RM_POSITION_FINAL_FIX.md`
- `bugs/BUG_RM_POSITION_INVESTIGATION.md`
- `bugs/DEBUG_DIFFICULTY_ASSESSMENT_LOGS.md`

---

### **Test Documentation (3 files)**
Incorporated into official docs or superseded:

- `E2E_TEST_SUCCESS_SUMMARY.md` - Success already documented
- `TEST_FAILURES_ANALYSIS.md` - Failures resolved
- `TEST_STATUS.md` - Status outdated

---

### **Miscellaneous (1 file)**

- `DRAFT_PR_DESCRIPTION.md` - Draft PR description (not needed)

---

## 📋 Execution Plan

### **Step 1: Extract Important Knowledge**

1. ✅ Read `DECOMPOSITION_MAP.md` and extract key decomposition patterns
2. ✅ Add "Component Decomposition Case Study" section to `frontendSummary.md`
3. ✅ Read `TESTING_GUIDE.md` and check for unique content
4. ✅ Create `docs/official/TESTING_STRATEGY.md` if needed

---

### **Step 2: Clean Up**

1. ✅ Delete all 33 files marked for removal
2. ✅ Delete `bugs/` folder
3. ✅ Keep only 2 reference files in `tasks/`

---

### **Step 3: Final Structure**

```
tasks/
├── tasks-frontend-refactor-execution-plan.md (MASTER PLAN)
└── prd-frontend-refactor-execution-plan.md (ORIGINAL PRD)
```

---

## 📊 Summary

| Category | Files | Action |
|----------|------:|--------|
| **Keep** | 2 | Reference documents |
| **Archive** | 2 | Extract knowledge → docs/official/ |
| **Remove** | 33 | Delete (obsolete/completed) |
| **TOTAL** | **37** | — |

**Result:** Clean, minimal `tasks/` folder with only essential reference documents.

---

## ✅ Benefits

1. **Cleaner Repository** - Remove 89% of task files
2. **Preserved Knowledge** - Important patterns documented in official docs
3. **Easy Reference** - Only master plan and PRD remain
4. **No Data Loss** - All git history preserved

---

**Ready to execute cleanup!**
