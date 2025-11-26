# SquadUp API Documentation

## 🚀 Overview

This document provides comprehensive documentation for all available APIs in the SquadUp football management system. The API uses **JWT (JSON Web Token) authentication** and follows RESTful principles.

**Base URL**: `http://localhost:3001/api`

**Health Check**: `GET http://localhost:3001/health` (No authentication required)

---

## 🔐 Authentication

All API endpoints (except login/register) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### JWT Token Structure
- **Expires**: 24 hours
- **Contains**: `userId`, `email`, `role`

---

## 📚 API Endpoints

### 🔑 Authentication Routes (`/api/auth`)

#### **POST** `/api/auth/login`
**Purpose**: User login with email/password  
**Authentication**: None required  
**Body**:
```json
{
  "email": "coach@squadup.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "fullName": "John Coach",
    "email": "coach@squadup.com",
    "role": "Coach"
  }
}
```

#### **POST** `/api/auth/register`
**Purpose**: Register new user (Admin use)  
**Authentication**: None required  
**Body**:
```json
{
  "FullName": "New User",
  "Email": "newuser@squadup.com",
  "Role": "Coach",
  "PhoneNumber": "+1234567890",
  "Department": "Youth Division",
  "Password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "New User has been added to the system successfully!",
  "user": { /* user object without password */ }
}
```

#### **POST** `/api/auth/verify`
**Purpose**: Verify JWT token and get user info  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "user": { /* current user object */ }
}
```

#### **GET** `/api/auth/me`
**Purpose**: Get current user information  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "user": { /* current user object */ }
}
```

#### **PUT** `/api/auth/profile`
**Purpose**: Update user profile  
**Authentication**: Required  
**Body**:
```json
{
  "fullName": "Updated Name",
  "phoneNumber": "+1234567890",
  "department": "Senior Division"
}
```

---

### 👥 User Management (`/api/users`)

#### **GET** `/api/users`
**Purpose**: Get all users  
**Authentication**: Required  
**Roles**: Admin, Department Manager  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "John Coach",
      "email": "coach@squadup.com",
      "role": "Coach",
      "department": "Youth Division",
      "phoneNumber": "+1234567890"
    }
  ]
}
```

#### **GET** `/api/users/:id`
**Purpose**: Get user by ID  
**Authentication**: Required  

#### **POST** `/api/users`
**Purpose**: Create new user  
**Authentication**: Required  
**Roles**: Admin only  

#### **PUT** `/api/users/:id`
**Purpose**: Update user  
**Authentication**: Required  
**Roles**: Admin only  

#### **DELETE** `/api/users/:id`
**Purpose**: Delete user  
**Authentication**: Required  
**Roles**: Admin only  

---

### ⚽ Team Management (`/api/teams`)

#### **GET** `/api/teams`
**Purpose**: Get all teams (filtered by user role)  
**Authentication**: Required  
**Role Filtering**:
- **Coach**: Only teams they coach
- **Division Manager**: All teams in their division
- **Admin/Department Manager**: All teams

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "teamName": "Lions U16",
      "season": "2024/25",
      "division": "Youth Premier",
      "coach": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "fullName": "John Coach",
        "email": "coach@squadup.com",
        "role": "Coach"
      }
    }
  ]
}
```

#### **GET** `/api/teams/:id`
**Purpose**: Get team by ID  
**Authentication**: Required + team access check  

#### **POST** `/api/teams`
**Purpose**: Create new team  
**Authentication**: Required  
**Roles**: Admin, Department Manager  
**Body**:
```json
{
  "teamName": "Eagles U18",
  "season": "2024/25",
  "division": "Senior Premier",
  "coach": "60f7b3b3b3b3b3b3b3b3b3b3",
  "divisionManager": "60f7b3b3b3b3b3b3b3b3b3b4",
  "departmentManager": "60f7b3b3b3b3b3b3b3b3b3b5"
}
```

#### **PUT** `/api/teams/:id`
**Purpose**: Update team  
**Authentication**: Required + team access check  

#### **DELETE** `/api/teams/:id`
**Purpose**: Delete team  
**Authentication**: Required  
**Roles**: Admin, Department Manager  

---

### 🏃‍♂️ Player Management (`/api/players`)

