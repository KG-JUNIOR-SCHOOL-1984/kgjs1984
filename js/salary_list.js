// ======================================================
// School Management System V7
// salary_list.js
// Part 1
// Firebase + Load Salary List
// ======================================================

import { db } from "./firebase.js";

import {

collection,
query,
orderBy,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Collection
// ======================================================

const salaryRef = collection(db,"salary");

// ======================================================
// Global Variables
// ======================================================

let salaries = [];

// ======================================================
// Load Salary List
// ======================================================

const salaryQuery = query(

salaryRef,

orderBy("salaryMonth","desc")

);

onSnapshot(salaryQuery,(snapshot)=>{

salaries = [];

snapshot.forEach((doc)=>{

salaries.push({

docId: doc.id,

...doc.data()

});

});

renderSalaryTable();

});

console.log("Salary List Module Part 1 Loaded");
// ======================================================
// salary_list.js
// Part 2
// Render Salary Table
// ======================================================

function renderSalaryTable(){

const table =
document.getElementById("salaryTableBody");

if(!table) return;

table.innerHTML="";

let totalPaid = 0;

salaries.forEach((salary,index)=>{

if(salary.salaryStatus==="Paid"){

totalPaid += Number(salary.netSalary || 0);

}

table.innerHTML += `

<tr>

<td>${index+1}</td>

<td>${salary.teacherId || ""}</td>

<td>${salary.teacherName || ""}</td>

<td>${salary.salaryMonth || ""}</td>

<td>৳ ${Number(salary.basicSalary || 0).toLocaleString()}</td>

<td>৳ ${Number(salary.bonus || 0).toLocaleString()}</td>

<td>৳ ${Number(salary.deduction || 0).toLocaleString()}</td>

<td><b>৳ ${Number(salary.netSalary || 0).toLocaleString()}</b></td>

<td>${salary.paymentDate || ""}</td>

<td>

<span class="badge bg-${
salary.salaryStatus==="Paid"
? "success"
: "warning"
}">

${salary.salaryStatus || "Pending"}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editSalary('${salary.docId}')">

✏ Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteSalary('${salary.docId}')">

🗑 Delete

</button>

</td>

</tr>

`;

});

document.getElementById("totalSalary").innerText =
salaries.length;

document.getElementById("totalPaid").innerText =
"৳ " + totalPaid.toLocaleString();

}
// ======================================================
// salary_list.js
// Part 3
// Search + Filter
// ======================================================

// -------------------------------------
// Search Salary
// -------------------------------------

window.searchSalary = function(){

const keyword =
document.getElementById("searchSalary")
.value
.toLowerCase();

const month =
document.getElementById("monthFilter")
.value;

const status =
document.getElementById("statusFilter")
.value;

const rows =
document.querySelectorAll("#salaryTableBody tr");

let visible = 0;

rows.forEach(row=>{

const text =
row.innerText.toLowerCase();

const matchKeyword =
text.includes(keyword);

const matchMonth =
month === "" ||
text.includes(month.toLowerCase());

const matchStatus =
status === "" ||
text.includes(status.toLowerCase());

if(matchKeyword && matchMonth && matchStatus){

row.style.display = "";

visible++;

}else{

row.style.display = "none";

}

});

document.getElementById("totalSalary").innerText =
visible;

};
// ======================================================
// salary_list.js
// Part 4 (FINAL)
// Edit + Delete + Print
// ======================================================

import {

doc,
deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Edit Salary
// -------------------------------------

window.editSalary = function(docId){

localStorage.setItem(

"editSalaryId",

docId

);

window.location.href =

"salary.html";

};

// -------------------------------------
// Delete Salary
// -------------------------------------

window.deleteSalary = async function(docId){

if(!confirm("Delete this salary record?"))

return;

try{

await deleteDoc(

doc(db,"salary",docId)

);

alert("Salary Deleted Successfully.");

}

catch(error){

console.error(error);

alert("Delete Failed.");

}

};

// -------------------------------------
// Print Salary List
// -------------------------------------

window.printSalaryList = function(){

window.print();

};

// -------------------------------------
// Refresh
// -------------------------------------

window.refreshSalaryTable = function(){

renderSalaryTable();

};

// -------------------------------------
// Module Ready
// -------------------------------------

document.addEventListener("DOMContentLoaded",()=>{

renderSalaryTable();

console.log("==================================");
console.log("Salary List Module Ready");
console.log("School Management System V7");
console.log("==================================");

});
