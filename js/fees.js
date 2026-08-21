// ======================================================
// School Management System V7
// fees.js
// Part 1
// Firebase Setup + Global Variables
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ======================================================
// Firestore Collections
// ======================================================

const feesRef = collection(db, "fees");
const studentsRef = collection(db, "students");

// ======================================================
// Global Variables
// ======================================================

let editId = null;

let selectedStudent = null;

let isSaving = false;

const VERSION = "V7.0";

// ======================================================
// Utility
// ======================================================

function today() {

    return new Date()
        .toISOString()
        .split("T")[0];

}

// ======================================================
// Initialize
// ======================================================

async function loadFeeForEdit() {
    const docId = localStorage.getItem("editFeeId");
    if (!docId) return;
    localStorage.removeItem("editFeeId");
    await window.editFee(docId);
}

document.addEventListener("DOMContentLoaded", () => {

    const paymentDate =
        document.getElementById("paymentDate");

    if (paymentDate) {

        paymentDate.value = today();

    }

    loadFeeForEdit();

});

console.log("==================================");
console.log("Fee Management Module V7 Loaded");
console.log("==================================");
// ======================================================
// School Management System V7
// fees.js
// Part 2
// Auto Load Student Information
// ======================================================

// -------------------------------------
// Search Student By ID
// -------------------------------------

async function loadStudentInfo() {

    const studentId =
        document.getElementById("studentId")
        .value
        .trim();

    if (studentId === "") return;

    try {

        const q = query(
            studentsRef,
            where("studentId", "==", studentId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            alert("Student Not Found.");

            clearStudentInfo();

            return;

        }

        snapshot.forEach((docSnap) => {

            selectedStudent = {

                docId: docSnap.id,

                ...docSnap.data()

            };

        });

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("studentName", selectedStudent.name || "");
        setVal("studentClass", selectedStudent.studentClass || "");
        setVal("studentRoll", selectedStudent.roll || "");

    }

    catch (error) {

        console.error(error);

        alert("Failed to Load Student.");

    }

}

// -------------------------------------
// Clear Student Information
// -------------------------------------

function clearStudentInfo() {

    selectedStudent = null;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal("studentName", "");
    setVal("studentClass", "");
    setVal("studentRoll", "");

}

// -------------------------------------
// Auto Search
// -------------------------------------

const studentInput =
document.getElementById("studentId");

if(studentInput){

    studentInput.addEventListener(

        "change",

        loadStudentInfo

    );

}

// -------------------------------------
// Global Functions
// -------------------------------------

window.loadStudentInfo = loadStudentInfo;
window.clearStudentInfo = clearStudentInfo;
// ======================================================
// School Management System V7
// fees.js
// Part 3
// Get Form Data + Validation + Save Fee
// ======================================================

// -------------------------------------
// Get Form Data
// -------------------------------------

function getFormData() {

    return {

        studentId: document.getElementById("studentId").value.trim(),

        studentName: document.getElementById("studentName").value.trim(),

        studentClass: document.getElementById("studentClass").value.trim(),

        studentRoll: document.getElementById("studentRoll").value.trim(),

        feeMonth: document.getElementById("feeMonth").value,

        feeType: document.getElementById("feeType").value,

        amount: Number(document.getElementById("feeAmount").value || 0),

        paymentDate: document.getElementById("paymentDate").value,

        paymentMethod: document.getElementById("paymentMethod").value,

        remarks: document.getElementById("remarks").value.trim(),

        paymentStatus: document.getElementById("paymentStatus").value

    };

}

// -------------------------------------
// Validation
// -------------------------------------

function validateFee(data){

    if(data.studentId===""){

        alert("Student ID Required");

        return false;

    }

    if(data.studentName===""){

        alert("Load Student First");

        return false;

    }

    if(data.feeMonth===""){

        alert("Select Month");

        return false;

    }

    if(data.feeType===""){

        alert("Select Fee Type");

        return false;

    }

    if(data.amount<=0){

        alert("Invalid Amount");

        return false;

    }

    return true;

}

// -------------------------------------
// Save Fee
// -------------------------------------

async function saveFee(){

    if(isSaving) return;

    const data=getFormData();

    if(!validateFee(data)) return;

    isSaving=true;

    try{

        if(editId===null){

            await addDoc(feesRef,data);

            alert("Fee Saved Successfully.");

        }else{

            await updateDoc(

                doc(db,"fees",editId),

                data

            );

            alert("Fee Updated Successfully.");

        }

        document.getElementById("feeForm").reset();

        clearStudentInfo();

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
// Global
// -------------------------------------

window.saveFee=saveFee;

// -------------------------------------
// Form Submit
// -------------------------------------

const feeForm=document.getElementById("feeForm");

if(feeForm){

    feeForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        await saveFee();

    });

}
// ======================================================
// School Management System V7
// fees.js
// Part 4
// Edit Fee + Delete Fee + Reset Form
// ======================================================

// -------------------------------------
// Edit Fee
// -------------------------------------

window.editFee = async function(docId){

    try{

        const snapshot = await getDoc(
            doc(db,"fees",docId)
        );

        if(!snapshot.exists()){

            alert("Fee Record Not Found.");

            return;

        }

        const fee = snapshot.data();

        editId = docId;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("studentId", fee.studentId || "");

        await loadStudentInfo();

        setVal("feeMonth", fee.feeMonth || "");
        setVal("feeType", fee.feeType || "");
        setVal("feeAmount", fee.amount || "");
        setVal("paymentDate", fee.paymentDate || "");
        setVal("paymentMethod", fee.paymentMethod || "");
        setVal("remarks", fee.remarks || "");
        setVal("paymentStatus", fee.paymentStatus || "Paid");

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    }

    catch(error){

        console.error(error);

        alert("Edit Failed.");

    }

};

// -------------------------------------
// Delete Fee
// -------------------------------------

window.deleteFee = async function(docId){

    if(!confirm("Delete this fee record?")) return;

    try{

        await deleteDoc(
            doc(db,"fees",docId)
        );

        alert("Fee Deleted Successfully.");

    }

    catch(error){

        console.error(error);

        alert("Delete Failed.");

    }

};

// -------------------------------------
// Reset Form
// -------------------------------------

window.resetFeeForm = function(){

    editId = null;

    document.getElementById("feeForm").reset();

    clearStudentInfo();

    document.getElementById("paymentDate").value =
    today();

};
// ======================================================
// School Management System V7
// fees.js
// Part 5
// Realtime Fee List + Search + Print
// ======================================================

import {
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Load Fee List
// -------------------------------------

let fees = [];

// NOTE: no orderBy("paymentDate") -- Firestore drops any
// document missing that field from an ordered query. Pull
// everything and sort client-side so no record is hidden.

onSnapshot(feesRef,(snapshot)=>{

    fees=[];

    snapshot.forEach(docSnap=>{

        fees.push({

            docId:docSnap.id,
            ...docSnap.data()

        });

    });

    fees.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));

    renderFeeTable();

});

