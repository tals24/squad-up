# SquadUp API Documentation

## 🚀 Overview

This document provides comprehensive documentation for all available APIs in the SquadUp football management system. The API uses **JWT (JSON Web Token) authentication** and follows RESTful principles.

**Base URL**: `http://localhost:3001/api`

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

#### **POST** `/api/game-rosters`
**Purpose**: Add player to game roster  
**Authentication**: Required  
**Body**:
```json
{
  "game": "60f7b3b3b3b3b3b3b3b3b3b3",
  "player": "60f7b3b3b3b3b3b3b3b3b3b4",
  "status": "Starting XI"
}
```

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
  "action": "fetch|create|update|delete",
  "tableName": "Users|Teams|Players|Games|etc",
  "recordId": "optional-for-single-record-ops",
  "data": { /* record data for create/update */ }
}
```

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

## 📚 Additional Notes

1. **Authentication**: All endpoints require JWT token except `/api/auth/login` and `/api/auth/register`
2. **Role Filtering**: Data is automatically filtered based on user role and team assignments
3. **Population**: Most endpoints automatically populate related data (team info, user info, etc.)
4. **Validation**: Server validates required fields and data types
5. **CORS**: Configured to allow frontend origins (`localhost:5173`, `localhost:5174`)
6. **Security**: Passwords are hashed with bcrypt, sensitive data excluded from responses

---

*Last updated: December 2024*
*SquadUp Football Management System*
