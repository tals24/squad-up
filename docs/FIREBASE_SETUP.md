# Firebase Authentication Setup

## Phase 1: Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "squad-up-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click "Email/Password" → Enable → Save
   - **Google**: Click "Google" → Enable → Select project support email → Save

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon) → General tab
2. Scroll down to "Your apps" section
3. Click "Web app" icon (</>) to add a web app
4. Enter app nickname (e.g., "squad-up-web")
5. Copy the Firebase configuration object

### 4. Update Firebase Config
Replace the placeholder values in `src/config/firebase.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

### 5. Set Up Authentication Rules (Optional)
In Firebase Console → Authentication → Settings → Authorized domains:
- Add your development domain (e.g., `localhost:5173`)
- Add your production domain when ready

## Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to your app
3. You should see the login modal
4. Try signing in with:
   - Email/Password (create account first)
   - Google (if enabled)

## Next Steps

After Firebase is configured:
1. Test authentication flow
2. Verify user data is properly formatted
3. Move to Phase 2: Replace data management with Airtable or custom backend

## Troubleshooting

### Common Issues:
1. **"Firebase: Error (auth/invalid-api-key)"**: Check your API key in firebase.js
2. **"Firebase: Error (auth/unauthorized-domain)"**: Add your domain to authorized domains
3. **"Firebase: Error (auth/popup-closed-by-user)"**: User closed the popup, this is normal
4. **"Firebase: Error (auth/email-already-in-use)"**: Email is already registered

### Debug Mode:
- Open browser DevTools → Console
- Look for Firebase auth logs
- Check Network tab for Firebase API calls


