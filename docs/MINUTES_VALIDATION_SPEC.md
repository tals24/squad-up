# Minutes Validation Technical Specification

## Overview

This document specifies the technical implementation for validating player minutes in match reports, ensuring data integrity and realistic minute distribution across teams.

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Status:** Implemented

---

## Business Rules

### 1. Match Duration

**League Matches:**
- **Regular Time:** 90 minutes
- **Extra Time (1st Half):** 0-15 minutes (injury time)
- **Extra Time (2nd Half):** 0-15 minutes (injury time)
- **Total Duration:** 90 + extra time (typically 90-105 minutes)

**Cup Matches (Future):**
- **Regular Time:** 90 minutes
- **Extra Time (if draw):** 30 minutes (2 × 15 minutes)
- **Total Duration:** Up to 120 minutes

### 2. Team Minutes Validation

**Minimum Team Minutes:**
```
Minimum = 11 players × Match Duration
```

**Example (90-minute match):**
```
Minimum = 11 × 90 = 990 minutes
```

**Rationale:**
- 11 players must be on the pitch at all times
- Each position accounts for the full match duration
- Substitutions can increase total minutes beyond minimum

### 3. Individual Player Validation

**Maximum Player Minutes:**
```
Maximum = Match Duration
```

**Rules:**
- No player can exceed total match duration
- Players can play 0 minutes (bench players, unused substitutes)
- Negative minutes are invalid

---

## Data Model

### Game Schema Extensions

```javascript
Game {
  // ... existing fields ...
  
  // Match duration tracking
  matchDuration: {
    regularTime: { type: Number, default: 90 },
    firstHalfExtraTime: { type: Number, default: 0 },
    secondHalfExtraTime: { type: Number, default: 0 }
  },
  
  totalMatchDuration: { type: Number },  // Calculated field
  
  matchType: { 
    type: String, 
    enum: ['league', 'cup', 'friendly'], 
    default: 'league' 
  }
}
```

---

## Backend Implementation

### 1. Validation Service

**Location:** `backend/src/services/minutesValidation.js`

#### Core Functions:

##### `calculateTotalMatchDuration(matchDuration)`
Calculates total match duration including extra time.

```javascript
Input: { regularTime: 90, firstHalfExtraTime: 3, secondHalfExtraTime: 5 }
Output: 98 minutes
```

##### `calculateMinimumTeamMinutes(matchDuration)`
Calculates minimum required team minutes.

```javascript
Input: 90 (match duration)
Output: 990 minutes (11 × 90)
```

##### `calculateTotalPlayerMinutes(playerReports)`
Sums all player minutes from reports.

```javascript
Input: [
  { playerId: "1", minutesPlayed: 90 },
  { playerId: "2", minutesPlayed: 90 },
  { playerId: "3", minutesPlayed: 45 }
]
Output: 225 minutes
```

##### `validateMatchMinutes(game, playerReports)`
Comprehensive validation returning errors and warnings.

**Returns:**
```javascript
{
  isValid: boolean,
  errors: [
    {
      type: 'TEAM_MINUTES_INSUFFICIENT' | 'PLAYER_MINUTES_EXCEEDED',
      message: string,
      details: object
    }
  ],
  warnings: [
    {
      type: 'ZERO_MINUTES_WARNING' | 'EXCESSIVE_MINUTES_WARNING',
      message: string,
      details: object
    }
  ],
  summary: {
    totalPlayerMinutes: number,
    minimumRequired: number,
    matchDuration: number,
    playersReported: number,
    deficit: number,
    excess: number
  }
}
```

---

### 2. API Endpoints

#### `POST /api/games/:gameId/validate-minutes`

Validate minutes before final submission.

**Request Body:**
```json
{
  "playerReports": [
    {
      "playerId": "player123",
      "playerName": "John Doe",
      "minutesPlayed": 90
    }
  ]
}
```

