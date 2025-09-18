# SquadUp Backend API

Custom backend API to replace Airtable for the SquadUp football team management application.

## Features

- **Firebase Authentication** - Secure user authentication
- **Role-based Access Control** - Coach, Division Manager, Department Manager, Admin roles
- **MongoDB Database** - Scalable NoSQL database
- **RESTful API** - Clean API endpoints
- **Data Validation** - Input validation and error handling
- **CORS Support** - Frontend integration ready

## Database Schema

The backend mirrors your Airtable structure with these collections:

- **Users** - Administrative and coaching staff
- **Teams** - Team information for each season
- **Players** - Player profiles and team assignments
- **Games** - Match information and results
- **GameRosters** - Squad selection for each game
- **TimelineEvents** - Performance reports and events
- **Drills** - Training drill library
- **Formations** - Tactical formations
- **TrainingSessions** - Training session planning
- **SessionDrills** - Drill assignments to sessions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Update the `.env` file with your actual values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/squadup

# Firebase Admin (get from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=squadup202025
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@squadup202025.iam.gserviceaccount.com

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5174
```

### 3. Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `squadup202025`
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the values to your `.env` file

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user info

### Data (Airtable Compatible)
- `GET /api/data/all` - Get all data (replaces fetchAllTables)
- `POST /api/data/airtable-sync` - Airtable sync compatibility

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

## Role-based Access

- **Admin**: Full access to all data
- **Department Manager**: Access to all teams and data
- **Division Manager**: Access to teams in their division
- **Coach**: Access only to their assigned team's data

## Frontend Integration

The backend is designed to be a drop-in replacement for Airtable. Update your frontend API calls to point to:

```
http://localhost:3001/api/data/all
```

Instead of the Airtable `fetchAllTables` function.

## Development

- **Hot Reload**: `npm run dev` for development with auto-restart
- **Logs**: Morgan logging middleware enabled
- **CORS**: Configured for frontend at `http://localhost:5174`
- **Error Handling**: Global error handler with detailed error messages

## Next Steps

1. Set up MongoDB (local or Atlas)
2. Configure Firebase Admin credentials
3. Start the backend server
4. Update frontend to use new API endpoints
5. Test the integration

## Troubleshooting

- **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
- **Firebase Admin**: Verify service account credentials are properly formatted
- **CORS Issues**: Check that `FRONTEND_URL` matches your frontend URL
- **Port Conflicts**: Change `PORT` in `.env` if 3001 is in use



