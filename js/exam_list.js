// ======================================================
// School Management System V7
// exam_list.js
// Part 1
// Firebase Setup + Load Exam List
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

const examRef = collection(db,"exams");

// ======================================================
// Global Variables
// ======================================================

let exams = [];

// ======================================================
// Load Exams (Realtime)
// ======================================================

const examQuery = query(

examRef,

orderBy("examYear","desc")

);

onSnapshot(examQuery,(snapshot)=>{

exams=[];

snapshot.forEach((docSnap)=>{

exams.push({

docId:docSnap.id,

...docSnap.data()

});

});

renderExamTable();

});

console.log("==================================");
console.log("Exam List Module");
console.log("Part 1 Loaded");
console.log("==================================");
// ======================================================
// exam_list.js
// Part 2
// Render Exam Table
// ======================================================

function renderExamTable(){

const table =
document.getElementById("examTableBody");

if(!table) return;

table.innerHTML="";

exams.forEach((exam,index)=>{

table.innerHTML += `

<tr>

<td class="text-center">

${index+1}

</td>

<td>

${exam.examName || ""}

</td>

<td>

${exam.examYear || ""}

</td>

<td>

${exam.examClass || ""}

</td>

<td>

${exam.startDate || ""}

</td>

<td>

${exam.endDate || ""}

</td>

<td>

${exam.resultDate || ""}

</td>

<td>

<span class="badge bg-${
exam.examStatus==="Completed"
? "success"
: exam.examStatus==="Running"
? "warning text-dark"
: "secondary"
}">

${exam.examStatus || "Upcoming"}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editExam('${exam.docId}')">

✏ Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteExam('${exam.docId}')">

🗑 Delete

</button>

</td>

</tr>

`;

});

document.getElementById("totalExam").innerText =
exams.length;

}
// ======================================================
// exam_list.js
// Part 3
// Search + Filter
// ======================================================

// -------------------------------------
// Search Exam
// -------------------------------------

window.searchExam = function(){

const keyword =
document.getElementById("searchExam")
.value
.toLowerCase();

const classFilter =
document.getElementById("classFilter")
.value;

const statusFilter =
document.getElementById("statusFilter")
.value;

const rows =
document.querySelectorAll("#examTableBody tr");

let visible = 0;

rows.forEach(row=>{

const text =
row.innerText.toLowerCase();

const matchKeyword =
text.includes(keyword);

const matchClass =
classFilter==="" ||
text.includes(classFilter.toLowerCase());

const matchStatus =
statusFilter==="" ||
text.includes(statusFilter.toLowerCase());

if(matchKeyword && matchClass && matchStatus){

row.style.display="";

visible++;

}else{

row.style.display="none";

}

});

document.getElementById("totalExam").innerText =
visible;

};

console.log("Exam Search Ready");
// ======================================================
// exam_list.js
// Part 4 (FINAL)
// Edit + Delete + Refresh
// ======================================================

import {

doc,
deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Edit Exam
// -------------------------------------

window.editExam = function(docId){

localStorage.setItem(

"editExamId",

docId

);

window.location.href =

"exam.html";

};

// -------------------------------------
// Delete Exam
// -------------------------------------

window.deleteExam = async function(docId){

if(!confirm("Delete this exam?")) return;

try{

await deleteDoc(

doc(db,"exams",docId)

);

alert("Exam Deleted Successfully.");

}

catch(error){

console.error(error);

alert("Delete Failed.");

}

};

// -------------------------------------
// Refresh Table
// -------------------------------------

window.refreshExamTable=function(){

renderExamTable();

};

// -------------------------------------
// Print
// -------------------------------------

window.printExamList=function(){

window.print();

};

// -------------------------------------
// Module Ready
// -------------------------------------

document.addEventListener("DOMContentLoaded",()=>{

renderExamTable();

console.log("==================================");
console.log("Exam List Module Ready");
console.log("School Management System V7");
console.log("==================================");

});
