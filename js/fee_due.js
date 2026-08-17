// ======================================================
// School Management System
// fee_due.js
// Monthly Fee Due Report
// ======================================================
// Logic: A student is considered "Due" for the selected
// Month + Year unless a "fees" record exists for that
// student where feeType == "Monthly Fee", feeMonth ==
// selected month, paymentStatus == "Paid", and the year
// of paymentDate matches the selected year.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const studentsRef = collection(db, "students");
const feesRef = collection(db, "fees");

// -------------------------------------
// Populate Year Dropdown
// -------------------------------------

function populateYears() {

    const yearSelect = document.getElementById("dueYear");

    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();

    for (let y = currentYear - 2; y <= currentYear + 1; y++) {

        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;

        if (y === currentYear) {
            opt.selected = true;
        }

        yearSelect.appendChild(opt);

    }

}

// -------------------------------------
// Set Default Month To Current Month
// -------------------------------------

function setDefaultMonth() {

    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    const monthSelect = document.getElementById("dueMonth");

    if (!monthSelect) return;

    monthSelect.value = monthNames[new Date().getMonth()];

}

// -------------------------------------
// Load Due List
// -------------------------------------

window.loadDueList = async function () {

    const monthEl = document.getElementById("dueMonth");
    const yearEl = document.getElementById("dueYear");
    const classEl = document.getElementById("dueClass");
    const loadingMsg = document.getElementById("loadingMsg");
    const tableBody = document.getElementById("dueTableBody");

    const selectedMonth = monthEl.value;
    const selectedYear = Number(yearEl.value);
    const selectedClass = classEl.value;

    tableBody.innerHTML = "";
    loadingMsg.style.display = "";

    try {

        // ---------------------------------
        // Load Active Students (with a monthly fee set)
        // ---------------------------------

        let studentQuery = query(
            studentsRef,
            where("status", "==", "Active")
        );

        const studentSnapshot = await getDocs(studentQuery);

        let students = [];

        studentSnapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (Number(data.monthlyFee || 0) <= 0) return;

            if (selectedClass && data.studentClass !== selectedClass) return;

            students.push({
                docId: docSnap.id,
                ...data
            });

        });

        // ---------------------------------
        // Load Fee Records For Selected Month
        // ---------------------------------

        const feeQuery = query(
            feesRef,
            where("feeType", "==", "Monthly Fee"),
            where("feeMonth", "==", selectedMonth),
            where("paymentStatus", "==", "Paid")
        );

        const feeSnapshot = await getDocs(feeQuery);

        // Set of studentId(s) who already paid this month/year
        const paidSet = new Set();

        feeSnapshot.forEach((docSnap) => {

            const fee = docSnap.data();

            if (!fee.paymentDate) return;

            const paidYear = new Date(fee.paymentDate).getFullYear();

            if (paidYear === selectedYear && fee.studentId) {
                paidSet.add(fee.studentId);
            }

        });

        // ---------------------------------
        // Build Due List
        // ---------------------------------

        const dueStudents = students.filter(
            (s) => !paidSet.has(s.studentId)
        );

        renderDueTable(dueStudents, selectedMonth, selectedYear);

    } catch (error) {

        console.error("Fee Due Load Error:", error);

        tableBody.innerHTML = `
<tr><td colspan="8" class="text-center text-danger py-4">
ডেটা লোড করতে সমস্যা হয়েছে। Console এ error দেখুন।
</td></tr>
`;

    } finally {

        loadingMsg.style.display = "none";

    }

};

// -------------------------------------
// Render Table
// -------------------------------------

function renderDueTable(dueStudents, month, year) {

    const tableBody = document.getElementById("dueTableBody");
    const dueCount = document.getElementById("dueCount");
    const dueTotal = document.getElementById("dueTotal");

    if (dueStudents.length === 0) {

        tableBody.innerHTML = `
<tr><td colspan="8" class="text-center text-success py-4">
🎉 ${month} ${year} মাসের ফি সবাই পরিশোধ করেছে। কোনো বকেয়া নেই।
</td></tr>
`;

        dueCount.textContent = "0";
        dueTotal.textContent = "৳ 0";

        return;

    }

    let total = 0;

    tableBody.innerHTML = dueStudents.map((s, index) => {

        total += Number(s.monthlyFee || 0);

        return `
<tr>
<td>${index + 1}</td>
<td>${s.studentId || "-"}</td>
<td>${s.name || "-"}</td>
<td>${s.studentClass || "-"}</td>
<td>${s.roll || "-"}</td>
<td>৳ ${Number(s.monthlyFee || 0).toLocaleString()}</td>
<td><span class="badge bg-danger">Due</span></td>
<td>
<button class="btn btn-primary btn-sm" onclick="collectFee('${s.studentId}','${month}',${Number(s.monthlyFee || 0)})">
💳 Collect
</button>
</td>
</tr>
`;

    }).join("");

    dueCount.textContent = dueStudents.length;
    dueTotal.textContent = "৳ " + total.toLocaleString();

}

// -------------------------------------
// Redirect To Fees Page (Prefilled)
// -------------------------------------

window.collectFee = function (studentId, month, amount) {

    const params = new URLSearchParams({
        studentId: studentId,
        feeMonth: month,
        feeType: "Monthly Fee",
        amount: amount
    });

    window.location.href = "fees.html?" + params.toString();

};

// -------------------------------------
// Init
// -------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    populateYears();
    setDefaultMonth();
    loadDueList();

});

console.log("Fee Due Module Loaded");
  
