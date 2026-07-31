// ======================================================
// School Management System V6
// teachers_incard.js
// Part 1
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ------------------------------------
// Get Teacher ID
// ------------------------------------

const teacherId = localStorage.getItem("teacherProfileId");

if (!teacherId) {

    alert("No Teacher Selected.");

    window.location.href = "teachers_list.html";

}

// ------------------------------------
// Load Teacher ID Card
// ------------------------------------

async function loadTeacherIDCard() {

    try {

        const teacherRef = doc(db, "teachers", teacherId);

        const teacherSnap = await getDoc(teacherRef);

        if (!teacherSnap.exists()) {

            alert("Teacher Not Found.");

            window.location.href = "teachers_list.html";

            return;

        }

        const teacher = teacherSnap.data();
              document.getElementById("teacherPhoto").src =
            teacher.photo || "https://via.placeholder.com/130";

        document.getElementById("teacherName").textContent =
            teacher.name || "";

        document.getElementById("teacherDesignation").textContent =
            teacher.designation || "";

        document.getElementById("teacherId").textContent =
            teacher.teacherId || "";

        document.getElementById("teacherSubject").textContent =
            teacher.subject || "";

        document.getElementById("teacherMobile").textContent =
            teacher.mobile || "";

        document.getElementById("teacherBlood").textContent =
            teacher.blood || "";

        document.getElementById("joiningDate").textContent =
            teacher.joiningDate || "";

        document.getElementById("teacherStatus").textContent =
            teacher.status || "";

        document.getElementById("teacherAddress").textContent =
            teacher.address || "";
          } catch (error) {

        console.error("Teacher ID Card Error:", error);

        alert("Failed to Load Teacher Information.");

    }

}

// ------------------------------------
// Load Automatically
// ------------------------------------

loadTeacherIDCard();

// ------------------------------------
// Print Function
// ------------------------------------

window.printTeacherID = function () {

    window.print();

};

// ------------------------------------
// Version
// ------------------------------------

console.log("======================================");
console.log(" Teacher ID Card Module Loaded");
console.log(" School Management System V6");
console.log("======================================");
