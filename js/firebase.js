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
    apiKey: "AIzaSyCywqr-qBqlDsJeT3QtYKhpT7rWiIPnoAE",
    authDomain: "school-management-261d8.firebaseapp.com",
    projectId: "school-management-261d8",
    storageBucket: "school-management-261d8.firebasestorage.app",
    messagingSenderId: "468023681751",
    appId: "1:468023681751:web:4632f7faf169915f88c692",
    measurementId: "G-50T35Z0LPZ"
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
