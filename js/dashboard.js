// ==========================================
// School Management System V6
// dashboard.js
// (Cleaned up: removed duplicate onSnapshot
// listeners that were firing twice on every
// update)
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Collections

const studentsRef = collection(db, "students");
const teachersRef = collection(db, "teachers");

// Dashboard Elements

const totalStudents =
document.getElementById("totalStudents");

const totalTeachers =
document.getElementById("totalTeachers");

const todayAttendance =
document.getElementById("todayAttendance");

const feesCollected =
document.getElementById("feesCollected");

// Default Values

if (todayAttendance) todayAttendance.textContent = "0";
if (feesCollected) feesCollected.textContent = "0";

// -----------------------------
// Total Students (Realtime)
// -----------------------------

onSnapshot(studentsRef, (snapshot) => {

    if (totalStudents) {

        totalStudents.textContent = snapshot.size;

    }

}, (error) => {

    console.error("Student Count Error:", error);

});

// -----------------------------
// Total Teachers (Realtime)
// -----------------------------

onSnapshot(teachersRef, (snapshot) => {

    if (totalTeachers) {

        totalTeachers.textContent = snapshot.size;

    }

}, (error) => {

    console.error("Teacher Count Error:", error);

});

// -----------------------------
// Dashboard Ready
// -----------------------------

console.log("=================================");
console.log(" Dashboard Connected Successfully");
console.log(" Firebase Firestore Ready");
console.log("=================================");
