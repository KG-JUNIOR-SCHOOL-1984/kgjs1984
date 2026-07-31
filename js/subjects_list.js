// ======================================================
// School Management System V7
// subjects_list.js
// Part 1
// Firebase Setup
// ======================================================

import { db } from "./firebase.js";

import {

collection,
query,
orderBy,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const subjectsRef = collection(db,"subjects");

let subjects=[];

const subjectQuery=query(

subjectsRef,

orderBy("subjectName")

);

onSnapshot(subjectQuery,(snapshot)=>{

subjects=[];

snapshot.forEach((docSnap)=>{

subjects.push({

docId:docSnap.id,

...docSnap.data()

});

});

renderSubjectTable();

});
// ======================================================
// Render Subject Table
// ======================================================

function renderSubjectTable(){

const table=document.getElementById("subjectTableBody");

if(!table) return;

table.innerHTML="";

subjects.forEach((subject,index)=>{

table.innerHTML+=`

<tr>

<td>${index+1}</td>

<td>${subject.subjectName}</td>

<td>${subject.subjectCode}</td>

<td>${subject.subjectClass}</td>

<td>${subject.fullMarks}</td>

<td>${subject.passMarks}</td>

<td>

<span class="badge bg-${
subject.subjectStatus==="Active"
?
"success"
:
"danger"
}">

${subject.subjectStatus}

</span>

</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editSubject('${subject.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteSubject('${subject.docId}')">

Delete

</button>

</td>

</tr>

`;

});

document.getElementById("totalSubject").innerText=
subjects.length;

}
// ======================================================
// Search Subject
// ======================================================

window.searchSubject=function(){

const keyword=document

.getElementById("searchSubject")

.value

.toLowerCase();

const classFilter=document

.getElementById("classFilter")

.value;

const statusFilter=document

.getElementById("statusFilter")

.value;

const rows=document.querySelectorAll(

"#subjectTableBody tr"

);

let total=0;

rows.forEach(row=>{

const text=row.innerText.toLowerCase();

const matchKeyword=text.includes(keyword);

const matchClass=

classFilter===""

||

text.includes(classFilter.toLowerCase());

const matchStatus=

statusFilter===""

||

text.includes(statusFilter.toLowerCase());

if(

matchKeyword&&

matchClass&&

matchStatus

){

row.style.display="";

total++;

}

else{

row.style.display="none";

}

});

document.getElementById("totalSubject").innerText=total;

};
import{

doc,
deleteDoc

} from

"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.editSubject=function(docId){

localStorage.setItem(

"editSubjectId",

docId

);

window.location.href=

"subjects.html";

};

window.deleteSubject=async function(docId){

if(!confirm("Delete Subject?")) return;

try{

await deleteDoc(

doc(db,"subjects",docId)

);

alert("Subject Deleted.");

}

catch(error){

console.error(error);

alert("Delete Failed.");

}

};
window.refreshSubjectTable=function(){

renderSubjectTable();

};

window.printSubjectList=function(){

window.print();

};

document.addEventListener(

"DOMContentLoaded",

()=>{

renderSubjectTable();

console.log("================================");

console.log("Subject List Ready");

console.log("================================");

}

);
