// ======================================================
// School Management System V8
// result_list.js
// Part 1
// Firebase Setup + Load Results
// ======================================================

import { db } from "./firebase.js";

import {

collection,
query,
orderBy,
onSnapshot,
doc,
deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collection
// ======================================================

const resultRef = collection(db,"results");

// ======================================================
// Global Variables
// ======================================================

let results = [];

// groups: one entry per (studentId + session + examName), each
// holding the list of subject-wise result docs for that student/exam.
let groups = [];

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

buildGroups();

renderResultTable();

});

// ======================================================
// Group Subject-wise Results By Student + Session + Exam
// ======================================================

function buildGroups(){

const map = new Map();

results.forEach((result)=>{

const key = `${result.studentId}|${result.session}|${result.examName}`;

if(!map.has(key)){

map.set(key,{

key,
studentId: result.studentId,
studentName: result.studentName,
studentClass: result.studentClass,
studentRoll: result.studentRoll,
session: result.session,
examName: result.examName,
subjects: []

});

}

map.get(key).subjects.push(result);

});

groups = Array.from(map.values());

}

// ======================================================
// Render Result Table (One Row Per Student + Exam)
// ======================================================

function renderResultTable(){

const table =

document.getElementById("resultTableBody");

if(!table) return;

table.innerHTML="";

groups.forEach((group,index)=>{

let totalObtained = 0;
let totalFull = 0;
let totalGPA = 0;

group.subjects.forEach(s=>{
totalObtained += Number(s.obtainedMarks||0);
totalFull += Number(s.fullMarks||0);
totalGPA += Number(s.gpa||0);
});

const avgGPA = group.subjects.length
? (totalGPA / group.subjects.length).toFixed(2)
: "0.00";

const overallStatus = group.subjects.every(s=>s.resultStatus==="PASS")
? "PASS"
: "FAIL";

const subjectSummary = group.subjects
.map(s=>`<div>${s.subjectName}: <b>${s.obtainedMarks}</b></div>`)
.join("");

table.innerHTML += `

<tr>

<td>${index+1}</td>

<td>${group.studentId}</td>

<td>${group.studentName}</td>

<td>${group.studentClass}</td>

<td>${group.studentRoll}</td>

<td>${group.session}</td>

<td>${group.examName}</td>

<td class="text-start">${subjectSummary}</td>

<td>${totalObtained} / ${totalFull}</td>

<td>${avgGPA}</td>

<td>

<span class="badge bg-${

overallStatus==="PASS"

?

"success"

:

"danger"

}">

${overallStatus}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="openResultDetails('${group.key}')">

📄 Details

</button>

</td>

</tr>

`;

});

document.getElementById("totalResults").innerText=

groups.length;

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
// Subject Details Modal + Edit + Delete
// ======================================================

let detailsModalInstance = null;

// -------------------------------------
// Open Details Modal (Subject Breakdown For One Student/Exam)
// -------------------------------------

window.openResultDetails = function(groupKey){

const group = groups.find(g=>g.key===groupKey);

if(!group) return;

document.getElementById("detailsModalTitle").innerText =
`${group.studentName} (${group.studentId}) — ${group.session} / ${group.examName}`;

const body = document.getElementById("detailsModalBody");

body.innerHTML = group.subjects.map(s=>`

<tr>
<td>${s.subjectName}</td>
<td>${s.obtainedMarks} / ${s.fullMarks}</td>
<td>${s.grade}</td>
<td>${s.gpa}</td>
<td>
<span class="badge bg-${s.resultStatus==="PASS"?"success":"danger"}">${s.resultStatus}</span>
</td>
<td>${s.teacherRemark||""}</td>
<td>
<button class="btn btn-primary btn-sm" onclick="editResult('${s.docId}')">Edit</button>
<button class="btn btn-danger btn-sm" onclick="deleteResult('${s.docId}')">Delete</button>
</td>
</tr>

`).join("");

const modalEl = document.getElementById("detailsModal");

if (window.bootstrap) {
detailsModalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
detailsModalInstance.show();
}

};

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

"Are you sure you want to delete this subject result?"

);

if(!confirmDelete) return;

try{

await deleteDoc(

doc(db,"results",docId)

);

alert("Result Deleted Successfully.");

// Close the details modal since its content is now stale;
// the underlying table refreshes automatically via onSnapshot.
if (detailsModalInstance) {

detailsModalInstance.hide();

}

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

console.log("================================");

console.log("Result List Ready");

console.log("School Management System V8");

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
window.openResultDetails = openResultDetails;
