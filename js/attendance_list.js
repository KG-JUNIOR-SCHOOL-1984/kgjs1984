// ======================================================
// School Management System V7
// attendance_list.js
//
// Lists every saved attendance record (across all classes/
// dates), with search + delete. To correct a record, go back
// to attendance.html, load that class/date again, and re-save
// — existing records for that day are updated, not duplicated.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    doc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const attendanceRef = collection(db, "attendance");

let attendance = [];

// ======================================================
// Realtime Listing
// ======================================================

const attendanceQuery = query(attendanceRef, orderBy("attendanceDate", "desc"));

onSnapshot(attendanceQuery, (snapshot) => {

    attendance = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));

    renderTable(attendance);

});

// ======================================================
// Render Table
// ======================================================

function renderTable(list) {

    const body = document.getElementById("attendanceTableBody");

    if (!body) return;

    document.getElementById("totalAttendance").innerText = list.length;

    if (list.length === 0) {

        body.innerHTML = '<tr><td colspan="9" class="text-muted">No attendance records found.</td></tr>';

        return;

    }

    const statusBadge = {
        Present: '<span class="badge bg-success">Present</span>',
        Absent: '<span class="badge bg-danger">Absent</span>',
        Leave: '<span class="badge bg-warning text-dark">Leave</span>',
        Late: '<span class="badge bg-orange bg-warning text-dark">Late</span>'
    };

    body.innerHTML = list.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.attendanceDate || ""}</td>
            <td>${item.studentId || ""}</td>
            <td>${item.studentName || ""}</td>
            <td>${item.attendanceClass || ""}</td>
            <td>${item.attendanceSection || ""}</td>
            <td>${statusBadge[item.attendanceStatus] || (item.attendanceStatus || "")}</td>
            <td>${item.attendanceRemarks || ""}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteAttendance('${item.docId}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

}

// ======================================================
// Search / Filter
// ======================================================

window.searchAttendance = function () {

    const keyword = (document.getElementById("searchAttendance").value || "").toLowerCase();
    const status = document.getElementById("statusFilter").value;

    const filtered = attendance.filter((item) => {

        const matchesKeyword =
            (item.studentId || "").toLowerCase().includes(keyword) ||
            (item.studentName || "").toLowerCase().includes(keyword) ||
            (item.attendanceClass || "").toLowerCase().includes(keyword);

        const matchesStatus = !status || item.attendanceStatus === status;

        return matchesKeyword && matchesStatus;

    });

    renderTable(filtered);

};

// ======================================================
// Delete
// ======================================================

window.deleteAttendance = async function (docId) {

    if (!confirm("Delete this attendance record?")) return;

    try {

        await deleteDoc(doc(db, "attendance", docId));

        alert("Attendance record deleted.");

    } catch (error) {

        console.error("Delete Attendance Error:", error);

        alert("Failed to delete: " + error.message);

    }

};