// -------------------------------------
// Render Fee Table
// -------------------------------------

function renderFeeTable(){

    const table=document.getElementById("feeTableBody");

    if(!table) return;

    table.innerHTML="";

    fees.forEach((fee,index)=>{

        table.innerHTML+=`

<tr>

<td>${index+1}</td>

<td>${fee.studentId}</td>

<td>${fee.studentName}</td>

<td>${fee.studentClass}</td>

<td>${fee.feeMonth}</td>

<td>${fee.feeType}</td>

<td>৳ ${fee.amount}</td>

<td>${fee.paymentStatus}</td>

<td>

<button class="btn btn-primary btn-sm"
onclick="editFee('${fee.docId}')">

Edit

</button>

<button class="btn btn-danger btn-sm"
onclick="deleteFee('${fee.docId}')">

Delete

</button>

</td>

</tr>

`;

    });

}

// -------------------------------------
// Search Fee
// -------------------------------------

window.searchFee=function(){

    const keyword=document
    .getElementById("searchFee")
    .value
    .toLowerCase();

    const rows=document.querySelectorAll("#feeTableBody tr");

    rows.forEach(row=>{

        row.style.display=row.innerText
        .toLowerCase()
        .includes(keyword)

        ? ""

        : "none";

    });

};

// -------------------------------------
// Print Receipt
// -------------------------------------

window.printReceipt=function(){

    window.print();

};

console.log("==================================");
console.log("Fee Module Ready");
console.log("Version : V7");
console.log("==================================");
