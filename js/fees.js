// ======================================================
// School Management System V8
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
    where,
    orderBy,
    writeBatch
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

// Cart holds fee items (Month + Fee Type + Amount) queued for a
// single student before they are saved together in one batch.
let feeCart = [];

const VERSION = "V8.0";

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

// -------------------------------------
// Prefill From Fee Due List ("Collect" button)
// -------------------------------------

async function loadFeeFromQueryParams() {

    const params = new URLSearchParams(window.location.search);

    const studentId = params.get("studentId");

    if (!studentId) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setVal("studentId", studentId);

    await window.loadStudentInfo();

    if (params.get("feeMonth")) setVal("feeMonth", params.get("feeMonth"));
    if (params.get("feeType")) setVal("feeType", params.get("feeType"));
    if (params.get("amount")) setVal("feeAmount", params.get("amount"));

}

document.addEventListener("DOMContentLoaded", () => {

    const paymentDate =
        document.getElementById("paymentDate");

    if (paymentDate) {

        paymentDate.value = today();

    }

    renderCart();

    loadFeeForEdit();

    loadFeeFromQueryParams();

});

console.log("==================================");
console.log("Fee Management Module V8 Loaded");
console.log("==================================");
// ======================================================
// School Management System V8
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

        () => {
            // Changing student clears any queued (unsaved) cart
            // items so fees never get attributed to the wrong student.
            if (feeCart.length > 0) {
                feeCart = [];
                renderCart();
            }
            loadStudentInfo();
        }

    );

}

// -------------------------------------
// Global Functions
// -------------------------------------

window.loadStudentInfo = loadStudentInfo;
window.clearStudentInfo = clearStudentInfo;
// ======================================================
// School Management System V8
// fees.js
// Part 3
// Fee Cart (Add Multiple Fees for One Student)
// ======================================================

// -------------------------------------
// Add Current Fee Item To Cart
// -------------------------------------

window.addFeeToCart = function () {

    if (editId !== null) {
        alert("You are editing an existing record. Finish or cancel the edit first (🔄 Reset) before adding new items.");
        return;
    }

    const studentId = document.getElementById("studentId").value.trim();

    if (studentId === "" || !selectedStudent) {
        alert("Please enter a valid Student ID first.");
        return;
    }

    const feeMonthEl = document.getElementById("feeMonth");
    const feeTypeEl = document.getElementById("feeType");
    const feeAmountEl = document.getElementById("feeAmount");

    const feeMonth = feeMonthEl.value;
    const feeType = feeTypeEl.value;
    const amount = Number(feeAmountEl.value || 0);

    if (feeType === "") {
        alert("Select Fee Type.");
        return;
    }

    if (amount <= 0) {
        alert("Invalid Amount.");
        return;
    }

    feeCart.push({ feeMonth, feeType, amount });

    // Clear only the item-entry fields so the next fee can be added quickly.
    feeMonthEl.value = "";
    feeTypeEl.value = "";
    feeAmountEl.value = "";
    feeTypeEl.focus();

    renderCart();

};

// -------------------------------------
// Remove Item From Cart
// -------------------------------------

window.removeCartItem = function (index) {

    feeCart.splice(index, 1);
    renderCart();

};

// -------------------------------------
// Render Cart Table
// -------------------------------------

function renderCart() {

    const body = document.getElementById("cartTableBody");
    const totalCell = document.getElementById("cartTotal");

    if (!body) return;

    if (feeCart.length === 0) {

        body.innerHTML = `
<tr id="cartEmptyRow">
<td colspan="5" class="text-center text-muted py-3">
কোনো ফি এখনো যোগ করা হয়নি। উপরে থেকে Fee Type ও Amount দিয়ে ➕ চাপুন।
</td>
</tr>
`;

        if (totalCell) totalCell.textContent = "৳ 0";

        return;

    }

    let total = 0;

    body.innerHTML = feeCart.map((item, index) => {

        total += Number(item.amount || 0);

        return `
<tr>
<td>${index + 1}</td>
<td>${item.feeMonth || "-"}</td>
<td>${item.feeType}</td>
<td class="text-end">৳ ${item.amount}</td>
<td class="text-center">
<button type="button" class="btn btn-outline-danger btn-sm" onclick="removeCartItem(${index})">✕</button>
</td>
</tr>
`;

    }).join("");

    if (totalCell) totalCell.textContent = "৳ " + total;

}

// ======================================================
// School Management System V8
// fees.js
// Part 4
// Common Payment Fields + Validation + Save
// ======================================================

// -------------------------------------
// Get Common (Shared) Payment Fields
// -------------------------------------

