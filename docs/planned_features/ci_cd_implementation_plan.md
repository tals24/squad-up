# CI/CD Implementation Plan

Complete guide for setting up Continuous Integration and Continuous Deployment.

**Status:** 📋 Planned for Future Implementation  
**Priority:** Medium  
**Estimated Time:** 3-4 hours total  
**Prerequisites:** Completed Phase 3 optimizations and testing

---

## 🎯 Overview

This document outlines the implementation plan for a complete CI/CD pipeline including:
- Automated testing on every commit
- Code quality checks
- Automated deployment
- Pre-commit hooks for local quality

---

## Task 4.1: GitHub Actions Workflow

**Time:** 1-2 hours  
**Priority:** Medium  
**Impact:** Automated quality checks, prevent broken code from merging

### What It Does

- Runs tests automatically on every push/PR
- Checks code quality (linting, formatting)
- Builds the app to catch build errors
- Runs tests for both frontend and backend
- Blocks merges if tests fail

### Benefits

- ✅ Catch bugs before they reach production
- ✅ Enforce code quality standards
- ✅ Automated testing saves time
- ✅ Confidence in deployments
- ✅ Team collaboration (safe merges)

---

### Implementation Steps

#### Step 1: Create Workflow File

**File:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ========================================
  # Backend Tests
  # ========================================
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run linter
        run: cd backend && npm run lint
      
      - name: Run tests
        run: cd backend && npm test
        env:
          NODE_ENV: test
          MONGODB_URI: ${{ secrets.MONGODB_TEST_URI }}
      
      - name: Generate coverage report
        run: cd backend && npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage

  # ========================================
  # Frontend Tests
  # ========================================
  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run linter
        run: cd frontend && npm run lint
      
      - name: Run tests
        run: cd frontend && npm test -- --coverage
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage

  # ========================================
  # E2E Tests (Optional - runs on schedule or manual)
  # ========================================
  e2e-test:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [backend-test, frontend-test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Install backend dependencies
        run: cd backend && npm ci
      
      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps
      
      - name: Start backend server
        run: |
          cd backend
          npm start &
          sleep 10
        env:
          NODE_ENV: test
          PORT: 3001
      
      - name: Start frontend server
        run: |
          cd frontend
          npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: cd frontend && npx playwright test
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report
          retention-days: 30

  # ========================================
  # Code Quality Checks
  # ========================================
  code-quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run ESLint
        run: |
          cd frontend && npm ci
          npm run lint -- --max-warnings 0
      
      - name: Check formatting (Prettier)
        run: |
          cd frontend
          npx prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}"
      
      - name: Check for console.logs
        run: |
          if grep -r "console.log" frontend/src --exclude-dir=node_modules; then
            echo "❌ Found console.log statements"
            exit 1
          fi

  # ========================================
  # Security Audit
  # ========================================
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run npm audit (Backend)
        run: cd backend && npm audit --audit-level=moderate
      
      - name: Run npm audit (Frontend)
        run: cd frontend && npm audit --audit-level=moderate
      
      - name: Check for known vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

#### Step 2: Configure Secrets

Add these secrets in GitHub Settings → Secrets:

```
MONGODB_TEST_URI        - Test database connection
SNYK_TOKEN             - Security scanning (optional)
CODECOV_TOKEN          - Coverage reporting (optional)
```

#### Step 3: Branch Protection Rules

**Settings → Branches → Branch protection rules → Add rule**

```
Branch name pattern: main

☑ Require a pull request before merging
☑ Require status checks to pass before merging
  - backend-test
  - frontend-test
  - code-quality
☑ Require branches to be up to date before merging
☑ Require conversation resolution before merging
```

#### Step 4: Test the Workflow

```bash
# Create a PR to test
git checkout -b test-ci-pipeline
git commit --allow-empty -m "test: trigger CI pipeline"
git push origin test-ci-pipeline

# Create PR on GitHub
# Watch Actions tab for results
```

---

### Advanced Features

#### Conditional Jobs

Run expensive tests only on main branch:

```yaml
e2e-test:
  if: github.ref == 'refs/heads/main'
  # ... job steps
```

