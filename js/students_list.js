// ======================================================
// School Management System V7
// students_list.js
// Part 1
// Firebase Setup + Global Variables
// ======================================================

import { db, storage } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ==========================================
// Firestore Collection
// ==========================================

const studentsRef = collection(db, "students");

// ==========================================
// Global Variables
// ==========================================

let students = [];
let filteredStudents = [];

// ==========================================
// Realtime Load
// ==========================================

const studentQuery = query(
    studentsRef,
    orderBy("studentId")
);

onSnapshot(studentQuery, (snapshot) => {

    students = [];

    snapshot.forEach((document) => {

        students.push({
            docId: document.id,
            ...document.data()
        });

    });

    filteredStudents = [...students];

    renderStudentTable();

});

// ==========================================
// Default Photo
// ==========================================

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

console.log("students_list.js Part 1 Loaded");
// ======================================================
// Part 2
// Render Student Table
// ======================================================

function renderStudentTable() {

    const table =
        document.getElementById("studentTableBody");

    if (!table) return;

    table.innerHTML = "";

    filteredStudents.forEach((student, index) => {

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>

<img
src="${student.photo || DEFAULT_PHOTO}"
style="width:45px;height:45px;border-radius:50%;object-fit:cover;">

</td>

<td>${student.studentId || ""}</td>

<td>${student.name || ""}</td>

<td>${student.studentClass || ""}</td>

<td>${student.roll || ""}</td>

<td>${student.guardianMobile || ""}</td>

<td>

<span class="badge bg-${
student.status === "Active"
? "success"
: student.status === "Inactive"
? "danger"
: "warning"
}">

${student.status || "Active"}

</span>

</td>

<td>

<button
class="btn btn-info btn-sm"
onclick="openProfile('${student.docId}')">

Profile

</button>

<button
class="btn btn-warning btn-sm"
onclick="createStudentLogin('${student.docId}')">

🔑 Login

</button>

<button
class="btn btn-success btn-sm"
onclick="openIDCard('${student.docId}')">

ID

</button>

<button
class="btn btn-primary btn-sm"
onclick="editStudent('${student.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteStudent('${student.docId}')">

Delete

</button>

</td>

</tr>

`;

    });

    document.getElementById("studentCount").innerText =
        filteredStudents.length;

       }
// ======================================================
// Part 3
// Search + Class Filter
// ======================================================

window.searchStudent = function () {

    const keyword =
        document.getElementById("searchStudent")
        .value
        .toLowerCase()
        .trim();

    const classFilter =
        document.getElementById("classFilter")
        .value;

    filteredStudents = students.filter(student => {

        const matchKeyword =

            (student.name || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (student.studentId || "")
            .toLowerCase()
            .includes(keyword)

            ||

            (student.guardianMobile || "")
            .toLowerCase()
            .includes(keyword);

        const matchClass =

            classFilter === "" ||

            student.studentClass === classFilter;

        return matchKeyword && matchClass;

    });

    renderStudentTable();

};

// ======================================================
// Refresh Student List
// ======================================================

window.refreshStudentTable = function () {

    filteredStudents = [...students];

    const searchInput = document.getElementById("searchStudent");
    if (searchInput) searchInput.value = "";

    const classInput = document.getElementById("classFilter");
    if (classInput) classInput.value = "";

    renderStudentTable();

};
// ======================================================
// Part 4
// Delete + Profile + ID Card
// ======================================================

// Delete Student
// (also removes the photo from Storage, if any, so
// deleted students don't leave orphaned files behind)
window.deleteStudent = async function (docId) {

    if (!confirm("Delete this student?")) return;

    try {

        const student = students.find(s => s.docId === docId);

        await deleteDoc(doc(db, "students", docId));

        if (student && student.photo) {

            try {

                await deleteObject(
                    ref(storage, `students/${student.studentId}/photo.jpg`)
                );

            } catch (storageError) {

                // Non-fatal — the record is already deleted either way.
                console.warn("Could not remove student photo:", storageError);

            }

        }

        alert("Student Deleted Successfully.");

    } catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};

// Open Student Profile
window.openProfile = function (docId) {

    localStorage.setItem(
        "studentProfileId",
        docId
    );

    window.location.href =
        "students_profile.html";

};

// Open Student ID Card
window.openIDCard = function (docId) {

    localStorage.setItem(
        "studentProfileId",
        docId
    );

    window.location.href =
        "students_incard.html";

};
// ======================================================
// School Management System V7
// students_list.js
// Part 5 (FINAL)
// ======================================================

// ------------------------------------
// Edit Student
// ------------------------------------

window.editStudent = function (docId) {

    // Edit করার জন্য students.html এ যাবে
    localStorage.setItem("editStudentId", docId);

    window.location.href = "students.html";

};

// ------------------------------------
// Total Students
// ------------------------------------

window.totalStudents = function () {

    return students.length;

};

// ------------------------------------
// Initialize
// ------------------------------------

function initializeStudentList() {

    console.log("Student List Initialized");

    renderStudentTable();

}

initializeStudentList();

// ------------------------------------
// Global Functions
// ------------------------------------

window.reloadStudentTable = renderStudentTable;

// ------------------------------------
// Module Version
// ------------------------------------

window.STUDENT_LIST_MODULE_VERSION = "V7.0";

// ------------------------------------
// Ready Message
// ------------------------------------

console.log("======================================");
console.log(" School Management System");
console.log(" Student List Module V7 Loaded");
console.log(" Firebase Connected");
console.log("======================================");
