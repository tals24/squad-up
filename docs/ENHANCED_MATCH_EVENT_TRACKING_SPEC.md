# Technical Design Specification: Enhanced Match Event Tracking System

## Executive Summary

This specification outlines the technical implementation for enhanced match event tracking features, focusing on manual data entry efficiency while maximizing analytical value. The design prioritizes user experience, data integrity, and future analytical capabilities.

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Status:** Approved for Implementation  

---

## 1. Data Model Design

### 1.1 Enhanced Goal Schema

```javascript
Goal {
  _id: ObjectId,
  gameId: ObjectId,         // Reference to Game
  goalNumber: Number,       // 1, 2, 3, etc. (sequence in match)
  minute: Number,           // 1-120 (includes extra time)
  
  // Goal relationships
  scorerId: ObjectId,       // Player who scored
  assistedById: ObjectId | null,  // Player who assisted (null if unassisted)
  
  // Goal involvement (indirect contributors)
  goalInvolvement: [{
    playerId: ObjectId,
    contributionType: String  // enum: ['pre-assist', 'space-creation', 'defensive-action', 'set-piece-delivery', 'pressing-action', 'other']
  }],
  
  // Goal context
  goalType: String,         // enum: ['open-play', 'set-piece', 'penalty', 'counter-attack', 'own-goal']
  matchState: String,       // enum: ['winning', 'drawing', 'losing'] - at time of goal
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (for game-level queries)
- `scorerId` (for player statistics)
- `assistedById` (for assist tracking)
- `minute` (for timeline analysis)

---

### 1.2 Enhanced Substitution Schema

```javascript
Substitution {
  _id: ObjectId,
  gameId: ObjectId,
  
  // Substitution details
  playerOutId: ObjectId,    // Player leaving the field
  playerInId: ObjectId,     // Player entering the field
  minute: Number,           // 1-120
  
  // Substitution context
  reason: String,           // enum: ['tactical', 'tired', 'injury', 'yellow-card-risk', 'poor-performance']
  matchState: String,       // enum: ['winning', 'drawing', 'losing']
  
  // Optional coaching notes
  tacticalNote: String,     // Brief explanation (optional)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (for game-level queries)
- `playerOutId` (for player rotation analysis)
- `playerInId` (for substitute impact analysis)

---

### 1.3 Enhanced Disciplinary Action Schema

```javascript
DisciplinaryAction {
  _id: ObjectId,
  gameId: ObjectId,
  playerId: ObjectId,
  
  // Card details
  cardType: String,         // enum: ['yellow', 'red', 'second-yellow']
  minute: Number,           // 1-120
  
  // Foul tracking (aggregate)
  foulsCommitted: Number,   // dropdown: 0-2, 3-5, 6+ (stored as: 1, 4, 7)
  foulsReceived: Number,    // dropdown: 0-2, 3-5, 6+ (stored as: 1, 4, 7)
  
  // Context
  reason: String,           // Optional: Brief description of card incident
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (for game-level queries)
- `playerId` (for discipline tracking)
- `cardType` (for card statistics)

---

### 1.4 Enhanced Shot Tracking Schema (Optional)

```javascript
ShotTracking {
  _id: ObjectId,
  gameId: ObjectId,
  playerId: ObjectId,
  
  // Shot outcomes (estimated counts)
  shotsOnTarget: Number,    // dropdown: 0, 1, 2, 3, 4, 5+ (stored as actual or 6)
  shotsOffTarget: Number,   // dropdown: 0, 1, 2, 3, 4, 5+
  shotsBlocked: Number,     // dropdown: 0, 1, 2, 3+
  
  // Big chances
  bigChancesMissed: Number, // dropdown: 0, 1, 2, 3+ (high-quality opportunities)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (for game statistics)
- `playerId` (for player performance)

**Note:** This is optional per organizational settings (see Configuration Schema)

---

### 1.5 Position-Specific Metrics Schema (Optional)

```javascript
PositionSpecificMetrics {
  _id: ObjectId,
  gameId: ObjectId,
  playerId: ObjectId,
  position: String,         // enum: ['goalkeeper', 'defender', 'midfielder', 'forward']
  
  // Goalkeeper-specific (if position = 'goalkeeper')
  goalkeeperMetrics: {
    savesMade: Number,      // dropdown: 0-2, 3-5, 6+ (stored as: 1, 4, 7)
    goalsConceded: Number,  // Auto-calculated from match score
    cleanSheet: Boolean,    // Auto-calculated
    penaltyFaced: Boolean,
    penaltySaved: Boolean,
    majorError: Boolean     // Error leading to goal/big chance
  },
  
  // Defender-specific (if position = 'defender')
  defenderMetrics: {
    cleanSheetContribution: Boolean,  // Part of clean sheet defense
    majorDefensiveError: Boolean,     // Error leading to goal/big chance
    dominantInDuels: String,          // enum: ['yes', 'average', 'no']
    crucialDefensiveActions: Number   // dropdown: 0, 1, 2, 3+ (goal-line clearances, last-ditch tackles)
  },
  
  // Midfielder-specific (if position = 'midfielder')
  midfielderMetrics: {
    controlledGame: String,           // enum: ['yes', 'average', 'no']
    createdMultipleChances: Boolean,  // Created 3+ chances
    bigChancesCreated: Number         // dropdown: 0, 1, 2, 3+
  },
  
  // Forward-specific (if position = 'forward')
  forwardMetrics: {
    // Covered by ShotTracking schema
    clinicalFinishing: Boolean        // Subjective: took chances well
  },
  
  // Metadata
  isEnabled: Boolean,       // From organization settings
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (for game queries)
- `playerId` (for player analysis)
- `position` (for position-based analytics)

---

### 1.6 Match Context Schema

```javascript
MatchContext {
  _id: ObjectId,
  gameId: ObjectId,         // One-to-one with Game
  
  // Opposition assessment
  oppositionQuality: String,    // enum: ['weak', 'average', 'strong']
  
  // Match importance
  matchImportance: String,      // enum: ['friendly', 'league', 'cup', 'derby', 'playoff', 'final']
  
  // Environmental conditions
  weather: String,              // enum: ['good', 'rain', 'wind', 'cold', 'hot']
  pitchCondition: String,       // enum: ['excellent', 'good', 'average', 'poor']
  
  // Squad availability
  squadAvailability: String,    // enum: ['full-squad', 'missing-key-players', 'injury-crisis']
  missingKeyPlayers: [String],  // Array of player names (optional)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `gameId` (unique, for one-to-one lookup)

---

### 1.7 Organization Configuration Schema

```javascript
OrganizationConfig {
  _id: ObjectId,
  organizationId: ObjectId,
  
  // Feature toggles
  features: {
    shotTrackingEnabled: Boolean,           // Default: false
    positionSpecificMetricsEnabled: Boolean, // Default: false
    detailedDisciplinaryEnabled: Boolean,   // Default: true
    goalInvolvementEnabled: Boolean,        // Default: true
  },
  
  // Age group configurations
  ageGroupSettings: [{
    ageGroupId: ObjectId,
    minAge: Number,
    maxAge: Number,
    
    // Per age group feature overrides
    shotTrackingEnabled: Boolean,
    positionSpecificMetricsEnabled: Boolean,
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `organizationId` (unique)
- `ageGroupSettings.ageGroupId`

---

## 2. API Endpoints Design

### 2.1 Goals API

```javascript
// Create/Update goal with relationships
POST /api/games/:gameId/goals
{
  goalNumber: 1,
  minute: 23,
  scorerId: "player123",
  assistedById: "player456",  // or null
  goalInvolvement: [
    { playerId: "player789", contributionType: "pre-assist" }
  ],
  goalType: "open-play",
  matchState: "drawing"
}

// Get all goals for a game
GET /api/games/:gameId/goals

// Update existing goal
PUT /api/games/:gameId/goals/:goalId

// Delete goal
DELETE /api/games/:gameId/goals/:goalId

// Get player goal partnerships (analytics endpoint)
GET /api/analytics/goal-partnerships?teamId=xxx&season=2024
Response: [
  { 
    scorer: { id: "player123", name: "John Doe" },
    assister: { id: "player456", name: "Jane Smith" },
    goalCount: 5,
    games: ["game1", "game2", ...]
  }
]
```

---

### 2.2 Substitutions API

```javascript
// Create substitution
POST /api/games/:gameId/substitutions
{
  playerOutId: "player123",
  playerInId: "player456",
  minute: 67,
  reason: "tired",
  matchState: "winning",
  tacticalNote: "Freshen up midfield"  // optional
}

// Get all substitutions for a game
GET /api/games/:gameId/substitutions

// Update substitution
PUT /api/games/:gameId/substitutions/:subId

// Delete substitution
DELETE /api/games/:gameId/substitutions/:subId

// Get player substitution patterns (analytics)
GET /api/analytics/substitution-patterns?playerId=xxx
```

---

### 2.3 Disciplinary Actions API

```javascript
// Create/Update disciplinary action
POST /api/games/:gameId/disciplinary-actions
{
  playerId: "player123",
  cardType: "yellow",
  minute: 34,
  foulsCommitted: 4,  // Represents 3-5 range
  foulsReceived: 1,   // Represents 0-2 range
  reason: "Tactical foul stopping counter-attack"  // optional
}

// Get all disciplinary actions for a game
GET /api/games/:gameId/disciplinary-actions

// Get player discipline history
GET /api/analytics/player-discipline?playerId=xxx&season=2024
```

---

### 2.4 Shot Tracking API

```javascript
// Create/Update shot tracking (if enabled)
POST /api/games/:gameId/shot-tracking
{
  playerId: "player123",
  shotsOnTarget: 3,
  shotsOffTarget: 2,
  shotsBlocked: 1,
  bigChancesMissed: 1
}

// Get shot tracking for game
GET /api/games/:gameId/shot-tracking

// Check if shot tracking is enabled for team/age group
GET /api/config/shot-tracking-enabled?teamId=xxx
```

---

### 2.5 Position-Specific Metrics API

```javascript
// Create/Update position-specific metrics (if enabled)
POST /api/games/:gameId/position-metrics
{
  playerId: "player123",
  position: "goalkeeper",
  goalkeeperMetrics: {
    savesMade: 4,
    penaltyFaced: true,
    penaltySaved: false,
    majorError: false
  }
}

// Get position metrics for game
GET /api/games/:gameId/position-metrics

// Check if position metrics enabled
GET /api/config/position-metrics-enabled?teamId=xxx
```

---

### 2.6 Match Context API

```javascript
// Create/Update match context
POST /api/games/:gameId/match-context
{
  oppositionQuality: "strong",
  matchImportance: "derby",
  weather: "rain",
  pitchCondition: "average",
  squadAvailability: "missing-key-players",
  missingKeyPlayers: ["John Doe", "Jane Smith"]
}

// Get match context
GET /api/games/:gameId/match-context
```

---

### 2.7 Organization Configuration API

```javascript
// Get organization config
GET /api/organizations/:orgId/config

// Update feature toggles (admin only)
PUT /api/organizations/:orgId/config
{
  features: {
    shotTrackingEnabled: true,
    positionSpecificMetricsEnabled: true
  }
}

// Update age group settings (admin only)
PUT /api/organizations/:orgId/config/age-groups/:ageGroupId
{
  shotTrackingEnabled: false,
  positionSpecificMetricsEnabled: false
}
```

---

## 3. Frontend Component Architecture

### 3.1 Enhanced Goal Dialog Component

```jsx
<GoalDialog>
  {/* Basic goal info */}
  <Select label="Goal Number" options={[1, 2, 3, ...]} />
  <Input type="number" label="Minute" min={1} max={120} />
  
  {/* Goal relationships */}
  <PlayerSelect label="Scorer" players={gamePlayers} required />
  <PlayerSelect label="Assisted By" players={gamePlayers} allowNull />
  
  {/* Goal involvement (multi-select) */}
  <GoalInvolvementSelector 
    label="Other Contributors"
    players={gamePlayers}
    excludePlayers={[scorerId, assistedById]}
  />
  
  {/* Goal context */}
  <Select label="Goal Type" options={goalTypes} />
  <Select label="Match State" options={matchStates} />
  
  {/* Actions */}
  <Button onClick={handleSave}>Save Goal</Button>
</GoalDialog>
```

**State Management:**
```javascript
const [goalData, setGoalData] = useState({
  goalNumber: null,
  minute: null,
  scorerId: null,
  assistedById: null,
  goalInvolvement: [],
  goalType: 'open-play',
  matchState: 'drawing'
});
```

---

### 3.2 Enhanced Substitution Dialog Component

```jsx
<SubstitutionDialog>
  {/* Players involved */}
  <PlayerSelect label="Player Out" players={playersOnPitch} required />
  <PlayerSelect label="Player In" players={benchPlayers} required />
  
  {/* Timing */}
  <Select label="Minute" options={[45, 60, 65, 70, 75, 80, 85, 90]} />
  
  {/* Context */}
  <Select label="Reason" options={substitutionReasons} />
  <Select label="Match State" options={matchStates} autoDetect />
  
  {/* Optional tactical note */}
  <Textarea label="Tactical Note (Optional)" maxLength={200} />
  
  <Button onClick={handleSave}>Save Substitution</Button>
</SubstitutionDialog>
```

---

### 3.3 Enhanced Disciplinary Section Component

```jsx
<DisciplinarySection player={player}>
  {/* Card tracking */}
  <CardSelector 
    value={cardData.cardType}
    onChange={handleCardChange}
    options={['none', 'yellow', 'red']}
  />
  
  {cardData.cardType !== 'none' && (
    <>
      <Select label="Minute" options={timeOptions} />
      <Input label="Reason (Optional)" />
    </>
  )}
  
  {/* Foul tracking */}
  <Select 
    label="Fouls Committed"
    options={[
      { label: '0-2', value: 1 },
      { label: '3-5', value: 4 },
      { label: '6+', value: 7 }
    ]}
  />
  
  <Select 
    label="Fouls Received"
    options={[
      { label: '0-2', value: 1 },
      { label: '3-5', value: 4 },
      { label: '6+', value: 7 }
    ]}
  />
</DisciplinarySection>
```

---

### 3.4 Conditional Shot Tracking Component

```jsx
<ShotTrackingSection 
  player={player}
  enabled={orgConfig.features.shotTrackingEnabled}
>
  {enabled && (
    <>
      <Select label="Shots on Target" options={[0, 1, 2, 3, 4, '5+']} />
      <Select label="Shots off Target" options={[0, 1, 2, 3, 4, '5+']} />
      <Select label="Shots Blocked" options={[0, 1, 2, '3+']} />
      <Select label="Big Chances Missed" options={[0, 1, 2, '3+']} />
    </>
  )}
</ShotTrackingSection>
```

---

### 3.5 Conditional Position-Specific Metrics Component

```jsx
<PositionMetricsSection 
  player={player}
  position={player.position}
  enabled={orgConfig.features.positionSpecificMetricsEnabled}
>
  {enabled && position === 'goalkeeper' && (
    <GoalkeeperMetrics>
      <Select label="Saves Made" options={rangeOptions} />
      <Checkbox label="Faced Penalty" />
      <Checkbox label="Saved Penalty" />
      <Checkbox label="Major Error" />
    </GoalkeeperMetrics>
  )}
  
  {enabled && position === 'defender' && (
    <DefenderMetrics>
      <Checkbox label="Clean Sheet Contribution" />
      <Checkbox label="Major Defensive Error" />
      <RadioGroup label="Dominant in Duels" options={['yes', 'average', 'no']} />
      <Select label="Crucial Defensive Actions" options={[0, 1, 2, '3+']} />
    </DefenderMetrics>
  )}
  
  {enabled && position === 'midfielder' && (
    <MidfielderMetrics>
      <RadioGroup label="Controlled Game" options={['yes', 'average', 'no']} />
      <Checkbox label="Created Multiple Chances" />
      <Select label="Big Chances Created" options={[0, 1, 2, '3+']} />
    </MidfielderMetrics>
  )}
  
  {enabled && position === 'forward' && (
    <ForwardMetrics>
      <Checkbox label="Clinical Finishing" />
      {/* Shot tracking appears here if enabled */}
    </ForwardMetrics>
  )}
</PositionMetricsSection>
```

---

### 3.6 Match Context Component (One-time entry)

```jsx
<MatchContextForm gameId={gameId}>
  <Select label="Opposition Quality" options={['weak', 'average', 'strong']} />
  <Select label="Match Importance" options={importanceOptions} />
  <Select label="Weather" options={weatherOptions} />
  <Select label="Pitch Condition" options={pitchOptions} />
  <Select label="Squad Availability" options={availabilityOptions} />
  
  {squadAvailability === 'missing-key-players' && (
    <TagInput label="Missing Key Players" />
  )}
  
  <Button onClick={handleSave}>Save Match Context</Button>
</MatchContextForm>
```

---

## 4. User Flow Design

### 4.1 Goal Entry Flow

```
1. Coach clicks "Add Goal" button
2. GoalDialog opens
3. Coach selects:
   - Goal number (auto-increments)
   - Minute (required)
   - Scorer (dropdown of players)
   - Assisted by (dropdown + "Unassisted" option)
   - Other contributors (multi-select with contribution type)
   - Goal type (quick select buttons)
   - Match state (auto-detected, editable)
4. Click "Save Goal"
5. Goal appears in timeline/summary
6. Auto-updates player stats (goals, assists)
```

**Time estimate:** 45-60 seconds per goal

---

### 4.2 Player Report Entry Flow (Enhanced)

```
1. Coach clicks on player (from pitch or sidebar)
2. PlayerPerformanceDialog opens with tabs:
   
   Tab 1: Basic Stats
   - Minutes played
   - Goals (read-only, from goal tracking)
   - Assists (read-only, from goal tracking)
   - Overall rating (1-10)
   - Notes
   
   Tab 2: Disciplinary (always shown)
   - Card type + minute
   - Fouls committed/received
   
   Tab 3: Shot Tracking (conditional)
   - Shows if enabled for this team/age group
   - Shots on/off target, blocked
   - Big chances missed
   
   Tab 4: Position Metrics (conditional)
   - Shows if enabled for this team/age group
   - Position-specific fields based on player position
   
3. Click "Save Report"
4. Validation: Starting lineup must have minutes > 0
5. Report saved, player indicator updates
```

**Time estimate:** 60-90 seconds per player (depending on enabled features)

---

### 4.3 Substitution Entry Flow

```
1. Coach clicks "Add Substitution"
2. SubstitutionDialog opens
3. Coach selects:
   - Player out (from players on pitch)
   - Player in (from bench players)
   - Minute (dropdown with common times: 45, 60, 70, 75, 80, 85)
   - Reason (dropdown)
   - Match state (auto-detected)
   - Optional tactical note
4. Click "Save Substitution"
5. Players swap positions (pitch ↔ bench)
6. Substitution logged in timeline
```

**Time estimate:** 30-45 seconds per substitution

---

### 4.4 Match Context Entry Flow

```
1. After marking game as "Played", prompt appears:
   "Would you like to add match context?"
2. If yes, MatchContextForm opens
3. Coach fills quick selections (all dropdowns)
4. Click "Save Match Context"
5. Context saved for future analysis
```

**Time estimate:** 60-90 seconds (one-time per match)

---

## 5. Configuration Management

### 5.1 Organization Admin Panel

```jsx
<OrganizationSettingsPage>
  <Section title="Enhanced Tracking Features">
    
    <Toggle 
      label="Shot Tracking"
      description="Track shots on/off target for forwards"
      value={config.features.shotTrackingEnabled}
      onChange={handleToggle}
    />
    
    <Toggle 
      label="Position-Specific Metrics"
      description="Track position-specific performance indicators"
      value={config.features.positionSpecificMetricsEnabled}
      onChange={handleToggle}
    />
    
    <Toggle 
      label="Detailed Disciplinary Tracking"
      description="Track fouls committed/received in addition to cards"
      value={config.features.detailedDisciplinaryEnabled}
      onChange={handleToggle}
    />
    
    <Toggle 
      label="Goal Involvement Tracking"
      description="Track indirect goal contributors (pre-assists, etc.)"
      value={config.features.goalInvolvementEnabled}
      onChange={handleToggle}
    />
  </Section>
  
  <Section title="Age Group Overrides">
    <AgeGroupTable>
      {ageGroups.map(group => (
        <AgeGroupRow key={group.id}>
          <Cell>{group.name} ({group.minAge}-{group.maxAge})</Cell>
          <Cell>
            <Toggle 
              size="small"
              value={group.shotTrackingEnabled}
              onChange={(v) => handleAgeGroupToggle(group.id, 'shotTracking', v)}
            />
          </Cell>
          <Cell>
            <Toggle 
              size="small"
              value={group.positionSpecificMetricsEnabled}
              onChange={(v) => handleAgeGroupToggle(group.id, 'positionMetrics', v)}
            />
          </Cell>
        </AgeGroupRow>
      ))}
    </AgeGroupTable>
  </Section>
</OrganizationSettingsPage>
```

---

### 5.2 Feature Detection Logic

```javascript
// Frontend utility
const isFeatureEnabled = (featureName, teamId, organizationConfig) => {
  // Check if team has age group
  const team = getTeam(teamId);
  const ageGroupId = team?.ageGroupId;
  
  if (!ageGroupId) {
    // No age group, use organization-level setting
    return organizationConfig.features[featureName];
  }
  
  // Check age group override
  const ageGroupSetting = organizationConfig.ageGroupSettings.find(
    ag => ag.ageGroupId === ageGroupId
  );
  
  if (ageGroupSetting && ageGroupSetting[featureName] !== undefined) {
    return ageGroupSetting[featureName];
  }
  
  // Fallback to organization-level setting
  return organizationConfig.features[featureName];
};

// Usage in components
const showShotTracking = isFeatureEnabled(
  'shotTrackingEnabled',
  game.teamId,
  orgConfig
);
```

---

## 6. Analytics & Reporting Capabilities

### 6.1 Goal Partnership Analysis

```javascript
// Dashboard widget: Top Goal Partnerships
GET /api/analytics/goal-partnerships?teamId=xxx&season=2024

Response:
[
  {
    scorer: { id: "player123", name: "John Doe", position: "Forward" },
    assister: { id: "player456", name: "Jane Smith", position: "Midfielder" },
    goals: 8,
    games: ["game1", "game2", ...],
    avgMinute: 67.5  // Average minute of goals
  },
  ...
]

// Visualization: Network graph showing player connections
// Node size = goals scored
// Edge thickness = number of assists between players
```

---

### 6.2 Substitution Impact Analysis

```javascript
// Player report: Substitution patterns
GET /api/analytics/player-substitutions?playerId=xxx

Response:
{
  totalSubstitutions: 12,
  avgSubMinute: 68,
  substitutionReasons: {
    "tired": 7,
    "tactical": 3,
    "yellow-card-risk": 2
  },
  performanceWhenSubbed: {
    avgRating: 6.2,
    goalsScored: 3,
    assists: 2
  },
  performanceAsSubstitute: {
    appearancesAsSub: 3,
    avgMinutesPlayed: 28,
    goalsScored: 1,
    impactRating: 7.1  // Avg rating when coming off bench
  }
}
```

---

### 6.3 Discipline Tracking

```javascript
// Season discipline report
GET /api/analytics/team-discipline?teamId=xxx&season=2024

Response:
{
  totalYellowCards: 34,
  totalRedCards: 2,
  mostDisciplinedPlayers: [...],
  mostCardedPlayers: [
    {
      player: { id: "player123", name: "John Doe" },
      yellowCards: 6,
      redCards: 1,
      avgFoulsCommitted: 4.2,  // Per game
      riskLevel: "high"  // Based on pattern analysis
    }
  ],
  cardsByMinute: {
    "0-15": 2,
    "15-30": 5,
    ...
  }
}
```

---

### 6.4 Position-Specific Performance Rankings

```javascript
// Position-based leaderboards
GET /api/analytics/position-rankings?position=goalkeeper&season=2024

Response (Goalkeepers):
[
  {
    player: { id: "player123", name: "John Doe" },
    games: 15,
    avgSaves: 4.2,
    cleanSheets: 7,
    cleanSheetPercentage: 46.7,
    majorErrors: 1,
    penaltiesFaced: 3,
    penaltiesSaved: 2
  },
  ...
]
```

---

## 7. Performance & Optimization

### 7.1 Database Indexing Strategy

```javascript
// Critical indexes for performance
Goals: 
  - { gameId: 1, minute: 1 }
  - { scorerId: 1, gameId: 1 }
  - { assistedById: 1, gameId: 1 }

Substitutions:
  - { gameId: 1, minute: 1 }
  - { playerOutId: 1 }
  - { playerInId: 1 }

DisciplinaryActions:
  - { gameId: 1 }
  - { playerId: 1, cardType: 1 }

PositionSpecificMetrics:
  - { gameId: 1, position: 1 }
  - { playerId: 1 }
```

---

### 7.2 Caching Strategy

```javascript
// Cache organization config (rarely changes)
Redis: org_config:{orgId} 
TTL: 1 hour

// Cache player partnerships (expensive query)
Redis: partnerships:{teamId}:{season}
TTL: 6 hours, invalidate on new goal

// Cache discipline stats (moderate cost)
Redis: discipline:{playerId}:{season}
TTL: 1 hour, invalidate on new card
```

---

## 8. Migration Strategy

### 8.1 Backward Compatibility

```javascript
// Existing GameReport schema compatibility
GameReport {
  // ... existing fields ...
  
  // Add optional references to new schemas
  goals: [ObjectId],  // References to Goal documents
  substitutions: [ObjectId],  // References to Substitution documents
  disciplinaryActions: [ObjectId],  // References to DisciplinaryAction documents
  
  // Maintain legacy fields for existing reports
  goalsScored: Number,  // DEPRECATED, use goals array
  assists: Number,  // DEPRECATED, use goals.assistedById
  
  // Migration flag
  migrated: Boolean  // True if using new schema
}
```

---

### 8.2 Data Migration Script

```javascript
// Migration strategy: Gradual rollout
// Phase 1: New games use new schema, old games remain unchanged
// Phase 2: Provide "Upgrade Report" button for old games
// Phase 3: Batch migrate old reports (optional)

async function migrateGameReport(gameReportId) {
  const report = await GameReport.findById(gameReportId);
  
  if (report.migrated) return;
  
  // Extract goals from legacy format
  if (report.goalsScored > 0) {
    // Create Goal documents based on legacy data
    // Note: Will lose some detail (no assist info in old format)
    for (let i = 1; i <= report.goalsScored; i++) {
      await Goal.create({
        gameId: report.gameId,
        goalNumber: i,
        minute: null,  // Unknown in legacy data
        scorerId: report.playerId,
        assistedById: null,  // Unknown in legacy data
        goalType: 'open-play'  // Assume open play
      });
    }
  }
  
  // Mark as migrated
  report.migrated = true;
  await report.save();
}
```

---

## 9. Implementation Timeline

### Phase 1 (Week 1-2): Core Goal Tracking
- ✅ Goal schema with relationships
- ✅ Goal API endpoints
- ✅ Goal dialog UI component
- ✅ Basic goal partnerships analytics

### Phase 2 (Week 3): Substitution & Disciplinary
- ✅ Substitution schema and API
- ✅ Disciplinary actions schema and API
- ✅ Enhanced player dialog with tabs
- ✅ Substitution impact analytics

### Phase 3 (Week 4): Match Context
- ✅ Match context schema and API
- ✅ Match context entry form
- ✅ Context-aware analytics

### Phase 4 (Week 5-6): Optional Features
- ✅ Organization configuration schema
- ✅ Shot tracking (optional)
- ✅ Position-specific metrics (optional)
- ✅ Admin settings panel
- ✅ Feature detection logic

### Phase 5 (Week 7-8): Analytics & Polish
- ✅ Advanced analytics dashboards
- ✅ Partnership visualizations
- ✅ Performance optimizations
- ✅ Migration tools for existing data
- ✅ User documentation

---

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
// Test goal relationship validation
describe('Goal Schema', () => {
  it('should create goal with assist relationship', async () => {
    const goal = await Goal.create({
      gameId: game._id,
      goalNumber: 1,
      minute: 23,
      scorerId: player1._id,
      assistedById: player2._id,
      goalType: 'open-play'
    });
    
    expect(goal.scorerId).toBe(player1._id);
    expect(goal.assistedById).toBe(player2._id);
  });
  
  it('should allow unassisted goals', async () => {
    const goal = await Goal.create({
      gameId: game._id,
      goalNumber: 1,
      minute: 45,
      scorerId: player1._id,
      assistedById: null,
      goalType: 'open-play'
    });
    
    expect(goal.assistedById).toBeNull();
  });
});

// Test feature detection logic
describe('Feature Detection', () => {
  it('should respect age group overrides', () => {
    const config = {
      features: { shotTrackingEnabled: true },
      ageGroupSettings: [
        { ageGroupId: 'u12', shotTrackingEnabled: false }
      ]
    };
    
    const team = { ageGroupId: 'u12' };
    
    const result = isFeatureEnabled('shotTrackingEnabled', team, config);
    expect(result).toBe(false);  // Age group override
  });
});
```

---

### 10.2 Integration Tests

```javascript
// Test goal partnership analytics
describe('Goal Partnerships API', () => {
  it('should calculate correct partnerships', async () => {
    // Create test data: Player A assists Player B (3 goals)
    await Goal.create([
      { scorerId: playerB._id, assistedById: playerA._id, ... },
      { scorerId: playerB._id, assistedById: playerA._id, ... },
      { scorerId: playerB._id, assistedById: playerA._id, ... }
    ]);
    
    const response = await request(app)
      .get('/api/analytics/goal-partnerships')
      .query({ teamId: team._id });
    
    expect(response.body[0]).toMatchObject({
      scorer: { id: playerB._id },
      assister: { id: playerA._id },
      goals: 3
    });
  });
});
```

---

### 10.3 E2E Tests

```javascript
// Test complete goal entry flow
describe('Goal Entry Flow', () => {
  it('should create goal and update player stats', async () => {
    // 1. Open goal dialog
    await page.click('[data-testid="add-goal-button"]');
    
    // 2. Fill goal form
    await page.selectOption('[data-testid="scorer-select"]', playerA._id);
    await page.selectOption('[data-testid="assister-select"]', playerB._id);
    await page.fill('[data-testid="minute-input"]', '23');
    await page.click('[data-testid="goal-type-open-play"]');
    
    // 3. Save goal
    await page.click('[data-testid="save-goal-button"]');
    
    // 4. Verify goal appears in timeline
    await expect(page.locator('[data-testid="goal-1"]')).toBeVisible();
    
    // 5. Verify player stats updated
    const scorerStats = await page.locator(`[data-player-id="${playerA._id}"] [data-testid="goals"]`);
    await expect(scorerStats).toHaveText('1');
  });
});
```

---

## 11. Security Considerations

### 11.1 Authorization Rules

```javascript
// Only coaches/managers of the team can edit match data
const canEditMatch = (user, game) => {
  return (
    user.role === 'coach' && user.teamId === game.teamId ||
    user.role === 'manager' && user.organizationId === game.organizationId ||
    user.role === 'admin'
  );
};

// Middleware for protected endpoints
router.post('/api/games/:gameId/goals', 
  authenticate,
  authorize(canEditMatch),
  createGoal
);
```

---

### 11.2 Data Validation

```javascript
// Server-side validation for goal creation
const validateGoal = (goalData, game) => {
  const errors = [];
  
  // Scorer must be in the game
  if (!game.roster.includes(goalData.scorerId)) {
    errors.push('Scorer must be part of the game roster');
  }
  
  // Assister must be in the game (if provided)
  if (goalData.assistedById && !game.roster.includes(goalData.assistedById)) {
    errors.push('Assister must be part of the game roster');
  }
  
  // Scorer and assister cannot be the same
  if (goalData.scorerId === goalData.assistedById) {
    errors.push('Scorer and assister cannot be the same player');
  }
  
  // Minute must be valid
  if (goalData.minute < 1 || goalData.minute > 120) {
    errors.push('Minute must be between 1 and 120');
  }
  
  return errors;
};
```

---

## 12. Documentation Requirements

### 12.1 User Documentation

- **Coach Guide:** How to track goals with relationships
- **Coach Guide:** How to log substitutions with context
- **Coach Guide:** Understanding position-specific metrics
- **Admin Guide:** Configuring features for age groups
- **Analytics Guide:** Interpreting partnership data

### 12.2 API Documentation

- OpenAPI/Swagger spec for all new endpoints
- Example requests/responses
- Authentication requirements
- Rate limiting information

---

## Summary

This technical specification provides a comprehensive, implementation-ready design for enhanced match event tracking. The system balances **data richness** with **manual entry efficiency**, ensuring coaches can capture valuable insights without excessive time investment.

**Key Differentiators:**
- ✅ Goal relationships enable partnership analysis
- ✅ Substitution context reveals tactical patterns
- ✅ Optional features adapt to age group needs
- ✅ Position-specific metrics provide role clarity
- ✅ Match context enables performance comparison

**Expected Data Entry Time:** 12-20 minutes per match (depending on enabled features)

**Expected Analytical Value:** High - enables player development tracking, tactical analysis, and team performance optimization

---

## Next Steps

1. Review and approve this specification
2. Create implementation tickets for each phase
3. Set up development environment
4. Begin Phase 1: Core Goal Tracking

---

**Document Status:** Ready for Implementation  
**Last Updated:** October 31, 2025  
**Version:** 1.0

