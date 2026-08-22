// ======================================================
// School Management System
// fees_due.js
//
// "Who still owes this month's fee?" report, across every
// class at once. Only the recurring "Monthly Fee" type is
// tracked here (one-off fees like Admission/Exam are not
// treated as a recurring due).
//
// A student counts as PAID for the selected month if there
// is a fees record with feeType="Monthly Fee",
// feeMonth=<selected month>, paymentStatus="Paid". Anyone
// without such a record (and with a monthlyFee > 0 set on
// their profile) shows up here as due.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { fetchClasses } from "./classHelper.js";

const studentsRef = collection(db, "students");
const feesRef = collection(db, "fees");

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let dueRows = []; // last computed due list, kept for client-side search filtering

// ------------------------------------
// Init
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    // Default the month dropdown to the current month.
    const monthSelect = document.getElementById("dueMonthFilter");

    if (monthSelect) {
        monthSelect.value = MONTHS[new Date().getMonth()];
    }

    await populateClassFilter();

    const searchInput = document.getElementById("dueSearch");

    if (searchInput) {
        searchInput.addEventListener("keyup", filterRenderedRows);
    }

    const classFilter = document.getElementById("dueClassFilter");

    if (classFilter) {
        classFilter.addEventListener("change", () => window.loadDueList());
    }

    // Load immediately on page open (current month, all classes).
    window.loadDueList();

});

async function populateClassFilter() {

    const select = document.getElementById("dueClassFilter");

    if (!select) return;

    try {

        const classes = await fetchClasses();

        classes.forEach((cls) => {

            const opt = document.createElement("option");
            opt.value = cls.name;
            opt.textContent = cls.name;
            select.appendChild(opt);

        });

    } catch (error) {

        console.error("populateClassFilter error:", error);

    }

}

// ------------------------------------
// Load / Compute Due List
// ------------------------------------

window.loadDueList = async function () {

    const month = document.getElementById("dueMonthFilter").value;
    const classFilter = document.getElementById("dueClassFilter").value;

    const statusBox = document.getElementById("dueListStatus");
    const table = document.getElementById("dueTable");

    statusBox.style.display = "block";
    statusBox.className = "text-center text-muted py-4";
    statusBox.innerText = "Loading...";
    table.style.display = "none";

    try {

        // 1) All students (optionally narrowed to one class).
        const studentsSnapshot = classFilter
            ? await getDocs(query(studentsRef, where("studentClass", "==", classFilter)))
            : await getDocs(studentsRef);

        const students = [];
        studentsSnapshot.forEach((docSnap) => students.push({ docId: docSnap.id, ...docSnap.data() }));

        // 2) Everyone who already has a "Paid" Monthly Fee record
        //    for this month.
        const feesSnapshot = await getDocs(
            query(
                feesRef,
                where("feeType", "==", "Monthly Fee"),
                where("feeMonth", "==", month)
            )
        );

        const paidStudentIds = new Set();

        feesSnapshot.forEach((docSnap) => {

            const fee = docSnap.data();

            if (fee.paymentStatus === "Paid" && fee.studentId) {
                paidStudentIds.add(fee.studentId);
            }

        });

        // 3) Anyone with a monthlyFee configured and NOT in the
        //    paid set is due.
        dueRows = students
            .filter((s) => Number(s.monthlyFee || 0) > 0 && !paidStudentIds.has(s.studentId))
            .map((s) => ({
                studentId: s.studentId || "",
                name: s.name || "",
                studentClass: s.studentClass || "",
                section: s.section || "",
                guardianMobile: s.guardianMobile || "",
                amount: Number(s.monthlyFee || 0),
                month
            }))
            .sort((a, b) =>
                a.studentClass.localeCompare(b.studentClass) ||
                a.name.localeCompare(b.name)
            );

        renderDueTable(dueRows);

        statusBox.style.display = "none";
        table.style.display = "";

    } catch (error) {

        console.error(error);

        statusBox.className = "text-center text-danger py-4";
        statusBox.innerText = "Failed to load due list.";

    }

};

function renderDueTable(rows) {

    const body = document.getElementById("dueTableBody");

    body.innerHTML = "";

    let total = 0;

    rows.forEach((row, index) => {

        total += row.amount;

        body.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${row.studentId}</td>
                <td>${row.name}</td>
                <td>${row.studentClass}</td>
                <td>${row.section}</td>
                <td>${row.month}</td>
                <td>৳ ${row.amount}</td>
                <td>${row.guardianMobile}</td>
                <td class="no-print">
                    <a class="btn btn-success btn-sm" href="fees.html?studentId=${encodeURIComponent(row.studentId)}">
                        💰 Collect
                    </a>
                </td>
            </tr>
        `;

    });

    if (rows.length === 0) {

        body.innerHTML = `<tr><td colspan="9" class="text-center text-success">🎉 এই মাসে কোনো বকেয়া নেই!</td></tr>`;

    }

    document.getElementById("dueCount").innerText = rows.length;
    document.getElementById("dueTotal").innerText = total;

}

function filterRenderedRows() {

    const keyword = document.getElementById("dueSearch").value.toLowerCase();

    const rows = document.querySelectorAll("#dueTableBody tr");

    rows.forEach((row) => {

        row.style.display = row.innerText.toLowerCase().includes(keyword) ? "" : "none";

    });

}

console.log("==================================");
console.log("Fees Due List Module Loaded");
console.log("==================================");
