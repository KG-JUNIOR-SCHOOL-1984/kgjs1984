// ======================================================
// students_profile.js
// Part 1
// Load Student Profile
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

// ===========================================
// Load Profile
// ===========================================

async function loadStudentProfile() {

   console.log(localStorage.getItem("studentProfileId"));
    const docId =
        localStorage.getItem("studentProfileId");

    if (!docId) {

        alert("Student not found.");

        window.location.href =
        "students_list.html";

        return;

    }

    try {

        const studentRef =
            doc(db, "students", docId);

        const snapshot =
            await getDoc(studentRef);

        if (!snapshot.exists()) {

            alert("Student not found.");

            return;

        }

        const student = snapshot.data();

        document.getElementById("profilePhoto").src =
            student.photo || DEFAULT_PHOTO;

        document.getElementById("profileName").innerText =
            student.name || "";

        document.getElementById("profileID").innerText =
            student.studentId || "";

        document.getElementById("pStudentId").innerText =
            student.studentId || "";

        document.getElementById("pFather").innerText =
            student.father || "";

        document.getElementById("pMother").innerText =
            student.mother || "";

        document.getElementById("pClass").innerText =
            student.studentClass || "";

        document.getElementById("pRoll").innerText =
            student.roll || "";

        document.getElementById("pSection").innerText =
            student.section || "";

        document.getElementById("pSession").innerText =
            student.session || "";

        document.getElementById("pAdmissionDate").innerText =
            student.admissionDate || "";

        document.getElementById("pDOB").innerText =
            student.dob || "";
                document.getElementById("pGender").innerText =
            student.gender || "";

        document.getElementById("pReligion").innerText =
            student.religion || "";

        document.getElementById("pBlood").innerText =
            student.blood || "";

        document.getElementById("pEmail").innerText =
            student.email || "";

        document.getElementById("pMonthlyFee").innerText =
            "৳ " + (student.monthlyFee || 0);

        document.getElementById("pAdmissionFee").innerText =
            "৳ " + (student.admissionFee || 0);

        document.getElementById("pGuardianName").innerText =
            student.guardianName || "";

        document.getElementById("pGuardianMobile").innerText =
            student.guardianMobile || "";

        document.getElementById("pGuardianOccupation").innerText =
            student.guardianOccupation || "";

        document.getElementById("pAddress").innerText =
            student.address || "";

        document.getElementById("pStatus").innerHTML =
            `<span class="badge bg-${
                student.status === "Active"
                    ? "success"
                    : student.status === "Inactive"
                    ? "danger"
                    : "warning"
            }">
                ${student.status || "Active"}
            </span>`;

    } catch (error) {

    console.error(error);

    alert(error.message);

    }

}

// ===========================================
// Initialize
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    loadStudentProfile
);

console.log("==================================");
console.log("Student Profile Module Loaded");
console.log("==================================");