function getCommonData() {

    return {

        studentId: document.getElementById("studentId").value.trim(),

        studentName: document.getElementById("studentName").value.trim(),

        studentClass: document.getElementById("studentClass").value.trim(),

        studentRoll: document.getElementById("studentRoll").value.trim(),

        paymentDate: document.getElementById("paymentDate").value,

        paymentMethod: document.getElementById("paymentMethod").value,

        remarks: document.getElementById("remarks").value.trim(),

        paymentStatus: document.getElementById("paymentStatus").value

    };

}

// -------------------------------------
// Single-Record Form Data (Used Only When Editing)
// -------------------------------------

function getEditFormData() {

    return {

        ...getCommonData(),

        feeMonth: document.getElementById("feeMonth").value,

        feeType: document.getElementById("feeType").value,

        amount: Number(document.getElementById("feeAmount").value || 0)

    };

}

// -------------------------------------
// Validation
// -------------------------------------

function validateCommon(data) {

    if (data.studentId === "") {

        alert("Student ID Required");

        return false;

    }

    if (data.studentName === "") {

        alert("Load Student First");

        return false;

    }

    if (data.paymentDate === "") {

        alert("Select Payment Date");

        return false;

    }

    return true;

}

function validateEditFee(data) {

    if (!validateCommon(data)) return false;

    if (data.feeMonth === "") {

        alert("Select Month");

        return false;

    }

    if (data.feeType === "") {

        alert("Select Fee Type");

        return false;

    }

    if (data.amount <= 0) {

        alert("Invalid Amount");

        return false;

    }

    return true;

}

// -------------------------------------
// Save Fee(s)
// -------------------------------------

async function saveFee(){

    if(isSaving) return;

    isSaving = true;

    try {

        if (editId !== null) {

            // ---- Edit Mode: update the single existing record ----

            const data = getEditFormData();

            if (!validateEditFee(data)) return;

            await updateDoc(
                doc(db, "fees", editId),
                data
            );

            alert("Fee Updated Successfully.");

            editId = null;

        } else {

            // ---- Add Mode: save every item queued in the cart ----

            const common = getCommonData();

            if (!validateCommon(common)) return;

            if (feeCart.length === 0) {

                alert("Add at least one fee to the list before saving (➕ Add Fee Item).");

                return;

            }

            const batch = writeBatch(db);

            feeCart.forEach((item) => {

                const newDocRef = doc(feesRef);

                batch.set(newDocRef, {
                    ...common,
                    feeMonth: item.feeMonth,
                    feeType: item.feeType,
                    amount: item.amount
                });

            });

            await batch.commit();

            alert(`${feeCart.length} Fee(s) Saved Successfully. Total ৳ ${feeCart.reduce((s, i) => s + Number(i.amount || 0), 0)}`);

            feeCart = [];

        }

        document.getElementById("feeForm").reset();

        clearStudentInfo();

        document.getElementById("paymentDate").value = today();

        renderCart();

        setEditModeUI(false);

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
// School Management System V8
// fees.js
// Part 5
// Edit Fee + Delete Fee + Reset Form
// ======================================================

// -------------------------------------
// Toggle UI Between "Add Multiple" And "Edit Single" Modes
// -------------------------------------

function setEditModeUI(isEditing) {

    const notice = document.getElementById("editModeNotice");
    const addBtn = document.getElementById("addToCartBtn");
    const saveBtn = document.getElementById("saveFeeBtn");

    if (notice) notice.style.display = isEditing ? "" : "none";
    if (addBtn) addBtn.disabled = isEditing;
    if (saveBtn) saveBtn.textContent = isEditing ? "💾 Update Fee" : "💾 Save All";

}

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

        // Editing a single saved record is a separate flow from the
        // multi-item cart, so clear any queued (unsaved) cart items.
        feeCart = [];
        renderCart();

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

        setEditModeUI(true);

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

    feeCart = [];

    document.getElementById("feeForm").reset();

    clearStudentInfo();

    document.getElementById("paymentDate").value =
    today();

    renderCart();

    setEditModeUI(false);

};

// Also handle the native "Reset" button (type=reset) the same way,
// since it bypasses window.resetFeeForm.
if (feeForm) {

    feeForm.addEventListener("reset", () => {

        // Let the native reset run first, then clean up JS state.
        setTimeout(() => {

            editId = null;
            feeCart = [];
            clearStudentInfo();
            document.getElementById("paymentDate").value = today();
            renderCart();
            setEditModeUI(false);

        }, 0);

    });

}
// ======================================================
// School Management System V8
// fees.js
// Part 6
// Realtime Fee List + Search + Print
// ======================================================

import {
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// -------------------------------------
// Load Fee List
// -------------------------------------

let fees = [];

const feeQuery = query(
    feesRef,
    orderBy("paymentDate","desc")
);

onSnapshot(feeQuery,(snapshot)=>{

    fees=[];

    snapshot.forEach(docSnap=>{

        fees.push({

            docId:docSnap.id,
            ...docSnap.data()

        });

    });

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
console.log("Version : V8");
console.log("==================================");
        
