// ======================================================
// School Management System V8
// fees.js
//
// Student Fee Collection page.
//  - Search a student, see which months' Monthly Fee are
//    still due right on this page.
//  - Add several fee rows (different months / fee types)
//    for the SAME student and save them all in one go
//    (one Firestore batch write), instead of repeating the
//    whole add-fee flow one month at a time.
//  - Still supports editing a single existing fee record
//    (arrives here via the "Edit" button on fees_list.html).
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collections
// ======================================================

const feesRef = collection(db, "fees");
const studentsRef = collection(db, "students");

// ======================================================
// Constants / Global State
// ======================================================

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const FEE_TYPES = [
    "Monthly Fee", "Admission Fee", "Exam Fee", "Session Fee",
    "Registration Fee", "Transport Fee", "Library Fee", "Fine", "Other"
];

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank"];

let selectedStudent = null;   // { docId, studentId, name, studentClass, roll, monthlyFee, admissionDate, ... }
let studentFeeRecords = [];   // all existing fee docs for the loaded student
let dueMonths = [];           // month names currently unpaid for the loaded student
let isSaving = false;
let rowSeq = 0;                // unique id generator for table rows

const VERSION = "V8.0";

// ======================================================
// Utility
// ======================================================

function today() {
    return new Date().toISOString().split("T")[0];
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function optionsHtml(list, placeholder) {
    let html = placeholder ? `<option value="">${placeholder}</option>` : "";
    list.forEach((item) => { html += `<option>${item}</option>`; });
    return html;
}

// ======================================================
// Student Search / Info
// ======================================================

async function loadStudentInfo() {

    const studentId = document.getElementById("studentId").value.trim();

    if (studentId === "") return;

    try {

        const q = query(studentsRef, where("studentId", "==", studentId));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            alert("Student Not Found.");

            clearStudentInfo();

            return;

        }

        snapshot.forEach((docSnap) => {

            selectedStudent = { docId: docSnap.id, ...docSnap.data() };

        });

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("studentName", selectedStudent.name || "");
        setVal("studentClass", selectedStudent.studentClass || "");
        setVal("studentRoll", selectedStudent.roll || "");

        await refreshStudentFeeRecords();

        renderDueSummary();

        // Fresh search (not an edit-in-progress) -> reset the rows
        // table to one clean row ready for entry.
        if (window.__feeEditMode !== true) {

            resetRows();

        }

    } catch (error) {

        console.error(error);

        alert("Failed to Load Student.");

    }

}

function clearStudentInfo() {

    selectedStudent = null;
    studentFeeRecords = [];
    dueMonths = [];

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal("studentName", "");
    setVal("studentClass", "");
    setVal("studentRoll", "");

    hideDueBoxes();

}

async function refreshStudentFeeRecords() {

    if (!selectedStudent) {
        studentFeeRecords = [];
        return;
    }

    try {

        const q = query(feesRef, where("studentId", "==", selectedStudent.studentId));

        const snapshot = await getDocs(q);

        studentFeeRecords = [];

        snapshot.forEach((docSnap) => {
            studentFeeRecords.push({ docId: docSnap.id, ...docSnap.data() });
        });

    } catch (error) {

        console.error(error);

        studentFeeRecords = [];

    }

}

const studentInput = document.getElementById("studentId");

if (studentInput) {
    studentInput.addEventListener("change", loadStudentInfo);
}

window.loadStudentInfo = loadStudentInfo;
window.clearStudentInfo = clearStudentInfo;

// ======================================================
// Due Months Summary
//
// Only "Monthly Fee" is treated as a recurring due -- one-off
// fee types (Admission, Exam, etc.) are not tracked as "due".
// Since fee records only store a month NAME (no year), this
// checks months within the current calendar year, starting
// from the student's admission month if that falls in the
// current year, otherwise from January.
// ======================================================

function computeDueMonths() {

    dueMonths = [];

    if (!selectedStudent) return;

    const monthlyFee = Number(selectedStudent.monthlyFee || 0);

    if (monthlyFee <= 0) return; // no monthly fee configured -- nothing to compute

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth(); // 0 = January

    let startMonthIndex = 0;

    const admission = selectedStudent.admissionDate
        ? new Date(selectedStudent.admissionDate)
        : null;

    if (admission && !isNaN(admission) && admission.getFullYear() === currentYear) {
        startMonthIndex = admission.getMonth();
    }

    for (let i = startMonthIndex; i <= currentMonthIndex; i++) {

        const monthName = MONTHS[i];

        const paid = studentFeeRecords.some((fee) =>
            fee.feeType === "Monthly Fee" &&
            fee.feeMonth === monthName &&
            fee.paymentStatus === "Paid"
        );

        if (!paid) {
            dueMonths.push(monthName);
        }

    }

}

function hideDueBoxes() {

    document.getElementById("dueSummaryBox")?.classList.add("d-none");
    document.getElementById("noDueBox")?.classList.add("d-none");

}

