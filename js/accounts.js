// ======================================================
// School Management System
// accounts.js
//
// Combines:
//  - "fees" collection      -> income (already collected via fees.js)
//  - "salary" collection    -> expense (already paid via salary.js)
//  - "income" collection    -> other income entered here (donations, admission fees, etc.)
//  - "expenses" collection  -> other expenses entered here (utilities, supplies, etc.)
// into one summary + combined transaction list.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const incomeRef = collection(db, "income");
const expensesRef = collection(db, "expenses");
const feesRef = collection(db, "fees");
const salaryRef = collection(db, "salary");

let otherIncome = [];
let otherExpenses = [];
let fees = [];
let salaries = [];

// ------------------------------------
// Add Other Income
// ------------------------------------

window.saveIncome = async function () {

    const source = document.getElementById("incomeSource")?.value.trim() || "";
    const amount = Number(document.getElementById("incomeAmount")?.value || 0);
    const date = document.getElementById("incomeDate")?.value || "";
    const note = document.getElementById("incomeNote")?.value.trim() || "";

    if (source === "" || amount <= 0 || date === "") {

        alert("Source, Amount, and Date are required.");

        return;

    }

    try {

        await addDoc(incomeRef, { source, amount, date, note });

        alert("Income Added Successfully.");

        document.getElementById("incomeForm").reset();

    } catch (error) {

        console.error(error);

        alert("Save Failed: " + error.message);

    }

};

// ------------------------------------
// Add Other Expense
// ------------------------------------

window.saveExpense = async function () {

    const category = document.getElementById("expenseCategory")?.value.trim() || "";
    const amount = Number(document.getElementById("expenseAmount")?.value || 0);
    const date = document.getElementById("expenseDate")?.value || "";
    const note = document.getElementById("expenseNote")?.value.trim() || "";

    if (category === "" || amount <= 0 || date === "") {

        alert("Category, Amount, and Date are required.");

        return;

    }

    try {

        await addDoc(expensesRef, { category, amount, date, note });

        alert("Expense Added Successfully.");

        document.getElementById("expenseForm").reset();

    } catch (error) {

        console.error(error);

        alert("Save Failed: " + error.message);

    }

};

// ------------------------------------
// Delete Entries
// ------------------------------------

window.deleteIncome = async function (docId) {

    if (!confirm("Delete this income entry?")) return;

    await deleteDoc(doc(db, "income", docId));

};

window.deleteExpense = async function (docId) {

    if (!confirm("Delete this expense entry?")) return;

    await deleteDoc(doc(db, "expenses", docId));

};

// ------------------------------------
// Realtime Listeners
// ------------------------------------

onSnapshot(query(incomeRef, orderBy("date", "desc")), (snapshot) => {

    otherIncome = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));

    renderAll();

});

onSnapshot(query(expensesRef, orderBy("date", "desc")), (snapshot) => {

    otherExpenses = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));

    renderAll();

});

onSnapshot(feesRef, (snapshot) => {

    fees = snapshot.docs.map((d) => d.data());

    renderAll();

});

onSnapshot(salaryRef, (snapshot) => {

    salaries = snapshot.docs.map((d) => d.data());

    renderAll();

});

// ------------------------------------
// Render Summary + Tables
// ------------------------------------

function sum(list, field) {

    return list.reduce((total, item) => total + (Number(item[field]) || 0), 0);

}

function renderAll() {

    const feesTotal = sum(fees, "amount");
    const otherIncomeTotal = sum(otherIncome, "amount");
    const salaryTotal = sum(salaries, "netSalary");
    const otherExpenseTotal = sum(otherExpenses, "amount");

    const totalIncome = feesTotal + otherIncomeTotal;
    const totalExpense = salaryTotal + otherExpenseTotal;
    const netBalance = totalIncome - totalExpense;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value.toLocaleString();
    };

    setText("feesIncomeTotal", feesTotal);
    setText("otherIncomeTotal", otherIncomeTotal);
    setText("salaryExpenseTotal", salaryTotal);
    setText("otherExpenseTotal", otherExpenseTotal);
    setText("totalIncome", totalIncome);
    setText("totalExpense", totalExpense);
    setText("netBalance", netBalance);

    const incomeTable = document.getElementById("incomeTableBody");

    if (incomeTable) {

        incomeTable.innerHTML = otherIncome.map((item) => `
<tr>
<td>${item.date || ""}</td>
<td>${item.source || ""}</td>
<td>${(item.amount || 0).toLocaleString()}</td>
<td>${item.note || ""}</td>
<td><button class="btn btn-danger btn-sm" onclick="deleteIncome('${item.docId}')">Delete</button></td>
</tr>
`).join("");

    }

    const expenseTable = document.getElementById("expenseTableBody");

    if (expenseTable) {

        expenseTable.innerHTML = otherExpenses.map((item) => `
<tr>
<td>${item.date || ""}</td>
<td>${item.category || ""}</td>
<td>${(item.amount || 0).toLocaleString()}</td>
<td>${item.note || ""}</td>
<td><button class="btn btn-danger btn-sm" onclick="deleteExpense('${item.docId}')">Delete</button></td>
</tr>
`).join("");

    }

}

console.log("Accounts Module Ready");
