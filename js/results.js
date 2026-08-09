// ==========================================
// School Management System V6
// result.js
// Part 1
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==========================================
// Collection
// ==========================================

const resultRef = collection(db, "results");

// ==========================================
// Global Variables
// ==========================================

let results = [];
let editId = null;

// ==========================================
// Read Form Data
// ==========================================

function getResultData() {

    return {

        studentId: document.getElementById("studentId").value.trim(),

        studentName: document.getElementById("studentName").value.trim(),

        studentClass: document.getElementById("studentClass").value,

        examName: document.getElementById("examName").value,

        bangla: Number(document.getElementById("bangla").value || 0),

        english: Number(document.getElementById("english").value || 0),

        math: Number(document.getElementById("math").value || 0),

        science: Number(document.getElementById("science").value || 0),

        bgs: Number(document.getElementById("bgs").value || 0),

        religion: Number(document.getElementById("religion").value || 0),

        ict: Number(document.getElementById("ict").value || 0),

        resultDate: document.getElementById("resultDate").value

    };

}

// ==========================================
// Validation
// ==========================================

function validateResult(data) {

    if (data.studentId === "") {

        alert("Student ID Required");

        return false;

    }

    if (data.studentName === "") {

        alert("Student Name Required");

        return false;

    }

    return true;

}
// ==========================================
// result.js
// Part 2
// Total, GPA & Save Result
// ==========================================

// GPA Function

function getGPA(mark) {

    if (mark >= 80) return 5.00;
    if (mark >= 70) return 4.00;
    if (mark >= 60) return 3.50;
    if (mark >= 50) return 3.00;
    if (mark >= 40) return 2.00;

    return 0.00;

}

// Grade Function

function getGrade(gpa) {

    if (gpa === 5.00) return "A+";
    if (gpa >= 4.00) return "A";
    if (gpa >= 3.50) return "A-";
    if (gpa >= 3.00) return "B";
    if (gpa >= 2.00) return "C";

    return "F";

}

// ==========================================
// result.js
// Part 3
// Realtime Result List
// ==========================================

// ------------------------------------------
// Realtime Result Data
// ------------------------------------------

const resultQuery = query(
    resultRef,
    orderBy("studentId")
);

onSnapshot(resultQuery, (snapshot) => {

    results = [];

    snapshot.forEach((document) => {

        results.push({

            docId: document.id,

            ...document.data()

        });

    });

    renderResultTable();

});

// ------------------------------------------
// Render Result Table
// ------------------------------------------

function renderResultTable() {

    const table = document.getElementById("resultTable");

    if (!table) return;

    table.innerHTML = "";

    results.forEach((result, index) => {

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${result.studentId}</td>

<td>${result.studentName}</td>

<td>${result.studentClass}</td>

<td>${result.examName}</td>

<td>${result.total}</td>

<td>${result.gpa.toFixed(2)}</td>

<td>${result.grade}</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editResult('${result.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteResult('${result.docId}')">

Delete

</button>

</td>

</tr>

`;

    });

}

// ------------------------------------------
// Total Result Count
// ------------------------------------------

window.totalResults = function () {

    return results.length;

};
// ==========================================
// result.js
// Part 4
// Edit / Delete / Search
// ==========================================

// ------------------------------------------
// Find Result
// ------------------------------------------

function findResult(docId) {

    return results.find(item => item.docId === docId);

}

// ------------------------------------------
// Edit Result
// ------------------------------------------

window.editResult = function (docId) {

    const result = findResult(docId);

    if (!result) return;

    editId = docId;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal("studentId", result.studentId || "");
    setVal("studentName", result.studentName || "");
    setVal("studentClass", result.studentClass || "");
    setVal("examName", result.examName || "");
    setVal("bangla", result.bangla || 0);
    setVal("english", result.english || 0);
    setVal("math", result.math || 0);
    setVal("science", result.science || 0);
    setVal("bgs", result.bgs || 0);
    setVal("religion", result.religion || 0);
    setVal("discipline", result.descipline || 0);
    setVal("resultDate", result.resultDate || "");

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};

// ------------------------------------------
// Delete Result
// ------------------------------------------

window.deleteResult = async function (docId) {

    if (!confirm("Delete this result?")) return;

    try {

        await deleteDoc(doc(db, "results", docId));

        alert("Result Deleted Successfully.");

    }

    catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};

// ------------------------------------------
// Search Result
// ------------------------------------------

window.searchResult = function () {

    const keyword = document
        .getElementById("searchResult")
        .value
        .toLowerCase();

    const table = document.getElementById("resultTable");

    if (!table) return;

    table.innerHTML = "";

    results
        .filter(item =>

            (item.studentId || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (item.studentName || "")
                .toLowerCase()
                .includes(keyword)

            ||

            (item.examName || "")
                .toLowerCase()
                .includes(keyword)

        )

        .forEach((result, index) => {

            table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${result.studentId}</td>

<td>${result.studentName}</td>

<td>${result.studentClass}</td>

<td>${result.examName}</td>

<td>${result.total}</td>

<td>${result.gpa.toFixed(2)}</td>

<td>${result.grade}</td>

<td>

<button class="btn btn-primary btn-sm"
onclick="editResult('${result.docId}')">

Edit

</button>

<button class="btn btn-danger btn-sm"
onclick="deleteResult('${result.docId}')">

Delete

</button>

</td>

</tr>

`;

        });

};
// ==========================================
// result.js
// Part 5
// Result Summary & Print
// ==========================================

// ------------------------------------------
// Pass / Fail Summary
// ------------------------------------------

window.getResultSummary = function () {

    let pass = 0;
    let fail = 0;

    results.forEach(item => {

        if (item.grade === "F") {

            fail++;

        } else {

            pass++;

        }

    });

    const passBox = document.getElementById("passCount");
    const failBox = document.getElementById("failCount");

    if (passBox) {

        passBox.textContent = pass;

    }

    if (failBox) {

        failBox.textContent = fail;

    }

};

// ------------------------------------------
// Refresh Result
// ------------------------------------------

window.refreshResult = function () {

    renderResultTable();

    getResultSummary();

};

// ------------------------------------------
// Print Marksheet
// ------------------------------------------

window.printMarksheet = function () {

    window.print();

};

// ------------------------------------------
// Dashboard Result Count
// ------------------------------------------

window.getTotalResults = function () {

    return results.length;

};

// ------------------------------------------
// Pass Percentage
// ------------------------------------------

window.getPassPercentage = function () {

    if (results.length === 0) return 0;

    const pass = results.filter(item => item.grade !== "F").length;

    return ((pass / results.length) * 100).toFixed(2);

};
// ==========================================
// result.js
// Part 6
// Module Initialization
// ==========================================

// ------------------------------------------
// Initialize Module
// ------------------------------------------

function initializeResultModule() {

    const resultDate = document.getElementById("resultDate");

    if (resultDate && resultDate.value === "") {

        resultDate.value = new Date()
            .toISOString()
            .split("T")[0];

    }

    console.log("Result Module Initialized");

}

// ------------------------------------------
// Auto Initialize
// ------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    initializeResultModule();

});

