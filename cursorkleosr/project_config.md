# Project Config

<!-- STATIC:GOAL:START -->
## Goal
Squad Up is a comprehensive youth soccer management system designed for coaches, team managers, and administrators. It provides real-time game management (rosters, goals, substitutions, cards), training session planning, and player development tracking with analytics. The system follows MVC architecture with Domain-Driven Design, featuring role-based access control (Admin, Department Manager, Division Manager, Coach) and 150+ API endpoints across 18 MongoDB collections.
<!-- STATIC:GOAL:END -->

<!-- STATIC:TECH_STACK:START -->
## Tech Stack

### Primary Languages
- **JavaScript (ES2020+)** - Both frontend and backend
- **JSX** - React components

### Backend (Node.js)
| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express | 5.1.0 |
| Database | MongoDB | 5.0+ |
| ODM | Mongoose | 8.18.1 |
| Auth | jsonwebtoken | 9.0.2 |
| Password | bcryptjs | 3.0.2 |
| Validation | Joi | 18.0.1 |
| Security | helmet | 8.1.0 |
| CORS | cors | 2.8.5 |
| Logging | morgan | 1.10.1 |
| Testing | Jest | 30.2.0 |
| E2E Testing | supertest | 7.1.4 |
| Dev Server | nodemon | 3.1.10 |

### Frontend (React)
| Category | Technology | Version |
|----------|------------|---------|
| UI Library | React | 18.2.0 |
| Build Tool | Vite | 6.1.0 |
| Router | react-router-dom | 7.2.0 |
| Server State | @tanstack/react-query | 5.90.12 |
| Forms | react-hook-form | 7.54.2 |
| Validation | Zod | 3.24.2 |
| Styling | Tailwind CSS | 3.4.17 |
| Component Variants | class-variance-authority | 0.7.1 |
| UI Primitives | Radix UI | Various 1.x-2.x |
| Icons | lucide-react | 0.475.0 |
| Charts | Recharts | 2.15.1 |
| Animations | framer-motion | 12.23.12 |
| Date Utils | date-fns | 3.6.0 |
| Toasts | sonner | 2.0.1 |
| Virtualization | react-window | 2.2.3 |

### Development Tools
- **ESLint 9** - Linting with React, Hooks, Prettier plugins
- **Prettier 3** - Code formatting
- **Jest 29-30** - Testing (backend + frontend)
- **Testing Library** - React component testing
- **Babel** - Transpilation for tests

### Infrastructure
- **MongoDB Atlas** - Cloud database
- **Job Queue** - Custom polling-based worker (`worker.js`)
<!-- STATIC:TECH_STACK:END -->

<!-- STATIC:PATTERNS:START -->
## Patterns

### Architecture Patterns
1. **MVC with Service Layer** - Routes (thin, 5-15 lines) → Controllers (HTTP orchestration, 60-150 lines) → Services (business logic, 80-400 lines) → Models (Mongoose schemas)
2. **Domain-Driven Folders** - Code organized by domain: `games/`, `training/`, `player-management/` with dedicated controllers, services, routes per domain
3. **Feature-Sliced Frontend** - Features in `src/features/{domain}/` with `api/`, `components/`, `utils/` subfolders

### Data Fetching & State
4. **React Query for Server State** - Use `useQuery`/`useMutation` with centralized query keys (`gameKeys.all`, `gameKeys.detail(id)`)
5. **Context for Global Data** - `DataProvider` provides app-wide data (games, players, teams) with `updateGameInCache()` for optimistic updates
6. **Native Fetch API** - All API calls use `fetch()` with Bearer token auth from `localStorage.getItem('authToken')`

### API & Response Format
7. **Consistent Response Shape** - All API responses: `{ success: boolean, data?: any, error?: string, message?: string }`
8. **JWT Auth Middleware** - `authenticateJWT` verifies token, attaches `req.user` and `req.userId`
9. **Role-Based Middleware** - `checkTeamAccess`, `checkGameAccess` enforce permissions before controllers

