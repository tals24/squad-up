# Quick Descriptions: Not Implemented Features (Still Valid)

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** Reference Guide

---

## 1. Shot Tracking (Optional)

### What It Is
An optional feature that allows coaches to track shooting statistics for individual players during a match. It captures shot outcomes and big chances missed.

### Key Components
- **Data Model:** `ShotTracking` schema storing per-player shot statistics
- **Fields:**
  - `shotsOnTarget` - Number of shots that hit the target (0-5+)
  - `shotsOffTarget` - Number of shots that missed (0-5+)
  - `shotsBlocked` - Number of shots blocked by defenders (0-3+)
  - `bigChancesMissed` - High-quality scoring opportunities missed (0-3+)
- **API Endpoints:** `POST/GET /api/games/:gameId/shot-tracking`
- **UI Component:** Conditional tab in `PlayerPerformanceDialog` (only shown if enabled)

### Use Case
Coaches can record shooting data to analyze player finishing ability, shot selection, and offensive performance. Useful for forwards and attacking midfielders.

### Status
- **Backend:** ❌ Model and API missing
- **Frontend:** ❌ UI component missing
- **Dependency:** Requires Organization Configuration to enable/disable

### Priority
**Low** - Optional feature, can be added when needed for specific teams/age groups.

---

## 2. Position-Specific Metrics (Optional)

### What It Is
An optional feature that captures position-specific performance metrics beyond basic stats (minutes, goals, assists). Different positions have different relevant metrics.

### Key Components
- **Data Model:** `PositionSpecificMetrics` schema with position-specific fields
- **Position Types & Metrics:**
  - **Goalkeeper:** Saves made, penalties faced/saved, major errors, clean sheets
  - **Defender:** Clean sheet contribution, dominant in duels, crucial defensive actions, major errors
  - **Midfielder:** Controlled game (yes/average/no), chances created, big chances created
  - **Forward:** Clinical finishing (subjective assessment)
- **API Endpoints:** `POST/GET /api/games/:gameId/position-metrics`
- **UI Component:** Conditional tab in `PlayerPerformanceDialog` with position-specific fields

### Use Case
Provides deeper insights into position-specific performance. For example, a goalkeeper's saves and penalty performance, or a defender's contribution to clean sheets and defensive duels.

### Status
- **Backend:** ❌ Model and API missing
- **Frontend:** ❌ UI component missing
- **Dependency:** Requires Organization Configuration to enable/disable

### Priority
**Low** - Optional feature, can be added when needed for specific teams/age groups.

---

## 3. Match Context

### What It Is
A data model that captures contextual information about a match to provide better context for analytics and performance analysis. It stores environmental, opposition, and squad availability data.

### Key Components
- **Data Model:** `MatchContext` schema (one-to-one with Game)
- **Fields:**
  - `oppositionQuality` - Weak/Average/Strong
  - `matchImportance` - Friendly/League/Cup/Derby/Playoff/Final
  - `weather` - Good/Rain/Wind/Cold/Hot
  - `pitchCondition` - Excellent/Good/Average/Poor
  - `squadAvailability` - Full squad/Missing key players/Injury crisis
  - `missingKeyPlayers` - Array of player names (optional)
- **API Endpoints:** `POST/GET /api/games/:gameId/match-context`
- **UI Component:** `MatchContextForm` - Prompted after "Game Was Played" action

### Use Case
Enables context-aware analytics. For example:
- "How did we perform against strong opposition?"
- "Did weather conditions affect performance?"
- "How did missing key players impact results?"

### Status
- **Backend:** ❌ Model and API missing
- **Frontend:** ❌ UI component missing
- **Dependency:** None (standalone feature)

### Priority
**Medium** - Useful for analytics and performance context, but not blocking core functionality.

---

## 4. Organization Configuration

### What It Is
A backend system that stores feature toggles and age group settings at the organization level. It controls which optional features (Shot Tracking, Position Metrics) are enabled for specific teams or age groups.

### Key Components
- **Data Model:** `OrganizationConfig` schema
- **Fields:**
  - `features` - Global feature toggles (shotTrackingEnabled, positionSpecificMetricsEnabled, etc.)
  - `ageGroupSettings` - Array of age group overrides (can enable/disable features per age group)
- **API Endpoints:**
  - `GET /api/organizations/:orgId/config` - Get configuration
  - `PUT /api/organizations/:orgId/config` - Update global features (admin only)
  - `PUT /api/organizations/:orgId/config/age-groups/:ageGroupId` - Update age group settings
- **UI Component:** `OrganizationSettingsSection` in Settings page (currently placeholder)

### Use Case
Allows organizations to:
- Enable Shot Tracking for senior teams but disable for youth teams
- Enable Position Metrics for competitive leagues but disable for recreational leagues
- Configure feature availability per age group

### Status
- **Backend:** ❌ Model and API missing
- **Frontend:** ⚠️ Placeholder exists (`OrganizationSettingsSection.jsx`) but non-functional
- **Dependency:** Blocks Feature Detection Logic and optional features

### Priority
**High** - Required to enable optional features (Shot Tracking, Position Metrics). Blocks Feature Detection Logic implementation.

---

## 5. Feature Detection Logic

### What It Is
A utility function that determines if a specific feature is enabled for a team/age group, respecting organization-level defaults and age group overrides.

### Key Components
- **Utility Function:** `isFeatureEnabled(featureName, teamId, organizationConfig)`
- **Logic Flow:**
  1. Get team's age group
  2. Check age group override in `organizationConfig.ageGroupSettings`
  3. Fallback to organization-level `organizationConfig.features[featureName]`
  4. Return boolean
- **Usage:** Components call this function to conditionally render features

### Example Usage
```javascript
// In PlayerPerformanceDialog.jsx
const showShotTracking = isFeatureEnabled(
  'shotTrackingEnabled',
  game.teamId,
  orgConfig
);

{showShotTracking && (
  <ShotTrackingSection player={player} />
)}
```

### Use Case
Enables conditional rendering of optional features based on organization and age group settings. Prevents showing Shot Tracking UI if it's disabled for a specific team.

### Status
- **Backend:** ❌ No config to check (depends on Organization Configuration)
- **Frontend:** ❌ Utility function missing
- **Dependency:** Requires Organization Configuration (#4) to exist first

### Priority
**Medium** - Can be implemented once Organization Configuration exists. Straightforward utility function.

---

## Summary Table

| Feature | Type | Priority | Blocks | Blocked By |
|---------|------|----------|--------|------------|
| **Shot Tracking** | Optional | Low | None | Organization Config |
| **Position-Specific Metrics** | Optional | Low | None | Organization Config |
| **Match Context** | Standalone | Medium | None | None |
| **Organization Configuration** | Infrastructure | **High** | Feature Detection, Optional Features | None |
| **Feature Detection Logic** | Utility | Medium | Optional Features | Organization Config |

---

## Implementation Order Recommendation

1. **Organization Configuration** (High Priority)
   - Enables all optional features
   - Blocks Feature Detection Logic

2. **Feature Detection Logic** (Medium Priority)
   - Can be implemented once Organization Config exists
   - Enables conditional rendering

3. **Match Context** (Medium Priority)
   - Standalone feature, no dependencies
   - Useful for analytics

4. **Shot Tracking** (Low Priority)
   - Optional feature
   - Requires Organization Config + Feature Detection

5. **Position-Specific Metrics** (Low Priority)
   - Optional feature
   - Requires Organization Config + Feature Detection

---

**Last Updated:** December 2024

