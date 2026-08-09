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

const totalBoys =
document.getElementById("totalBoys");

const totalGirls =
document.getElementById("totalGirls");

const totalEnglishMedium =
document.getElementById("totalEnglishMedium");

const totalHindu =
document.getElementById("totalHindu");

const totalMuslim =
document.getElementById("totalMuslim");

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

    let boyCount = 0;
    let girlCount = 0;
    let englishMediumCount = 0;
    let hinduCount = 0;
    let muslimCount = 0;

    snapshot.forEach((doc) => {

        const data = doc.data();

        const gender = (data.gender || "").toLowerCase();
        const medium = (data.medium || "").toLowerCase();
        const religion = (data.religion || "").toLowerCase();

        if (gender === "male") {

            boyCount++;

        } else if (gender === "female") {

            girlCount++;

        }

        if (medium === "english") {

            englishMediumCount++;

        }

        if (religion === "hinduism") {

            hinduCount++;

        } else if (religion === "islam") {

            muslimCount++;

        }

    });

    if (totalBoys) totalBoys.textContent = boyCount;
    if (totalGirls) totalGirls.textContent = girlCount;
    if (totalEnglishMedium) totalEnglishMedium.textContent = englishMediumCount;
    if (totalHindu) totalHindu.textContent = hinduCount;
    if (totalMuslim) totalMuslim.textContent = muslimCount;

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
