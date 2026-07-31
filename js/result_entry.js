// ======================================================
// School Management System V7
// result_entry.js
// Part 1
// Firebase Setup + Collections + Global Variables
// ======================================================

import { db } from "./firebase.js";

import { populateClassDropdown } from "./classHelper.js";

import {

collection,
addDoc,
updateDoc,
doc,
getDoc,
getDocs,
query,
orderBy

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collections
// ======================================================

const resultRef = collection(db,"results");

const studentRef = collection(db,"students");

const subjectRef = collection(db,"subjects");

// ======================================================
// Global Variables
// ======================================================

let editId = null;

let isSaving = false;

let studentList = [];

let subjectList = [];

console.log("================================");
console.log("Result Entry Module Loaded");
console.log("================================");

// ======================================================
// Load Students
// ======================================================

async function loadStudents(){

const snapshot = await getDocs(

query(studentRef,orderBy("studentId"))

);

studentList=[];

const select=document.getElementById("studentId");

select.innerHTML=

'<option value="">Select Student</option>';

snapshot.forEach(docSnap=>{

const student={

docId:docSnap.id,

...docSnap.data()

};

studentList.push(student);

select.innerHTML+=`

<option value="${student.docId}">

${student.studentId} - ${student.name}

</option>

`;

});

}

// ======================================================
// Load Subjects
// ======================================================

async function loadSubjects(){

const snapshot=await getDocs(

query(subjectRef,orderBy("subjectName"))

);

subjectList=[];

snapshot.forEach(docSnap=>{

subjectList.push({

docId:docSnap.id,

...docSnap.data()

});

});

}
// ======================================================
// result_entry.js
// Part 2
// Student Auto Fill + Subject Auto Fill
// ======================================================

// -------------------------------------
// Student Auto Fill
// -------------------------------------

document.getElementById("studentId")

.addEventListener("change",function(){

const student=studentList.find(

item=>item.docId===this.value

);

if(!student) return;

const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
setVal("studentName", student.name || "");
setVal("studentRoll", student.roll || "");

});

// -------------------------------------
// Subject Auto Fill
// -------------------------------------

document.getElementById("subjectName")

.addEventListener("change",function(){

const subject=subjectList.find(

item=>item.subjectName===this.value

);

if(!subject) return;

const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
setVal("fullMarks", subject.fullMarks || 100);
setVal("passMarks", subject.passMarks || 33);

});

// -------------------------------------
// Marks Auto Calculation
// -------------------------------------

document.getElementById("obtainedMarks")

.addEventListener("input",calculateResult);

function calculateResult(){

const marks=

Number(

document.getElementById("obtainedMarks").value

);

const pass=

Number(

document.getElementById("passMarks").value

);

let grade="";

let gpa=0;

let status="";

if(marks>=80){

grade="A+";

gpa=5.00;

status="PASS";

}

else if(marks>=70){

grade="A";

gpa=4.00;

status="PASS";

}

else if(marks>=60){

grade="A-";

gpa=3.50;

status="PASS";

}

else if(marks>=50){

grade="B";

gpa=3.00;

status="PASS";

}

else if(marks>=40){

grade="C";

gpa=2.00;

status="PASS";

}

else if(marks>=pass){

grade="D";

gpa=1.00;

status="PASS";

}

else{

grade="F";

gpa=0.00;

status="FAIL";

}

document.getElementById("grade").value=grade;

document.getElementById("gpa").value=gpa.toFixed(2);

document.getElementById("resultStatus").value=status;

}
// ======================================================
// result_entry.js
// Part 3
// Get Result Data + Duplicate Check + Save Result
// ======================================================

// -------------------------------------
// Get Form Data
// -------------------------------------

function getResultData(){

return{

session:
document.getElementById("session").value,

examName:
document.getElementById("examName").value,

studentClass:
document.getElementById("studentClass").value,

studentId:
document.getElementById("studentId").value,

studentName:
document.getElementById("studentName").value,

studentRoll:
document.getElementById("studentRoll").value,

subjectName:
document.getElementById("subjectName").value,

fullMarks:
Number(document.getElementById("fullMarks").value),

passMarks:
Number(document.getElementById("passMarks").value),

obtainedMarks:
Number(document.getElementById("obtainedMarks").value),

grade:
document.getElementById("grade").value,

gpa:
Number(document.getElementById("gpa").value),

resultStatus:
document.getElementById("resultStatus").value,

teacherRemark:
document.getElementById("teacherRemark").value

};

}

// -------------------------------------
// Duplicate Result Check
// -------------------------------------

async function duplicateResult(result){

const snapshot=await getDocs(resultRef);

let found=false;

snapshot.forEach(docSnap=>{

const data=docSnap.data();

if(

data.studentId===result.studentId &&

data.examName===result.examName &&

data.subjectName===result.subjectName &&

docSnap.id!==editId

){

found=true;

}

});

return found;

}

// -------------------------------------
// Save Result
// -------------------------------------

async function saveResult(){

if(isSaving) return;

const result=getResultData();

if(await duplicateResult(result)){

alert("Result Already Exists.");

return;

}

isSaving=true;

try{

if(editId===null){

await addDoc(resultRef,result);

alert("Result Saved Successfully.");

}else{

await updateDoc(

doc(db,"results",editId),

result

);

alert("Result Updated Successfully.");

}

document.getElementById("resultForm").reset();

editId=null;

}
catch(error){

console.error(error);

alert(error.message);

}
finally{

isSaving=false;

}

}
// ======================================================
// result_entry.js
// Part 4 (FINAL)
// Form Submit + Edit + Initialization
// ======================================================

// -------------------------------------
// Form Submit
// -------------------------------------

const resultForm =
document.getElementById("resultForm");

if(resultForm){

resultForm.addEventListener(

"submit",

async function(e){

e.preventDefault();

await saveResult();

}

);

}

// -------------------------------------
// Load Result For Edit
// -------------------------------------

async function loadResultForEdit(){

const docId=

localStorage.getItem("editResultId");

if(!docId) return;

try{

const snapshot=

await getDoc(

doc(db,"results",docId)

);

if(!snapshot.exists()) return;

const result=snapshot.data();

editId=docId;

const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
setVal("session", result.session || "");
setVal("examName", result.examName || "");
setVal("studentClass", result.studentClass || "");
setVal("studentId", result.studentId || "");
setVal("studentName", result.studentName || "");
setVal("studentRoll", result.studentRoll || "");
setVal("subjectName", result.subjectName || "");
setVal("fullMarks", result.fullMarks || 100);
setVal("passMarks", result.passMarks || 33);
setVal("obtainedMarks", result.obtainedMarks || 0);
setVal("grade", result.grade || "");
setVal("gpa", result.gpa || "");
setVal("resultStatus", result.resultStatus || "");
setVal("teacherRemark", result.teacherRemark || "");

localStorage.removeItem("editResultId");

}
catch(error){

console.error(error);

}

}

// -------------------------------------
// Initialization
// -------------------------------------

document.addEventListener(

"DOMContentLoaded",

async()=>{

await populateClassDropdown("studentClass");

await loadStudents();

await loadSubjects();

await loadResultForEdit();

console.log("================================");

console.log("Result Entry Ready");

console.log("School Management System V7");

console.log("================================");

}

);
