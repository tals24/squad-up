# What Does "MongoDB is Running" Mean?

## Quick Answer

**MongoDB is a database server** - it's a program that needs to be running on your computer (or a remote server) before your backend application or tests can connect to it.

Think of it like this:
- **Your backend app** = A restaurant
- **MongoDB** = The kitchen (where data is stored)
- **"MongoDB is running"** = The kitchen is open and ready to serve

If MongoDB isn't running, your tests will fail with: `connect ECONNREFUSED ::1:27017`

---

## Your Situation: MongoDB Atlas (Cloud Database) ✅

**Good news!** You're using **MongoDB Atlas** (cloud database), not a local MongoDB installation.

**Your backend connects to**:
```
mongodb+srv://tals24:...@squadup-cluster.iwd2jyh.mongodb.net/squadup
```

**What this means**:
- ✅ MongoDB **IS running** (in the cloud)
- ✅ Your backend app works because it connects to Atlas
- ❌ Tests fail because they try to connect to `localhost:27017` (local MongoDB that doesn't exist)

**Solution**: Tests should use the same Atlas connection, but with a different database name (so test data doesn't mix with real data).

---

## How MongoDB Works

### 1. MongoDB Server (The Database)
- **What it is**: A program that stores and manages your data
- **Where it runs**: 
  - **Local**: On your computer (localhost:27017) - NOT what you're using
  - **Cloud**: MongoDB Atlas (what you're using) ✅
- **Connection string**: 
  - Local: `mongodb://localhost:27017/database-name`
  - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/database-name`

### 2. Your Backend App
- **What it does**: Connects to MongoDB to save/load data
- **Connection**: Uses Mongoose library to talk to MongoDB
- **Your connection**: MongoDB Atlas (cloud)
- **When it connects**: When the app starts (`connectDB()` in `app.js`)

### 3. Tests
- **What they do**: Connect to MongoDB to test database operations
- **Problem**: Tests were trying to connect to `localhost:27017` (local MongoDB)
- **Solution**: Tests should connect to the same Atlas database, but use a test database name

---

## How to Fix Tests

### Option 1: Use Your Atlas Connection (Recommended)

Tests will automatically use your Atlas connection but with a test database name:

```powershell
cd backend
npm test
```

The test file now automatically:
1. Checks for `MONGODB_TEST_URI` environment variable (if you want to override)
2. Uses your `MONGODB_URI` from `.env` but changes database name to `test-draft-autosave`
3. Falls back to `localhost:27017` only if neither is available

### Option 2: Set Explicit Test Database URI

If you want to use a different Atlas cluster for tests:

```powershell
# Set test database URI (uses same cluster but different database)
$env:MONGODB_TEST_URI="mongodb+srv://tals24:Maccabihaifa20@squadup-cluster.iwd2jyh.mongodb.net/test-draft-autosave?retryWrites=true&w=majority"
cd backend
npm test
```

---

## How to Check if MongoDB is Running

### For Local MongoDB (Not Your Case)

If you were using local MongoDB:

```powershell
# Check port
Test-NetConnection -ComputerName localhost -Port 27017

# Check Windows service
Get-Service -Name "*mongo*"
```

### For MongoDB Atlas (Your Case)

**MongoDB Atlas is always "running"** - it's a cloud service. You just need:
- ✅ Internet connection
- ✅ Valid connection string
- ✅ Database accessible (not paused/deleted)

**To verify Atlas is accessible**:
```powershell
# If your backend app works, Atlas is accessible!
# You can also check Atlas dashboard: https://cloud.mongodb.com
```

---

## Summary

| Question | Answer |
|----------|--------|
| **Is MongoDB running?** | ✅ Yes, in the cloud (MongoDB Atlas) |
| **Where is it?** | MongoDB Atlas cluster: `squadup-cluster.iwd2jyh.mongodb.net` |
| **Why do tests fail?** | Tests were trying to connect to `localhost:27017` (local MongoDB that doesn't exist) |
| **How to fix?** | Tests now automatically use your Atlas connection with test database name |

---

## Next Steps

1. **Run tests** - They should now work:
   ```powershell
   cd backend
   npm test
   ```

2. **If tests still fail**, check:
   - Internet connection
   - Atlas cluster is not paused
   - Connection string in `.env` is correct

3. **Test data**: Tests use database name `test-draft-autosave` so your real data (`squadup`) won't be affected
