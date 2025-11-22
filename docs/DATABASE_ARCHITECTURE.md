# Database Architecture Documentation

**Document Version:** 1.1  
**Date:** December 2024  
**Status:** Reference Document - Updated December 2024

---

## Executive Summary

This document outlines the current database architecture for the SquadUp application, provides recommendations for organization and scalability, and defines when to consider architectural changes.

**Current State:** Single MongoDB database with 18 collections  
**Recommendation:** Keep current structure, add naming conventions for clarity  
**Future Consideration:** Re-evaluate at 30+ collections or when hitting specific scale thresholds

---

## Current Database Structure

### Database: `squadup` (Single Database)

```
squadup (database)
├── Core Domain (4 collections)
│   ├── users
│   ├── teams
│   ├── players
│   └── games
│
├── Match Events Domain (3 collections)
│   ├── goals (with discriminators: TeamGoal, OpponentGoal)
│   ├── substitutions
│   └── cards
│
├── Match Data Domain (4 collections)
│   ├── game_reports
│   ├── gamerosters
│   ├── formations
│   └── playermatchstats
│
├── Training Domain (3 collections)
│   ├── drills
│   ├── sessiondrills
│   └── trainingsessions
│
├── Analysis Domain (2 collections)
│   ├── scout_reports
│   └── timeline_events
│
└── System Domain (2 collections)
    ├── jobs
    └── organization_configs
```

**Total Collections:** 18

---

## Collection Details

### Core Domain

#### `users`
**Purpose:** Authentication and user management  
**Relationships:** References `teams` (coaches)  
**Size:** Small (typically < 1000 documents)  
**Growth:** Slow (adds users, rarely deletes)

#### `teams`
**Purpose:** Team entities  
**Relationships:** References `users` (coach), `players` (roster)  
**Size:** Small (typically < 100 documents)  
**Growth:** Slow (seasonal additions)

#### `players`
**Purpose:** Player entities  
**Relationships:** Referenced by `games`, `goals`, `substitutions`, etc.  
**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (adds players per season)

#### `games`
**Purpose:** Match/game entities  
**Relationships:** Referenced by all event collections  
**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (adds games per season)

**Key Fields:**
- `status`: Enum ['Scheduled', 'Played', 'Done', 'Postponed']
- `matchType`: Enum ['league', 'cup', 'friendly'] - Match type for validation rules
- `matchDuration`: Object with `regularTime`, `firstHalfExtraTime`, `secondHalfExtraTime`
- `totalMatchDuration`: Calculated total match duration
- `lineupDraft`: Draft lineup for Scheduled games (temporary storage before game starts)
  - Format: `{ rosters: { playerId: status }, formation: {...}, formationType: string }`
- `reportDraft`: Draft reports for Played games (temporary storage before final submission)
  - Format: `{ teamSummary: {...}, finalScore: {...}, matchDuration: {...}, playerReports: {...} }`

**Indexes:**
- `{ gameID: 1 }` - Unique game identifier
- `{ team: 1 }` - Team filtering
- `{ date: 1 }` - Chronological queries
- `{ status: 1 }` - Status filtering
- `{ season: 1 }` - Season filtering
- `{ status: 1, lineupDraft: 1 }` - Draft queries for Scheduled games
- `{ status: 1, reportDraft: 1 }` - Draft queries for Played games

---

### Match Events Domain (Time-stamped Events)

#### `goals`
**Purpose:** Goal events during matches  
**Discriminators:** 
- `TeamGoal` - Goals scored by team (has scorerId, assistedById, goalInvolvement)
- `OpponentGoal` - Goals scored by opponent (has minute, goalType only)

**Relationships:** 
- References `games` (gameId)
- References `players` (scorerId, assistedById, goalInvolvement.playerId)

**Size:** Medium (typically 500-5000 documents per season)  
**Growth:** Fast (adds 2-5 goals per game)  
**Indexes:**
- `{ gameId: 1, goalNumber: 1 }` - Game-level queries
- `{ gameId: 1, minute: 1 }` - Timeline analysis
- `{ scorerId: 1 }` - Player statistics
- `{ assistedById: 1 }` - Assist tracking

**Special Features:**
- Uses Mongoose discriminators for type safety
- `goalNumber` and `matchState` auto-calculated when game status = "Done"

#### `substitutions`
**Purpose:** Player substitution events  
**Relationships:**
- References `games` (gameId)
- References `players` (playerOutId, playerInId)

