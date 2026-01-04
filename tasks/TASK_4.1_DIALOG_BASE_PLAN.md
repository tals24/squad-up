# Task 4.1: Standardize Shared Dialog Base

**Status:** 📋 Planning → In Progress  
**Date:** 2026-01-04  
**Branch:** `refactor/frontend-alignment-plan`

---

## 🎯 Objective

Create a reusable base dialog component in `shared/ui/composed/` that encapsulates common dialog patterns, reducing code duplication and improving consistency across features.

---

## 📊 Current State Analysis

### Existing Dialogs (game-execution feature):

1. **CardDialog.jsx** (~433 lines)
2. **FinalReportDialog.jsx** (~138 lines)
3. **GoalDialog.jsx** (~492 lines)
4. **PlayerPerformanceDialog.jsx** (~633 lines)
5. **PlayerSelectionDialog.jsx** (~135 lines)
6. **SubstitutionDialog.jsx** (~377 lines)
7. **TeamSummaryDialog.jsx** (~94 lines)

**Total:** ~2,302 lines across 7 dialogs

### Common Patterns Identified:

✅ **All dialogs share:**
1. State management (`useState` for form data, errors, loading)
2. Dialog primitives (Dialog, DialogContent, DialogHeader, DialogFooter)
3. Loading states (`isSaving`, `setIsSaving`)
4. Error handling (`errors` state, error display)
5. Validation logic (client-side)
6. Save/Cancel button pattern
7. Read-only mode support
8. Close handler logic

✅ **Styling patterns:**
- Dark theme (bg-slate-900, border-slate-700)
- Cyan accents for titles
- Consistent button styles
- Error message formatting

---

## 🎨 Proposed Solution

### 4.1.1: Standard Location Decision ✅

**Location:** `frontend/src/shared/ui/composed/BaseDialog.jsx`

**Rationale:**
- ✅ Follows FSD architecture (`composed` = composed UI from primitives)
- ✅ Keeps primitives separate from composed components
- ✅ Consistent with existing `StatSliderControl.jsx` in same folder
- ✅ Easy to import: `@/shared/ui/composed/BaseDialog`

---

### 4.1.2: Base Dialog API Design

**Approach:** Composition over configuration
- Provide common layout and patterns
- Allow customization via props and children
- Don't enforce too much structure (flexibility)

**Component API:**

```typescript
interface BaseDialogProps {
  // Dialog State
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Header
  title: string | React.ReactNode;
  titleIcon?: React.ReactNode;
  description?: string;
  
  // Content
  children: React.ReactNode;
  
  // Footer Actions
  actions?: {
    cancel?: {
      label?: string;
      onClick?: () => void;
      disabled?: boolean;
    };
    confirm?: {
      label?: string;
      onClick?: () => void;
      disabled?: boolean;
      variant?: 'default' | 'destructive';
      loading?: boolean;
    };
    custom?: React.ReactNode; // For custom action buttons
  };
  
  // States
  isLoading?: boolean;
  isReadOnly?: boolean;
  loadingMessage?: string;
  
  // Errors
  error?: string | null;
  errors?: Record<string, string>; // Field-level errors
  
  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Advanced
  hideCloseButton?: boolean;
  preventOutsideClick?: boolean;
}
```

---

## 📁 File Structure (After Task 4.1)

```
frontend/src/shared/ui/composed/
├── BaseDialog.jsx          # ✅ NEW - Base dialog with common patterns
├── StatSliderControl.jsx   # Existing
└── index.js                # Export both
```

---

## 🚀 Implementation Plan

### Step 1: Create BaseDialog Component ✅

**File:** `frontend/src/shared/ui/composed/BaseDialog.jsx`

**Features:**
- Wraps Radix UI Dialog primitives
- Provides default dark theme styling
- Handles loading states (with overlay)
- Handles error display (global + field-level)
- Provides standard footer with Cancel/Confirm buttons
- Supports read-only mode
- Supports custom actions
- Responsive size options

### Step 2: Update Composed Index ✅

**File:** `frontend/src/shared/ui/composed/index.js`

```javascript
export { default as StatSliderControl } from './StatSliderControl';
export { default as BaseDialog } from './BaseDialog';
```

### Step 3: Create Documentation ✅

**File:** `tasks/TASK_4.1_DIALOG_BASE_PLAN.md` (this file)

---

## 🔄 Migration Strategy (Task 4.2)

### Priority Order (Simplest to Most Complex):

1. **TeamSummaryDialog** (~94 lines) - Simplest, good pilot
2. **FinalReportDialog** (~138 lines) - Simple confirmation
3. **CardDialog** (~433 lines) - Medium complexity
4. **GoalDialog** (~492 lines) - Complex (tabs, multiple states)
5. **SubstitutionDialog** (~377 lines) - Medium-complex
6. **PlayerPerformanceDialog** (~633 lines) - Most complex (tabs, many fields)
7. **PlayerSelectionDialog** (~135 lines) - Simple list selection

**Task 4.2 will migrate:**
- ✅ TeamSummaryDialog (pilot)
- ✅ CardDialog OR FinalReportDialog (second)

---

## 📊 Expected Benefits

### Code Reduction:
- **Current:** ~2,302 lines (7 dialogs)
- **After:** Estimated ~1,500-1,800 lines (40-50% reduction in boilerplate)

### Consistency:
- ✅ Uniform styling across all dialogs
- ✅ Consistent loading states
- ✅ Consistent error handling
- ✅ Consistent button placement

### Maintainability:
- ✅ Fix styling once, applies to all dialogs
- ✅ Add features once (e.g., keyboard shortcuts)
- ✅ Easier to test (test base once, dialogs test logic only)

---

## 🧪 Verification Checklist

After implementation:
- [ ] BaseDialog component created in `shared/ui/composed/`
- [ ] Exported from `shared/ui/composed/index.js`
- [ ] Supports all documented props
- [ ] Dark theme styling matches existing dialogs
- [ ] Loading overlay works
- [ ] Error display works (global + field-level)
- [ ] Footer actions work (cancel, confirm, custom)
- [ ] Read-only mode disables buttons
- [ ] Size variants work (sm, md, lg, xl)
- [ ] No linter errors

---

## 📝 Notes

- This is a **progressive enhancement** - existing dialogs keep working
- Migration happens in Task 4.2 (incremental, 2 dialogs first)
- BaseDialog is opt-in (not enforced)
- Allows flexibility for complex dialogs that need custom layouts

---

## 🔗 Related Tasks

- **Task 4.2:** Migrate 2 dialogs to BaseDialog
- **Task 4.3:** Consolidate shared form patterns
- **Phase 1 (Complete):** Decomposed GameDetailsPage into modules
- **Phase 2 (Complete):** Split game-management into focused features