function renderDueSummary() {

    computeDueMonths();

    const dueBox = document.getElementById("dueSummaryBox");
    const dueText = document.getElementById("dueSummaryText");
    const noDueBox = document.getElementById("noDueBox");

    if (!dueBox || !noDueBox) return;

    const monthlyFee = Number(selectedStudent?.monthlyFee || 0);

    if (monthlyFee <= 0) {

        hideDueBoxes();

        return;

    }

    if (dueMonths.length > 0) {

        const total = dueMonths.length * monthlyFee;

        dueText.innerHTML =
            `${dueMonths.join(", ")} &nbsp; (মোট বকেয়া: ৳ ${total}) ` +
            `<button type="button" class="btn btn-sm btn-danger ms-2" onclick="addAllDueMonths()">➕ সব বকেয়া মাস যোগ করুন</button>`;

        dueBox.classList.remove("d-none");
        noDueBox.classList.add("d-none");

    } else {

        dueBox.classList.add("d-none");
        noDueBox.classList.remove("d-none");

    }

}

// One click: add a ready-to-save row for every due month, all
// pre-filled as "Monthly Fee" / student's monthlyFee amount --
// this is the "collect many months' fees at once" shortcut.
window.addAllDueMonths = function () {

    if (!selectedStudent || dueMonths.length === 0) return;

    // If the table only has the single blank starter row, drop it
    // first so we don't leave an empty row mixed in.
    const body = document.getElementById("feeRowsBody");
    const existingRows = body ? Array.from(body.querySelectorAll("tr")) : [];

    if (existingRows.length === 1 && rowIsBlank(existingRows[0])) {
        existingRows[0].remove();
    }

    dueMonths.forEach((monthName) => {

        addFeeRow({
            feeMonth: monthName,
            feeType: "Monthly Fee",
            amount: Number(selectedStudent.monthlyFee || 0),
            paymentDate: today(),
            paymentMethod: "Cash",
            paymentStatus: "Paid",
            remarks: ""
        });

    });

};

function rowIsBlank(row) {

    const month = row.querySelector(".row-month")?.value || "";
    const type = row.querySelector(".row-type")?.value || "";
    const amount = row.querySelector(".row-amount")?.value || "";

    return month === "" && type === "" && amount === "";

}

// ======================================================
// Fee Rows Table (multi-row entry)
// ======================================================

function addFeeRow(prefill) {

    const body = document.getElementById("feeRowsBody");

    if (!body) return;

    rowSeq += 1;

    const rowId = `row-${rowSeq}`;

    const data = prefill || {};

    const tr = document.createElement("tr");
    tr.id = rowId;
    if (data.docId) tr.dataset.docId = data.docId;

    tr.innerHTML = `
        <td>
            <select class="form-select form-select-sm row-month">
                ${optionsHtml(MONTHS, "Select Month")}
            </select>
        </td>
        <td>
            <select class="form-select form-select-sm row-type">
                ${optionsHtml(FEE_TYPES, "Select Fee")}
            </select>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm row-amount" placeholder="0">
        </td>
        <td>
            <input type="date" class="form-control form-control-sm row-date">
        </td>
        <td>
            <select class="form-select form-select-sm row-method">
                ${optionsHtml(PAYMENT_METHODS, "")}
            </select>
        </td>
        <td>
            <select class="form-select form-select-sm row-status">
                <option value="Paid">✅ Paid</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Partial">🟠 Partial</option>
            </select>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm row-remarks" placeholder="Remarks">
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeFeeRow('${rowId}')">✖</button>
        </td>
    `;

    body.appendChild(tr);

    const setSel = (cls, val) => { const el = tr.querySelector(cls); if (el && val !== undefined) el.value = val; };

    setSel(".row-month", data.feeMonth || "");
    setSel(".row-type", data.feeType || "");
    if (data.amount !== undefined) tr.querySelector(".row-amount").value = data.amount || "";
    tr.querySelector(".row-date").value = data.paymentDate || today();
    setSel(".row-method", data.paymentMethod || "Cash");
    setSel(".row-status", data.paymentStatus || "Paid");
    tr.querySelector(".row-remarks").value = data.remarks || "";

}

window.addFeeRow = () => addFeeRow();

window.removeFeeRow = function (rowId) {

    const body = document.getElementById("feeRowsBody");

    const row = document.getElementById(rowId);

    if (row) row.remove();

    // Never leave the table completely empty.
    if (body && body.querySelectorAll("tr").length === 0) {
        addFeeRow();
    }

};

function resetRows() {

    const body = document.getElementById("feeRowsBody");

    if (body) body.innerHTML = "";

    addFeeRow();

}

// ======================================================
// Collect + Validate Row Data
// ======================================================

