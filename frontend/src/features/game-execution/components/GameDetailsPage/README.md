# GameDetails - Modular Component Structure

This document describes the refactored, modular structure of the GameDetails page.

## Overview

The monolithic GameDetails component (previously ~1679 lines) has been refactored into a clean, modular structure with single-responsibility components. This improves maintainability, readability, and makes future development easier.

## Directory Structure

```
/pages/GameDetails/
├── index.jsx                    # Main container component (state management & logic)
├── formations.js                # Formation configuration data
├── components/
│   ├── GameDetailsHeader.jsx    # Top header with title, status, score, and action buttons
│   ├── GameDayRosterSidebar.jsx # Left sidebar with player roster management
│   ├── TacticalBoard.jsx        # Central tactical pitch view
│   ├── MatchAnalysisSidebar.jsx # Right sidebar with stats and summaries
│   ├── PlayerCard.jsx           # Reusable player card component
│   └── dialogs/
│       ├── PlayerPerformanceDialog.jsx  # Player performance entry dialog
│       └── FinalReportDialog.jsx        # Final report confirmation dialog
```

## Component Responsibilities

### index.jsx (Main Container)
**Responsibility**: State management, business logic, and orchestration
- Manages all component state (game data, players, rosters, formation, reports)
- Handles data loading from DataContext
- Implements all business logic (drag-and-drop, status updates, API calls)
- Delegates rendering to child components

**Props**: None (receives data from URL params and DataContext)

### GameDetailsHeader.jsx
**Responsibility**: Display game info and primary actions
- Shows game title, date, location, opponent
- Displays game status badge
- Shows/edits final score
- Renders action buttons (Game Was Played, Postpone, Submit Final Report, Edit Report)

**Props**:
- `game`: Game object
- `finalScore`: Score state
- `setFinalScore`: Score setter
- `missingReportsCount`: Count of missing reports
- `teamSummary`: Team summary state
- `isSaving`: Saving status flag
- `isScheduled`, `isPlayed`, `isDone`: Game status flags
- Handler functions for all actions

### GameDayRosterSidebar.jsx
**Responsibility**: Player roster management and display
- Groups players into: "Players on Pitch", "Bench", "Squad Players"
- Renders PlayerCard components for each player
- Handles drag-and-drop initiation

**Props**:
- `playersOnPitch`, `benchPlayers`, `squadPlayers`: Player arrays
- `hasReport`, `needsReport`, `getPlayerStatus`: Helper functions
- `handleOpenPerformanceDialog`: Opens performance dialog
- `updatePlayerStatus`: Updates player status
- `handleDragStart`, `handleDragEnd`: Drag handlers
- Status flags

### TacticalBoard.jsx
**Responsibility**: Visual tactical pitch display
- Renders the football pitch with markings
- Shows formation selector
- Displays player positions with drag-and-drop support
- Handles player assignment to positions

**Props**:
- `formations`: Available formations
- `formationType`: Current formation
- `positions`: Position configuration
- `formation`: Current player assignments
- `onFormationChange`: Formation change handler
- `onPositionDrop`: Drop handler
- `onRemovePlayer`: Remove player handler
- `onPlayerClick`: Player click handler
- `isDragging`: Drag state
- Status flags
- Helper functions

### MatchAnalysisSidebar.jsx
**Responsibility**: Display match statistics and summaries
- Shows match stats (scorers, assists, MVP)
- Displays AI summary placeholder
- Provides team summary input fields (Defense, Midfield, Attack, General)

**Props**:
- `isPlayed`, `isDone`: Status flags
- `matchStats`: Computed match statistics
- `teamSummary`: Team summary state
- `setTeamSummary`: Team summary setter

### PlayerCard.jsx
**Responsibility**: Reusable player card display
- Shows player kit number, name, position
- Displays report status indicators
- Provides status menu (Add to Bench, Mark Unavailable, etc.)
- Supports drag-and-drop

**Props**:
- `player`: Player object
- `status`: Player status
- `hasReport`, `needsReport`: Report status flags
- `onOpenPerformance`: Opens performance dialog
- `onStatusChange`: Status change handler
- `onDragStart`, `onDragEnd`: Drag handlers
- Status flags

### Dialogs

#### PlayerPerformanceDialog.jsx
**Responsibility**: Player performance data entry
- Allows input of: minutes played, goals, assists, rating, notes
- Validates and saves performance reports

**Props**:
- `open`: Dialog visibility
- `onOpenChange`: Dialog visibility handler
- `player`: Player object
- `data`: Performance data
- `onDataChange`: Data change handler
- `onSave`: Save handler
- `isReadOnly`: Read-only flag

#### FinalReportDialog.jsx
**Responsibility**: Final report confirmation
- Shows summary of final score and team summaries
- Validates all required fields are filled
- Confirms final submission

**Props**:
- `open`: Dialog visibility
- `onOpenChange`: Dialog visibility handler
- `finalScore`: Final score
- `teamSummary`: Team summaries
- `onConfirm`: Confirmation handler
- `isSaving`: Saving status flag

### formations.js
**Responsibility**: Formation configuration data
- Exports all available formations (1-4-4-2, 1-4-3-3, 1-3-5-2)
- Defines position coordinates and metadata for each formation

## Benefits of This Structure

1. **Maintainability**: Each component has a clear, single responsibility
2. **Readability**: Smaller, focused files are easier to understand
3. **Reusability**: Components like PlayerCard can be reused elsewhere
4. **Testability**: Easier to write unit tests for individual components
5. **Collaboration**: Multiple developers can work on different components simultaneously
6. **Scalability**: Easy to add new features or modify existing ones

## Migration Notes

- The original monolithic file has been renamed to `GameDetails.old.jsx` as a backup
- All functionality has been preserved - no breaking changes
- Import path remains the same: `import GameDetails from "./GameDetails"`
- All existing routes and references continue to work

## Future Improvements

Consider these enhancements:
1. Extract helper functions into a `utils/` folder
2. Move API calls to a `services/` folder
3. Create custom hooks for complex state logic (e.g., `useFormation`, `usePlayerReports`)
4. Add PropTypes or TypeScript for type safety
5. Implement AI Match Summary component

