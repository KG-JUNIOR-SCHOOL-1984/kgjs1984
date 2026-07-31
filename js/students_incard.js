// ======================================================
// students_incard.js
// School Management System V6.5
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const DEFAULT_PHOTO =
"https://via.placeholder.com/120";

async function loadStudentIDCard() {

    const docId = localStorage.getItem("studentProfileId");

    if (!docId) {

        alert("Student not found.");

        window.location.href = "students_list.html";

        return;

    }

    try {

        const studentRef = doc(db, "students", docId);

        const snapshot = await getDoc(studentRef);

        if (!snapshot.exists()) {

            alert("Student not found.");

            return;

        }

        const student = snapshot.data();

        document.getElementById("cardPhoto").src =
            student.photo || DEFAULT_PHOTO;

        document.getElementById("cardStudentId").innerText =
            student.studentId || "";

        document.getElementById("cardName").innerText =
            student.name || "";

        document.getElementById("cardFather").innerText =
            student.father || "";

        document.getElementById("cardMother").innerText =
            student.mother || "";

        document.getElementById("cardClass").innerText =
            student.studentClass || "";

        document.getElementById("cardRoll").innerText =
            student.roll || "";

        document.getElementById("cardSection").innerText =
            student.section || "";

        document.getElementById("cardSession").innerText =
            student.session || student.studentSession || "";

        document.getElementById("cardBlood").innerText =
            student.blood || "";

        document.getElementById("cardGuardianMobile").innerText =
            student.guardianMobile || "";

        document.getElementById("cardStatus").innerText =
            student.status || "Active";

    } catch (error) {

        console.error("ID Card Load Error:", error);

        alert("Failed to load student ID card.");

    }

}

document.addEventListener(
    "DOMContentLoaded",
    loadStudentIDCard
);

console.log("==================================");
console.log("Student ID Card Module Loaded");
console.log("==================================");
