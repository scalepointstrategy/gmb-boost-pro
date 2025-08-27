import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwe2lgsK5rhHePnsVgNflZf68M35qm3wU",
  authDomain: "gbp-467810-a56e2.firebaseapp.com",
  projectId: "gbp-467810-a56e2",
  storageBucket: "gbp-467810-a56e2.firebasestorage.app",
  messagingSenderId: "1027867101",
  appId: "1:1027867101:web:e5a55b106f9238eb72b634"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
