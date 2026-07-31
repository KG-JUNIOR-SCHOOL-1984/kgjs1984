// ======================================================
// School Management System V7
// fee_receipt.js
// Part 1
// Firebase + Load Receipt
// ======================================================

import { db } from "./firebase.js";

import {

doc,
getDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Default Photo
// ======================================================

const DEFAULT_LOGO = "images/logo.png";

// ======================================================
// Load Receipt
// ======================================================

async function loadReceipt(){

const docId = localStorage.getItem("printFeeId");

if(!docId){

alert("Receipt not found.");

window.location.href="fees_list.html";

return;

}

try{

const receiptRef = doc(db,"fees",docId);

const snapshot = await getDoc(receiptRef);

if(!snapshot.exists()){

alert("Receipt not found.");

return;

}

const fee = snapshot.data();

// Receipt Number

document.getElementById("receiptNo").innerText =
fee.receiptNo || ("RC-" + docId.substring(0,6).toUpperCase());

// School Logo

const logo=document.getElementById("schoolLogo");

if(logo){

logo.src=DEFAULT_LOGO;

}

// Store Data

window.receiptData = fee;

}
catch(error){

console.error(error);

alert("Failed to load receipt.");

}

}

console.log("Fee Receipt Module Part 1 Loaded");
// ======================================================
// fee_receipt.js
// Part 2
// Load Student & Payment Information
// ======================================================

function loadReceiptData(){

const fee = window.receiptData;

if(!fee) return;

// Student Information

document.getElementById("rStudentId").innerText =
fee.studentId || "";

document.getElementById("rStudentName").innerText =
fee.studentName || "";

document.getElementById("rClass").innerText =
fee.studentClass || "";

document.getElementById("rRoll").innerText =
fee.roll || "";

document.getElementById("rSection").innerText =
fee.section || "";

document.getElementById("rSession").innerText =
fee.session || "";

// Payment Information

document.getElementById("rMonth").innerText =
fee.feeMonth || "";

document.getElementById("rFeeType").innerText =
fee.feeType || "";

document.getElementById("rPaymentDate").innerText =
fee.paymentDate || "";

document.getElementById("rPaymentMethod").innerText =
fee.paymentMethod || "Cash";

document.getElementById("rStatus").innerHTML =

`<span class="badge bg-${
fee.paymentStatus==="Paid"
?"success"
:fee.paymentStatus==="Pending"
?"danger"
:"warning"
}">

${fee.paymentStatus || "Paid"}

</span>`;

document.getElementById("rAmount").innerText =
"৳ " + Number(fee.amount || 0).toLocaleString();

document.getElementById("rRemarks").innerText =
fee.remarks || "-";

}
// ======================================================
// fee_receipt.js
// Part 3 (FINAL)
// Initialize + Print
// ======================================================

// -------------------------------------
// Print Receipt
// -------------------------------------

window.printReceipt = function(){

window.print();

};

// -------------------------------------
// Initialize
// -------------------------------------

async function initializeReceipt(){

await loadReceipt();

loadReceiptData();

console.log("==================================");

console.log("Fee Receipt Ready");

console.log("==================================");

}

// -------------------------------------
// Start
// -------------------------------------

document.addEventListener(

"DOMContentLoaded",

initializeReceipt

);