**Response (Success):**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "summary": {
    "totalPlayerMinutes": 990,
    "minimumRequired": 990,
    "matchDuration": 90,
    "playersReported": 11,
    "deficit": 0,
    "excess": 0
  },
  "suggestions": null
}
```

**Response (Error - Insufficient Minutes):**
```json
{
  "isValid": false,
  "errors": [
    {
      "type": "TEAM_MINUTES_INSUFFICIENT",
      "message": "Total team minutes (900) is less than required minimum (990). Missing 90 minutes.",
      "details": {
        "totalPlayerMinutes": 900,
        "minimumRequired": 990,
        "deficit": 90,
        "matchDuration": 90
      }
    }
  ],
  "warnings": [],
  "summary": {
    "totalPlayerMinutes": 900,
    "minimumRequired": 990,
    "matchDuration": 90,
    "playersReported": 11,
    "deficit": 90,
    "excess": 0
  },
  "suggestions": {
    "deficit": 90,
    "suggestions": [
      {
        "type": "distribute-evenly",
        "description": "Add approximately 9 minutes to each of the 10 player(s) already recorded"
      },
      {
        "type": "add-substitutes",
        "description": "Add 3 substitute appearance(s) (~30 minutes each)"
      }
    ]
  }
}
```

**Response (Error - Player Exceeded):**
```json
{
  "isValid": false,
  "errors": [
    {
      "type": "PLAYER_MINUTES_EXCEEDED",
      "message": "John Doe cannot play more than 90 minutes (recorded: 95 minutes)",
      "details": {
        "playerId": "player123",
        "playerName": "John Doe",
        "minutesPlayed": 95,
        "maxAllowed": 90
      }
    }
  ],
  "warnings": [],
  "summary": {...}
}
```

---

#### `PUT /api/games/:gameId/match-duration`

Update match duration (for recording extra time).

**Request Body:**
```json
{
  "regularTime": 90,
  "firstHalfExtraTime": 3,
  "secondHalfExtraTime": 5
}
```

**Response:**
```json
{
  "message": "Match duration updated successfully",
  "matchDuration": {
    "regularTime": 90,
    "firstHalfExtraTime": 3,
    "secondHalfExtraTime": 5
  },
  "totalMatchDuration": 98
}
```

---

#### `GET /api/games/:gameId/minutes-summary`

Get current minutes summary for a match.

**Response:**
```json
{
  "matchDuration": 90,
  "minimumRequired": 990,
  "totalRecorded": 945,
  "deficit": 45,
  "excess": 0,
  "playersReported": 13,
  "playersWithMinutes": 11,
  "isValid": false
}
```

---

## Frontend Implementation

### 1. Validation Utilities

**Location:** `src/features/game-management/utils/minutesValidation.js`

#### Core Functions:

##### `validateMinutesForSubmission(playerReports, game, startingLineup)`

Comprehensive validation before final submission.

**Usage:**
```javascript
const validation = validateMinutesForSubmission(
  localPlayerReports,
  game,
  playersOnPitch
);

