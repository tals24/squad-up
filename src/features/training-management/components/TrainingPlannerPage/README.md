# TrainingPlanner Component Structure

This directory contains the refactored TrainingPlanner components, broken down from a monolithic 414-line component into smaller, focused components.

## File Structure

```
src/pages/TrainingPlanner/
├── index.jsx                    # Main container component with state management
├── components/
│   ├── TrainingPlannerHeader.jsx    # Header with navigation, team selector, save button
│   └── TrainingPlannerContent.jsx   # Main content area with loading states
└── TrainingPlanner.old.jsx      # Backup of original monolithic component
```

## Component Responsibilities

### `index.jsx` (Main Container)
- **State Management**: All useState, useEffect, and useMemo hooks
- **Data Fetching**: User authentication, team management, plan loading/saving
- **Event Handlers**: Drop, remove, notes change, save, team/week navigation
- **Component Orchestration**: Renders header and content components

### `TrainingPlannerHeader.jsx`
- **Week Navigation**: Previous/next week buttons with date display
- **Team Selection**: Dropdown for team selection
- **Save Status**: Visual indicator for saved/unsaved state
- **Save Button**: Primary action for saving training plans

### `TrainingPlannerContent.jsx`
- **Loading States**: Loading spinner and messages
- **Content Rendering**: WeeklyCalendar and DrillLibrarySidebar
- **Empty States**: Team selection prompt when no team selected

## Benefits of Refactoring

### **Stability Improvements**
- **Reduced Complexity**: Each component has a single responsibility
- **Better Error Isolation**: Issues contained to specific components
- **Easier Debugging**: Problems easier to locate and fix
- **Improved Testing**: Smaller units are easier to test

### **Maintainability Enhancements**
- **Cleaner Code**: 414 lines broken into focused components
- **Better Reusability**: Components can be shared or modified independently
- **Easier Updates**: Changes don't affect entire page
- **Clear Separation**: UI logic separated from business logic

## State Management Pattern

All state remains in the main `index.jsx` component and is passed down as props:
- `currentDate`, `selectedTeamId`, `trainingPlan` - Core data
- `isLoadingPlan`, `hasSavedData`, `isSaving` - UI states
- `handleDrop`, `handleRemoveDrill`, `handleSavePlan` - Event handlers

This pattern ensures:
- **Single Source of Truth**: All state in one place
- **Predictable Data Flow**: Props flow down, events bubble up
- **Easy State Debugging**: All state changes visible in main component
- **Component Independence**: Child components are pure and testable