#### Matrix Testing

Test multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

#### Caching

Speed up builds:

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

#### Notifications

Slack notifications on failure:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

---

### Troubleshooting

**Tests pass locally but fail in CI:**
- Check Node version matches
- Verify environment variables
- Check file paths (case-sensitive)

**Slow CI runs:**
- Use caching for dependencies
- Run jobs in parallel
- Skip E2E tests for non-main branches

**Authentication issues:**
- Verify secrets are set correctly
- Check secret names match exactly
- Use `${{ secrets.NAME }}` syntax

---

### Cost & Performance

- **Free tier:** 2,000 minutes/month (GitHub Actions)
- **Average run time:** 5-10 minutes per push
- **Cost estimate:** Free for most projects

**Optimization tips:**
- Cache dependencies (saves 2-3 min)
- Run jobs in parallel
- Skip optional jobs on PRs

---

### Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Best Practices](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)
- [Example Workflows](https://github.com/actions/starter-workflows)

---

## Task 4.2: Pre-commit Hooks

**Time:** 30 minutes  
**Priority:** Medium  
**Impact:** Local code quality, prevent bad commits

### What It Does

Runs checks automatically BEFORE allowing a commit:
- Linting
- Formatting
- Type checking
- Basic tests

If checks fail → commit is blocked.

### Benefits

- ✅ Catch issues before pushing
- ✅ Consistent code style
- ✅ Faster feedback (local, not CI)
- ✅ Less "fix linting" commits
- ✅ Better commit quality

---

### Implementation Steps

#### Step 1: Install Husky & lint-staged

```bash
cd frontend
npm install -D husky lint-staged

# Initialize husky
npx husky init
```

#### Step 2: Configure lint-staged

**File:** `frontend/package.json`

```json
{
  "lint-staged": {
    "src/**/*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,css,md}": [
      "prettier --write"
    ],
    "src/**/*.test.{js,jsx}": [
      "jest --bail --findRelatedTests"
    ]
  }
}
```

#### Step 3: Create pre-commit hook

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Lint staged files
cd frontend
npx lint-staged

# Run type checking (if using TypeScript)
# npm run type-check

# Check for TODO/FIXME comments in staged files
if git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$' | xargs grep -n 'TODO\|FIXME'; then
  echo ""
  echo "⚠️  Warning: Found TODO/FIXME comments in staged files"
  echo "Consider resolving them or removing the comments"
  echo ""
fi

echo "✅ Pre-commit checks passed!"
```

#### Step 4: Create commit-msg hook (Optional)

**File:** `.husky/commit-msg`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Enforce conventional commits
npx --no -- commitlint --edit ${1}
```

**File:** `frontend/.commitlintrc.json`

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "test",
        "chore",
        "perf"
      ]
    ]
  }
}
```

#### Step 5: Test the hooks

```bash
# Make a change with linting error
echo "const x = 1" >> src/test.js

# Try to commit (should auto-fix)
git add src/test.js
git commit -m "test: check pre-commit hook"

# Should see:
# 🔍 Running pre-commit checks...
# ✅ eslint --fix
# ✅ prettier --write
# ✅ Pre-commit checks passed!
```

---

### Configuration Options

#### Skip hooks (when needed)

```bash
# Skip pre-commit checks
git commit --no-verify -m "urgent fix"

# Skip specific hook
HUSKY_SKIP_HOOKS=1 git commit -m "skip hooks"
```

#### Custom checks

Add to `.husky/pre-commit`:

```bash
# Check bundle size
npm run check-bundle-size

# Run security audit
npm audit

# Check for large files
if [ $(du -sb . | cut -f1) -gt 10485760 ]; then
  echo "⚠️ Large files detected"
fi
```

---

### Troubleshooting

**Hooks not running:**
```bash
# Re-install hooks
rm -rf .git/hooks
npx husky install
```

**Hooks too slow:**
```bash
# Run only on changed files
# lint-staged already does this