### Error Handling
10. **Try-Catch in Controllers** - Controllers wrap service calls, log errors, call `next(error)` for global handler
11. **Global Error Handler** - `app.use((err, req, res, next))` handles ValidationError, CastError with appropriate status codes
12. **Error Objects with Message** - Services throw `new Error('descriptive message')` for business rule violations

### Component Patterns
13. **Radix + CVA Components** - UI primitives from Radix, styled with Tailwind and `cva()` for variants
14. **Functional Components Only** - All React components are functional with hooks, no class components
15. **Dialog Pattern** - Modals via Radix Dialog, controlled by `show*Dialog` state and `selected*` for edit mode

### Code Style
16. **CommonJS in Backend** - `require()`/`module.exports` pattern, `exports.functionName = async () => {}`
17. **ES Modules in Frontend** - `import`/`export`, path aliases via `@/` (e.g., `@/shared/hooks`)
18. **JSDoc Comments** - Controllers and services have `/** */` block comments describing purpose and HTTP method
<!-- STATIC:PATTERNS:END -->

<!-- STATIC:CONSTRAINTS:START -->
## Constraints

### Technical Requirements
- **Node.js 18+** required for backend
- **MongoDB 5.0+** required for database features
- **ES2020** syntax in frontend (`ecmaVersion: 2020` in ESLint)

### API Constraints
- **JSON body limit**: 10mb (`express.json({ limit: '10mb' })`)
- **JWT expiry**: 24 hours
- **bcrypt rounds**: 10

### Frontend Constraints
- **Vite as bundler** - No webpack, use Vite conventions
- **Tailwind only** - No inline styles, use utility classes
- **Path aliases required** - Use `@/` prefix for imports from `src/`

### Code Quality
- **ESLint + Prettier enforced** - `prettier/prettier: 'error'`
- **No console.log** - Use `console.warn`/`console.error` only (ESLint rule)
- **Unused vars warning** - Prefix with `_` to ignore (`argsIgnorePattern: '^_'`)
- **PropTypes warning** - Components should have prop types defined

### Testing Requirements
- **Jest** for all tests (backend and frontend)
- **No test database mocking** - Tests use actual MongoDB (check `__tests__/setup.js`)
- **Service tests mock dependencies** - Use `jest.mock()` for external services

### Architecture Rules
- **Services never import controllers** - One-way dependency: Controller → Service → Model
- **Routes never contain business logic** - Only authentication middleware and controller delegation
- **Models define indexes** - All queryable fields must have Mongoose indexes
<!-- STATIC:CONSTRAINTS:END -->

<!-- STATIC:TOKENIZATION:START -->
## Tokenization
3.5ch/token | 8K cap | summarize >12
<!-- STATIC:TOKENIZATION:END -->

<!-- STATIC:MODEL_CONFIG:START -->
## Model Config

### Task Types
- `feature` - New functionality (endpoints, UI components, services)
- `bugfix` - Fix existing behavior
- `refactor` - Code restructure without behavior change
- `test` - Add/update tests
- `chore` - Config, deps, docs, tooling
- `perf` - Performance optimization

### Architecture Tags
- `backend` - Node.js/Express code (controllers, services, routes, models)
- `frontend` - React code (components, hooks, features)
- `api` - API layer (route definitions, response formats)
- `db` - Database (Mongoose schemas, indexes, migrations)
- `auth` - Authentication/authorization
- `worker` - Background job processing
- `test` - Test files and utilities
- `config` - Configuration files (ESLint, Vite, Jest)

### Domain Tags
- `games` - Game management domain
- `training` - Training sessions and drills
- `players` - Player management
- `teams` - Team management
- `analytics` - Stats and reporting
- `users` - User authentication and roles
<!-- STATIC:MODEL_CONFIG:END -->

<!-- DYNAMIC:CHANGELOG:START -->
## Changelog
<!-- DYNAMIC:CHANGELOG:END -->
