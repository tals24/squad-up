# Task 4.3: Form Pattern Analysis

**Date**: January 4, 2026
**Status**: 🔍 Analysis Phase

## Identified Repeated Patterns

### 1. Minute Input Field (HIGH PRIORITY)
**Used in**: CardDialog, SubstitutionDialog, GoalDialog (3 instances)

**Current Pattern**:
```jsx
<div className="space-y-2">
  <Label htmlFor="minute" className="text-slate-300">Minute *</Label>
  <Input
    type="number"
    min="1"
    max={matchDuration}
    value={data.minute || ''}
    onChange={(e) => setData(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
    disabled={isReadOnly}
    className="bg-slate-800 border-slate-700 text-white"
    placeholder={`1-${matchDuration}`}
  />
  {errors.minute && <p className="text-red-400 text-sm">{errors.minute}</p>}
</div>
```

**Duplication**: ~15 lines x 3 dialogs = 45 lines
**Recommendation**: ✅ **CREATE** shared `MinuteInput` component

---

### 2. Player Select Dropdown (HIGH PRIORITY)
**Used in**: CardDialog, SubstitutionDialog, GoalDialog (5+ instances)

**Current Pattern**:
```jsx
<div className="space-y-2">
  <Label htmlFor="player" className="text-slate-300">Player *</Label>
  <Select
    value={playerId || ''}
    onValueChange={(value) => setData(prev => ({ ...prev, playerId: value }))}
    disabled={isReadOnly}
  >
    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
      <SelectValue placeholder="Select player..." />
    </SelectTrigger>
    <SelectContent className="bg-slate-800 border-slate-700">
      {players.map(player => (
        <SelectItem key={player._id} value={player._id} className="text-white">
          #{player.kitNumber || '?'} {player.fullName || player.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.playerId && <p className="text-red-400 text-sm">{errors.playerId}</p>}
</div>
```

**Duplication**: ~20 lines x 5 instances = 100 lines
**Recommendation**: ✅ **CREATE** shared `PlayerSelect` component

---

### 3. Form Field Wrapper (MEDIUM PRIORITY)
**Used in**: All dialogs (20+ instances)

**Current Pattern**:
```jsx
<div className="space-y-2">
  <Label htmlFor="field" className="text-slate-300">Label Text *</Label>
  {/* Input component */}
  {errors.field && <p className="text-red-400 text-sm">{errors.field}</p>}
</div>
```

**Duplication**: ~6 lines x 20 instances = 120 lines
**Recommendation**: ✅ **CREATE** shared `FormField` wrapper component

---

### 4. Textarea with Character Count (LOW PRIORITY)
**Used in**: CardDialog, SubstitutionDialog, TeamSummaryDialog (3 instances)

**Current Pattern**:
```jsx
<div className="space-y-2">
  <Label htmlFor="notes" className="text-slate-300">Notes</Label>
  <Textarea
    value={data.notes}
    onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
    disabled={isReadOnly}
    className="bg-slate-800 border-slate-700 text-white"
    maxLength={500}
  />
  <p className="text-xs text-slate-500">{data.notes.length}/500 characters</p>
  {errors.notes && <p className="text-red-400 text-sm">{errors.notes}</p>}
</div>
```

**Duplication**: ~10 lines x 3 instances = 30 lines
**Recommendation**: ⚠️ **OPTIONAL** - Create only if time allows

---

### 5. Form State Management Pattern (LOW PRIORITY)
**Used in**: All dialogs

**Current Pattern**:
```jsx
const [data, setData] = useState({...});
const [errors, setErrors] = useState({});
const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
  if (isOpen) {
    if (item) {
      setData({...item});
    } else {
      setData({...defaults});
    }
    setErrors({});
  }
}, [isOpen, item]);

const handleSave = async () => {
  if (!validateForm()) return;
  setIsSaving(true);
  try {
    await onSave(data);
    onClose();
  } catch (error) {
    setErrors({ submit: error.message });
  } finally {
    setIsSaving(false);
  }
};
```

**Duplication**: ~30 lines x 6 dialogs = 180 lines
**Recommendation**: ⚠️ **SKIP** - Too complex, each dialog has unique validation logic

---

## Priority & Justification

### High Priority (CREATE NOW)
1. **MinuteInput** - Used 3+ times, simple, high value
2. **PlayerSelect** - Used 5+ times, high duplication
3. **FormField** - Used 20+ times, simple wrapper

### Low Priority (OPTIONAL)
4. **TextareaWithCount** - Only 3 instances, less critical

### Skip
5. **Form State Hook** - Too complex, diminishing returns

---

## Estimated Impact

**Before**: ~295 lines of duplicated code across dialogs
**After**: ~50 lines (3 shared components) + ~100 lines (usage) = **~145 lines saved**

**Maintenance**: Future field styling changes now happen in 1 place instead of 20+ places

---

## Implementation Plan

1. Create `frontend/src/shared/ui/form/FormField.jsx` - Generic field wrapper
2. Create `frontend/src/shared/ui/form/MinuteInput.jsx` - Match minute input
3. Create `frontend/src/shared/ui/form/PlayerSelect.jsx` - Player dropdown
4. Export from `frontend/src/shared/ui/form/index.js`
5. Migrate dialogs incrementally (start with CardDialog)
6. Verify behavior unchanged

---

## Decision: Proceed?

**Recommendation**: ✅ **YES** - High-value, low-risk consolidation

The identified patterns are:
- Simple and stable
- Used frequently
- Easy to test
- No complex business logic
- Clear boundaries