if (!validation.isValid) {
  showError(validation.errors.join('\n\n'));
}
```

##### `getMinutesSummary(playerReports, game)`

Get summary statistics for display.

**Returns:**
```javascript
{
  matchDuration: 90,
  minimumRequired: 990,
  totalRecorded: 945,
  deficit: 45,
  excess: 0,
  playersReported: 13,
  playersWithMinutes: 11,
  percentage: 95,
  isValid: false,
  isSufficient: false,
  isExcessive: false
}
```

---

### 2. Integration with GameDetails

**Location:** `src/features/game-management/components/GameDetailsPage/index.jsx`

#### Validation Flow:

```javascript
const validatePlayedStatus = () => {
  // ... other validations ...
  
  // 3. Team minutes validation
  const minutesValidation = validateMinutesForSubmission(
    localPlayerReports, 
    game, 
    playersOnPitch
  );
  
  if (!minutesValidation.isValid) {
    hasErrors = true;
    validations.push(...minutesValidation.errors);
  }
  
  if (minutesValidation.warnings.length > 0) {
    validations.push(...minutesValidation.warnings.map(w => `⚠️ ${w}`));
  }
  
  // ... continue validation ...
};
```

---

## Validation Scenarios

### Scenario 1: Valid Match (No Substitutions)

**Setup:**
- 11 players, each played 90 minutes
- Total: 990 minutes
- Match duration: 90 minutes

**Expected Result:**
```javascript
{
  isValid: true,
  errors: [],
  warnings: []
}
```

---

### Scenario 2: Valid Match (With Substitutions)

**Setup:**
- 8 players played 90 minutes (720)
- 3 players played 60 minutes (180)
- 3 substitutes played 30 minutes each (90)
- Total: 990 minutes
- Match duration: 90 minutes

**Expected Result:**
```javascript
{
  isValid: true,
  errors: [],
  warnings: []
}
```

---

### Scenario 3: Insufficient Minutes

**Setup:**
- 11 players, 10 played 90 minutes, 1 played 0 minutes
- Total: 900 minutes
- Match duration: 90 minutes
- Minimum required: 990 minutes

**Expected Result:**
```javascript
{
  isValid: false,
  errors: [
    "Total team minutes (900) is less than required (990). Missing 90 minutes."
  ],
  warnings: [],
  summary: {
    deficit: 90
  }
}
```

---

### Scenario 4: Player Exceeded Maximum

**Setup:**
- 1 player recorded 95 minutes
- Match duration: 90 minutes

**Expected Result:**
```javascript
{
  isValid: false,
  errors: [
    "John Doe: Player cannot play more than 90 minutes (recorded: 95)"
  ],
  warnings: []
}
```

---

### Scenario 5: Excessive Minutes (Warning)

**Setup:**
- Total minutes: 1200 (21% over minimum)
- Minimum required: 990 minutes
- Match duration: 90 minutes

**Expected Result:**
```javascript
{
  isValid: true,
  errors: [],
  warnings: [
    "Total minutes (1200) significantly exceeds minimum (990). This is 21% over the expected amount."
  ]
}
```

---

## User Experience

### 1. Error Messages

**Clear and Actionable:**

❌ **Bad:**
"Invalid minutes"

✅ **Good:**
"Total team minutes (900) is less than required (990). Missing 90 minutes."

---

### 2. Helpful Suggestions

When validation fails, provide suggestions:

```
❌ Missing 90 minutes