// ------------------------------------------
// Reload Result Table
// ------------------------------------------

window.reloadResults = function () {

    renderResultTable();
    getResultSummary();

};

// ------------------------------------------
// Reset Form
// ------------------------------------------

window.resetResultForm = function () {

    const form = document.getElementById("resultForm");

    if (form) {

        form.reset();

    }

    editId = null;

    initializeResultModule();

};

// ------------------------------------------
// Module Version
// ------------------------------------------

window.RESULT_MODULE_VERSION = "V6.0";

// ------------------------------------------
// Ready Message
// ------------------------------------------

console.log("======================================");
console.log(" School Management System");
console.log(" Result Module V6 Loaded");
console.log(" Firebase Firestore Connected");
console.log("======================================");
// ==========================================
// result.js
// Part 7 (FINAL)
// ==========================================

// ------------------------------------------
// Duplicate Result Check
// ------------------------------------------

function duplicateResult(data) {

    return results.some(item =>

        item.studentId === data.studentId &&
        item.examName === data.examName &&
        item.docId !== editId

    );

}

// ------------------------------------------
// Final Save Result
// ------------------------------------------

window.saveResult = async function () {

    const data = getResultData();

    if (!validateResult(data)) return;

    if (duplicateResult(data)) {

        alert("Result already exists for this student and exam.");

        return;

    }

    const total =
        data.bangla +
        data.english +
        data.math +
        data.science +
        data.bgs +
        data.religion +
        data.descipline;

    const average = total / 7;

    const gpa = getGPA(average);

    data.total = total;
    data.gpa = gpa;
    data.grade = getGrade(gpa);

    try {

        if (editId === null) {

            await addDoc(resultRef, data);

            alert("Result Saved Successfully.");

        } else {

            await updateDoc(
                doc(db, "results", editId),
                data
            );

            alert("Result Updated Successfully.");

        }

        resetResultForm();

    } catch (error) {

        console.error("Result Save Error:", error);

        alert("Failed to Save Result.");

    }

};

// ------------------------------------------
// Dashboard Helper
// ------------------------------------------

window.getAverageGPA = function () {

    if (results.length === 0) return 0;

    const totalGPA = results.reduce((sum, item) => {

        return sum + Number(item.gpa);

    }, 0);

    return (totalGPA / results.length).toFixed(2);

};

// ------------------------------------------
// Final Ready Message
// ------------------------------------------

console.log("======================================");
console.log(" School Management System V6");
console.log(" Result Module Ready");
console.log(" Firestore Connected Successfully");
console.log("======================================");

window.openMarksheet = function (docId) {

    localStorage.setItem("resultDocId", docId);

    window.location.href = "marksheet.html";

};
