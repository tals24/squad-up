# Squad Up - Youth Soccer Management System

**Version:** 2.0  
**Architecture:** MVC (Model-View-Controller)  
**Status:** Production-Ready ✅

---

## 🚀 Overview

Squad Up is a comprehensive youth soccer management system designed for coaches, team managers, and administrators. It provides tools for managing games, training sessions, player development, and team analytics.

### Key Features
- ⚽ **Game Management** - Schedule games, track scores, manage rosters
- 📊 **Match Events** - Record goals, substitutions, cards in real-time
- 📈 **Analytics** - Goal partnerships, player stats, team discipline
- 🎯 **Training** - Plan sessions, manage drill library
- 👥 **Player Development** - Track performance, ratings, progress
- 🔐 **Role-Based Access** - Admin, Department Manager, Division Manager, Coach

---

## 🏗️ Architecture

### Backend
- **Framework:** Node.js + Express
- **Database:** MongoDB (18 collections)
- **Authentication:** JWT tokens + bcrypt
- **Pattern:** MVC with Domain-Driven Design
- **Testing:** Jest (98 tests, 100% passing)

### Frontend
- **Framework:** React 18 + Vite
- **State:** React Context + Hooks
- **Styling:** Tailwind CSS
- **Architecture:** Feature-Sliced Design

---

## 📚 Documentation

### Official Documentation (`docs/official/`)
Complete reference documentation for the entire system:

1. **[Backend Summary](docs/official/backendSummary.md)** (50+ pages)
   - Complete backend architecture
   - 60+ files documented
   - 370+ functions explained
   - Controllers, Services, Routes, Models

2. **[API Documentation](docs/official/apiDocumentation.md)** (45+ pages)
   - 150+ API endpoints
   - Request/response formats
   - Authentication flows
   - Error handling

3. **[Database Architecture](docs/official/databaseArchitecture.md)** (30+ pages)
   - 18 MongoDB collections
   - Schema definitions
   - Indexes and relationships
   - Query patterns

**Start here:** [`docs/official/README.md`](docs/official/README.md) - Documentation navigation guide

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd squad-up-with-backend

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend/` directory:

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

### Running the Application

#### Development Mode

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

#### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Stats:**
- 98 tests across 6 suites
- 100% passing
- Coverage: Controllers, Services, Routes

### Frontend Tests
```bash
cd frontend
npm test

# Watch mode
npm run test:watch
```

---

## 📁 Project Structure

```
squad-up-with-backend/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/        # HTTP request handlers
│   │   │   ├── games/          # Game domain controllers
│   │   │   └── training/       # Training domain controllers
│   │   ├── services/           # Business logic
│   │   │   ├── games/          # Game domain services
│   │   │   │   └── utils/      # Game utilities
│   │   │   └── training/       # Training domain services
│   │   ├── routes/             # Express routes
│   │   │   └── games/          # Game routes (13 files)
│   │   ├── models/             # Mongoose schemas (17 models)
│   │   ├── middleware/         # Auth, validation
│   │   └── utils/              # Helper functions
│   ├── tests/                  # Test files
│   └── package.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── app/                # App setup, providers
│   │   ├── features/           # Feature modules
│   │   │   ├── game-management/
│   │   │   ├── training-management/
│   │   │   └── drill-system/
│   │   └── shared/             # Shared components, hooks
│   └── package.json
│
└── docs/                       # Documentation
    ├── official/               # ⭐ Official documentation suite
    │   ├── README.md           # Documentation guide
    │   ├── backendSummary.md   # Backend architecture (50+ pages)
    │   ├── apiDocumentation.md # API reference (45+ pages)
    │   └── databaseArchitecture.md # Database schema (30+ pages)
    └── [other docs]/
```

---

## 🎯 Key Technologies

### Backend
- **Express** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Jest** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

---

## 🔐 Security Features

- ✅ JWT token authentication (24-hour expiry)
- ✅ bcrypt password hashing (10 rounds)
- ✅ Role-based access control (4 roles)
- ✅ Team-based data filtering
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ HTTP-only cookies (production)

---

## 👥 User Roles

1. **Admin** - Full system access
2. **Department Manager** - Manage multiple teams/coaches
3. **Division Manager** - Manage teams in their division
4. **Coach** - Manage assigned team(s) only

---

## 📊 Database Collections

**Core Domain** (4 collections)
- users, teams, players, games

**Match Events** (3 collections)
- goals, substitutions, cards

**Match Data** (4 collections)
- game_reports, gamerosters, formations, playermatchstats

**Training** (3 collections)
- drills, sessiondrills, trainingsessions

**Analysis** (2 collections)
- scout_reports, timeline_events

**System** (2 collections)
- jobs, organization_configs

**Total:** 18 collections

See [`docs/official/databaseArchitecture.md`](docs/official/databaseArchitecture.md) for details.

---

## 🔧 API Endpoints

The API follows RESTful principles with JWT authentication.

**Base URL:** `http://localhost:3001/api`

**Main Routes:**
- `/api/auth` - Authentication (login, register)
- `/api/users` - User management
- `/api/teams` - Team management
- `/api/players` - Player management
- `/api/games` - Game management (13 sub-routes)
- `/api/training-sessions` - Training management
- `/api/drills` - Drill library
- `/api/analytics` - Statistics and analytics

**Total:** 150+ endpoints

See [`docs/official/apiDocumentation.md`](docs/official/apiDocumentation.md) for complete reference.

---

## 🏆 Architecture Highlights

### Professional MVC Pattern
- **Routes** - Thin routing layer (5-15 lines per file)
- **Controllers** - HTTP orchestration (60-150 lines per file)
- **Services** - Business logic (80-400 lines per file)
- **Models** - Mongoose schemas

### Domain-Driven Design
- **Games Domain** - All game-related code in `games/` folder
- **Training Domain** - All training code in `training/` folder
- **Core Domain** - Fundamental entities at root level

### Separation of Concerns
- ✅ Single Responsibility Principle
- ✅ Clear domain boundaries
- ✅ Testable business logic
- ✅ Maintainable codebase

**Architecture Grade: A+** 🎯

---

## 📈 Performance

- **Backend:** ~60ms average response time
- **Database:** Optimized indexes on all collections
- **Tests:** 98 tests pass in ~60 seconds
- **Build:** Frontend builds in ~10 seconds

---

## 🤝 Contributing

### Code Style
- ESLint for linting
- Prettier for formatting
- Conventional commits for messages

### Adding New Features
1. Check [`docs/official/databaseArchitecture.md`](docs/official/databaseArchitecture.md) - Schema support?
2. Add service in appropriate domain folder
3. Add controller to handle HTTP
4. Add routes (thin, delegation only)
5. Update API documentation
6. Write tests
7. Update backend summary

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add new feature description"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file exists with correct MongoDB URI
- Verify MongoDB is running and accessible
- Check port 3001 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check CORS settings in `backend/src/app.js`
- Verify `VITE_API_URL` in frontend env

### Tests failing
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check MongoDB is running for backend tests
- Verify test database connection string

---

## 📝 License

[Add your license information here]

---

## 📧 Contact & Support

For questions or support:
- Check the [official documentation](docs/official/README.md)
- Review the [API documentation](docs/official/apiDocumentation.md)
- Consult the [backend architecture](docs/official/backendSummary.md)

---

## 🎉 Acknowledgments

Built with ❤️ by the Squad Up team using modern web technologies and professional software architecture patterns.

---

**Version:** 2.0 (Post-MVC Refactoring)  
**Last Updated:** December 2025  
**Status:** Production-Ready ✅
