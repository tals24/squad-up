# Minutes Progress Indicator - UI Component Specification

## Overview

The **Minutes Progress Indicator** is an optional visual component that displays real-time progress of player minutes recorded for a match. It helps coaches quickly see if they've met the minimum minute requirements before submitting the final report.

---

## Visual Design

### Location: GameDetails Header (Right side)

```
┌─────────────────────────────────────────────────────────────────┐
│  U12 vs Hapoel Haifa    |   Score: 2-0   |   Status: Played    │
│                                                                   │
│  [Postpone] [Game Was Played] [Submit Final Report]              │
│                                         Minutes: 945/990 (95%) ⚠️ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Variants

### 1. Progress Below Minimum (Red)

```jsx
Minutes: 900/990 (91%) ❌
[████████░░] 91%
```

**Styling:**
- Text color: `text-red-400`
- Progress bar: Red gradient
- Icon: ❌ or Alert icon
- Message: "Missing X minutes"

---

### 2. Progress Near Minimum (Yellow)

```jsx
Minutes: 945/990 (95%) ⚠️
[█████████░] 95%
```

**Styling:**
- Text color: `text-yellow-400`
- Progress bar: Yellow gradient
- Icon: ⚠️ or Warning icon
- Message: "Almost there! X more minutes"

---

### 3. Progress Complete (Green)

```jsx
Minutes: 990/990 (100%) ✅
[██████████] 100%
```

**Styling:**
- Text color: `text-green-400`
- Progress bar: Green gradient
- Icon: ✅ or Check icon
- Message: "Minimum met"

---

### 4. Progress Excessive (Blue with Warning)

```jsx
Minutes: 1200/990 (121%) ℹ️
[██████████████] 121%
```

**Styling:**
- Text color: `text-blue-400`
- Progress bar: Blue gradient
- Icon: ℹ️ or Info icon
- Message: "Significantly over minimum (possible multiple subs)"

---

## Component Code Example

### React Component

```jsx
import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getMinutesSummary, getMinutesProgressColor } from '../../utils/minutesValidation';

