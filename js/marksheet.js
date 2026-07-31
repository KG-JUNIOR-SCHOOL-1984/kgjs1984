// ==========================================
// School Management System V6
// marksheet.js
// Part 1
// ==========================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ------------------------------------------
// Get Selected Result ID
// ------------------------------------------

const resultDocId = localStorage.getItem("resultDocId");

// ------------------------------------------
// Load Marksheet
// ------------------------------------------

async function loadMarksheet() {

    if (!resultDocId) {

        alert("Result Not Found");

        return;

    }

    try {

        const ref = doc(db, "results", resultDocId);

        const snap = await getDoc(ref);

        if (!snap.exists()) {

            alert("Result Record Not Found");

            return;

        }

        const result = snap.data();

        showMarksheet(result);

    }

    catch (error) {

        console.error(error);

        alert("Failed to Load Marksheet");

    }

}
// ==========================================
// marksheet.js
// Part 2
// Show Marksheet Data
// ==========================================

function showMarksheet(result) {

    document.getElementById("studentId").value =
        result.studentId || "-";

    document.getElementById("studentName").value =
        result.studentName || "-";

    document.getElementById("studentClass").value =
        result.studentClass || "-";

    document.getElementById("examName").value =
        result.examName || "-";

    document.getElementById("resultDate").value =
        result.resultDate || "-";

    // Roll (যদি Result এ না থাকে)
    document.getElementById("studentRoll").value =
        result.roll || "-";

    // Subject Marks (table cells)

    document.getElementById("bangla").textContent =
        result.bangla ?? 0;

    document.getElementById("english").textContent =
        result.english ?? 0;

    document.getElementById("math").textContent =
        result.math ?? 0;

    document.getElementById("science").textContent =
        result.science ?? 0;

    document.getElementById("bgs").textContent =
        result.bgs ?? 0;

    document.getElementById("religion").textContent =
        result.religion ?? 0;

    document.getElementById("ict").textContent =
        result.ict ?? 0;

    // Result Summary

    document.getElementById("total").value =
        result.total ?? 0;

    document.getElementById("gpa").value =
        Number(result.gpa || 0).toFixed(2);

    document.getElementById("grade").value =
        result.grade || "-";

    document.getElementById("resultStatus").value =
        (result.grade === "F") ? "FAIL" : "PASS";

}
// ==========================================
// marksheet.js
// Part 3 (FINAL)
// ==========================================

// ------------------------------------------
// Print Marksheet
// ------------------------------------------

window.printMarksheet = function () {

    window.print();

};

// ------------------------------------------
// Page Initialize
// ------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    loadMarksheet();

});

// ------------------------------------------
// Reload Marksheet
// ------------------------------------------

window.reloadMarksheet = function () {

    loadMarksheet();

};

// ------------------------------------------
// Module Version
// ------------------------------------------

window.MARKSHEET_MODULE_VERSION = "V6.0";

// ------------------------------------------
// Ready Message
// ------------------------------------------

console.log("======================================");
console.log(" School Management System V6");
console.log(" Marksheet Module Loaded");
console.log(" Firebase Firestore Connected");
console.log("======================================");
