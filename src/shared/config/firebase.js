import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBhX8wrjrwFepS8O8UbA7c3RFTlKzb_650",
  authDomain: "squadup202025.firebaseapp.com",
  projectId: "squadup202025",
  storageBucket: "squadup202025.firebasestorage.app",
  messagingSenderId: "411968958763",
  appId: "1:411968958763:web:653533fcf8621ab407556e",
  measurementId: "G-4Z6GKP87BV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;