**Size:** Medium (typically 200-2000 documents per season)  
**Growth:** Fast (adds 3-5 substitutions per game)  
**Indexes:**
- `{ gameId: 1, minute: 1 }` - Game timeline
- `{ playerOutId: 1 }` - Player rotation analysis
- `{ playerInId: 1 }` - Substitute impact analysis

**Special Features:**
- `matchState` auto-calculated when game status = "Done"

#### `cards`
**Purpose:** Card events during matches (Yellow/Red/Second Yellow)  
**Relationships:**
- References `games` (gameId)
- References `players` (playerId)

**Size:** Small-Medium (typically 100-500 documents per season)  
**Growth:** Moderate (adds 1-3 cards per game)

**Key Fields:**
- `cardType`: Enum ['yellow', 'red', 'second-yellow']
- `minute`: Number (1-120) - Required, critical for timeline ordering
- `reason`: String (optional, max 200 characters)

**Indexes:**
- `{ gameId: 1, minute: 1 }` - Timeline order
- `{ gameId: 1, playerId: 1 }` - Player cards per game
- `{ gameId: 1 }` - Game queries
- `{ playerId: 1 }` - Player queries

**Special Features:**
- Red cards and second yellows trigger `recalc-minutes` job automatically
- Minute field is required (critical for timeline ordering and minutes calculation)

---

### Match Data Domain

#### `game_reports`
**Purpose:** Post-match reports and summaries  
**Collection Name:** `game_reports` (explicit)  
**Relationships:** References `games` (game), `players` (player), `users` (author)  
**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (one per game)

**Key Fields:**
- `minutesPlayed`: Server-calculated from substitutions and red cards
- `goals`: Server-calculated from Goals collection
- `assists`: Server-calculated from Goals collection
- `rating_physical`, `rating_technical`, `rating_tactical`, `rating_mental`: User-provided ratings
- `minutesCalculationMethod`: 'calculated' or 'manual'

**Special Features:**
- Server-calculated fields (`minutesPlayed`, `goals`, `assists`) are automatically computed
- Cannot be manually set by client (enforced by API validation)

#### `gamerosters`
**Purpose:** Player availability and roster status per game  
**Relationships:** References `games` (gameId), `players` (playerId)  
**Size:** Medium (typically 500-5000 documents)  
**Growth:** Fast (11-18 players per game)

#### `formations`
**Purpose:** Tactical formations per game  
**Relationships:** References `games` (gameId)  
**Size:** Small (typically 100-1000 documents)  
**Growth:** Moderate (one per game)

#### `playermatchstats`
**Purpose:** Aggregate player statistics per game (Fouls, Shots, Passing, etc.)  
**Relationships:**
- References `games` (gameId)
- References `players` (playerId)

**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (one per player per game)

**Key Fields:**
- `disciplinary`: Object with `foulsCommitted`, `foulsReceived`
- `shooting`: Object with `shotsOnTarget`, `shotsOffTarget`, `blockedShots`, `hitWoodwork`
- `passing`: Object with `totalPasses`, `completedPasses`, `keyPasses`

**Indexes:**
- `{ gameId: 1, playerId: 1 }` - Unique constraint (one stat sheet per player per game)

