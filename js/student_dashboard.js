// ======================================================
// School Management System
// student_dashboard.js
//
// The student-facing portal. Only accessible to accounts
// whose users/{uid} document has role:"student" (see
// studentGuard() in auth.js, called from the page itself).
//
// Looks up the student's own studentId from users/{uid},
// then queries attendance / fees / results / routine /
// notices scoped to that student — never the full collections.
// ======================================================

import { db, auth } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { renderNoticeFeed } from "./noticesFeed.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const DEFAULT_PHOTO = "https://via.placeholder.com/170";

let studentId = "";
let studentClass = "";

// ------------------------------------
// Load Everything
// ------------------------------------

async function loadStudentPortal() {

    const user = auth.currentUser;

    if (!user) return;

    try {

        // 1. Find which student this login belongs to.
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists() || !userSnap.data().studentDocId) {

            document.getElementById("portalContent").innerHTML =
                '<div class="alert alert-warning">This login isn\'t linked to a student record. Please contact the school office.</div>';

            return;

        }

        const studentDocId = userSnap.data().studentDocId;

        // 2. Load the student's profile.
        const studentSnap = await getDoc(doc(db, "students", studentDocId));

        if (!studentSnap.exists()) return;

        const student = studentSnap.data();

        studentId = student.studentId;
        studentClass = student.studentClass;

        renderProfile(student);

        // 3. Load everything scoped to this student, in parallel.
        await Promise.all([
            loadAttendance(),
            loadFees(),
            loadResults(),
            loadRoutine()
        ]);

        renderNoticeFeed("students");

    } catch (error) {

        console.error(error);

    }

}

// ------------------------------------
// Profile Card
// ------------------------------------

function renderProfile(student) {

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "-";
    };

    setText("pName", student.name);
    setText("pId", student.studentId);
    setText("pClass", student.studentClass);
    setText("pSection", student.section);
    setText("pRoll", student.roll);

    const img = document.getElementById("pPhoto");

    if (img) img.src = student.photo || DEFAULT_PHOTO;

}

// ------------------------------------
// Attendance Summary
// ------------------------------------

async function loadAttendance() {

    const q = query(
        collection(db, "attendance"),
        where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);

    let present = 0, absent = 0, leave = 0;

    const rows = [];

    snapshot.forEach((docSnap) => {

        const item = docSnap.data();

        const status = (item.attendanceStatus || "").toLowerCase();

        if (status === "present") present++;
        else if (status === "absent") absent++;
        else if (status === "leave") leave++;

        rows.push(item);

    });

    rows.sort((a, b) => (b.attendanceDate || "").localeCompare(a.attendanceDate || ""));

    document.getElementById("attPresent").textContent = present;
    document.getElementById("attAbsent").textContent = absent;
    document.getElementById("attLeave").textContent = leave;

    const table = document.getElementById("attendanceTableBody");

    if (table) {

        table.innerHTML = rows.slice(0, 15).map((item) => `
<tr>
<td>${item.attendanceDate || ""}</td>
<td><span class="badge bg-${item.attendanceStatus === "Present" ? "success" : item.attendanceStatus === "Absent" ? "danger" : "warning"}">${item.attendanceStatus || ""}</span></td>
<td>${item.attendanceRemarks || ""}</td>
</tr>
`).join("") || '<tr><td colspan="3" class="text-muted">No attendance records yet</td></tr>';

    }

}

// ------------------------------------
// Fees
// ------------------------------------

async function loadFees() {

    const q = query(
        collection(db, "fees"),
        where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);

    let totalPaid = 0;

    const rows = [];

    snapshot.forEach((docSnap) => {

        const fee = docSnap.data();

        if ((fee.paymentStatus || "").toLowerCase() === "paid") {

            totalPaid += Number(fee.amount) || 0;

        }

        rows.push(fee);

    });

    document.getElementById("feesPaidTotal").textContent = totalPaid.toLocaleString();

    const table = document.getElementById("feesTableBody");

    if (table) {

        table.innerHTML = rows.map((fee) => `
<tr>
<td>${fee.feeMonth || ""}</td>
<td>${fee.feeType || ""}</td>
<td>৳ ${(fee.amount || 0).toLocaleString()}</td>
<td><span class="badge bg-${fee.paymentStatus === "Paid" ? "success" : "warning"}">${fee.paymentStatus || ""}</span></td>
</tr>
`).join("") || '<tr><td colspan="4" class="text-muted">No fee records yet</td></tr>';

    }

}

// ------------------------------------
// Results
// ------------------------------------

async function loadResults() {

    const q = query(
        collection(db, "results"),
        where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);

    const table = document.getElementById("resultsTableBody");

    if (!table) return;

    const rows = snapshot.docs.map((d) => d.data());

    table.innerHTML = rows.map((r) => `
<tr>
<td>${r.examName || ""}</td>
<td>${r.total ?? ""}</td>
<td>${r.gpa ?? ""}</td>
<td>${r.grade ?? ""}</td>
</tr>
`).join("") || '<tr><td colspan="4" class="text-muted">No results published yet</td></tr>';

}

// ------------------------------------
// Routine
// ------------------------------------

async function loadRoutine() {

    const container = document.getElementById("routineView");

    if (!container || !studentClass) return;

    try {

        const snapshot = await getDoc(doc(db, "routines", studentClass));

        if (!snapshot.exists()) {

            container.innerHTML = '<p class="text-muted">No routine published for your class yet.</p>';

            return;

        }

        const days = snapshot.data().days || {};

        container.innerHTML = Object.keys(days).map((day) => {

            const periods = days[day] || [];

            if (periods.length === 0) return "";

            const rows = periods.map((p) => `
<tr><td>${p.time || ""}</td><td>${p.subject || ""}</td><td>${p.teacher || ""}</td></tr>
`).join("");

            return `
<h6 class="mt-3">${day}</h6>
<table class="table table-sm">
<thead><tr><th>Time</th><th>Subject</th><th>Teacher</th></tr></thead>
<tbody>${rows}</tbody>
</table>
`;

        }).join("") || '<p class="text-muted">No routine published for your class yet.</p>';

    } catch (error) {

        console.error(error);

    }

}

// ------------------------------------
// Initialize
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    // studentGuard() (from auth.js) also runs on this page and will
    // redirect away anyone who isn't a signed-in student; here we just
    // wait for Firebase to confirm the user so auth.currentUser is
    // reliably populated before we query their data.
    onAuthStateChanged(auth, (user) => {

        if (user) {

            loadStudentPortal();

        }

    });

});

console.log("Student Portal Ready");
