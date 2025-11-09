# Automated Minutes Calculation - Implementation Status

## Backend Implementation ✅ COMPLETE

### 1. Calculation Service
- **File**: `backend/src/services/minutesCalculation.js`
- **Status**: ✅ Complete
- **Features**:
  - Session-based algorithm
  - Handles substitutions and red cards
  - Edge case handling (multiple sessions, players already off-field)
  - Validation and error handling

### 2. API Endpoints
- **File**: `backend/src/routes/gameReports.js`
- **Status**: ✅ Complete
- **Endpoints**:
  - `GET /api/game-reports/calculate-minutes/:gameId` - Calculate minutes on-demand
  - `POST /api/game-reports/batch` - Updated to use calculated minutes for "Played" games

### 3. Model Updates
- **File**: `backend/src/models/GameReport.js`
- **Status**: ✅ Complete
- **Changes**: Added `minutesCalculationMethod` field (enum: ['manual', 'calculated'])

### 4. Event Integration
- **Files**: 
  - `backend/src/routes/substitutions.js`
  - `backend/src/routes/disciplinaryActions.js`
- **Status**: ✅ Complete
- **Features**: Auto-recalculate minutes when events are created/updated/deleted

## Frontend Implementation ⏳ IN PROGRESS

### 1. API Client
- **File**: `src/features/game-management/api/minutesCalculationApi.js` (to be created)
- **Status**: ⏳ Pending
- **Needs**: Fetch calculated minutes from API

### 2. Custom Hook
- **File**: `src/features/game-management/hooks/useCalculatedMinutes.js` (to be created)
- **Status**: ⏳ Pending
- **Needs**: Hook following their DataProvider pattern

### 3. PlayerPerformanceDialog
- **File**: `src/features/game-management/components/GameDetailsPage/components/dialogs/PlayerPerformanceDialog.jsx`
- **Status**: ⏳ Pending
- **Needs**: Show calculated minutes as read-only

### 4. GameDetailsPage
- **File**: `src/features/game-management/components/GameDetailsPage/index.jsx`
- **Status**: ⏳ Pending
- **Needs**: Fetch and use calculated minutes

## Environment Configuration

Add to `backend/.env`:
```env
ENABLE_CALCULATED_MINUTES=true
```

## Testing Checklist

- [ ] Standard substitution (A starts, subbed out at 75', B in → A=75min, B=15min)
- [ ] Red card (A starts, red card at 60' → A=60min)
- [ ] Multiple sessions (A starts, out at 45', in at 60', out at 80' → A=65min)
- [ ] Full match (A starts, no events → A=full match duration)
- [ ] Bench player (A on bench, in at 30', no other events → A=60min)
- [ ] Red card for player already subbed out (should be ignored)
- [ ] Events out of chronological order (should validate)

## Next Steps

1. Create frontend API client for minutes calculation
2. Create custom hook following DataProvider pattern
3. Update PlayerPerformanceDialog to show calculated minutes
4. Update GameDetailsPage to fetch and display calculated minutes
5. Test all scenarios
6. Add environment variable to backend .env

