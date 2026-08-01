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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const feesRef = collection(db, "fees");

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

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
            '<tr><td colspan="6" class="text-center text-muted">No Student ID on record.</td></tr>';

        return;

    }

    try {

        const q = query(feesRef, where("studentId", "==", studentId));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            body.innerHTML =
                '<tr><td colspan="6" class="text-center text-muted">No fee records found.</td></tr>';

            setTotals(0, 0, 0);

            return;

        }

        let rowsHtml = "";

        let totalPaid = 0;
        let totalPartial = 0;
        let totalPending = 0;

        const records = [];

        snapshot.forEach((docSnap) => records.push(docSnap.data()));

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
            </tr>`;

        });

        body.innerHTML = rowsHtml;

        setTotals(totalPaid, totalPartial, totalPending);

    } catch (error) {

        console.error("Fee Summary Error:", error);

        body.innerHTML =
            '<tr><td colspan="6" class="text-center text-danger">Failed to load fee records.</td></tr>';

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
// Load School Name/Logo Header
// ===========================================

async function loadSchoolHeader() {

    const wrap = document.getElementById("profileSchoolHeader");

    if (!wrap) return;

    try {

        const snap = await getDoc(doc(db, "settings", "school"));

        if (!snap.exists()) return;

        const data = snap.data();

        if (!data.schoolName) return;

        document.getElementById("profileSchoolName").innerText = data.schoolName;

        const addrParts = [data.schoolAddress, data.schoolMobile].filter(Boolean);
        document.getElementById("profileSchoolAddress").innerText = addrParts.join(" | ");

        if (data.schoolLogo) {
            const logo = document.getElementById("profileSchoolLogo");
            logo.src = data.schoolLogo;
            logo.classList.remove("d-none");
        }

        wrap.classList.remove("d-none");

    } catch (error) {

        console.error("School Header Load Error:", error);

    }

}

// ===========================================
// Initialize
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
    loadSchoolHeader();
    loadStudentProfile();
});

console.log("==================================");
console.log("Student Profile Module Loaded");
console.log("==================================");
