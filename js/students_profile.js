// ======================================================
// students_profile.js
// Part 1
// Load Student Profile
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const feesRef = collection(db, "fees");

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

// ===========================================
// Current Student (used by Add Fee form)
// ===========================================

let currentStudent = null;
let profileFeeEditId = null;
let isSavingProfileFee = false;

function today() {
    return new Date().toISOString().split("T")[0];
}

// ===========================================
// Load Profile
// ===========================================

async function loadStudentProfile() {

   console.log(localStorage.getItem("studentProfileId"));
    const docId =
        localStorage.getItem("studentProfileId");

    if (!docId) {

        alert("Student not found.");

        window.location.href =
        "students_list.html";

        return;

    }

    try {

        const studentRef =
            doc(db, "students", docId);

        const snapshot =
            await getDoc(studentRef);

        if (!snapshot.exists()) {

            alert("Student not found.");

            return;

        }

        const student = snapshot.data();

        currentStudent = {
            docId: snapshot.id,
            ...student
        };

        document.getElementById("profilePhoto").src =
            student.photo || DEFAULT_PHOTO;

        document.getElementById("profileName").innerText =
            student.name || "";

        document.getElementById("profileID").innerText =
            student.studentId || "";

        document.getElementById("pStudentId").innerText =
            student.studentId || "";

        document.getElementById("pFather").innerText =
            student.father || "";

        document.getElementById("pMother").innerText =
            student.mother || "";

        document.getElementById("pClass").innerText =
            student.studentClass || "";

        document.getElementById("pRoll").innerText =
            student.roll || "";

        document.getElementById("pSection").innerText =
            student.section || "";

        document.getElementById("pSession").innerText =
            student.session || "";

        document.getElementById("pAdmissionDate").innerText =
            student.admissionDate || "";

        document.getElementById("pDOB").innerText =
            student.dob || "";
                document.getElementById("pGender").innerText =
            student.gender || "";

        document.getElementById("pReligion").innerText =
            student.religion || "";

        document.getElementById("pBlood").innerText =
            student.blood || "";

        document.getElementById("pEmail").innerText =
            student.email || "";

        document.getElementById("pMonthlyFee").innerText =
            "৳ " + (student.monthlyFee || 0);

        document.getElementById("pAdmissionFee").innerText =
            "৳ " + (student.admissionFee || 0);

        document.getElementById("pGuardianName").innerText =
            student.guardianName || "";

        document.getElementById("pGuardianMobile").innerText =
            student.guardianMobile || "";

        document.getElementById("pGuardianOccupation").innerText =
            student.guardianOccupation || "";

        document.getElementById("pAddress").innerText =
            student.address || "";

        document.getElementById("pStatus").innerHTML =
            `<span class="badge bg-${
                student.status === "Active"
                    ? "success"
                    : student.status === "Inactive"
                    ? "danger"
                    : "warning"
            }">
                ${student.status || "Active"}
            </span>`;

        loadFeeSummary(student.studentId);

    } catch (error) {

    console.error(error);

    alert(error.message);

    }

}

// ===========================================
// Load Fee Summary (all fee records for this student)
// ===========================================

async function loadFeeSummary(studentId) {

    const body = document.getElementById("feeSummaryBody");

    if (!body) return;

    if (!studentId) {

        body.innerHTML =
            '<tr><td colspan="7" class="text-center text-muted">No Student ID on record.</td></tr>';

        return;

    }

    try {

        const q = query(feesRef, where("studentId", "==", studentId));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            body.innerHTML =
                '<tr><td colspan="7" class="text-center text-muted">No fee records found.</td></tr>';

            setTotals(0, 0, 0);

            return;

        }

        let rowsHtml = "";

        let totalPaid = 0;
        let totalPartial = 0;
        let totalPending = 0;

        const records = [];

        snapshot.forEach((docSnap) => records.push({ docId: docSnap.id, ...docSnap.data() }));

        // Most recent payment date first.
        records.sort((a, b) =>
            (b.paymentDate || "").localeCompare(a.paymentDate || "")
        );

        records.forEach((fee) => {

            const amount = Number(fee.amount || 0);

            if (fee.paymentStatus === "Paid") totalPaid += amount;
            else if (fee.paymentStatus === "Partial") totalPartial += amount;
            else if (fee.paymentStatus === "Pending") totalPending += amount;

            const statusBadge = {
                Paid: '<span class="badge bg-success">Paid</span>',
                Partial: '<span class="badge bg-warning text-dark">Partial</span>',
                Pending: '<span class="badge bg-danger">Pending</span>'
            }[fee.paymentStatus] || (fee.paymentStatus || "");

            rowsHtml += `<tr>
                <td>${fee.feeMonth || ""}</td>
                <td>${fee.feeType || ""}</td>
                <td>৳ ${amount}</td>
                <td>${statusBadge}</td>
                <td>${fee.paymentDate || ""}</td>
                <td>${fee.paymentMethod || ""}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editProfileFee('${fee.docId}')">✏ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProfileFee('${fee.docId}')">🗑 Delete</button>
                </td>
            </tr>`;

        });

        body.innerHTML = rowsHtml;

        setTotals(totalPaid, totalPartial, totalPending);

    } catch (error) {

        console.error("Fee Summary Error:", error);

        body.innerHTML =
            '<tr><td colspan="7" class="text-center text-danger">Failed to load fee records.</td></tr>';

    }

}

