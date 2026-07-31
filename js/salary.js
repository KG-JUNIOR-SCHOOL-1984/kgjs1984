// ======================================================
// School Management System V7
// salary.js
// Part 1
// Firebase Setup + Collections + Global Variables
// ======================================================

import { db } from "./firebase.js";

import {

collection,
doc,
addDoc,
updateDoc,
getDoc,
getDocs,
query,
where,
orderBy

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Collections
// ======================================================

const salaryRef = collection(db,"salary");
const teachersRef = collection(db,"teachers");

// ======================================================
// Global Variables
// ======================================================

let editId = null;

let teachers = [];

let currentTeacher = null;

let isSaving = false;

// ======================================================
// Today's Date
// ======================================================

function today(){

return new Date()
.toISOString()
.split("T")[0];

}

// ======================================================
// Set Default Date
// ======================================================

document.addEventListener("DOMContentLoaded",()=>{

const paymentDate =
document.getElementById("paymentDate");

if(paymentDate){

paymentDate.value = today();

}

loadSalaryForEdit();

});

console.log("==================================");
console.log("Salary Module");
console.log("Part 1 Loaded");
console.log("==================================");
// ======================================================
// School Management System V7
// salary.js
// Part 2
// Load Teacher Information
// ======================================================

// -------------------------------------
// Load Teacher by ID
// -------------------------------------

async function loadTeacherInfo(){

const teacherId =
document.getElementById("teacherId")
.value
.trim();

if(teacherId==="") return;

try{

const q=query(

teachersRef,

where("teacherId","==",teacherId)

);

const snapshot=await getDocs(q);

if(snapshot.empty){

alert("Teacher Not Found.");

clearTeacherInfo();

return;

}

snapshot.forEach(docSnap=>{

currentTeacher={

docId:docSnap.id,

...docSnap.data()

};

});

document.getElementById("teacherName").value=
currentTeacher.name||"";

document.getElementById("basicSalary").value=
currentTeacher.salary||0;

calculateSalary();

}

catch(error){

console.error(error);

alert("Failed to Load Teacher.");

}

}

// -------------------------------------
// Clear Teacher Information
// -------------------------------------

function clearTeacherInfo(){

currentTeacher=null;

document.getElementById("teacherName").value="";

document.getElementById("basicSalary").value="";

document.getElementById("netSalary").value="";

}

// -------------------------------------
// Auto Load
// -------------------------------------

const teacherInput=
document.getElementById("teacherId");

if(teacherInput){

teacherInput.addEventListener(

"change",

loadTeacherInfo

);

}

// -------------------------------------
// Global Functions
// -------------------------------------

window.loadTeacherInfo=loadTeacherInfo;

window.clearTeacherInfo=clearTeacherInfo;
// ======================================================
// School Management System V7
// salary.js
// Part 3
// Get Form Data + Validation + Save Salary
// ======================================================

// -------------------------------------
// Get Form Data
// -------------------------------------

function getFormData(){

return{

teacherId:
document.getElementById("teacherId").value.trim(),

teacherName:
document.getElementById("teacherName").value.trim(),

salaryMonth:
document.getElementById("salaryMonth").value,

basicSalary:
Number(document.getElementById("basicSalary").value||0),

bonus:
Number(document.getElementById("bonus").value||0),

deduction:
Number(document.getElementById("deduction").value||0),

netSalary:
Number(document.getElementById("netSalary").value||0),

paymentDate:
document.getElementById("paymentDate").value,

paymentMethod:
document.getElementById("paymentMethod").value,

salaryStatus:
document.getElementById("salaryStatus").value,

remarks:
document.getElementById("remarks").value.trim()

};

}

// -------------------------------------
// Validation
// -------------------------------------

function validateSalary(data){

if(data.teacherId===""){

alert("Teacher ID Required");

return false;

}

if(data.teacherName===""){

alert("Load Teacher First");

return false;

}

if(data.salaryMonth===""){

alert("Select Salary Month");

return false;

}

if(data.netSalary<=0){

alert("Invalid Salary");

return false;

}

return true;

}

// -------------------------------------
// Save Salary
// -------------------------------------

async function saveSalary(){

if(isSaving) return;

const data=getFormData();

if(!validateSalary(data)) return;

isSaving=true;

try{

if(editId===null){

await addDoc(

salaryRef,

data

);

alert("Salary Saved Successfully.");

}else{

await updateDoc(

doc(db,"salary",editId),

data

);

alert("Salary Updated Successfully.");

}

document.getElementById("salaryForm").reset();

clearTeacherInfo();

document.getElementById("paymentDate").value=today();

editId=null;

}

catch(error){

console.error(error);

alert("Save Failed.");

}

finally{

isSaving=false;

}

}

// -------------------------------------
// Form Submit
// -------------------------------------

const salaryForm=document.getElementById("salaryForm");

if(salaryForm){

salaryForm.addEventListener(

"submit",

async function(e){

e.preventDefault();

await saveSalary();

}

);

}

// -------------------------------------
// Global
// -------------------------------------

window.saveSalary=saveSalary;
// ======================================================
// School Management System V7
// salary.js
// Part 4 (FINAL)
// Edit + Delete + Initialization
// ======================================================

import {

deleteDoc,
onSnapshot

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Salary List
// -------------------------------------

let salaries=[];

const salaryQuery=query(

salaryRef,

orderBy("salaryMonth","desc")

);

onSnapshot(salaryQuery,(snapshot)=>{

salaries=[];

snapshot.forEach(docSnap=>{

salaries.push({

docId:docSnap.id,

...docSnap.data()

});

});

});

// -------------------------------------
// Edit Salary
// -------------------------------------

window.editSalary = async function(docId){

let salary = salaries.find(
item=>item.docId===docId
);

if (!salary) {
    try {
        const snap = await getDoc(doc(db, "salary", docId));
        if (snap.exists()) salary = { docId: snap.id, ...snap.data() };
    } catch(e) {
        console.error(e);
    }
}

if(!salary) return;

editId=docId;

if(document.getElementById("teacherId")) document.getElementById("teacherId").value=salary.teacherId || "";
if(document.getElementById("teacherName")) document.getElementById("teacherName").value=salary.teacherName || "";
if(document.getElementById("salaryMonth")) document.getElementById("salaryMonth").value=salary.salaryMonth || "";
if(document.getElementById("basicSalary")) document.getElementById("basicSalary").value=salary.basicSalary || "";
if(document.getElementById("bonus")) document.getElementById("bonus").value=salary.bonus || 0;
if(document.getElementById("deduction")) document.getElementById("deduction").value=salary.deduction || 0;
if(document.getElementById("netSalary")) document.getElementById("netSalary").value=salary.netSalary || "";
if(document.getElementById("paymentDate")) document.getElementById("paymentDate").value=salary.paymentDate || "";
if(document.getElementById("paymentMethod")) document.getElementById("paymentMethod").value=salary.paymentMethod || "Cash";
if(document.getElementById("salaryStatus")) document.getElementById("salaryStatus").value=salary.salaryStatus || "Paid";
if(document.getElementById("remarks")) document.getElementById("remarks").value=salary.remarks || "";

window.scrollTo({
top:0,
behavior:"smooth"
});

};

async function loadSalaryForEdit() {
    const docId = localStorage.getItem("editSalaryId");
    if (!docId) return;
    localStorage.removeItem("editSalaryId");
    await window.editSalary(docId);
}

// -------------------------------------
// Delete Salary
// -------------------------------------

window.deleteSalary=async function(docId){

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
// Reset Form
// -------------------------------------

window.resetSalaryForm=function(){

editId=null;

document.getElementById("salaryForm").reset();

clearTeacherInfo();

document.getElementById("paymentDate").value=today();

};

// -------------------------------------
// Module Ready
// -------------------------------------

console.log("==================================");
console.log("Salary Module Ready");
console.log("Version : V7");
console.log("==================================");
