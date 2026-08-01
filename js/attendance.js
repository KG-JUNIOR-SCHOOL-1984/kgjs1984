// ======================================================
// School Management System V6
// attendance.js
//
// Bulk / whole-class attendance: pick Date + Class + Section,
// load every student in that class/section at once, mark each
// one's status, and save all of them in a single batch write —
// instead of picking one student at a time.
// ======================================================

import { db } from "./firebase.js";

import { populateClassDropdown, populateSectionDropdown } from "./classHelper.js";

import {
    collection,
    doc,
    query,
    where,
    getDocs,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Collections
// ======================================================

const attendanceRef = collection(db, "attendance");
const studentsRef = collection(db, "students");

// ======================================================
// Global State
// ======================================================

let currentStudents = [];       // students in the selected class/section
let existingAttendance = {};    // studentId -> existing attendance doc (for the selected date), so re-saving updates instead of duplicating

// ======================================================
// Class / Section Dropdowns
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    await populateClassDropdown("attendanceClass");

    const classSelect = document.getElementById("attendanceClass");

    if (classSelect) {

        classSelect.addEventListener("change", () => {
            populateSectionDropdown("attendanceSection", classSelect.value);
        });

    }

});

// ======================================================
// Load Students For The Selected Class/Section + Date
// ======================================================

window.loadClassAttendance = async function () {

    const date = document.getElementById("attendanceDate").value;
    const className = document.getElementById("attendanceClass").value;
    const section = document.getElementById("attendanceSection").value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    if (!className) {
        alert("Please select a class.");
        return;
    }

    const btn = document.getElementById("loadStudentsBtn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Loading...";

    try {

        // 1. Fetch every student in this class (+ section, if chosen).
        const studentConstraints = [where("studentClass", "==", className)];

        if (section) {
            studentConstraints.push(where("section", "==", section));
        }

        const studentSnap = await getDocs(query(studentsRef, ...studentConstraints));

        currentStudents = studentSnap.docs
            .map((d) => ({ docId: d.id, ...d.data() }))
            .sort((a, b) => (a.roll || 0) - (b.roll || 0) || (a.name || "").localeCompare(b.name || ""));

        if (currentStudents.length === 0) {

            document.getElementById("attendanceListWrapper").style.display = "none";
            document.getElementById("attendanceEmptyState").style.display = "block";
            document.getElementById("attendanceEmptyState").innerText =
                "এই Class/Section-এ কোনো Student পাওয়া যায়নি।";

            return;

        }

        // 2. Fetch any attendance ALREADY marked for this exact date + class
        //    (+ section), so re-opening the same day updates the existing
        //    records instead of creating duplicates.
        const attConstraints = [
            where("attendanceDate", "==", date),
            where("attendanceClass", "==", className)
        ];

        if (section) {
            attConstraints.push(where("attendanceSection", "==", section));
        }

        const attSnap = await getDocs(query(attendanceRef, ...attConstraints));

        existingAttendance = {};

        attSnap.forEach((d) => {
            const data = d.data();
            existingAttendance[data.studentId] = { docId: d.id, ...data };
        });

        renderAttendanceRows();

        document.getElementById("attendanceEmptyState").style.display = "none";
        document.getElementById("attendanceListWrapper").style.display = "block";
        document.getElementById("attendanceClassTitle").innerText =
            `${className}${section ? " - " + section : ""} — ${date} (${currentStudents.length} students)`;

    } catch (error) {

        console.error("Load Class Attendance Error:", error);
        alert("Failed to load students: " + error.message);

    } finally {

        btn.disabled = false;
        btn.innerHTML = originalText;

    }

};

// ======================================================
// Render One Row Per Student
// ======================================================

function renderAttendanceRows() {

    const body = document.getElementById("attendanceStudentsBody");

    body.innerHTML = "";

    currentStudents.forEach((student, index) => {

        const existing = existingAttendance[student.studentId];
        const status = existing ? existing.attendanceStatus : "Present";
        const remarks = existing ? (existing.attendanceRemarks || "") : "";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.studentId || ""}</td>
            <td>${student.name || ""}</td>
            <td>
                <select class="form-select form-select-sm status-select status-${status}"
                        data-student-doc="${student.docId}"
                        onchange="this.className = 'form-select form-select-sm status-select status-' + this.value">
                    <option value="Present" ${status === "Present" ? "selected" : ""}>✅ Present</option>
                    <option value="Absent" ${status === "Absent" ? "selected" : ""}>❌ Absent</option>
                    <option value="Leave" ${status === "Leave" ? "selected" : ""}>🟡 Leave</option>
                    <option value="Late" ${status === "Late" ? "selected" : ""}>🟠 Late</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm remarks-input"
                       data-student-doc="${student.docId}"
                       value="${remarks.replace(/"/g, "&quot;")}" placeholder="Optional">
            </td>
        `;

        body.appendChild(row);

    });

}

// ======================================================
// Mark All Present / Absent
// ======================================================

window.markAll = function (status) {

    document.querySelectorAll(".status-select").forEach((select) => {
        select.value = status;
        select.className = "form-select form-select-sm status-select status-" + status;
    });

};

// ======================================================
// Save All Rows In One Batch
// ======================================================

window.saveClassAttendance = async function () {

    const date = document.getElementById("attendanceDate").value;
    const className = document.getElementById("attendanceClass").value;
    const section = document.getElementById("attendanceSection").value;

    if (currentStudents.length === 0) return;

    try {

        const batch = writeBatch(db);

        currentStudents.forEach((student) => {

            const statusEl = document.querySelector(
                `.status-select[data-student-doc="${student.docId}"]`
            );
            const remarksEl = document.querySelector(
                `.remarks-input[data-student-doc="${student.docId}"]`
            );

            const record = {
                attendanceDate: date,
                attendanceClass: className,
                attendanceSection: section,
                studentDocId: student.docId,
                studentId: student.studentId || "",
                studentName: student.name || "",
                attendanceStatus: statusEl ? statusEl.value : "Present",
                attendanceRemarks: remarksEl ? remarksEl.value.trim() : ""
            };

            const existing = existingAttendance[student.studentId];

            if (existing) {
                batch.set(doc(db, "attendance", existing.docId), record);
            } else {
                batch.set(doc(attendanceRef), record);
            }

        });

        await batch.commit();

        alert(`Attendance saved for ${currentStudents.length} students.`);

        // Refresh so the "already marked" state reflects what was just saved.
        loadClassAttendance();

    } catch (error) {

        console.error("Save Class Attendance Error:", error);
        alert("Failed to save attendance: " + error.message);

    }

};

// ------------------------------------
// Module Version
// ------------------------------------

window.ATTENDANCE_MODULE_VERSION = "V7.0-bulk";

console.log("Attendance Module (bulk class mode) loaded.");