#### **GET** `/api/players`
**Purpose**: Get all players (filtered by user's teams)  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "fullName": "Mohamed Salah",
      "kitNumber": 11,
      "position": "Forward",
      "dateOfBirth": "1992-06-15",
      "nationalID": "12345678901",
      "phoneNumber": "+1234567890",
      "email": "salah@squadup.com",
      "team": {
        "id": "60f7b3b3b3b3b3b3b3b3b3b3",
        "teamName": "Lions U16",
        "season": "2024/25",
        "division": "Youth Premier"
      }
    }
  ]
}
```

#### **GET** `/api/players/:id`
**Purpose**: Get player by ID  
**Authentication**: Required + team access check  

#### **POST** `/api/players`
**Purpose**: Create new player  
**Authentication**: Required  
**Body**:
```json
{
  "fullName": "New Player",
  "kitNumber": 10,
  "position": "Midfielder",
  "dateOfBirth": "2005-03-20",
  "team": "60f7b3b3b3b3b3b3b3b3b3b3",
  "nationalID": "12345678901",
  "phoneNumber": "+1234567890",
  "email": "player@squadup.com"
}
```

#### **PUT** `/api/players/:id`
**Purpose**: Update player  
**Authentication**: Required + team access check  

#### **DELETE** `/api/players/:id`
**Purpose**: Delete player  
**Authentication**: Required + team access check  

---

### 🏆 Game Management (`/api/games`)

#### **GET** `/api/games`
**Purpose**: Get all games (filtered by user's teams)  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "team": { /* team object */ },
      "season": "2024/25",
      "teamName": "Lions U16",
      "opponent": "Tigers FC",
      "date": "2024-12-25T15:00:00.000Z",
      "location": "Central Stadium",
      "status": "Scheduled",
      "ourScore": 0,
      "opponentScore": 0
    }
  ]
}
```

#### **GET** `/api/games/:id`
**Purpose**: Get game by ID  
**Authentication**: Required + team access check  

#### **POST** `/api/games`
**Purpose**: Create new game  
**Authentication**: Required  
**Body**:
```json
{
  "team": "60f7b3b3b3b3b3b3b3b3b3b3",
  "opponent": "Arsenal FC",
  "date": "2024-12-30T15:00:00.000Z",
  "location": "Emirates Stadium",
  "status": "Scheduled"
}
```

#### **PUT** `/api/games/:id`
**Purpose**: Update game (including scores and summaries)  
**Authentication**: Required + team access check  
**Body**:
```json
{
  "status": "Completed",
  "ourScore": 2,
  "opponentScore": 1,
  "defenseSummary": "Solid defensive performance",
  "midfieldSummary": "Controlled midfield well",
  "attackSummary": "Clinical finishing",
  "generalSummary": "Great team performance"
}
```

#### **DELETE** `/api/games/:id`
**Purpose**: Delete game  
**Authentication**: Required + team access check  

#### **PUT** `/api/games/:gameId/draft`
**Purpose**: Save draft data (autosave) - polymorphic endpoint  
**Authentication**: Required + game access check  
**Behavior**:
- **Scheduled games**: Saves to `lineupDraft` (rosters, formation, formationType)
- **Played games**: Saves to `reportDraft` (teamSummary, finalScore, matchDuration, playerReports, playerMatchStats)
- **Other statuses**: Rejected with error

**Body (Scheduled game)**:
```json
{
  "rosters": { "playerId1": "Starting Lineup", "playerId2": "Bench" },
  "formation": { "gk": { "_id": "playerId1" }, "cb1": { "_id": "playerId2" } },
  "formationType": "1-4-4-2"
}
```

**Body (Played game)**:
```json
{
  "teamSummary": {
    "defenseSummary": "Solid defense",
    "midfieldSummary": "Controlled midfield",
    "attackSummary": "Clinical finishing",
    "generalSummary": "Great performance"
  },
  "finalScore": { "ourScore": 2, "opponentScore": 1 },
  "matchDuration": {
    "regularTime": 90,
    "firstHalfExtraTime": 0,
    "secondHalfExtraTime": 0
  },
  "playerReports": { "playerId": { "rating": 4, "notes": "..." } },
  "playerMatchStats": {
    "playerId": {
      "foulsCommitted": "1-2",
      "foulsReceived": "0"
    }
  }
}
```
**Note**: All fields are optional. The endpoint merges provided fields with existing draft data. `playerMatchStats` stores fouls data (as strings: '0', '1-2', '3-4', '5+') and is saved to `PlayerMatchStat` collection when game is finalized.

**Response**:
```json
{
  "success": true,
  "message": "Draft saved successfully",
  "data": {
    "gameId": "...",
    "draftSaved": true
  }
}
```

#### **POST** `/api/games/:gameId/start-game`
**Purpose**: Start a game (transition from Scheduled to Played) with lineup validation  
**Authentication**: Required + game access check  
**Body**:
```json
{
  "rosters": [
    { "playerId": "...", "status": "Starting Lineup", "position": "gk" },
    { "playerId": "...", "status": "Starting Lineup", "position": "cb1" }
  ]
}
```
**Validation**: 
- Requires exactly 11 players in Starting Lineup
- Requires at least 1 goalkeeper
- Warns if bench has fewer than 7 players
**Response**:
```json
{
  "success": true,
  "data": {
    "game": { /* updated game object */ },
    "rosters": [ /* created roster objects */ ]
  }
}
```

