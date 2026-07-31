// ======================================================
// School Management System V7
// result_list.js
// Part 1
// Firebase Setup + Load Results
// ======================================================

import { db } from "./firebase.js";

import {

collection,
query,
orderBy,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collection
// ======================================================

const resultRef = collection(db,"results");

// ======================================================
// Global Variables
// ======================================================

let results = [];

// ======================================================
// Load Result Realtime
// ======================================================

const resultQuery = query(

resultRef,

orderBy("studentName")

);

onSnapshot(resultQuery,(snapshot)=>{

results=[];

snapshot.forEach((docSnap)=>{

results.push({

docId:docSnap.id,

...docSnap.data()

});

});

renderResultTable();

});

// ======================================================
// Render Result Table
// ======================================================

function renderResultTable(){

const table =

document.getElementById("resultTableBody");

if(!table) return;

table.innerHTML="";

results.forEach((result,index)=>{

table.innerHTML += `

<tr>

<td>${index+1}</td>

<td>${result.studentId}</td>

<td>${result.studentName}</td>

<td>${result.studentClass}</td>

<td>${result.studentRoll}</td>

<td>${result.session}</td>

<td>${result.examName}</td>

<td>${result.subjectName}</td>

<td>${result.obtainedMarks}</td>

<td>${result.grade}</td>

<td>${result.gpa}</td>

<td>

<span class="badge bg-${
result.resultStatus==="PASS"
?
"success"
:
"danger"
}">

${result.resultStatus}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editResult('${result.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteResult('${result.docId}')">

Delete

</button>

</td>

</tr>

`;

});

document.getElementById("totalResults").innerText=

results.length;

}

console.log("Result List Part 1 Loaded");
// ======================================================
// result_list.js
// Part 2
// Search + Filter Results
// ======================================================

// -------------------------------------
// Search Result
// -------------------------------------

window.searchResults = function () {

const keyword = document
.getElementById("searchStudent")
.value
.toLowerCase();

const session = document
.getElementById("filterSession")
.value;

const exam = document
.getElementById("filterExam")
.value;

const studentClass = document
.getElementById("filterClass")
.value;

const rows = document.querySelectorAll(
"#resultTableBody tr"
);

let total = 0;

rows.forEach(row => {

const text = row.innerText.toLowerCase();

const matchKeyword =
text.includes(keyword);

const matchSession =
session === "" ||
text.includes(session.toLowerCase());

const matchExam =
exam === "" ||
text.includes(exam.toLowerCase());

const matchClass =
studentClass === "" ||
text.includes(studentClass.toLowerCase());

if (

matchKeyword &&
matchSession &&
matchExam &&
matchClass

) {

row.style.display = "";

total++;

} else {

row.style.display = "none";

}

});

document.getElementById(
"totalResults"
).innerText = total;

};

// -------------------------------------
// Auto Search
// -------------------------------------

document.getElementById("searchStudent")
.addEventListener("keyup", searchResults);

document.getElementById("filterSession")
.addEventListener("change", searchResults);

document.getElementById("filterExam")
.addEventListener("change", searchResults);

document.getElementById("filterClass")
.addEventListener("change", searchResults);

console.log("Result List Part 2 Loaded");
// ======================================================
// result_list.js
// Part 3
// Edit + Delete Result
// ======================================================

import {

doc,
deleteDoc

} from

"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Edit Result
// -------------------------------------

window.editResult = function(docId){

localStorage.setItem(

"editResultId",

docId

);

window.location.href =

"result_entry.html";

};

// -------------------------------------
// Delete Result
// -------------------------------------

window.deleteResult = async function(docId){

const confirmDelete = confirm(

"Are you sure you want to delete this result?"

);

if(!confirmDelete) return;

try{

await deleteDoc(

doc(db,"results",docId)

);

alert("Result Deleted Successfully.");

}
catch(error){

console.error(error);

alert(error.message);

}

};

// -------------------------------------
// Refresh Table
// -------------------------------------

window.refreshResultTable = function(){

renderResultTable();

};

console.log("Result List Part 3 Loaded");
// ======================================================
// result_list.js
// Part 4 (FINAL)
// Print + Initialization
// ======================================================

// -------------------------------------
// Print Result List
// -------------------------------------

window.printResultList = function(){

window.print();

};

// -------------------------------------
// DOM Ready
// -------------------------------------

document.addEventListener(

"DOMContentLoaded",

()=>{

renderResultTable();

console.log("================================");

console.log("Result List Ready");

console.log("School Management System V7");

console.log("================================");

}

);

// -------------------------------------
// Export (Optional)
// -------------------------------------

window.renderResultTable = renderResultTable;
window.searchResults = searchResults;
window.editResult = editResult;
window.deleteResult = deleteResult;
window.refreshResultTable = refreshResultTable;
window.printResultList = printResultList;
