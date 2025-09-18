# SquadUp Mock Data Summary

## 🎉 Mock Data Successfully Generated!

The mock data generation script has created a comprehensive dataset for testing and development purposes.

## 📊 Generated Data Summary

### **Teams (3 total)**
1. **Eagles FC** - Premier Division, 2024/2025 season
2. **Tigers United** - Championship Division, 2024/2025 season  
3. **Wolves Academy** - Youth Division, 2024/2025 season

### **Coaches (3 total)**
Each team has a dedicated coach with login credentials:

| Coach Name | Email | Team | Division |
|------------|-------|------|----------|
| John Martinez | coach1@squadup.com | Eagles FC | Premier Division |
| Sarah Thompson | coach2@squadup.com | Tigers United | Championship Division |
| Mike Rodriguez | coach3@squadup.com | Wolves Academy | Youth Division |

### **Players (66 total - 22 per team)**
Each team has a realistic squad composition:
- **3 Goalkeepers**
- **7 Defenders** (5 center-backs, 2 wing-backs)
- **8 Midfielders** (various positions)
- **4 Forwards/Strikers**

Player details include:
- Realistic names and kit numbers (1-99)
- Various birth dates (ages 16-35)
- Position-specific distribution
- Profile images (avatar URLs)
- Contact information

### **Games (30 total - 10 per team)**
Each team has 10 games with varied statuses:
- **Minimum 3 finished games** per team (ensuring game reports)
- **Games spread across season** (August 2024 - May 2025)
- **Realistic scores** for finished games
- **Various statuses**: Scheduled, Played, Done, Postponed
- **Opponent teams** from a pool of 20 different clubs
- **Match summaries** for finished games (defense, midfield, attack, general)

### **Game Rosters (660 total)**
For each game:
- **11 Starting lineup players**
- **7 Bench players** 
- **4 Not in squad players**
- Complete roster tracking for all 30 games

### **Scout Reports (330 total - 5 per player)**
Each player has 5 scout reports covering:
- **Technical Skills Assessment**
- **Physical Assessment**
- **Tactical Understanding**
- **Mental Attributes**
- **Match Performance**

Reports include:
- Ratings (2-5 scale)
- Detailed notes from various assessment categories
- Dates spread over the last 90 days
- Authored by respective team coaches

### **Game Reports (125 total)**
For finished games, performance reports for players who participated:
- **Minutes played** (realistic distribution)
- **Goals and assists** (realistic football statistics)
- **Performance ratings** (2-5 scale)
- **Match-specific notes**
- Only for players in starting lineup or who came from bench

### **Training Drills (15 total)**
5 different drill types for each coach:
- **Passing Accuracy** (Technical)
- **Shooting Practice** (Technical)
- **Defensive Shape** (Tactical)
- **Sprint Intervals** (Physical)
- **Ball Control** (Technical)

## 🚀 Usage Instructions

### **Running the Application**

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Application:**
   ```bash
   npm run dev
   ```

### **Login Credentials**

You can log in as any of the coaches using Firebase Auth:
- **coach1@squadup.com** (Eagles FC)
- **coach2@squadup.com** (Tigers United)  
- **coach3@squadup.com** (Wolves Academy)

*Note: You'll need to create these users in Firebase Auth or use the existing authentication system.*

### **Regenerating Mock Data**

To regenerate the mock data (this will clear existing data):

```bash
cd backend
node scripts/generateMockData.js
```

**⚠️ Warning**: This will delete all existing teams, players, games, and reports data.

## 🔍 Data Validation

The generated data includes:

✅ **Realistic Football Data**
- Proper position distribution
- Realistic game scores and statistics
- Age-appropriate player profiles
- Season-appropriate game scheduling

✅ **Relationship Integrity**
- All foreign key relationships maintained
- Game rosters linked to actual games and players
- Reports linked to correct players, games, and coaches
- Team hierarchies properly established

✅ **Business Logic Compliance**
- Kit numbers unique within teams
- Game dates spread across season
- Minimum finished games requirement met
- Scout reports separate from game reports

## 📈 Expected Performance

With this dataset, you can test:
- **Large list rendering** (66 players across teams)
- **Complex filtering** (by team, position, status)
- **Report generation** (450+ total reports)
- **Game management** (30 games with various statuses)
- **User role permissions** (coach-specific data access)

## 🔄 Data Relationships

```
User (Coach) ──┬─── Team ──┬─── Player ───┬─── TimelineEvent (Scout Reports)
               │           │              └─── GameRoster
               │           └─── Game ─────┬─── GameRoster  
               │                          └─── TimelineEvent (Game Reports)
               └─── Drill
```

The mock data maintains all these relationships and provides a realistic testing environment for the SquadUp application.

---

**Generated on**: ${new Date().toISOString()}
**Script Location**: `backend/scripts/generateMockData.js`