#### **GET** `/api/games/:gameId/player-stats`
**Purpose**: Get consolidated player statistics (minutes, goals, assists) for all players in a game  
**Authentication**: Required + game access check  
**Note**: Only available for games with status "Played". Optimized for pre-fetching - returns all stats in one request.  
**Response**:
```json
{
  "success": true,
  "gameId": "...",
  "playerStats": {
    "playerId1": { "minutes": 90, "goals": 2, "assists": 1 },
    "playerId2": { "minutes": 65, "goals": 0, "assists": 1 },
    "playerId3": { "minutes": 25, "goals": 0, "assists": 0 }
  },
  "metadata": {
    "totalPlayers": 3,
    "playersWithMinutes": 3,
    "playersWithGoalsAssists": 2
  }
}
```
**Note**: Minutes are calculated from substitutions and red cards. Goals and assists are calculated from the Goals collection. This endpoint runs both calculations in parallel for efficiency.

---

### ⚽ Game Events (`/api/games/:gameId/...`)

#### **Goals** (`/api/games/:gameId/goals`)

##### **GET** `/api/games/:gameId/goals`
**Purpose**: Get all goals for a game  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "totalGoals": 3,
  "goals": [
    {
      "_id": "...",
      "gameId": "...",
      "minute": 23,
      "scorerId": { "fullName": "Player Name", "kitNumber": 10 },
      "assistedById": { "fullName": "Assister Name", "kitNumber": 7 },
      "goalType": "open-play",
      "goalNumber": 1,
      "matchState": "drawing"
    }
  ]
}
```

##### **POST** `/api/games/:gameId/goals`
**Purpose**: Create a new goal  
**Authentication**: Required + game access check  
**Body**:
```json
{
  "minute": 23,
  "scorerId": "playerId",
  "assistedById": "playerId", // optional
  "goalType": "open-play", // open-play, penalty, free-kick, corner, own-goal
  "isOpponentGoal": false, // true for opponent goals
  "goalInvolvement": [ // optional
    { "playerId": "...", "role": "key-pass" }
  ]
}
```

##### **PUT** `/api/games/:gameId/goals/:goalId`
**Purpose**: Update an existing goal  
**Authentication**: Required + game access check  

##### **DELETE** `/api/games/:gameId/goals/:goalId`
**Purpose**: Delete a goal  
**Authentication**: Required + game access check  

#### **Substitutions** (`/api/games/:gameId/substitutions`)

##### **GET** `/api/games/:gameId/substitutions`
**Purpose**: Get all substitutions for a game  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "totalSubstitutions": 3,
  "substitutions": [
    {
      "_id": "...",
      "gameId": "...",
      "playerOutId": { "fullName": "Player Out", "kitNumber": 10 },
      "playerInId": { "fullName": "Player In", "kitNumber": 7 },
      "minute": 65,
      "reason": "tactical", // tactical, injury, fatigue, tactical-injury
      "matchState": "winning", // winning, drawing, losing
      "tacticalNote": "Bringing fresh legs"
    }
  ]
}
```

##### **POST** `/api/games/:gameId/substitutions`
**Purpose**: Create a new substitution  
**Authentication**: Required + game access check  
**Body**:
```json
{
  "playerOutId": "playerId",
  "playerInId": "playerId",
  "minute": 65,
  "reason": "tactical",
  "matchState": "winning",
  "tacticalNote": "Bringing fresh legs"
}
```

##### **PUT** `/api/games/:gameId/substitutions/:subId`
**Purpose**: Update an existing substitution  
**Authentication**: Required + game access check  

##### **DELETE** `/api/games/:gameId/substitutions/:subId`
**Purpose**: Delete a substitution  
**Authentication**: Required + game access check  

#### **Cards** (`/api/games/:gameId/cards`)

**Purpose**: Manage disciplinary cards (Yellow, Red, Second Yellow) for match timeline events  
**Note**: Red cards and second yellows trigger automatic `recalc-minutes` job