Suggestions:
• Add approximately 9 minutes to each of the 10 player(s) already recorded
• Add 3 substitute appearance(s) (~30 minutes each)
• Only 10 players have minutes. Check if any starting lineup players are missing reports.
```

---

### 3. Real-Time Feedback

Display minutes summary in GameDetails header:

```
Minutes: 945 / 990 (95%) ⚠️
```

---

## Testing Strategy

### 1. Unit Tests

```javascript
describe('Minutes Validation', () => {
  it('should calculate total match duration correctly', () => {
    const duration = calculateTotalMatchDuration({
      regularTime: 90,
      firstHalfExtraTime: 3,
      secondHalfExtraTime: 5
    });
    expect(duration).toBe(98);
  });
  
  it('should validate insufficient team minutes', () => {
    const validation = validateTeamMinutes(900, 990);
    expect(validation.isValid).toBe(false);
    expect(validation.deficit).toBe(90);
  });
  
  it('should validate player exceeding maximum', () => {
    const validation = validatePlayerMaxMinutes(95, 90);
    expect(validation.isValid).toBe(false);
  });
});
```

---

### 2. Integration Tests

```javascript
describe('Minutes Validation API', () => {
  it('should validate match minutes via API', async () => {
    const response = await request(app)
      .post('/api/games/game123/validate-minutes')
      .send({
        playerReports: [
          { playerId: '1', minutesPlayed: 90 },
          { playerId: '2', minutesPlayed: 90 },
          // ... 9 more players
        ]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
  });
});
```

---

### 3. E2E Tests

```javascript
describe('GameDetails Minutes Validation', () => {
  it('should prevent submission with insufficient minutes', async () => {
    // Set up game with insufficient minutes
    await setPlayerMinutes('player1', 90);
    await setPlayerMinutes('player2', 90);
    // ... only 10 players
    
    // Try to submit
    await page.click('[data-testid="submit-final-report"]');
    
    // Should see error modal
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(
      'Missing 90 minutes'
    );
  });
});
```

---

## Edge Cases

### 1. Zero Minutes Players

**Case:** Bench players with 0 minutes

**Validation:** Valid, but warning issued

**Message:** "X player(s) have 0 minutes recorded"

---

### 2. Excessive Extra Time

**Case:** Extra time > 15 minutes for a half

**Validation:** Error

**Message:** "Extra time for first half (20 minutes) is unusually high. Maximum recommended is 15 minutes."

---

### 3. Negative Minutes

**Case:** Player has negative minutes

**Validation:** Error

**Message:** "John Doe cannot have negative minutes (recorded: -5 minutes)"

---

### 4. Match Duration Missing

**Case:** Game has no matchDuration set

**Validation:** Default to 90 minutes

**Behavior:** Auto-set `matchDuration.regularTime = 90`

---

## Performance Considerations

### 1. Frontend Calculation

- All validation runs client-side before API call
- No network delay for instant feedback
- API called only on final submission

### 2. Backend Validation

- Validation is stateless (no database queries for calculation)
- Fast execution (<10ms typical)
- Can be cached if needed

### 3. Database Queries

- Minutes summary endpoint requires 2 queries:
  1. Fetch game (indexed by _id)
  2. Fetch reports (indexed by gameId)
- Typical response time: <50ms

---

## Future Enhancements

### 1. Cup Matches Support

**Extra Time Handling:**
- Detect draw after 90 minutes
- Allow 30-minute extra time
- Update validation to use 120-minute maximum

### 2. Penalty Shootouts

**Considerations:**
- Minutes remain at 120 (no additional time)
- Track penalty outcomes separately
- No impact on minutes validation

### 3. Weather Delays

**Scenario:** Match suspended and resumed

**Solution:**
- Allow manual adjustment of match duration
- Provide reason field for unusual durations

### 4. Minutes Distribution Visualization

**Feature:** Visual chart showing minute distribution

**Display:**
- Bar chart of minutes per player
- Color-coded by role (starter, substitute)
- Highlight players over/under expected range

---

## Migration Strategy

### 1. Existing Games

**Approach:** Gradual adoption

- New games: Validation enabled by default
- Old games: Validation optional (can be retroactively applied)

### 2. Default Match Duration

**Implementation:**
```javascript
// Pre-save middleware for Game schema
GameSchema.pre('save', function(next) {
  if (!this.matchDuration) {
    this.matchDuration = {
      regularTime: 90,
      firstHalfExtraTime: 0,
      secondHalfExtraTime: 0
    };
  }
  
  // Calculate total
  this.totalMatchDuration = 
    this.matchDuration.regularTime +
    this.matchDuration.firstHalfExtraTime +
    this.matchDuration.secondHalfExtraTime;
  
  next();
});
```

---

## Summary

This specification provides a comprehensive minutes validation system that:

✅ **Ensures Data Integrity** - Prevents impossible minute values  
✅ **Provides Clear Feedback** - Actionable error messages  
✅ **Supports Edge Cases** - Handles substitutions, extra time, etc.  
✅ **Performs Well** - Fast client-side and server-side validation  
✅ **Scales Easily** - Can extend to cup matches, penalties, etc.  

**Implementation Status:** Complete  
**Testing Status:** Ready for testing  
**Documentation Status:** Complete

---

**Next Steps:**
1. Test with real match data
2. Gather coach feedback on error messages
3. Implement cup match support
4. Add minutes distribution visualization

---

**Document Version:** 1.0  
**Last Updated:** October 31, 2025  
**Status:** Ready for Testing

