// ======================================================
// School Management System
// publicHome.js
//
// Powers the public landing page (index.html). Read-only:
// shows live total students / teachers and the latest
// notices. No write actions live here.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { renderNoticeFeed } from "./noticesFeed.js";

const studentsRef = collection(db, "students");
const teachersRef = collection(db, "teachers");

const totalStudents = document.getElementById("totalStudents");
const totalTeachers = document.getElementById("totalTeachers");

// -----------------------------
// Total Students (Realtime)
// -----------------------------

onSnapshot(studentsRef, (snapshot) => {

    if (totalStudents) {

        totalStudents.textContent = snapshot.size;

    }

}, (error) => {

    console.error("Public Student Count Error:", error);

    if (totalStudents) totalStudents.textContent = "--";

});

// -----------------------------
// Total Teachers (Realtime)
// -----------------------------

onSnapshot(teachersRef, (snapshot) => {

    if (totalTeachers) {

        totalTeachers.textContent = snapshot.size;

    }

}, (error) => {

    console.error("Public Teacher Count Error:", error);

    if (totalTeachers) totalTeachers.textContent = "--";

});

// -----------------------------
// Latest Notices (Public View)
// -----------------------------

renderNoticeFeed("all");

console.log("==================================");
console.log("Public Home Widgets Loaded");
console.log("==================================");
