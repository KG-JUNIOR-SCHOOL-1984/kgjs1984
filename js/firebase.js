// ======================================================
// School Management System V6.1 Stable
// firebase.js
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ======================================================
// Firebase Configuration
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyD_9fnbkTmPaceDGm36ufBzPDqA2u-vdOw",
    authDomain: "school-management-kgjs1984.firebaseapp.com",
    projectId: "school-management-kgjs1984",
    storageBucket: "school-management-kgjs1984.firebasestorage.app",
    messagingSenderId: "738094251132",
    appId: "1:738094251132:web:1e7625f16d5cc950bd5df9"
};

// This project uses Firestore's default database (created via
// "Build > Firestore Database > Create database" in the Firebase
// Console), not a custom named database like the old AI Studio
// Starter Tier project did.
const databaseId = "(default)";

// ======================================================
// Initialize Firebase
// ======================================================

const app = initializeApp(firebaseConfig);

// ======================================================
// Firebase Services
// ======================================================

const db = (databaseId && databaseId !== "(default)") ? getFirestore(app, databaseId) : getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);

// ======================================================
// Export
// ======================================================

export { app, db, auth, storage, firebaseConfig };

console.log("Firebase V6.1 Stable Loaded Successfully");
