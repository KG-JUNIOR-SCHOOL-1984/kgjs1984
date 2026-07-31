// ======================================================
// School Management System V7
// exam.js
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
getDocs,
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

let editId = null;

let isSaving = false;

const VERSION = "V7";

// ======================================================
// Utility
// ======================================================

function today(){

return new Date()

.toISOString()

.split("T")[0];

}

// ======================================================
// Initialization
// ======================================================

document.addEventListener(

"DOMContentLoaded",

async ()=>{

await populateClassDropdown("examClass");

const yearInput =
document.getElementById("examYear");

if(yearInput){

yearInput.value =
new Date().getFullYear();

}

const start =
document.getElementById("startDate");

if(start){

start.value = today();

}

await loadExamForEdit();

console.log("==================================");
console.log("Exam Module Loaded");
console.log("Version :",VERSION);
console.log("==================================");

});
// ======================================================
// exam.js
// Part 2
// Get Form Data + Validation + Save Exam
// ======================================================

// -------------------------------------
// Get Form Data
// -------------------------------------

function getExamData(){

return{

examName:
document.getElementById("examName").value,

examYear:
document.getElementById("examYear").value,

examClass:
document.getElementById("examClass").value,

startDate:
document.getElementById("startDate").value,

endDate:
document.getElementById("endDate").value,

resultDate:
document.getElementById("resultDate").value,

examStatus:
document.getElementById("examStatus").value,

examDescription:
document.getElementById("examDescription").value.trim()

};

}

// -------------------------------------
// Validation
// -------------------------------------

function validateExam(data){

if(data.examName===""){

alert("Select Exam Name");

return false;

}

if(data.examYear===""){

alert("Enter Academic Year");

return false;

}

if(data.examClass===""){

alert("Select Class");

return false;

}

if(data.startDate===""){

alert("Select Start Date");

return false;

}

if(data.endDate===""){

alert("Select End Date");

return false;

}

return true;

}

// -------------------------------------
// Save Exam
// -------------------------------------

async function saveExam(){

if(isSaving) return;

const exam=getExamData();

if(!validateExam(exam)) return;

isSaving=true;

try{

if(editId===null){

await addDoc(examRef,exam);

alert("Exam Saved Successfully.");

}else{

await updateDoc(

doc(db,"exams",editId),

exam

);

alert("Exam Updated Successfully.");

}

document.getElementById("examForm").reset();

editId=null;

document.getElementById("examYear").value=
new Date().getFullYear();

document.getElementById("startDate").value=
today();

}

catch(error){

console.error(error);

alert("Save Failed.");

}

finally{

isSaving=false;

}

}
// ======================================================
// exam.js
// Part 3
// Form Submit + Load Exams
// ======================================================

// -------------------------------------
// Form Submit
// -------------------------------------

const examForm =
document.getElementById("examForm");

if(examForm){

examForm.addEventListener(

"submit",

async function(e){

e.preventDefault();

await saveExam();

}

);

}

// -------------------------------------
// Load Exams (Realtime)
// -------------------------------------

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

console.log(

"Total Exams :",

exams.length

);

});

// -------------------------------------
// Global Functions
// -------------------------------------

window.saveExam = saveExam;

console.log("Exam Module Part 3 Loaded");
// ======================================================
// exam.js
// Part 4 (FINAL)
// Edit + Delete + Reset + Initialization
// ======================================================

import {

deleteDoc

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Edit Exam
// -------------------------------------

window.editExam = async function(docId){

let exam = exams.find(
item => item.docId === docId
);

if (!exam) {
    try {
        const docSnap = await getDoc(doc(db, "exams", docId));
        if (docSnap.exists()) {
            exam = { docId: docSnap.id, ...docSnap.data() };
        }
    } catch(e) {
        console.error(e);
    }
}

if(!exam) return;

editId = docId;

if (document.getElementById("examName")) document.getElementById("examName").value = exam.examName || "";
if (document.getElementById("examYear")) document.getElementById("examYear").value = exam.examYear || "";
if (document.getElementById("examClass")) document.getElementById("examClass").value = exam.examClass || "";
if (document.getElementById("startDate")) document.getElementById("startDate").value = exam.startDate || "";
if (document.getElementById("endDate")) document.getElementById("endDate").value = exam.endDate || "";
if (document.getElementById("resultDate")) document.getElementById("resultDate").value = exam.resultDate || "";
if (document.getElementById("examStatus")) document.getElementById("examStatus").value = exam.examStatus || "Upcoming";
if (document.getElementById("examDescription")) document.getElementById("examDescription").value = exam.examDescription || "";

window.scrollTo({
top:0,
behavior:"smooth"
});

};

async function loadExamForEdit() {
    const docId = localStorage.getItem("editExamId");
    if (!docId) return;
    localStorage.removeItem("editExamId");
    await window.editExam(docId);
}

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
// Reset Form
// -------------------------------------

window.resetExamForm = function(){

editId = null;

document.getElementById("examForm").reset();

document.getElementById("examYear").value =
new Date().getFullYear();

document.getElementById("startDate").value =
today();

};

// -------------------------------------
// Module Ready
// -------------------------------------

console.log("==================================");
console.log("Exam Module Ready");
console.log("School Management System V7");
console.log("==================================");