function setTotals(paid, partial, pending) {

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = "৳ " + val;
    };

    setText("feeTotalPaid", paid);
    setText("feeTotalPartial", partial);
    setText("feeTotalPending", pending);
    setText("feeGrandTotal", paid + partial + pending);

}

// ===========================================
// Add Fee (from Student Profile page)
// One student, many months -- all saved under
// the same studentId so they all show up together
// in the Fee History table above.
// ===========================================

function resetProfileFeeForm() {

    profileFeeEditId = null;

    const form = document.getElementById("profileFeeForm");
    if (form) form.reset();

    const dateEl = document.getElementById("pfDate");
    if (dateEl) dateEl.value = today();

    const submitBtn = document.getElementById("pfSubmitBtn");
    if (submitBtn) submitBtn.innerText = "💾 Save Fee";

    const cancelBtn = document.getElementById("pfCancelBtn");
    if (cancelBtn) cancelBtn.style.display = "none";

}

window.cancelProfileFeeEdit = resetProfileFeeForm;

async function saveProfileFee(e) {

    if (e) e.preventDefault();

    if (isSavingProfileFee) return;

    if (!currentStudent || !currentStudent.studentId) {

        alert("Student not loaded yet.");

        return;

    }

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const data = {

        studentId: currentStudent.studentId,
        studentName: currentStudent.name || "",
        studentClass: currentStudent.studentClass || "",
        studentRoll: currentStudent.roll || "",

        feeMonth: getVal("pfMonth"),
        feeType: getVal("pfType"),
        amount: Number(getVal("pfAmount") || 0),
        paymentDate: getVal("pfDate"),
        paymentMethod: getVal("pfMethod"),
        remarks: getVal("pfRemarks"),
        paymentStatus: getVal("pfStatus") || "Paid"

    };

    if (data.feeMonth === "") {
        alert("Select Month");
        return;
    }

    if (data.feeType === "") {
        alert("Select Fee Type");
        return;
    }

    if (data.amount <= 0) {
        alert("Invalid Amount");
        return;
    }

    isSavingProfileFee = true;

    try {

        if (profileFeeEditId === null) {

            await addDoc(feesRef, data);
            alert("Fee Saved Successfully.");

        } else {

            await updateDoc(doc(db, "fees", profileFeeEditId), data);
            alert("Fee Updated Successfully.");

        }

        resetProfileFeeForm();

        await loadFeeSummary(currentStudent.studentId);

    } catch (error) {

        console.error(error);
        alert("Save Failed.");

    } finally {

        isSavingProfileFee = false;

    }

}

window.editProfileFee = async function (docId) {

    try {

        const snapshot = await getDoc(doc(db, "fees", docId));

        if (!snapshot.exists()) {
            alert("Fee Record Not Found.");
            return;
        }

        const fee = snapshot.data();

        profileFeeEditId = docId;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal("pfMonth", fee.feeMonth || "");
        setVal("pfType", fee.feeType || "");
        setVal("pfAmount", fee.amount || "");
        setVal("pfDate", fee.paymentDate || "");
        setVal("pfMethod", fee.paymentMethod || "");
        setVal("pfRemarks", fee.remarks || "");
        setVal("pfStatus", fee.paymentStatus || "Paid");

        const submitBtn = document.getElementById("pfSubmitBtn");
        if (submitBtn) submitBtn.innerText = "💾 Update Fee";

        const cancelBtn = document.getElementById("pfCancelBtn");
        if (cancelBtn) cancelBtn.style.display = "inline-block";

        document.getElementById("profileFeeForm")
            .scrollIntoView({ behavior: "smooth", block: "center" });

    } catch (error) {

        console.error(error);
        alert("Edit Failed.");

    }

};

window.deleteProfileFee = async function (docId) {

    if (!confirm("Delete this fee record?")) return;

    try {

        await deleteDoc(doc(db, "fees", docId));

        alert("Fee Deleted Successfully.");

        if (currentStudent && currentStudent.studentId) {
            await loadFeeSummary(currentStudent.studentId);
        }

    } catch (error) {

        console.error(error);
        alert("Delete Failed.");

    }

};

// ===========================================
// Initialize
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    loadStudentProfile();

    const dateEl = document.getElementById("pfDate");
    if (dateEl) dateEl.value = today();

    const profileFeeForm = document.getElementById("profileFeeForm");
    if (profileFeeForm) {
        profileFeeForm.addEventListener("submit", saveProfileFee);
    }

});

console.log("==================================");
console.log("Student Profile Module Loaded");
console.log("==================================");
