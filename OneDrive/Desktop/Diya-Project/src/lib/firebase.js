// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOVYSAELDXXD-HJIDYMjjcX0q1h3-YeUM",
    authDomain: "diya-s-daily-work-tracker.firebaseapp.com",
    projectId: "diya-s-daily-work-tracker",
    storageBucket: "diya-s-daily-work-tracker.firebasestorage.app",
    messagingSenderId: "719535996704",
    appId: "1:719535996704:web:f1c33735bad779daa12145",
    measurementId: "G-DJTNVFHRKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
