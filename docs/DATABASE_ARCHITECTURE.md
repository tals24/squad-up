# Database Architecture Documentation

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** Reference Document (No changes required at this time)

---

## Executive Summary

This document outlines the current database architecture for the SquadUp application, provides recommendations for organization and scalability, and defines when to consider architectural changes.

**Current State:** Single MongoDB database with 15 collections  
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
│   └── disciplinaryactions
│
├── Match Data Domain (3 collections)
│   ├── gamereports
│   ├── gamerosters
│   └── formations
│
├── Training Domain (3 collections)
│   ├── drills
│   ├── sessiondrills
│   └── trainingsessions
│
└── Analysis Domain (2 collections)
    ├── scoutreports
    └── timelineevents
```

**Total Collections:** 15

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

#### `disciplinaryactions`
**Purpose:** Cards and disciplinary events  
**Relationships:**
- References `games` (gameId)
- References `players` (playerId)

**Size:** Small-Medium (typically 100-500 documents per season)  
**Growth:** Moderate (adds 1-3 cards per game)  
**Indexes:**
- `{ gameId: 1, playerId: 1 }` - Game-level queries
- `{ playerId: 1, cardType: 1 }` - Card statistics

---

### Match Data Domain

#### `gamereports`
**Purpose:** Post-match reports and summaries  
**Relationships:** References `games` (gameId), `players` (player reports)  
**Size:** Medium (typically 100-1000 documents)  
**Growth:** Moderate (one per game)

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

#### `scoutreports`
**Purpose:** Scouting data and analysis  
**Relationships:** References `players`, `games`  
**Size:** Small (typically < 1000 documents)  
**Growth:** Slow (adds reports as needed)

#### `timelineevents`
**Purpose:** Player timeline/history events  
**Relationships:** References `players` (playerId)  
**Size:** Medium (typically 500-5000 documents)  
**Growth:** Moderate (adds events per player)

---

## Query Patterns Analysis

### Common Query Patterns

1. **Game Details Page:**
   ```javascript
   // Needs: game + goals + substitutions + disciplinary actions
   Game.findById(gameId)
   Goal.find({ gameId })
   Substitution.find({ gameId })
   DisciplinaryAction.find({ gameId })
   ```
   **Impact:** Cross-collection queries (needs single database)

2. **Player Statistics:**
   ```javascript
   // Needs: player + goals + disciplinary actions across games
   Player.findById(playerId)
   Goal.find({ scorerId: playerId })
   Goal.find({ assistedById: playerId })
   DisciplinaryAction.find({ playerId })
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
gamereports → match_reports
gamerosters → match_rosters
formations → match_formations
drills → training_drills
sessiondrills → training_sessiondrills
trainingsessions → training_sessions
scoutreports → analysis_scoutreports
timelineevents → analysis_timelineevents
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

// Disciplinary Actions
DisciplinaryActions.index({ gameId: 1, playerId: 1 })  // Game queries
DisciplinaryActions.index({ playerId: 1, cardType: 1 }) // Card stats

// Games
Games.index({ status: 1 })                     // Status filtering
Games.index({ date: 1 })                       // Chronological queries
Games.index({ team: 1 })                      // Team filtering
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
| disciplinaryactions | 30-90 | Moderate (1-3 per game) |
| gamereports | 30-50 | Low (1 per game) |
| gamerosters | 330-900 | High (11-18 per game) |
| players | 20-30 | Low (adds players) |
| drills | 10-20 | Low (adds drills) |
| sessiondrills | 200-400 | Moderate (multiple per session) |
| trainingsessions | 50-100 | Moderate |

### Scaling Considerations

**Current capacity:** Well within MongoDB's limits  
**MongoDB limits:**
- Collections per database: 10,000+ (we have 15)
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
  - games, goals, substitutions, disciplinaryactions, gamereports, gamerosters, formations

squadup_training (database)
  - drills, sessiondrills, trainingsessions

squadup_analysis (database)
  - scoutreports, timelineevents
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
| 15 collections (current) | ✅ Single database | Now |
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
- **Collections:** 15 (well within limits)
- **Performance:** Good (no issues identified)
- **Recommendation:** Keep as-is

### Future Plans 📋
- **Short-term (3-6 months):** Monitor growth, document patterns
- **Medium-term (6-12 months):** Consider naming conventions if collection count grows
- **Long-term (12+ months):** Re-evaluate if hitting scale thresholds

### Key Takeaways
1. ✅ **Current structure is correct** - MongoDB best practice
2. ✅ **No changes needed** - 15 collections is perfectly manageable
3. ✅ **Focus on optimization** - Indexes and queries, not architecture
4. ✅ **Document logical groupings** - This document serves that purpose
5. ⚠️ **Don't split prematurely** - Complexity without benefits

---

**Document Status:** Reference - No changes required  
**Last Reviewed:** December 2024  
**Next Review:** When collection count reaches 25+

---

## Appendix: Collection Relationships Diagram

```
users ──┐
        ├──→ teams ──→ players
        │
games ──┼──→ goals (TeamGoal, OpponentGoal)
        ├──→ substitutions
        ├──→ disciplinaryactions
        ├──→ gamereports
        ├──→ gamerosters
        └──→ formations

drills ──→ sessiondrills ──→ trainingsessions

players ──→ timelineevents
players ──→ scoutreports
```

**Legend:**
- `──→` = References (ObjectId)
- `├──→` = Multiple references
- Parentheses = Discriminators

---

**Related Documentation:**
- `docs/ENHANCED_MATCH_EVENT_TRACKING_SPEC.md` - Match event tracking system
- `backend/src/models/` - All Mongoose model definitions