export default function MinutesProgressIndicator({ playerReports, game }) {
  const summary = useMemo(() => 
    getMinutesSummary(playerReports, game), 
    [playerReports, game]
  );

  const getIcon = () => {
    if (summary.percentage >= 100) return <CheckCircle className="w-4 h-4" />;
    if (summary.percentage >= 80) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusMessage = () => {
    if (summary.deficit > 0) return `Missing ${summary.deficit} min`;
    if (summary.excess > summary.minimumRequired * 0.2) return `${summary.excess} min over`;
    return 'Complete';
  };

  const progressColor = getMinutesProgressColor(summary.percentage);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-slate-400">Minutes:</span>
        <span className={`font-semibold ${progressColor}`}>
          {summary.totalRecorded}/{summary.minimumRequired}
        </span>
        <span className={`text-xs ${progressColor}`}>
          ({summary.percentage}%)
        </span>
        <span className={progressColor}>
          {getIcon()}
        </span>
      </div>
      
      {/* Progress Bar (optional) */}
      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            summary.percentage >= 100 ? 'bg-green-500' :
            summary.percentage >= 80 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(summary.percentage, 100)}%` }}
        />
      </div>
      
      {/* Status message */}
      <span className={`text-xs ${progressColor}`}>
        {getStatusMessage()}
      </span>
    </div>
  );
}
```

---

## Tooltip with Details

When user hovers over the indicator, show detailed breakdown:

```
┌─────────────────────────────────────┐
│  Minutes Summary                     │
├─────────────────────────────────────┤
│  Match Duration:        90 minutes   │
│  Minimum Required:     990 minutes   │
│  Total Recorded:       945 minutes   │
│                                      │
│  Missing:               45 minutes   │
│                                      │
│  Players with Minutes:  11           │
│  Players Reported:      13           │
│                                      │
│  Status: ⚠️ Incomplete                │
└─────────────────────────────────────┘
```

---

## Integration Points

### 1. GameDetails Header

```jsx
<GameDetailsHeader
  game={game}
  finalScore={finalScore}
  missingReportsCount={missingReportsCount}
  teamSummary={teamSummary}
  // ... other props
>
  {/* Add minutes indicator */}
  <MinutesProgressIndicator 
    playerReports={localPlayerReports}
    game={game}
  />
</GameDetailsHeader>
```

---

### 2. Sidebar Widget (Alternative)

Display as a card in the right sidebar:

```
┌─────────────────────────────────┐
│  ⏱️ Match Minutes                │
├─────────────────────────────────┤
│  [█████████░] 95%                │
│                                  │
│  945 / 990 minutes               │
│                                  │
│  Missing: 45 minutes             │
│                                  │
│  Suggestions:                    │
│  • Add ~5 min to each of 9       │
│    players                       │
│  • Add 1-2 substitute            │
│    appearances (~30 min each)    │
└─────────────────────────────────┘
```

---

## Real-time Updates

The indicator updates automatically when:
1. Player report is saved with new minutes
2. Player is added/removed from reports
3. Match duration is updated (extra time added)

```jsx
// Automatically recalculates on playerReports change
useEffect(() => {
  const summary = getMinutesSummary(localPlayerReports, game);
  setMinutesSummary(summary);
}, [localPlayerReports, game]);
```

---

## Benefits

### 1. Instant Feedback ⚡
- Coaches see progress in real-time
- No need to submit to find out minutes are insufficient
- Clear visual indicator of completion status

### 2. Clear Targets 🎯
- Shows exactly how many minutes are missing
- Displays percentage for quick assessment
- Color-coded for quick recognition

### 3. Better UX 😊
- Reduces submission errors
- Guides coaches to complete data entry
- Provides helpful suggestions

### 4. Proactive Validation ✅
- Catches issues before submission
- Prevents frustration from error messages
- Encourages complete data entry

---

## Mobile Responsive Design

### Desktop (Full)
```
Minutes: 945/990 (95%) ⚠️ [Progress Bar] Missing 45 min
```

### Tablet (Compact)
```
945/990 (95%) ⚠️ [Progress Bar]
```

### Mobile (Minimal)
```
945/990 ⚠️
```

---

## Accessibility

### Screen Reader Friendly
```jsx
<div 
  role="status" 
  aria-live="polite"
  aria-label={`Match minutes: ${summary.totalRecorded} of ${summary.minimumRequired} recorded. ${summary.deficit > 0 ? `Missing ${summary.deficit} minutes` : 'Complete'}`}
>
  {/* Visual content */}
</div>
```

### Keyboard Navigation
- Indicator is focusable (tabindex="0")
- Tooltip shows on focus (not just hover)
- Clear focus indicator styling

---

## Animation

### Progress Bar Animation
```css
.progress-bar {
  transition: width 0.3s ease-out;
}
```

### Icon Animation (Pulsing for warnings)
```css
.warning-icon {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Color Transitions
```css
.minutes-text {
  transition: color 0.2s ease-in-out;
}
```

---

## Testing Scenarios

### Test 1: Empty State
- No reports entered
- Should show: "0/990 (0%) ❌"
- Message: "Missing 990 minutes"

### Test 2: Partial Progress
- 5 players × 90 min = 450 min
- Should show: "450/990 (45%) ❌"
- Red color, alert icon

### Test 3: Near Complete
- 10 players × 90 min = 900 min
- Should show: "900/990 (91%) ⚠️"
- Yellow color, warning icon

### Test 4: Complete
- 11 players × 90 min = 990 min
- Should show: "990/990 (100%) ✅"
- Green color, check icon

### Test 5: Excessive
- 15 players (many subs) = 1200 min
- Should show: "1200/990 (121%) ℹ️"
- Blue color, info icon

---

## Future Enhancements

### 1. Per-Player Breakdown
Click indicator to see:
```
┌──────────────────────────────────┐
│  Player Minutes Breakdown         │
├──────────────────────────────────┤
│  John Doe        90 min ✅        │
│  Jane Smith      90 min ✅        │
│  Mike Johnson    60 min ✅        │
│  Sarah Lee        0 min ❌        │
│  ...                              │
└──────────────────────────────────┘
```

### 2. Historical Comparison
```
This match: 945/990 (95%)
Team average: 980/990 (99%)
```

### 3. Predictive Text
```
"Based on your typical substitution pattern, 
add 3 more substitute appearances"
```

---

## Implementation Steps

1. **Create Component** - `MinutesProgressIndicator.jsx`
2. **Add to Header** - Integrate in `GameDetailsHeader.jsx`
3. **Style** - Add Tailwind classes for colors and animations
4. **Test** - Verify all scenarios work correctly
5. **Optional** - Add tooltip and detailed breakdown

---

## Summary

The **Minutes Progress Indicator** is a small but powerful UI enhancement that:

✅ Provides instant visual feedback  
✅ Reduces submission errors  
✅ Guides coaches to complete data  
✅ Enhances overall user experience  

**Status:** Optional - Can be implemented after core validation is working  
**Effort:** 1-2 hours for basic version  
**Impact:** High - Significantly improves UX  

---

**Recommendation:** Implement after testing core validation to ensure coaches find it helpful in practice.