# Skip tests on commit
# Only lint and format
```

**Permission denied:**
```bash
chmod +x .husky/pre-commit
```

---

### Resources

- [Husky Docs](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)
- [commitlint](https://commitlint.js.org/)

---

## Task 4.3: Deployment Automation

**Time:** 30-60 minutes  
**Priority:** Low  
**Impact:** Easy deployment, zero downtime

### What It Does

Automatically deploy your app when code is merged:
- Frontend → Vercel/Netlify
- Backend → Railway/Render
- Database → MongoDB Atlas

### Benefits

- ✅ One-click deploy
- ✅ Preview environments for PRs
- ✅ Rollback support
- ✅ Zero-downtime deploys
- ✅ Automatic HTTPS/SSL

---

### Option A: Vercel (Frontend) + Railway (Backend)

**Best for:** Quick setup, great DX, free tier

#### Frontend (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Initialize Vercel**
```bash
cd frontend
vercel
# Follow prompts
```

3. **Configure Build Settings**

**File:** `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend.railway.app"
  }
}
```

4. **Auto-deploy**
```bash
# Vercel automatically deploys on push to main
# No additional config needed!
```

#### Backend (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub

2. **Create New Project**
   - "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Choose backend folder

3. **Configure**
```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "cd backend && npm install"

[deploy]
startCommand = "cd backend && npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[deploy.healthcheckPath]]
path = "/api/health"
```

4. **Environment Variables**
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
```

5. **Custom Domain (Optional)**
```
Settings → Domains → Add Custom Domain
```

---

### Option B: Full Docker Setup

**Best for:** Full control, self-hosted

#### Step 1: Create Dockerfiles

**File:** `backend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

**File:** `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Docker Compose

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### Step 3: Deploy Script

**File:** `deploy.sh`
```bash
#!/bin/bash

echo "🚀 Deploying SquadUp..."

# Pull latest code
git pull origin main

# Build and restart containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check health
sleep 10
curl http://localhost:3001/api/health

echo "✅ Deployment complete!"
```

#### Step 4: GitHub Actions Deploy

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/squad-up
            ./deploy.sh
```

---

### Monitoring & Alerts

#### Health Check Endpoint

**File:** `backend/src/routes/health.js`
```javascript
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

#### Uptime Monitoring

Use services like:
- **UptimeRobot** (Free)
- **Pingdom**
- **StatusCake**

Configure alerts:
- Email notifications
- Slack webhooks
- SMS (premium)

---

### Rollback Strategy

#### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

#### Railway
```bash
# Via dashboard: Deployments → Rollback
```

#### Docker
```bash
# Keep previous image
docker tag app:latest app:previous

# Rollback
docker-compose down
docker tag app:previous app:latest
docker-compose up -d
```

---

### Cost Estimates

#### Free Tier
- **Vercel:** Free for hobby projects
- **Railway:** $5/month credit
- **MongoDB Atlas:** Free 512MB

#### Paid Tier
- **Vercel Pro:** $20/month
- **Railway:** Pay-as-you-go (~$10-20/month)
- **MongoDB:** $9/month (2GB)

**Total:** ~$0-50/month depending on usage

---

### Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Docker Docs](https://docs.docker.com/)
- [Deployment Checklist](https://github.com/kdeldycke/awesome-falsehood)

---

## 🎯 Implementation Priority

### Phase 1: Immediate (Do Now)
1. **Pre-commit Hooks** (30 min) - Local quality checks
2. **GitHub Actions CI** (1-2 hours) - Automated testing

### Phase 2: Before Production
3. **Deployment Automation** (30-60 min) - Easy deploys

### Phase 3: Optional
- Monitoring & alerts
- Performance tracking
- Error tracking (Sentry)
- Analytics

---

## 📊 Expected Outcomes

### Before CI/CD
- ❌ Manual testing before merges
- ❌ Broken builds reach main
- ❌ Manual deployments
- ❌ No code quality enforcement

### After CI/CD
- ✅ Automatic testing on every commit
- ✅ Code quality enforced
- ✅ One-click deployments
- ✅ Preview environments for PRs
- ✅ Rollback support
- ✅ Team confidence

---

**Status:** 📋 Ready to Implement  
**Next Step:** Choose deployment platform (Vercel/Railway recommended)  
**Owner:** DevOps/Team Lead  
**Date:** December 2025

