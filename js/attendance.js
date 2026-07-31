// ======================================================
// School Management System V6
// attendance.js
// Part 1
// ======================================================

import { db } from "./firebase.js";

import { populateClassDropdown } from "./classHelper.js";

import {
collection,
addDoc,
updateDoc,
deleteDoc,
doc,
query,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Collections
// ======================================================

const attendanceRef = collection(db,"attendance");
const studentsRef = collection(db,"students");

// ======================================================
// Global Variables
// ======================================================

let attendance = [];
let students = [];
let editId = null;

// ======================================================
// Reset Form
// ======================================================

function resetForm(){

const form=document.getElementById("attendanceForm");

if(form) form.reset();

editId=null;

const date=document.getElementById("attendanceDate");

if(date){

date.value=new Date().toISOString().split("T")[0];

}

}

window.resetAttendanceForm=resetForm;

// ======================================================
// Load Students
// ======================================================

const studentQuery=query(
studentsRef,
orderBy("studentId")
);

onSnapshot(studentQuery,(snapshot)=>{

students=[];

snapshot.forEach((document)=>{

students.push({

docId:document.id,
...document.data()

});

});

loadStudentDropdown();

});

// ======================================================
// Student Dropdown
// ======================================================

function loadStudentDropdown(){

const select=document.getElementById("attendanceStudent");

if(!select) return;

select.innerHTML='<option value="">Select Student</option>';

students.forEach(student=>{

select.innerHTML+=`

<option value="${student.docId}">

${student.studentId} - ${student.name}

</option>

`;

});

}
// ======================================================
// attendance.js
// Part 2
// ======================================================

// ------------------------------------
// Auto Fill Student Information
// ------------------------------------

const attendanceStudentElem = document.getElementById("attendanceStudent");
if (attendanceStudentElem) {
    attendanceStudentElem.addEventListener("change", function(){
        const student=students.find(
            item=>item.docId===this.value
        );
        if(!student) return;
        const idElem = document.getElementById("attendanceStudentId");
        if(idElem) idElem.value = student.studentId || "";
    });
}

// ------------------------------------
// Read Form Data
// ------------------------------------

function getFormData(){

return{

attendanceDate:
document.getElementById("attendanceDate").value,

attendanceClass:
document.getElementById("attendanceClass").value,

attendanceSection:
document.getElementById("attendanceSection").value,

studentDocId:
document.getElementById("attendanceStudent").value,

studentId:
document.getElementById("attendanceStudentId").value,

attendanceStatus:
document.getElementById("attendanceStatus").value,

attendanceRemarks:
document.getElementById("attendanceRemarks").value.trim()

};

}

// ------------------------------------
// Validation
// ------------------------------------

function validateAttendance(data){

if(data.attendanceDate===""){

alert("Please Select Date");

return false;

}

if(data.attendanceClass===""){

alert("Please Select Class");

return false;

}

if(data.studentDocId===""){

alert("Please Select Student");

return false;

}

return true;

}

// ------------------------------------
// Save Attendance
// ------------------------------------

window.saveAttendance=async function(){

const attendance=getFormData();

if(!validateAttendance(attendance)) return;

try{

if(editId===null){

await addDoc(attendanceRef,attendance);

alert("Attendance Saved Successfully.");

}else{

await updateDoc(

doc(db,"attendance",editId),

attendance

);

alert("Attendance Updated Successfully.");

}

resetForm();

populateClassDropdown("attendanceClass");

}catch(error){

console.error(error);

alert("Failed to Save Attendance.");

}

};

// ------------------------------------
// Form Submit
// ------------------------------------

document.getElementById("attendanceForm")
.addEventListener("submit",function(e){

e.preventDefault();

saveAttendance();

});
// ======================================================
// attendance.js
// Part 3
// ======================================================

// ------------------------------------
// Realtime Attendance
// ------------------------------------

const attendanceQuery = query(
attendanceRef,
orderBy("attendanceDate","desc")
);

onSnapshot(attendanceQuery,(snapshot)=>{

attendance=[];

snapshot.forEach((document)=>{

attendance.push({

docId:document.id,
...document.data()

});

});

renderAttendanceTable();

});

// ------------------------------------
// Render Attendance Table
// ------------------------------------

function renderAttendanceTable(){

const table=document.getElementById("attendanceTableBody");

if(!table) return;

table.innerHTML="";

attendance.forEach((item,index)=>{

table.innerHTML+=`

<tr>

<td>${index+1}</td>

<td>${item.attendanceDate}</td>

<td>${item.studentId}</td>

<td>${item.attendanceClass}</td>

<td>${item.attendanceStatus}</td>

<td>${item.attendanceRemarks || ""}</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editAttendance('${item.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteAttendance('${item.docId}')">

Delete

</button>

</td>

</tr>

`;

});

}

// ------------------------------------
// Edit Attendance
// ------------------------------------

window.editAttendance=function(docId){

const item=attendance.find(a=>a.docId===docId);

if(!item) return;

editId=docId;

document.getElementById("attendanceDate").value=item.attendanceDate||"";
document.getElementById("attendanceClass").value=item.attendanceClass||"";
document.getElementById("attendanceSection").value=item.attendanceSection||"";
document.getElementById("attendanceStudent").value=item.studentDocId||"";
document.getElementById("attendanceStudentId").value=item.studentId||"";
document.getElementById("attendanceStatus").value=item.attendanceStatus||"";
document.getElementById("attendanceRemarks").value=item.attendanceRemarks||"";

window.scrollTo({

top:0,
behavior:"smooth"

});

};

// ------------------------------------
// Delete Attendance
// ------------------------------------

window.deleteAttendance=async function(docId){

if(!confirm("Delete this Attendance Record?")) return;

try{

await deleteDoc(doc(db,"attendance",docId));

alert("Attendance Deleted Successfully.");

}catch(error){

console.error(error);

alert("Delete Failed.");

}

};
// ======================================================
// attendance.js
// Part 4 (FINAL)
// ======================================================

// ------------------------------------
// Search Attendance
// ------------------------------------

window.searchAttendance = function () {

    const keyword = document
        .getElementById("searchAttendance")
        .value
        .toLowerCase();

    const table = document.getElementById("attendanceTableBody");

    if (!table) return;

    table.innerHTML = "";

    const filtered = attendance.filter(item =>

        (item.studentId || "")
        .toLowerCase()
        .includes(keyword)

        ||

        (item.attendanceClass || "")
        .toLowerCase()
        .includes(keyword)

        ||

        (item.attendanceStatus || "")
        .toLowerCase()
        .includes(keyword)

    );

    filtered.forEach((item, index) => {

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${item.attendanceDate}</td>

<td>${item.studentId}</td>

<td>${item.attendanceClass}</td>

<td>${item.attendanceStatus}</td>

<td>${item.attendanceRemarks || ""}</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="editAttendance('${item.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteAttendance('${item.docId}')">

Delete

</button>

</td>

</tr>

`;

    });

};

// ------------------------------------
// Refresh Table
// ------------------------------------

window.refreshAttendanceTable = function () {

    renderAttendanceTable();

};

// ------------------------------------
// Total Attendance
// ------------------------------------

window.getAttendanceCount = function () {

    return attendance.length;

};

// ------------------------------------
// Get Attendance By Doc ID
// ------------------------------------

window.getAttendanceByDocId = function (docId) {

    return attendance.find(item => item.docId === docId);

};

// ------------------------------------
// Initialize Module
// ------------------------------------

function initializeAttendanceModule() {

    console.log("Attendance Module Initialized");

}

initializeAttendanceModule();

// ------------------------------------
// Module Version
// ------------------------------------

window.ATTENDANCE_MODULE_VERSION = "V6.0";

// ------------------------------------
// Ready Message
// ------------------------------------

console.log("======================================");
console.log(" School Management System");
console.log(" Attendance Module V6 Loaded");
console.log(" Firebase Firestore Connected");
console.log("======================================");
