// ======================================================
// School Management System V7
// fees_list.js
// Part 1
// Firebase + Load Fee Collection
// ======================================================

import { db } from "./firebase.js";

import {

collection,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Collection
// ======================================================

const feesRef = collection(db,"fees");

// ======================================================
// Global Variables
// ======================================================

let fees=[];

// ======================================================
// Load Fee List
//
// NOTE: We deliberately do NOT use orderBy("paymentDate")
// here. Firestore silently excludes any document that is
// missing the field you order by -- so fee records saved
// without a paymentDate (or through an older/different
// entry path) would vanish from this list entirely. We
// pull every record and sort client-side instead, so every
// student's fee record always shows up.
// ======================================================

onSnapshot(feesRef,(snapshot)=>{

fees=[];

snapshot.forEach((doc)=>{

fees.push({

docId:doc.id,

...doc.data()

});

});

fees.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));

renderFeeTable();

});

console.log("Fee List Module Part 1 Loaded");
// ======================================================
// fees_list.js
// Part 2
// Render Fee Table
// ======================================================

function renderFeeTable(){

const table=document.getElementById("feeTableBody");

if(!table) return;

const rowsHtml = fees.map((fee,index)=>{

const searchBlob = [
    fee.studentId,
    fee.studentName,
    fee.studentClass,
    fee.feeMonth,
    fee.feeType,
    fee.paymentDate,
    fee.paymentStatus
].join(" ").toLowerCase();

return `

<tr data-feetype="${fee.feeType||""}" data-status="${fee.paymentStatus||"Paid"}" data-amount="${fee.amount||0}" data-search="${searchBlob.replace(/"/g,'&quot;')}">

<td>${index+1}</td>

<td>${fee.studentId||""}</td>

<td>${fee.studentName||""}</td>

<td>${fee.studentClass||""}</td>

<td>${fee.feeMonth||""}</td>

<td>${fee.feeType||""}</td>

<td>৳ ${fee.amount||0}</td>

<td>${fee.paymentDate||""}</td>

<td>

<span class="badge bg-${
fee.paymentStatus==="Paid"
?"success"
:fee.paymentStatus==="Pending"
?"danger"
:"warning"
}">

${fee.paymentStatus||"Paid"}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editFee('${fee.docId}')">

✏ Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteFee('${fee.docId}')">

🗑 Delete

</button>

<button
class="btn btn-success btn-sm"
onclick="printFee('${fee.docId}')">

🖨 Print

</button>

</td>

</tr>

`;

}).join("");

table.innerHTML = rowsHtml;

document.getElementById("totalFees").innerText=fees.length;

}
// ======================================================
// fees_list.js
// Part 3
// Search + Status Filter
// ======================================================

// -------------------------------------
// Search Fee
// -------------------------------------

function applyFeeFilters() {

const keyword = document
.getElementById("searchFee")
.value
.toLowerCase();

const status = document
.getElementById("statusFilter")
.value;

const month = document
.getElementById("monthFilter")
.value;

const typeFilterEl = document.getElementById("typeFilter");
const type = typeFilterEl ? typeFilterEl.value : "";

const rows = document.querySelectorAll("#feeTableBody tr");

let visible = 0;
let visibleTotal = 0;

rows.forEach(row=>{

const searchBlob = row.dataset.search || "";

const matchKeyword =
keyword === "" ||
searchBlob.includes(keyword);

const matchStatus =
status==="" ||
row.dataset.status === status;

const matchMonth =
month==="" ||
searchBlob.includes(month.toLowerCase());

const matchType =
type==="" ||
row.dataset.feetype === type;

if(matchKeyword && matchStatus && matchMonth && matchType){

row.style.display="";

visible++;

if (row.dataset.status === "Paid") {
    visibleTotal += Number(row.dataset.amount || 0);
}

}else{

row.style.display="none";

}

});

document.getElementById("totalFees").innerText = visible;

const totalAmountEl = document.getElementById("totalAmount");

if (totalAmountEl) {
    totalAmountEl.innerText = "৳ " + visibleTotal.toLocaleString();
}

}

// Debounce so typing quickly doesn't re-filter on every keystroke
let feeSearchTimer = null;

window.searchFee = function () {

clearTimeout(feeSearchTimer);

feeSearchTimer = setTimeout(applyFeeFilters, 200);

};

// -------------------------------------
// Type Filter
// -------------------------------------

const typeFilter =
document.getElementById("typeFilter");

if(typeFilter){

typeFilter.addEventListener(

"change",

applyFeeFilters

);

}

// -------------------------------------
// Status + Month Filter
// -------------------------------------

const statusFilter =
document.getElementById("statusFilter");

if(statusFilter){

statusFilter.addEventListener(

"change",

searchFee

);

}

const monthFilter =
document.getElementById("monthFilter");

if(monthFilter){

monthFilter.addEventListener(

"change",

searchFee

);

}
// ======================================================
// fees_list.js
// Part 4
// Edit + Delete + Print
// ======================================================

// -------------------------------------
// Edit Fee
// -------------------------------------

window.editFee = function(docId){

localStorage.setItem(

"editFeeId",

docId

);

window.location.href =

"fees.html";

};

// -------------------------------------
// Delete Fee
// -------------------------------------

import {

doc,
deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.deleteFee = async function(docId){

if(!confirm("Delete this fee record?"))

return;

try{

await deleteDoc(

doc(db,"fees",docId)

);

alert("Fee Deleted Successfully.");

}

catch(error){

console.error(error);

alert("Delete Failed.");

}

};

// -------------------------------------
// Print Fee Receipt
// -------------------------------------

window.printFee = function(docId){

localStorage.setItem(

"printFeeId",

docId

);

window.open(

"fee_receipt.html",

"_blank"

);

};

console.log("Fee List Module Part 4 Loaded");
// ======================================================
// fees_list.js
// Part 5 (FINAL)
// Total Collection + Initialization
// ======================================================

// -------------------------------------
// Total Collection
// -------------------------------------

function calculateTotalCollection() {

let total = 0;

fees.forEach(fee => {

if (fee.paymentStatus === "Paid") {

total += Number(fee.amount || 0);

}

});

const totalAmount =
document.getElementById("totalAmount");

if (totalAmount) {

totalAmount.innerText =
"৳ " + total.toLocaleString();

}

}

// -------------------------------------
// Update Table
// -------------------------------------

const oldRender = renderFeeTable;

renderFeeTable = function () {

oldRender();

if (typeof applyFeeFilters === "function") {
    applyFeeFilters();
} else {
    calculateTotalCollection();
}

};

// -------------------------------------
// Refresh
// -------------------------------------

window.refreshFeeTable = function () {

renderFeeTable();

};

// -------------------------------------
// Print Receipt / Fee List
// -------------------------------------

window.printReceipt = function () {

window.print();

};

// -------------------------------------
// Module Ready
// -------------------------------------

document.addEventListener("DOMContentLoaded", () => {

renderFeeTable();

console.log("==================================");
console.log("Fee List Ready");
console.log("School Management System V7");
console.log("==================================");

});