**Special Features:**
- Uses upsert pattern (efficient updates)
- Extensible structure (add new stat categories without migration)
- Feature flags handled at API/UI layer (stats don't trigger recalc-minutes job)

---

### Training Domain

#### `drills`
**Purpose:** Drill library (reusable drills)  
**Relationships:** Referenced by `sessiondrills`  
**Size:** Small-Medium (typically 50-500 documents)  
**Growth:** Slow (adds drills to library)

#### `sessiondrills`
**Purpose:** Drill instances in training sessions  
**Relationships:** References `trainingsessions` (sessionId), `drills` (drillId)  
**Size:** Medium (typically 500-5000 documents)  
**Growth:** Fast (multiple drills per session)

#### `trainingsessions`
**Purpose:** Training session records  
**Relationships:** Referenced by `sessiondrills`  
**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (adds sessions over time)

---

### Analysis Domain

#### `scout_reports`
**Purpose:** Scouting data and analysis  
**Collection Name:** `scout_reports` (explicit)  
**Relationships:** References `players`, `games`  
**Size:** Small (typically < 1000 documents)  
**Growth:** Slow (adds reports as needed)

#### `timeline_events`
**Purpose:** Player timeline/history events  
**Collection Name:** `timeline_events` (explicit)  
**Relationships:** References `players` (player), `games` (game), `users` (author)  
**Size:** Medium (typically 500-5000 documents)  
**Growth:** Moderate (adds events per player)

---

### System Domain

#### `jobs`
**Purpose:** Background job queue for asynchronous calculations  
**Collection Name:** `jobs` (default pluralized)  
**Relationships:** None (self-contained)  
**Size:** Small-Medium (typically < 1000 documents, auto-cleaned after 30 days)  
**Growth:** Fast (creates jobs for recalculations), but auto-expires completed jobs

**Job Types:**
- `recalc-minutes`: Recalculate player minutes from substitutions/red cards
- `recalc-goals-assists`: Recalculate goals and assists from Goals collection
- `recalc-analytics`: Recalculate goal analytics (goal numbers, match states)

**Status Flow:**
- `pending` → `running` → `completed` (or `failed`)

**Indexes:**
- `{ status: 1, runAt: 1 }` - Efficient job polling
- `{ jobType: 1, status: 1 }` - Job type queries
- `{ completedAt: 1 }` - TTL index (auto-delete completed jobs after 30 days)

**Special Features:**
- TTL index automatically deletes completed jobs after 30 days
- Retry logic with exponential backoff for failed jobs
- Atomic job locking via `findAndLock()` static method

---

#### `organization_configs`
**Purpose:** Organization-level feature configuration management  
**Collection Name:** `organization_configs` (explicit)  
**Relationships:** References `organizations` (optional, for multi-org support)  
**Size:** Tiny (typically 1-10 documents, one per organization)  
**Growth:** None (static configuration)

**Configuration Structure:**
```javascript
{
  organizationId: ObjectId | null,  // null for single-org deployments
  features: {
    shotTrackingEnabled: Boolean,             // Default: false
    positionSpecificMetricsEnabled: Boolean,  // Default: false
    detailedDisciplinaryEnabled: Boolean,     // Default: true
    goalInvolvementEnabled: Boolean           // Default: true
  },
  ageGroupOverrides: [{
    ageGroup: String,  // Enum: 'U6-U8', 'U8-U10', 'U10-U12', 'U12-U14', 'U14-U16', 'U16+'
    shotTrackingEnabled: Boolean | null,            // null = use global default
    positionSpecificMetricsEnabled: Boolean | null,
    detailedDisciplinaryEnabled: Boolean | null,
    goalInvolvementEnabled: Boolean | null
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Feature Priority Logic:**
1. Check age group override for specific team (if `teamId` provided)
2. If override exists and not `null`, use override value
3. Otherwise, use global `features` setting

**Indexes:**
- `{ organizationId: 1 }` - Unique, sparse (single config per org)

**Pre-Save Validation:**
- Prevents duplicate `ageGroup` entries in `ageGroupOverrides` array

**Use Cases:**
- Enable shot tracking only for U16+ teams
- Disable detailed disciplinary for U6-U8 teams (too young)
- Customize feature availability per age group for maximum flexibility

**API Access:**
- `GET /api/organizations/:orgId/config` - Fetch configuration
- `PUT /api/organizations/:orgId/config` - Update configuration (Admin only)
- `GET /api/organizations/:orgId/config/feature/:featureName?teamId=X` - Check feature status with age group resolution

---

## Query Patterns Analysis

### Common Query Patterns

1. **Game Details Page:**
   ```javascript
   // Needs: game + goals + substitutions + cards
   Game.findById(gameId)
   Goal.find({ gameId })
   Substitution.find({ gameId })
   Card.find({ gameId })
   ```
   **Impact:** Cross-collection queries (needs single database)

2. **Player Statistics:**
   ```javascript
   // Needs: player + goals + cards + player match stats across games
   Player.findById(playerId)
   Goal.find({ scorerId: playerId })
   Goal.find({ assistedById: playerId })
   Card.find({ playerId })
   PlayerMatchStat.find({ playerId })
   ```
   **Impact:** Cross-collection aggregation (needs single database)

3. **Analytics Queries:**
   ```javascript
   // Goal partnerships across games
   Goal.aggregate([
     { $match: { gameId: { $in: gameIds } } },
     { $group: { _id: { scorer: '$scorerId', assister: '$assistedById' } } }
   ])
   ```
   **Impact:** Complex aggregations (needs single database)

4. **Match Timeline:**
   ```javascript
   // All events sorted by minute
   Goal.find({ gameId }).sort({ minute: 1 })
   Substitution.find({ gameId }).sort({ minute: 1 })
   ```
   **Impact:** Multiple collections for timeline (needs single database)

---

## Architecture Recommendations

### ✅ PRIMARY RECOMMENDATION: Keep Single Database + Add Naming Conventions

**Why:**
1. **Current scale is manageable:** 15 collections is well within MongoDB's capabilities
2. **Query patterns require cross-collection access:** Game details, analytics, player stats all need multiple collections
3. **Transaction support:** Need ACID transactions when marking game as "Done" (triggers analytics across goals/substitutions)
4. **Simpler maintenance:** Single database is easier to backup, restore, and monitor

**Implementation:**
```javascript
// Option A: Add prefixes to new collections (no migration needed)
// Future collections:
'event_goals' → Already 'goals' (keep as is)
'event_substitutions' → Already 'substitutions' (keep as is)
'event_disciplinaryactions' → Already 'disciplinaryactions' (keep as is)

// Option B: Document logical groupings (current approach - recommended)
// Use documentation to clarify organization, no code changes needed
```

---

### Alternative: Collection Naming Conventions (Future Consideration)

If collection count grows to 30+, consider adding prefixes:

```
Current → Proposed (with prefixes)
────────────────────────────────────────
users → core_users
teams → core_teams
players → core_players
games → match_games
goals → event_goals
substitutions → event_substitutions
disciplinaryactions → event_disciplinaryactions
game_reports → match_reports
gamerosters → match_rosters
formations → match_formations
drills → training_drills
sessiondrills → training_sessiondrills
trainingsessions → training_sessions
scout_reports → analysis_scoutreports
timeline_events → analysis_timelineevents
jobs → system_jobs
```

**Benefits:**
- Logical grouping in database tools
- Easier to find related collections
- Better organization without architectural complexity

**Drawbacks:**
- Requires migration script
- Code changes needed (model names, queries)
- Longer collection names

**When to implement:** 30+ collections or when tooling becomes cluttered

---

### ❌ NOT RECOMMENDED: Multiple Databases

**Why not now:**
1. **MongoDB doesn't support hierarchical databases** - Can't have "Games → Goals" structure
2. **Cross-database queries are impossible** - Would need to fetch from multiple databases and join in application
3. **No transactions across databases** - ACID only works within single database
4. **Complexity outweighs benefits** - Current scale doesn't justify the overhead

**When to consider:**
- True multi-tenancy requirements (each team completely isolated)
- Regulatory/compliance requirements (data must be separated)
- Massive scale (100+ collections, TBs of data)
- Microservices architecture (different services need different databases)

**Your current state:** None of these apply ✅

---

## Indexing Strategy

### Critical Indexes (Already Implemented)

```javascript
// Goals
Goals.index({ gameId: 1, goalNumber: 1 })      // Game queries
Goals.index({ gameId: 1, minute: 1 })          // Timeline
Goals.index({ scorerId: 1 })                   // Player stats
Goals.index({ assistedById: 1 })                // Assist stats

// Substitutions
Substitutions.index({ gameId: 1, minute: 1 })  // Timeline
Substitutions.index({ playerOutId: 1 })         // Rotation analysis
Substitutions.index({ playerInId: 1 })         // Substitute impact

// Cards
Card.index({ gameId: 1, minute: 1 })  // Timeline order
Card.index({ gameId: 1, playerId: 1 })  // Player cards per game
Card.index({ playerId: 1, cardType: 1 }) // Card statistics

// Player Match Stats
PlayerMatchStat.index({ gameId: 1, playerId: 1 }, { unique: true })  // Unique per player per game

// Games
Games.index({ status: 1 })                     // Status filtering
Games.index({ date: 1 })                       // Chronological queries
Games.index({ team: 1 })                       // Team filtering
Games.index({ status: 1, lineupDraft: 1 })     // Draft queries for Scheduled games
Games.index({ status: 1, reportDraft: 1 })     // Draft queries for Played games

// Jobs
Jobs.index({ status: 1, runAt: 1 })            // Efficient job polling
Jobs.index({ jobType: 1, status: 1 })          // Job type queries
Jobs.index({ completedAt: 1 })                 // TTL index (auto-cleanup)
```

### Index Performance Monitoring

**Monitor:**
- Query execution time (should be < 100ms for indexed queries)
- Index usage statistics (ensure indexes are being used)
- Collection size growth (watch for collections growing disproportionately)

**Action thresholds:**
- Query time > 500ms: Investigate index strategy
- Collection > 1M documents: Consider sharding
- Index size > 50% of collection: Review index strategy

---

## Data Growth Projections

### Current Estimates (Per Season)

| Collection | Documents/Season | Growth Rate |
|------------|------------------|-------------|
| games | 30-50 | Low |
| goals | 100-250 | High (4-5 per game) |
| substitutions | 90-150 | High (3-5 per game) |
| cards | 30-90 | Moderate (1-3 per game) |
| playermatchstats | 30-90 | Moderate (11-18 per game) |
| game_reports | 30-50 | Low (1 per game) |
| jobs | 100-200 | Moderate (auto-expires after 30 days) |
| gamerosters | 330-900 | High (11-18 per game) |
| players | 20-30 | Low (adds players) |
| drills | 10-20 | Low (adds drills) |
| sessiondrills | 200-400 | Moderate (multiple per session) |
| trainingsessions | 50-100 | Moderate |

### Scaling Considerations

**Current capacity:** Well within MongoDB's limits  
**MongoDB limits:**
- Collections per database: 10,000+ (we have 16)
- Documents per collection: Billions (we have thousands)
- Database size: TBs (we have MBs)

**No scaling concerns expected in next 2-3 years** ✅

---

## Migration Strategy (If Needed in Future)

### Scenario 1: Adding Collection Name Prefixes

**When:** 30+ collections or organizational clarity needed

**Steps:**
1. Create migration script to rename collections
2. Update all model references in code
3. Update API queries
4. Test thoroughly
5. Deploy during maintenance window

**Example Migration Script:**
```javascript
// Migration: Add prefixes to collections
async function addCollectionPrefixes() {
  const collections = [
    { old: 'goals', new: 'event_goals' },
    { old: 'substitutions', new: 'event_substitutions' },
    // ... etc
  ];
  
  for (const { old, new: newName } of collections) {
    await db.collection(old).rename(newName);
    console.log(`Renamed ${old} → ${newName}`);
  }
}
```

---

### Scenario 2: Splitting into Multiple Databases (Future - Not Recommended Now)

**When:** Only if hitting true multi-tenancy or regulatory requirements

**Considerations:**
- Cross-database queries become impossible
- Need to fetch from multiple databases and join in application
- No transaction support across databases
- More complex connection management
- Separate backups/restores

**Architecture:**
```
squadup_core (database)
  - users, teams, players

squadup_matches (database)
  - games, goals, substitutions, cards, game_reports, gamerosters, formations, playermatchstats

squadup_training (database)
  - drills, sessiondrills, trainingsessions

squadup_analysis (database)
  - scout_reports, timeline_events

squadup_system (database)
  - jobs
```

**When to implement:** Only if:
- Moving to microservices architecture
- Different scaling needs per domain
- 50,000+ users
- 100+ collections
- Regulatory requirements

---

## Performance Optimization

### Current Performance Status

✅ **All good:** No performance issues identified

### Optimization Strategies (If Needed)

1. **Query Optimization:**
   - Use `.lean()` for read-only queries (returns plain JS objects, faster)
   - Use `.select()` to limit fields returned
   - Use aggregation pipelines for complex queries

2. **Caching Strategy:**
   ```javascript
   // Cache organization config (rarely changes)
   Redis: org_config:{orgId} 
   TTL: 1 hour
   
   // Cache player partnerships (expensive query)
   Redis: partnerships:{teamId}:{season}
   TTL: 6 hours, invalidate on new goal
   ```

3. **Index Optimization:**
   - Monitor index usage with `explain()`
   - Remove unused indexes
   - Add compound indexes for common query patterns

4. **Sharding (Future):**
   - Only if collection exceeds millions of documents
   - Shard by gameId or teamId
   - Requires careful planning

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Collection Sizes:**
   - Monitor document count growth
   - Watch for collections growing disproportionately

2. **Query Performance:**
   - Track slow queries (> 100ms)
   - Monitor index usage

3. **Index Sizes:**
   - Ensure indexes don't exceed 50% of collection size
   - Review unused indexes

4. **Connection Pool:**
   - Monitor active connections
   - Ensure pool size is appropriate

### Maintenance Tasks

**Daily:**
- Monitor slow query logs
- Check database health

**Weekly:**
- Review collection growth
- Check index usage statistics

**Monthly:**
- Review query patterns
- Optimize slow queries
- Consider new indexes if needed

**Quarterly:**
- Re-evaluate architecture
- Consider naming conventions if collection count grows
- Review scaling projections

---

## Decision Matrix

| Scenario | Recommended Approach | When |
|----------|---------------------|------|
| 16 collections (current) | ✅ Single database | Now |
| 30+ collections | ✅ Single database + naming conventions | Future |
| 50+ collections | ⚠️ Consider documenting logical groups | Future |
| 100+ collections | ⚠️ Re-evaluate splitting | Future |
| Multi-tenancy needed | ⚠️ Multiple databases | If required |
| Microservices architecture | ⚠️ Multiple databases | If moving to microservices |
| Performance issues | ✅ Optimize indexes/queries | If occurs |
| Regulatory requirements | ⚠️ Multiple databases | If required |

---

## Best Practices

### ✅ DO

- **Keep related data together** (goals, substitutions in same database)
- **Use compound indexes** for common query patterns
- **Monitor query performance** regularly
- **Document logical groupings** (this document)
- **Use discriminators** for type safety (like Goal model)
- **Plan for growth** but don't over-engineer

### ❌ DON'T

- **Don't split databases prematurely** (creates complexity)
- **Don't create indexes blindly** (monitor usage first)
- **Don't embed large arrays** (16MB document limit)
- **Don't ignore slow queries** (optimize early)
- **Don't change architecture** without clear justification

---

## Future Considerations

### When to Re-evaluate Architecture

**Triggers:**
1. Collection count reaches **30+**
2. Query performance degrades (> 500ms consistently)
3. Database size exceeds **10GB**
4. Any collection exceeds **1M documents**
5. Cross-collection queries become bottleneck
6. Moving to microservices architecture

**Process:**
1. Measure current performance
2. Identify bottlenecks
3. Consider alternatives
4. Test solutions
5. Document changes

---

## Summary

### Current State ✅
- **Architecture:** Single MongoDB database
- **Collections:** 16 (well within limits)
- **Performance:** Good (no issues identified)
- **Recommendation:** Keep as-is

### Future Plans 📋
- **Short-term (3-6 months):** Monitor growth, document patterns
- **Medium-term (6-12 months):** Consider naming conventions if collection count grows
- **Long-term (12+ months):** Re-evaluate if hitting scale thresholds

### Key Takeaways
1. ✅ **Current structure is correct** - MongoDB best practice
2. ✅ **No changes needed** - 16 collections is perfectly manageable
3. ✅ **Focus on optimization** - Indexes and queries, not architecture
4. ✅ **Document logical groupings** - This document serves that purpose
5. ⚠️ **Don't split prematurely** - Complexity without benefits
6. ✅ **Draft system implemented** - `lineupDraft` and `reportDraft` fields in Game model
7. ✅ **Job queue system** - Background processing for calculations via `jobs` collection

---

**Document Status:** Reference - Updated December 2024  
**Last Reviewed:** December 2024  
**Next Review:** When collection count reaches 25+

**Recent Updates:**
- Added `organization_configs` collection documentation (System Domain)
- Added all 4 features to age group overrides for maximum flexibility
- Added `jobs` collection documentation (System Domain)
- Added `lineupDraft` and `reportDraft` fields to Game model
- Added `matchDuration`, `totalMatchDuration`, and `matchType` fields to Game model
- Updated collection count from 16 to 17
- Corrected collection names (game_reports, scout_reports, timeline_events use explicit names)

---

## Appendix: Collection Relationships Diagram

```
users ──┐
        ├──→ teams ──→ players
        │
games ──┼──→ goals (TeamGoal, OpponentGoal)
        ├──→ substitutions
        ├──→ cards
        ├──→ playermatchstats
        ├──→ game_reports
        ├──→ gamerosters
        └──→ formations
        │
        ├──→ lineupDraft (embedded in games - Scheduled games)
        └──→ reportDraft (embedded in games - Played games)

drills ──→ sessiondrills ──→ trainingsessions

players ──→ timeline_events
players ──→ scout_reports

jobs (standalone - background processing)
organization_configs (standalone - feature configuration)
```

**Legend:**
- `──→` = References (ObjectId)
- `├──→` = Multiple references
- Parentheses = Discriminators

---

**Related Documentation:**
- `docs/ENHANCED_MATCH_EVENT_TRACKING_SPEC.md` - Match event tracking system
- `backend/src/models/` - All Mongoose model definitions

