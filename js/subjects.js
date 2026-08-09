// ======================================================
// School Management System V7
// subjects.js
// Part 1
// Firebase Setup + Global Variables
// ======================================================

import { db } from "./firebase.js";

import { populateClassDropdown } from "./classHelper.js";

import {

collection,
addDoc,
updateDoc,
doc,
query,
orderBy,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collection
// ======================================================

const subjectsRef = collection(db,"subjects");

// ======================================================
// Global Variables
// ======================================================

let subjects = [];

let editId = null;

let isSaving = false;

const VERSION = "V7";

// ======================================================
// Subject Code Generator
// ======================================================

const subjectCodes = {

"Bangla":"BAN101",

"English":"ENG102",

"Mathematics":"MAT103",

"General Knowledge":"GK104",

"Religion":"REL105",

"Bangladesh & Global Studies":"BGS106",

"Science":"SCI107",

"Introduction to Environment":"ENV108",

"Active English":"AEN109",

 "Discipline":"DCP110"
  
};

// ======================================================
// Auto Subject Code
// ======================================================

document.addEventListener(

"DOMContentLoaded",

()=>{

populateClassDropdown("subjectClass");

const subject =
document.getElementById("subjectName");

if(subject){

subject.addEventListener("change",()=>{

const codeElem = document.getElementById("subjectCode");
if (codeElem) codeElem.value = subjectCodes[subject.value] || "";

});

}

console.log("==================================");
console.log("Subject Module Loaded");
console.log("Version :",VERSION);
console.log("==================================");

});
// ======================================================
// subjects.js
// Part 2
// Get Form Data + Validation + Save Subject
// ======================================================

// -------------------------------------
// Get Form Data
// -------------------------------------

function getSubjectData(){

return{

subjectName:
document.getElementById("subjectName").value,

subjectCode:
document.getElementById("subjectCode").value.trim(),

subjectClass:
document.getElementById("subjectClass").value,

fullMarks:
Number(document.getElementById("fullMarks").value),

passMarks:
Number(document.getElementById("passMarks").value),

subjectStatus:
document.getElementById("subjectStatus").value,

subjectDescription:
document.getElementById("subjectDescription").value.trim()

};

}

// -------------------------------------
// Validation
// -------------------------------------

function validateSubject(subject){

if(subject.subjectName===""){

alert("Select Subject Name");

return false;

}

if(subject.subjectCode===""){

alert("Subject Code Required");

return false;

}

if(subject.subjectClass===""){

alert("Select Class");

return false;

}

if(subject.fullMarks<=0){

alert("Invalid Full Marks");

return false;

}

if(subject.passMarks<0){

alert("Invalid Pass Marks");

return false;

}

return true;

}

// -------------------------------------
// Save Subject
// -------------------------------------

async function saveSubject(){

if(isSaving) return;

const subject = getSubjectData();

if(!validateSubject(subject)) return;

isSaving = true;

try{

if(editId===null){

await addDoc(subjectsRef,subject);

alert("Subject Saved Successfully.");

}else{

await updateDoc(

doc(db,"subjects",editId),

subject

);

alert("Subject Updated Successfully.");

}

document.getElementById("subjectForm").reset();

editId = null;

}
catch(error){

console.error(error);

alert("Save Failed.");

}
finally{

isSaving = false;

}

}
// ======================================================
// subjects.js
// Part 3
// Form Submit + Load Subjects
// ======================================================

// -------------------------------------
// Form Submit
// -------------------------------------

const subjectForm =
document.getElementById("subjectForm");

if(subjectForm){

subjectForm.addEventListener(

"submit",

async function(e){

e.preventDefault();

await saveSubject();

}

);

}

// -------------------------------------
// Load Subjects (Realtime)
// -------------------------------------

const subjectQuery = query(

subjectsRef,

orderBy("subjectName")

);

onSnapshot(subjectQuery,(snapshot)=>{

subjects = [];

snapshot.forEach((docSnap)=>{

subjects.push({

docId: docSnap.id,

...docSnap.data()

});

});

console.log(

"Total Subjects :",

subjects.length

);

});

// -------------------------------------
// Global Functions
// -------------------------------------

window.saveSubject = saveSubject;

console.log("Subjects Module Part 3 Loaded");
// ======================================================
// subjects.js
// Part 4 (FINAL)
// Edit + Delete + Reset + Initialization
// ======================================================

import {

deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Edit Subject
// -------------------------------------

window.editSubject = function(docId){

const subject = subjects.find(

item => item.docId === docId

);

if(!subject) return;

editId = docId;

const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
setVal("subjectName", subject.subjectName || "");
setVal("subjectCode", subject.subjectCode || "");
setVal("subjectClass", subject.subjectClass || "");
setVal("fullMarks", subject.fullMarks || 100);
setVal("passMarks", subject.passMarks || 33);
setVal("subjectStatus", subject.subjectStatus || "Active");
setVal("subjectDescription", subject.subjectDescription || "");

window.scrollTo({

top:0,

behavior:"smooth"

});

};

// -------------------------------------
// Delete Subject
// -------------------------------------

window.deleteSubject = async function(docId){

if(!confirm("Delete this subject?")) return;

try{

await deleteDoc(

doc(db,"subjects",docId)

);

alert("Subject Deleted Successfully.");

}

catch(error){

console.error(error);

alert("Delete Failed.");

}

};

// -------------------------------------
// Reset Form
// -------------------------------------

window.resetSubjectForm = function(){

editId = null;

document.getElementById("subjectForm").reset();

};

// -------------------------------------
// Refresh Subject List
// -------------------------------------

window.refreshSubjectList = function(){

console.log("Subjects :",subjects.length);

};

// -------------------------------------
// Module Ready
// -------------------------------------

document.addEventListener("DOMContentLoaded",()=>{

console.log("==================================");
console.log("Subject Module Ready");
console.log("School Management System V7");
console.log("==================================");

});