##### **GET** `/api/games/:gameId/cards`
**Purpose**: Get all cards for a game  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "totalCards": 3,
  "cards": [
    {
      "_id": "...",
      "gameId": "...",
      "playerId": {
        "_id": "...",
        "fullName": "Player Name",
        "kitNumber": 5,
        "position": "MF"
      },
      "cardType": "yellow", // yellow, red, second-yellow
      "minute": 45,
      "reason": "Unsporting behavior",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

##### **GET** `/api/games/:gameId/cards/player/:playerId`
**Purpose**: Get cards for a specific player in a game  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "playerId": "...",
  "totalCards": 1,
  "cards": [...]
}
```

##### **POST** `/api/games/:gameId/cards`
**Purpose**: Create a new card  
**Authentication**: Required + game access check  
**Body**:
```json
{
  "playerId": "playerId",
  "cardType": "yellow", // Required: yellow, red, or second-yellow
  "minute": 45, // Required: 1-120
  "reason": "Unsporting behavior" // Optional: max 200 characters
}
```
**Response**:
```json
{
  "message": "Card created successfully",
  "card": {
    "_id": "...",
    "gameId": "...",
    "playerId": {...},
    "cardType": "yellow",
    "minute": 45,
    "reason": "Unsporting behavior"
  }
}
```
**Note**: If `cardType` is `red` or `second-yellow`, a `recalc-minutes` job is automatically queued.

##### **PUT** `/api/games/:gameId/cards/:cardId`
**Purpose**: Update an existing card  
**Authentication**: Required + game access check  
**Body**: (All fields optional)
```json
{
  "playerId": "playerId",
  "cardType": "red",
  "minute": 60,
  "reason": "Serious foul play"
}
```
**Note**: If card type changes to/from red/second-yellow, `recalc-minutes` job is triggered.

##### **DELETE** `/api/games/:gameId/cards/:cardId`
**Purpose**: Delete a card  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "message": "Card deleted successfully",
  "cardId": "..."
}
```
**Note**: If deleted card was red/second-yellow, `recalc-minutes` job is triggered.

---

#### **Player Match Stats** (`/api/games/:gameId/player-match-stats`)

**Purpose**: Manage aggregate player statistics per game (Fouls, Shots, Passing, etc.)  
**Note**: Stats don't trigger recalc-minutes job. Uses upsert pattern (create or update).

##### **GET** `/api/games/:gameId/player-match-stats`
**Purpose**: Get all player match stats for a game  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "totalStats": 11,
  "stats": [
    {
      "_id": "...",
      "gameId": "...",
      "playerId": {
        "_id": "...",
        "fullName": "Player Name",
        "kitNumber": 5,
        "position": "MF"
      },
      "disciplinary": {
        "foulsCommitted": 3,
        "foulsReceived": 1
      },
      "shooting": {
        "shotsOnTarget": 0,
        "shotsOffTarget": 0,
        "blockedShots": 0,
        "hitWoodwork": 0
      },
      "passing": {
        "totalPasses": 0,
        "completedPasses": 0,
        "keyPasses": 0
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

##### **GET** `/api/games/:gameId/player-match-stats/player/:playerId`
**Purpose**: Get player match stats for a specific player in a game  
**Authentication**: Required + game access check  
**Response**: (Same structure as above, single stat object)
```json
{
  "gameId": "...",
  "playerId": "...",
  "stats": {...}
}
```
**Note**: Returns 404 if stats don't exist for this player-game combination.

##### **PUT** `/api/games/:gameId/player-match-stats/player/:playerId`
**Purpose**: Create or update player match stats (upsert)  
**Authentication**: Required + game access check  
**Body**: (All fields optional, only include what you want to update)
```json
{
  "disciplinary": {
    "foulsCommitted": 3,
    "foulsReceived": 1
  },
  "shooting": {
    "shotsOnTarget": 2,
    "shotsOffTarget": 1,
    "blockedShots": 0,
    "hitWoodwork": 0
  },
  "passing": {
    "totalPasses": 45,
    "completedPasses": 38,
    "keyPasses": 2
  }
}
```
**Response**:
```json
{
  "message": "Player match stats updated successfully",
  "stats": {...}
}
```
**Note**: Creates new document if doesn't exist, updates existing one if it does.

---

#### **Match Timeline** (`/api/games/:gameId/timeline`)

**Purpose**: Get unified chronological timeline of all match events (Cards, Goals, Substitutions)  
**Note**: This endpoint aggregates data from multiple collections and normalizes it into a single chronological stream.

##### **GET** `/api/games/:gameId/timeline`
**Purpose**: Get unified chronological timeline for a match  
**Authentication**: Required + game access check  
**Response**:
```json
{
  "gameId": "...",
  "totalEvents": 8,
  "timeline": [
    {
      "id": "...",
      "type": "goal",
      "minute": 15,
      "timestamp": "2024-01-15T10:15:00.000Z",
      "scorer": {
        "_id": "...",
        "fullName": "Player Name",
        "kitNumber": 9,
        "position": "ST"
      },
      "assister": {...},
      "goalType": "open-play",
      "goalNumber": 1,
      "matchState": "winning",
      "goalCategory": "TeamGoal"
    },
    {
      "id": "...",
      "type": "card",
      "minute": 20,
      "timestamp": "2024-01-15T10:20:00.000Z",
      "cardType": "yellow",
      "player": {
        "_id": "...",
        "fullName": "Player Name",
        "kitNumber": 5,
        "position": "MF"
      },
      "reason": "Unsporting behavior"
    },
    {
      "id": "...",
      "type": "substitution",
      "minute": 60,
      "timestamp": "2024-01-15T10:60:00.000Z",
      "playerOut": {...},
      "playerIn": {...},
      "reason": "tactical",
      "matchState": "winning",
      "tacticalNote": "Fresh legs"
    }
  ]
}
```
**Event Types**:
- `card`: Disciplinary card (yellow, red, second-yellow)
- `goal`: Team goal
- `opponent-goal`: Opponent goal
- `substitution`: Player substitution

**Sorting**: Events are sorted by `minute` (ascending), then by `timestamp` (ascending) for events at the same minute.

#### **Match Duration** (`/api/games/:gameId/...`)

##### **PUT** `/api/games/:gameId/match-duration`
**Purpose**: Update match duration (regular time + extra time)  
**Authentication**: Required  
**Body**:
```json
{
  "regularTime": 90,
  "firstHalfExtraTime": 3,
  "secondHalfExtraTime": 5
}
```
**Response**:
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
**Note**: Extra time values are validated (must be 0-15 minutes, non-negative). The `totalMatchDuration` field is automatically calculated and stored.

---

### 📊 Game Reports (`/api/game-reports`)

#### **GET** `/api/game-reports`
**Purpose**: Get all game reports  
**Authentication**: Required  

#### **GET** `/api/game-reports/game/:gameId`
**Purpose**: Get all game reports for a specific game  
**Authentication**: Required + game access check  

#### **GET** `/api/game-reports/:id`
**Purpose**: Get game report by ID  
**Authentication**: Required  

#### **POST** `/api/game-reports`
**Purpose**: Create new game report  
**Authentication**: Required  
**Body**:
```json
{
  "player": "playerId",
  "game": "gameId",
  "minutesPlayed": 90,
  "goals": 2,
  "assists": 1,
  "rating_physical": 4,
  "rating_technical": 5,
  "rating_tactical": 4,
  "rating_mental": 4,
  "notes": "Excellent performance"
}
```

#### **PUT** `/api/game-reports/:id`
**Purpose**: Update game report  
**Authentication**: Required  

#### **DELETE** `/api/game-reports/:id`
**Purpose**: Delete game report  
**Authentication**: Required  

#### **POST** `/api/game-reports/batch`
**Purpose**: Batch create/update game reports (for final submission)  
**Authentication**: Required + game access check  
**Note**: Server automatically calculates `minutesPlayed`, `goals`, and `assists` from game events. These fields are **forbidden** in the request body.  
**Body**:
```json
{
  "gameId": "gameId",
  "reports": [
    {
      "playerId": "playerId",
      "rating_physical": 4,
      "rating_technical": 5,
      "rating_tactical": 4,
      "rating_mental": 4,
      "notes": "Great game"
    }
  ]
}
```

---

### 📊 Timeline Events/Reports (`/api/timeline-events`)

#### **GET** `/api/timeline-events`
**Purpose**: Get all player reports/timeline events  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "player": {
        "fullName": "Mohamed Salah",
        "kitNumber": 11,
        "position": "Forward"
      },
      "game": {
        "gameTitle": "Lions vs Tigers",
        "opponent": "Tigers FC",
        "date": "2024-12-25T15:00:00.000Z"
      },
      "author": {
        "fullName": "John Coach",
        "role": "Coach"
      },
      "eventType": "Game Report",
      "minutesPlayed": 90,
      "goals": 2,
      "assists": 1,
      "generalRating": 4,
      "generalNotes": "Excellent performance"
    }
  ]
}
```

#### **POST** `/api/timeline-events`
**Purpose**: Create new player report  
**Authentication**: Required  
**Body**:
```json
{
  "player": "60f7b3b3b3b3b3b3b3b3b3b3",
  "game": "60f7b3b3b3b3b3b3b3b3b3b4",
  "eventType": "Game Report",
  "minutesPlayed": 90,
  "goals": 1,
  "assists": 2,
  "generalRating": 4,
  "generalNotes": "Great performance in midfield"
}
```

---

### 🏋️ Drill Management (`/api/drills`)

#### **GET** `/api/drills`
**Purpose**: Get all drills  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "drillName": "Passing Triangle",
      "description": "Improve passing accuracy",
      "category": "Passing",
      "targetAgeGroup": "U16",
      "videoLink": "https://youtube.com/watch?v=abc123",
      "author": {
        "fullName": "John Coach",
        "role": "Coach"
      },
      "duration": 15,
      "playersRequired": 6,
      "equipment": ["Cones", "Balls"]
    }
  ]
}
```

#### **POST** `/api/drills`
**Purpose**: Create new drill  
**Authentication**: Required  
**Body**:
```json
{
  "drillName": "Shooting Practice",
  "description": "Improve shooting technique",
  "category": "Finishing",
  "targetAgeGroup": "U18",
  "videoLink": "https://youtube.com/watch?v=xyz789",
  "instructions": "Set up cones in a line...",
  "duration": 20,
  "playersRequired": 8,
  "equipment": ["Balls", "Cones", "Goals"]
}
```

---

### 🎯 Training Session Management (`/api/training-sessions`)

#### **GET** `/api/training-sessions`
**Purpose**: Get all training sessions (filtered by user's teams)  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "date": "2024-12-20T18:00:00.000Z",
      "team": {
        "teamName": "Lions U16",
        "season": "2024/25",
        "division": "Youth Premier"
      },
      "teamName": "Lions U16",
      "status": "Completed",
      "weekIdentifier": "Week 15",
      "duration": 90,
      "location": "Training Ground A",
      "weather": "Sunny"
    }
  ]
}
```

#### **POST** `/api/training-sessions`
**Purpose**: Create new training session  
**Authentication**: Required  
**Body**:
```json
{
  "date": "2024-12-25T18:00:00.000Z",
  "team": "60f7b3b3b3b3b3b3b3b3b3b3",
  "status": "Planned",
  "weekIdentifier": "Week 16",
  "duration": 90,
  "location": "Training Ground B",
  "weather": "Cloudy",
  "notes": "Focus on set pieces"
}
```

---

### 🎨 Formation Management (`/api/formations`)

#### **GET** `/api/formations`
**Purpose**: Get all formations  
**Authentication**: Required  

#### **POST** `/api/formations`
**Purpose**: Create new formation  
**Authentication**: Required  
**Body**:
```json
{
  "formationName": "4-3-3 Attack",
  "gameSize": "11v11",
  "formationLayout": "4-3-3",
  "team": "60f7b3b3b3b3b3b3b3b3b3b3",
  "description": "Attacking formation with wingers",
  "isDefault": false
}
```

---

### 📋 Game Rosters (`/api/game-rosters`)

#### **GET** `/api/game-rosters`
**Purpose**: Get all game roster entries  
**Authentication**: Required  

#### **GET** `/api/game-rosters/game/:gameId`
**Purpose**: Get all rosters for a specific game  
**Authentication**: Required + game access check  

#### **GET** `/api/game-rosters/:id`
**Purpose**: Get roster entry by ID  
**Authentication**: Required  

#### **POST** `/api/game-rosters`
**Purpose**: Add player to game roster  
**Authentication**: Required  
**Body**:
```json
{
  "game": "60f7b3b3b3b3b3b3b3b3b3b3",
  "player": "60f7b3b3b3b3b3b3b3b3b3b4",
  "status": "Starting Lineup" // Starting Lineup, Bench, Not Selected
}
```

#### **PUT** `/api/game-rosters/:id`
**Purpose**: Update roster entry  
**Authentication**: Required  

#### **DELETE** `/api/game-rosters/:id`
**Purpose**: Delete roster entry  
**Authentication**: Required  

**Note**: For batch roster operations (e.g., starting a game with a full lineup), use `POST /api/games/:gameId/start-game` instead, which creates rosters atomically as part of the game start transaction.

---

### 🔗 Session Drills (`/api/session-drills`)

#### **GET** `/api/session-drills`
**Purpose**: Get all drills assigned to training sessions  
**Authentication**: Required  

#### **POST** `/api/session-drills`
**Purpose**: Add drill to training session  
**Authentication**: Required  
**Body**:
```json
{
  "trainingSession": "60f7b3b3b3b3b3b3b3b3b3b3",
  "drill": "60f7b3b3b3b3b3b3b3b3b3b4",
  "sessionPart": "Warm-up",
  "duration": 15,
  "order": 1,
  "notes": "Focus on first touch"
}
```

---

### 📊 Data Aggregation (`/api/data`)

#### **GET** `/api/data/all`
**Purpose**: Get all system data in one request (for dashboard)  
**Authentication**: Required  
**Response**: Returns all entities filtered by user role:
```json
{
  "success": true,
  "data": {
    "users": [...],
    "teams": [...],
    "players": [...],
    "games": [...],
    "reports": [...],
    "drills": [...],
    "gameRosters": [...],
    "trainingSessions": [...],
    "sessionDrills": [...]
  }
}
```

#### **POST** `/api/data/airtable-sync`
**Purpose**: Legacy Airtable sync endpoint (for backward compatibility)  
**Authentication**: Required  
**Body**:
```json
{
  "action": "fetch|fetchSingle|create|update|delete",
  "tableName": "Users|Teams|Players|Games|etc",
  "recordId": "optional-for-single-record-ops",
  "data": { /* record data for create/update */ }
}
```

---

### 📈 Analytics (`/api/analytics`)

#### **GET** `/api/analytics/goal-partnerships`
**Purpose**: Get goal partnerships (scorer-assister combinations)  
**Authentication**: Required  
**Query Parameters**:
- `teamId` (required): Team ID
- `season` (optional): Season filter (e.g., "2024")

**Response**:
```json
{
  "teamId": "...",
  "season": "2024",
  "totalPartnerships": 5,
  "partnerships": [
    {
      "scorer": { "id": "...", "name": "Player A", "position": "Forward" },
      "assister": { "id": "...", "name": "Player B", "position": "Midfielder" },
      "goals": 3,
      "gameCount": 2,
      "avgMinute": 45
    }
  ]
}
```

#### **GET** `/api/analytics/player-goals`
**Purpose**: Get goal statistics for a specific player  
**Authentication**: Required  
**Query Parameters**:
- `playerId` (required): Player ID
- `season` (optional): Season filter

**Response**:
```json
{
  "playerId": "...",
  "season": "2024",
  "goalsScored": 15,
  "assists": 8,
  "goalContributions": 23,
  "goalsByType": { "open-play": 10, "penalty": 5 },
  "goalsByMatchState": { "winning": 5, "drawing": 7, "losing": 3 },
  "averageGoalMinute": 52
}
```

#### **GET** `/api/analytics/player-substitutions`
**Purpose**: Get substitution patterns for a specific player  
**Authentication**: Required  
**Query Parameters**:
- `playerId` (required): Player ID
- `season` (optional): Season filter

**Response**:
```json
{
  "playerId": "...",
  "season": "2024",
  "totalSubstitutions": 10,
  "timesSubbedOff": 6,
  "timesComingOn": 4,
  "avgSubOffMinute": 70,
  "avgSubOnMinute": 65,
  "substitutionReasons": { "tactical": 4, "fatigue": 2 },
  "impactAsSubstitute": {
    "appearances": 4,
    "avgMinutesPlayed": 25
  }
}
```

#### **GET** `/api/analytics/team-discipline`
**Purpose**: Get team discipline statistics  
**Authentication**: Required  
**Query Parameters**:
- `teamId` (required): Team ID
- `season` (optional): Season filter

**Response**:
```json
{
  "teamId": "...",
  "season": "2024",
  "totalYellowCards": 25,
  "totalRedCards": 2,
  "totalSecondYellows": 1,
  "mostCardedPlayers": [
    {
      "player": { "id": "...", "name": "Player Name", "position": "Defender" },
      "yellowCards": 5,
      "redCards": 1,
      "totalCards": 6
    }
  ],
  "cardsByMinute": {
    "0-15": 2,
    "15-30": 5,
    "30-45": 8
  }
}
```

---

### ⚙️ Organization Configuration Routes (`/api/organizations`)

#### **GET** `/api/organizations/:orgId/config`
**Purpose**: Fetch organization feature configuration (global settings + age group overrides)  
**Authentication**: Required  
**Access**: All authenticated users  
**URL Parameters**:
- `orgId`: Organization ID (use `"default"` for single-org deployments)

**Response** (Existing Config):
```json
{
  "success": true,
  "data": {
    "_id": "674123abc456def789012345",
    "organizationId": null,
    "features": {
      "shotTrackingEnabled": false,
      "positionSpecificMetricsEnabled": false,
      "detailedDisciplinaryEnabled": true,
      "goalInvolvementEnabled": true
    },
    "ageGroupOverrides": [
      {
        "ageGroup": "U16+",
        "shotTrackingEnabled": true,
        "positionSpecificMetricsEnabled": true,
        "detailedDisciplinaryEnabled": true,
        "goalInvolvementEnabled": true
      },
      {
        "ageGroup": "U6-U8",
        "shotTrackingEnabled": false,
        "positionSpecificMetricsEnabled": false,
        "detailedDisciplinaryEnabled": false,
        "goalInvolvementEnabled": false
      }
    ],
    "createdAt": "2024-11-19T16:30:00.000Z",
    "updatedAt": "2024-11-19T18:45:00.000Z"
  }
}
```

**Response** (No Config - Returns Defaults):
```json
{
  "success": true,
  "data": {
    "_id": null,
    "organizationId": null,
    "features": {
      "shotTrackingEnabled": false,
      "positionSpecificMetricsEnabled": false,
      "detailedDisciplinaryEnabled": true,
      "goalInvolvementEnabled": true
    },
    "ageGroupOverrides": [],
    "isDefault": true,
    "createdAt": null,
    "updatedAt": null
  }
}
```

**Notes**:
- This endpoint **does not** auto-create a config if none exists (REST-compliant GET)
- Returns default values with `isDefault: true` flag when no config is found
- Age group overrides can include: `U6-U8`, `U8-U10`, `U10-U12`, `U12-U14`, `U14-U16`, `U16+`

---

#### **PUT** `/api/organizations/:orgId/config`
**Purpose**: Create or update organization feature configuration  
**Authentication**: Required  
**Access**: **Admin only**  
**URL Parameters**:
- `orgId`: Organization ID (use `"default"` for single-org deployments)

**Request Body**:
```json
{
  "features": {
    "shotTrackingEnabled": true,
    "positionSpecificMetricsEnabled": false,
    "detailedDisciplinaryEnabled": true,
    "goalInvolvementEnabled": true
  },
  "ageGroupOverrides": [
    {
      "ageGroup": "U16+",
      "shotTrackingEnabled": true,
      "positionSpecificMetricsEnabled": true,
      "detailedDisciplinaryEnabled": true,
      "goalInvolvementEnabled": true
    },
    {
      "ageGroup": "U6-U8",
      "shotTrackingEnabled": null,
      "positionSpecificMetricsEnabled": null,
      "detailedDisciplinaryEnabled": false,
      "goalInvolvementEnabled": false
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674123abc456def789012345",
    "organizationId": null,
    "features": {
      "shotTrackingEnabled": true,
      "positionSpecificMetricsEnabled": false,
      "detailedDisciplinaryEnabled": true,
      "goalInvolvementEnabled": true
    },
    "ageGroupOverrides": [
      {
        "ageGroup": "U16+",
        "shotTrackingEnabled": true,
        "positionSpecificMetricsEnabled": true,
        "detailedDisciplinaryEnabled": true,
        "goalInvolvementEnabled": true
      },
      {
        "ageGroup": "U6-U8",
        "shotTrackingEnabled": null,
        "positionSpecificMetricsEnabled": null,
        "detailedDisciplinaryEnabled": false,
        "goalInvolvementEnabled": false
      }
    ],
    "createdAt": "2024-11-19T16:30:00.000Z",
    "updatedAt": "2024-11-19T19:00:00.000Z"
  },
  "message": "Organization configuration updated successfully"
}
```

**Notes**:
- If no config exists, this endpoint creates one
- If a config exists, this endpoint updates it (partial updates supported)
- `null` values in age group overrides mean "use global default"
- Duplicate age groups within `ageGroupOverrides` are rejected with an error
- All 4 features can now be overridden per age group for maximum flexibility

---

#### **GET** `/api/organizations/:orgId/config/feature/:featureName`
**Purpose**: Check if a specific feature is enabled (with optional team-specific age group override resolution)  
**Authentication**: Required  
**Access**: All authenticated users  
**URL Parameters**:
- `orgId`: Organization ID (use `"default"` for single-org deployments)
- `featureName`: One of: `shotTrackingEnabled`, `positionSpecificMetricsEnabled`, `detailedDisciplinaryEnabled`, `goalInvolvementEnabled`

**Query Parameters**:
- `teamId` (optional): Team ID to check for age group overrides

**Response** (Global Setting):
```json
{
  "success": true,
  "data": {
    "enabled": true
  }
}
```

**Response** (With Age Group Override):
```json
{
  "success": true,
  "data": {
    "enabled": false
  }
}
```

**Priority Logic**:
1. If `teamId` is provided, infer the age group from the team name (e.g., "U14 Team A" → "U12-U14")
2. Check if an age group override exists for that age group
3. If override exists and the feature is not `null`, return the override value
4. Otherwise, return the global feature value

**Example Use Cases**:
- `GET /api/organizations/default/config/feature/shotTrackingEnabled` → Global setting
- `GET /api/organizations/default/config/feature/shotTrackingEnabled?teamId=60f7b3b...` → Checks age group override for that team

---

## 🔐 Role-Based Access Control

### User Roles:
- **Admin**: Full access to all resources
- **Department Manager**: Manage teams, players, users within department
- **Division Manager**: Manage teams and players within division
- **Coach**: Manage assigned teams and their players only

### Access Patterns:
- **Team Access**: Users can only access teams they're assigned to (as coach, division manager, etc.)
- **Player Access**: Through team access - users see players from their teams
- **Game Access**: Through team access - users see games for their teams
- **Reports Access**: Can create reports for players in their teams

---

## 🚨 Error Handling

### Standard Error Responses:

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": "Email and password are required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## 📝 Request Examples

### Login and Use Token
```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@squadup.com","password":"password123"}'

# 2. Use token for authenticated request
curl -X GET http://localhost:3001/api/teams \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create New Player
```bash
curl -X POST http://localhost:3001/api/players \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Lionel Messi",
    "kitNumber": 10,
    "position": "Forward",
    "dateOfBirth": "1987-06-24",
    "team": "60f7b3b3b3b3b3b3b3b3b3b3",
    "nationalID": "12345678901",
    "phoneNumber": "+1234567890",
    "email": "messi@squadup.com"
  }'
```

### Get All Data for Dashboard
```bash
curl -X GET http://localhost:3001/api/data/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🌐 Environment Variables

Required environment variables in `.env`:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/squadup

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 🏥 Health Check

#### **GET** `/health`
**Purpose**: Health check endpoint (no authentication required)  
**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "environment": "development"
}
```

---

## 📚 Additional Notes

1. **Authentication**: All endpoints require JWT token except:
   - `/api/auth/login`
   - `/api/auth/register`
   - `/health`

2. **Role Filtering**: Data is automatically filtered based on user role and team assignments

3. **Population**: Most endpoints automatically populate related data (team info, user info, etc.)

4. **Validation**: Server validates required fields and data types

5. **CORS**: Configured to allow frontend origins (`localhost:5173`, `localhost:5174`)

6. **Security**: Passwords are hashed with bcrypt, sensitive data excluded from responses

7. **Draft Autosave**: The `/api/games/:gameId/draft` endpoint is polymorphic:
   - For **Scheduled** games: Saves lineup draft (rosters, formation)
   - For **Played** games: Saves report draft (teamSummary, finalScore, matchDuration, playerReports, playerMatchStats)
   - Drafts are automatically cleared when game status changes
   - `playerMatchStats` in draft stores fouls data temporarily and is saved to `PlayerMatchStat` collection on final submission

8. **Server-Calculated Fields**: The following fields are **always calculated by the server** and cannot be provided by the client:
   - `minutesPlayed` (calculated from substitutions and red cards)
   - `goals` (calculated from Goals collection)
   - `assists` (calculated from Goals collection)
   - `goalNumber` and `matchState` (calculated when game status = "Done")

9. **Minutes Calculation**: Player minutes are automatically recalculated when:
   - Substitutions are created/updated/deleted
   - Red cards are issued/removed
   - Match duration changes

10. **Goal Analytics**: Goal numbers and match states are recalculated when a game status changes to "Done"

---

*Last updated: December 2024*
*SquadUp Football Management System*
