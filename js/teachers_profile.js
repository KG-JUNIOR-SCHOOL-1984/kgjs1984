// ======================================================
// teacher_profile.js
// School Management System V7
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

// ===========================================
// Load Teacher Profile
// ===========================================

async function loadTeacherProfile() {

    const docId =
        localStorage.getItem("teacherProfileId");

    if (!docId) {

        alert("Teacher not found.");

        window.location.href =
        "teachers_list.html";

        return;

    }

    try {

        const teacherRef =
            doc(db, "teachers", docId);

        const snapshot =
            await getDoc(teacherRef);

        if (!snapshot.exists()) {

            alert("Teacher not found.");

            return;

        }

        const teacher = snapshot.data();

        document.getElementById("profilePhoto").src =
            teacher.photo || DEFAULT_PHOTO;

        document.getElementById("profileName").innerText =
            teacher.name || "";

        document.getElementById("profileID").innerText =
            teacher.teacherId || "";

        document.getElementById("pTeacherId").innerText =
            teacher.teacherId || "";

        document.getElementById("pTeacherName").innerText =
            teacher.name || "";

        document.getElementById("pFather").innerText =
            teacher.father || "";

        document.getElementById("pMother").innerText =
            teacher.mother || "";

        document.getElementById("pDesignation").innerText =
            teacher.designation || "";

        document.getElementById("pSubject").innerText =
            teacher.subject || "";

        document.getElementById("pJoiningDate").innerText =
            teacher.joiningDate || "";

        document.getElementById("pDOB").innerText =
            teacher.dob || "";

        document.getElementById("pGender").innerText =
            teacher.gender || "";

        document.getElementById("pReligion").innerText =
            teacher.religion || "";

        document.getElementById("pMobile").innerText =
            teacher.mobile || "";

        document.getElementById("pEmail").innerText =
            teacher.email || "";

        document.getElementById("pSalary").innerText =
            "৳ " + (teacher.salary || 0);

        document.getElementById("pStatus").innerHTML =
            `<span class="badge bg-${
                teacher.status === "Active"
                    ? "success"
                    : teacher.status === "Inactive"
                    ? "danger"
                    : "warning"
            }">
                ${teacher.status || "Active"}
            </span>`;

        document.getElementById("pAddress").innerText =
            teacher.address || "";

    } catch (error) {

        console.error("Profile Load Error:", error);

        alert("Failed to load teacher profile.");

    }

}

// ===========================================
// Load School Name/Logo Header
// ===========================================

async function loadSchoolHeader() {

    const wrap = document.getElementById("profileSchoolHeader");

    if (!wrap) return;

    try {

        const snap = await getDoc(doc(db, "settings", "school"));

        if (!snap.exists()) return;

        const data = snap.data();

        if (!data.schoolName) return;

        document.getElementById("profileSchoolName").innerText = data.schoolName;

        const addrParts = [data.schoolAddress, data.schoolMobile].filter(Boolean);
        document.getElementById("profileSchoolAddress").innerText = addrParts.join(" | ");

        if (data.schoolLogo) {
            const logo = document.getElementById("profileSchoolLogo");
            logo.src = data.schoolLogo;
            logo.classList.remove("d-none");
        }

        wrap.classList.remove("d-none");

    } catch (error) {

        console.error("School Header Load Error:", error);

    }

}

// ===========================================
// Initialize
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
    loadSchoolHeader();
    loadTeacherProfile();
});

console.log("==================================");
console.log("Teacher Profile Module Loaded");
console.log("==================================");