function collectRows() {

    const body = document.getElementById("feeRowsBody");

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr")).map((row) => ({

        rowEl: row,

        docId: row.dataset.docId || null,

        data: {
            studentId: selectedStudent ? selectedStudent.studentId : "",
            studentName: selectedStudent ? (selectedStudent.name || "") : "",
            studentClass: selectedStudent ? (selectedStudent.studentClass || "") : "",
            studentRoll: selectedStudent ? (selectedStudent.roll || "") : "",
            feeMonth: row.querySelector(".row-month").value,
            feeType: row.querySelector(".row-type").value,
            amount: Number(row.querySelector(".row-amount").value || 0),
            paymentDate: row.querySelector(".row-date").value,
            paymentMethod: row.querySelector(".row-method").value,
            remarks: row.querySelector(".row-remarks").value.trim(),
            paymentStatus: row.querySelector(".row-status").value
        }

    }));

}

function validateRow(data, rowNumber) {

    if (data.feeMonth === "") return `Row ${rowNumber}: Select Month`;
    if (data.feeType === "") return `Row ${rowNumber}: Select Fee Type`;
    if (data.amount <= 0) return `Row ${rowNumber}: Invalid Amount`;
    if (data.paymentDate === "") return `Row ${rowNumber}: Select Payment Date`;

    return null;

}

// ======================================================
// Save All (batch add + any in-place edits)
// ======================================================

async function saveAllFees(e) {

    if (e) e.preventDefault();

    if (isSaving) return;

    if (!selectedStudent) {
        alert("Load a Student First (enter Student ID).");
        return;
    }

    const rows = collectRows();

    for (let i = 0; i < rows.length; i++) {

        const error = validateRow(rows[i].data, i + 1);

        if (error) {
            alert(error);
            return;
        }

    }

    if (rows.length === 0) {
        alert("Add at least one fee row.");
        return;
    }

    isSaving = true;

    const btn = document.getElementById("feeSaveBtn");
    const originalBtnText = btn ? btn.innerHTML : "";

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Saving...";
    }

    const stuckWarning = setTimeout(() => {
        alert(
            "Taking longer than expected. Please check your internet " +
            "connection and try again. If this keeps happening, your " +
            "network may be blocking Firebase (googleapis.com / gstatic.com)."
        );
    }, 8000);

    try {

        const batch = writeBatch(db);

        rows.forEach(({ docId, data }) => {

            if (docId) {
                batch.update(doc(db, "fees", docId), data);
            } else {
                batch.set(doc(feesRef), data);
            }

        });

        await batch.commit();

        alert(rows.length > 1
            ? `${rows.length} Fee Records Saved Successfully.`
            : "Fee Saved Successfully.");

        window.__feeEditMode = false;

        await refreshStudentFeeRecords();

        renderDueSummary();

        resetRows();

    } catch (error) {

        console.error(error);

        alert("Save Failed: " + (error && error.message ? error.message : "Unknown error"));

    } finally {

        clearTimeout(stuckWarning);

        isSaving = false;

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
        }

    }

}

window.saveAllFees = saveAllFees;

const feeForm = document.getElementById("feeForm");

if (feeForm) {
    feeForm.addEventListener("submit", saveAllFees);
}

// ======================================================
// Reset Form
// ======================================================

window.resetFeeForm = function () {

    window.__feeEditMode = false;

    document.getElementById("studentId").value = "";

    clearStudentInfo();

    resetRows();

};

// ======================================================
// Edit a Single Existing Fee
// (arrives here via fees_list.html's Edit button, which
// stores the doc id in localStorage and redirects here)
// ======================================================

async function loadFeeForEdit() {

    const docId = localStorage.getItem("editFeeId");

    if (!docId) return;

    localStorage.removeItem("editFeeId");

    await window.editFee(docId);

}

async function loadFeeForStudentFromQuery() {

    const params = new URLSearchParams(window.location.search);

    const studentId = params.get("studentId");

    if (!studentId) return;

    document.getElementById("studentId").value = studentId;

    await loadStudentInfo();

}

window.editFee = async function (docId) {

    try {

        const snapshot = await getDoc(doc(db, "fees", docId));

        if (!snapshot.exists()) {
            alert("Fee Record Not Found.");
            return;
        }

        const fee = snapshot.data();

        window.__feeEditMode = true;

        document.getElementById("studentId").value = fee.studentId || "";

        await loadStudentInfo();

        const body = document.getElementById("feeRowsBody");

        if (body) body.innerHTML = "";

        addFeeRow({
            docId,
            feeMonth: fee.feeMonth || "",
            feeType: fee.feeType || "",
            amount: fee.amount || "",
            paymentDate: fee.paymentDate || today(),
            paymentMethod: fee.paymentMethod || "Cash",
            paymentStatus: fee.paymentStatus || "Paid",
            remarks: fee.remarks || ""
        });

        window.__feeEditMode = false; // one-shot: a fresh student search afterwards behaves normally again

        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {

        console.error(error);

        alert("Edit Failed.");

    }

};

window.deleteFee = async function (docId) {

    if (!confirm("Delete this fee record?")) return;

    try {

        await deleteDoc(doc(db, "fees", docId));

        alert("Fee Deleted Successfully.");

    } catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};

// ======================================================
// Initialize
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    resetRows();

    loadFeeForEdit();

    loadFeeForStudentFromQuery();

});

console.log("==================================");
console.log("Fee Management Module Loaded");
console.log("Version:", VERSION);
console.log("==================================");
