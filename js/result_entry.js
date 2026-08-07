// ======================================================
// School Management System V8
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
orderBy,
writeBatch

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

// Cart holds subject-wise results (Subject + Marks + Remark) queued
// for one student/exam before they're all saved together.
let resultCart = [];

console.log("================================");
console.log("Result Entry Module V8 Loaded");
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

// Changing student clears any queued (unsaved) cart items so
// subjects never get attributed to the wrong student.
if (resultCart.length > 0) {
    resultCart = [];
    renderCart();
}

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

calculateResult();

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
// Subject Cart (Add Multiple Subjects for One Student/Exam)
// ======================================================

// -------------------------------------
// Add Current Subject To Cart
// -------------------------------------

window.addResultToCart = function () {

    if (editId !== null) {
        alert("You are editing an existing subject result. Finish or cancel the edit first (🔄 Reset) before adding new subjects.");
        return;
    }

    const session = document.getElementById("session").value;
    const examName = document.getElementById("examName").value;
    const studentClass = document.getElementById("studentClass").value;
    const studentId = document.getElementById("studentId").value;

    if (session === "" || examName === "" || studentClass === "") {
        alert("Select Session, Exam and Class first.");
        return;
    }

    if (studentId === "") {
        alert("Select a Student first.");
        return;
    }

    const subjectEl = document.getElementById("subjectName");
    const remarkEl = document.getElementById("teacherRemark");
    const marksEl = document.getElementById("obtainedMarks");

    const subjectName = subjectEl.value;

    if (subjectName === "") {
        alert("Select Subject.");
        return;
    }

    if (resultCart.some(item => item.subjectName === subjectName)) {
        alert("This subject is already in the list.");
        return;
    }

    const obtainedMarks = Number(marksEl.value || 0);

    if (marksEl.value === "" || obtainedMarks < 0) {
        alert("Enter valid Obtained Marks.");
        return;
    }

    resultCart.push({
        subjectName,
        teacherRemark: remarkEl.value.trim(),
        fullMarks: Number(document.getElementById("fullMarks").value || 100),
        passMarks: Number(document.getElementById("passMarks").value || 33),
        obtainedMarks,
        grade: document.getElementById("grade").value,
        gpa: Number(document.getElementById("gpa").value || 0),
        resultStatus: document.getElementById("resultStatus").value
    });

    // Clear only the per-subject fields so the next subject can be added quickly.
    subjectEl.value = "";
    remarkEl.value = "";
    marksEl.value = "";
    document.getElementById("grade").value = "";
    document.getElementById("gpa").value = "";
    document.getElementById("resultStatus").value = "";
    subjectEl.focus();

    renderCart();

};

// -------------------------------------
// Remove Subject From Cart
// -------------------------------------

window.removeCartItem = function (index) {

    resultCart.splice(index, 1);
    renderCart();

};

// -------------------------------------
// Render Cart Table
// -------------------------------------

function renderCart() {

    const body = document.getElementById("cartTableBody");

    if (!body) return;

    if (resultCart.length === 0) {

        body.innerHTML = `
<tr id="cartEmptyRow">
<td colspan="7" class="text-center text-muted py-3">
এখনো কোনো সাবজেক্ট যোগ করা হয়নি। উপর থেকে Subject ও Marks দিয়ে ➕ Add to List চাপুন।
</td>
</tr>
`;

        return;

    }

    body.innerHTML = resultCart.map((item, index) => `
<tr>
<td>${index + 1}</td>
<td>${item.subjectName}</td>
<td class="text-end">${item.obtainedMarks} / ${item.fullMarks}</td>
<td>${item.grade}</td>
<td>${item.gpa.toFixed(2)}</td>
<td>
<span class="badge bg-${item.resultStatus === "PASS" ? "success" : "danger"}">${item.resultStatus}</span>
</td>
<td class="text-center">
<button type="button" class="btn btn-outline-danger btn-sm" onclick="removeCartItem(${index})">✕</button>
</td>
</tr>
`).join("");

}

// ======================================================
// result_entry.js
// Part 4
// Common Fields + Validation + Save (Batch or Single Edit)
// ======================================================

// -------------------------------------
// Get Common (Shared) Fields
// -------------------------------------

function getCommonData(){

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
document.getElementById("studentRoll").value

};

}

// -------------------------------------
// Get Single-Record Data (Used Only When Editing)
// -------------------------------------

function getEditResultData(){

return{

...getCommonData(),

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
// Duplicate Result Check (Single Subject)
// -------------------------------------

async function duplicateResult(studentId, examName, subjectName){

const snapshot=await getDocs(resultRef);

let found=false;

snapshot.forEach(docSnap=>{

const data=docSnap.data();

if(

data.studentId===studentId &&

data.examName===examName &&

data.subjectName===subjectName &&

docSnap.id!==editId

){

found=true;

}

});

return found;

}

// -------------------------------------
// Save Result(s)
// -------------------------------------

async function saveResult(){

if(isSaving) return;

isSaving=true;

try{

if(editId!==null){

// ---- Edit Mode: update the single existing subject record ----

const result=getEditResultData();

if(result.subjectName===""){
alert("Select Subject.");
return;
}

if(await duplicateResult(result.studentId, result.examName, result.subjectName)){

alert("Result Already Exists For This Subject.");

return;

}

await updateDoc(

doc(db,"results",editId),

result

);

alert("Result Updated Successfully.");

editId=null;

}else{

// ---- Add Mode: save every subject queued in the cart ----

const common=getCommonData();

if(common.studentId===""){
alert("Select a Student.");
return;
}

if(resultCart.length===0){
alert("Add at least one subject to the list before saving (➕ Add to List).");
return;
}

for(const item of resultCart){

if(await duplicateResult(common.studentId, common.examName, item.subjectName)){

alert(`Result Already Exists For ${item.subjectName}. Remove it from the list and try again.`);

return;

}

}

const batch=writeBatch(db);

resultCart.forEach(item=>{

const newDocRef=doc(resultRef);

batch.set(newDocRef,{

...common,

...item

});

});

await batch.commit();

alert(`${resultCart.length} Subject Result(s) Saved Successfully.`);

resultCart=[];

}

document.getElementById("resultForm").reset();

renderCart();

setEditModeUI(false);

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
// Part 5
// Form Submit + Edit + Reset + Initialization
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
// Toggle UI Between "Add Multiple" And "Edit Single" Modes
// -------------------------------------

function setEditModeUI(isEditing) {

    const notice = document.getElementById("editModeNotice");
    const addBtn = document.getElementById("addToCartBtn");
    const saveBtn = document.getElementById("saveResultBtn");

    if (notice) notice.style.display = isEditing ? "" : "none";
    if (addBtn) addBtn.disabled = isEditing;
    if (saveBtn) saveBtn.textContent = isEditing ? "💾 Update Result" : "💾 Save All";

}

// -------------------------------------
// Reset Handling (also clears cart / edit state)
// -------------------------------------

if (resultForm) {

    resultForm.addEventListener("reset", () => {

        setTimeout(() => {

            editId = null;
            resultCart = [];
            renderCart();
            setEditModeUI(false);

        }, 0);

    });

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

// Editing a single saved subject is a separate flow from the
// multi-subject cart, so clear any queued (unsaved) items.
resultCart=[];
renderCart();

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

setEditModeUI(true);

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

renderCart();

await loadResultForEdit();

console.log("================================");

console.log("Result Entry Ready");

console.log("School Management System V8");

console.log("================================");

}

);
