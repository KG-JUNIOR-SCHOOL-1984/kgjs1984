// ======================================================
// School Management System V8
// teachers.js
// Part 1
// Firebase + Global Variables + Auto Teacher ID
//
// V8 changes:
// - Teacher ID now comes from idCounter.js (Firestore
//   transaction) instead of scanning the whole collection.
// - Photos now upload to Firebase Storage and only the
//   download URL is saved in Firestore (no more base64
//   blobs bloating documents).
// ======================================================

import { db, storage } from "./firebase.js";

import {
    collection
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadString,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import { getNextSequentialId, peekNextSequentialId } from "./idCounter.js";

// ======================================================
// Collection
// ======================================================

const teachersRef = collection(db, "teachers");

// ======================================================
// Global Variables
// ======================================================

let teachers = [];
let editId = null;

let photoData = "";        // Data URL for the <img> preview (and upload source)
let photoChanged = false;  // true only when the user picks a NEW file
let existingPhotoURL = ""; // photo URL already stored in Firestore (edit mode)

const DEFAULT_PHOTO =
"https://via.placeholder.com/170";

// ======================================================
// Auto Serial Teacher ID (counter-based)
// TCH-000001
// ======================================================

async function generateTeacherID() {

    if (editId !== null) return;

    const input =
        document.getElementById("teacherId");

    if (!input) return;

    try {

        input.value = await peekNextSequentialId({
            counterName: "teachers",
            prefix: "TCH",
            padLength: 6,
            collectionRef: teachersRef,
            idField: "teacherId",
            idRegex: /^TCH-(\d+)$/
        });

    } catch (error) {

        console.error("Teacher ID Error:", error);

        input.value = "TCH-000001";

    }

}

// ======================================================
// Global Functions
// ======================================================

window.generateTeacherID =
generateTeacherID;
// ======================================================
// School Management System V8
// teachers.js
// Part 2
// Photo Preview + Reset + Initialization
// ======================================================

// ------------------------------------
// Teacher Photo Preview with Auto Compression
// ------------------------------------

function previewTeacherPhoto(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;

    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const imgObj = new Image();

        imgObj.onload = function () {

            const canvas = document.createElement("canvas");

            let width = imgObj.width;

            let height = imgObj.height;

            const MAX_SIZE = 400;

            if (width > height) {

                if (width > MAX_SIZE) {

                    height *= MAX_SIZE / width;

                    width = MAX_SIZE;

                }

            } else {

                if (height > MAX_SIZE) {

                    width *= MAX_SIZE / height;

                    height = MAX_SIZE;

                }

            }

            canvas.width = width;

            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(imgObj, 0, 0, width, height);

            photoData = canvas.toDataURL("image/jpeg", 0.75);

            photoChanged = true;

            const img = document.getElementById("teacherPhotoPreview");

            if (img) {

                img.src = photoData;

            }

        };

        imgObj.src = e.target.result;

    };

    reader.readAsDataURL(file);

}

// ------------------------------------
// Clear Teacher Photo
// ------------------------------------

function clearTeacherPhoto() {

    photoData = "";
    photoChanged = false;

    const img =
        document.getElementById("teacherPhotoPreview");

    if (img) {

        img.src = DEFAULT_PHOTO;

    }

    const input =
        document.getElementById("teacherPhoto");

    if (input) {

        input.value = "";

    }

}

// ------------------------------------
// Reset Global Data
// ------------------------------------

function resetGlobalData() {

    editId = null;

    photoData = "";
    photoChanged = false;
    existingPhotoURL = "";

}

// ------------------------------------
// Reset Teacher Form
// ------------------------------------

async function resetTeacherForm() {

    const form =
        document.getElementById("teacherForm");

    if (form) {

        form.reset();

    }

    resetGlobalData();

    document.getElementById("teacherPhotoPreview").src =
        DEFAULT_PHOTO;

    await generateTeacherID();

}

// ------------------------------------
// Initialize
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    await generateTeacherID();
    await loadTeacherForEdit();

    console.log("Teacher Module Part 2 Loaded");

});

// ------------------------------------
// Global Functions
// ------------------------------------

window.previewTeacherPhoto = previewTeacherPhoto;

window.clearTeacherPhoto = clearTeacherPhoto;

window.resetTeacherForm = resetTeacherForm;
// ======================================================
// School Management System V8
// teachers.js
// Part 3
// Form Data + Validation + Duplicate Check
// ======================================================

// ------------------------------------
// Get Form Data
// ------------------------------------

function getFormData() {

    return {

        teacherId:
        document.getElementById("teacherId")?.value.trim() || "",

        name:
        document.getElementById("teacherName")?.value.trim() || "",

        father:
        document.getElementById("fatherName")?.value.trim() || "",

        mother:
        document.getElementById("motherName")?.value.trim() || "",

        designation:
        document.getElementById("designation")?.value || "",

        subject:
        document.getElementById("teacherSubject")?.value || "",

        joiningDate:
        document.getElementById("joiningDate")?.value || "",

        dob:
        document.getElementById("teacherDOB")?.value || "",

        gender:
        document.getElementById("teacherGender")?.value || "",

        religion:
        document.getElementById("teacherReligion")?.value || "",

        mobile:
        document.getElementById("teacherMobile")?.value.trim() || "",

        email:
        document.getElementById("teacherEmail")?.value.trim() || "",

        salary:
        Number(document.getElementById("teacherSalary")?.value || 0),

        status:
        document.getElementById("teacherStatus")?.value || "Active",

        address:
        document.getElementById("teacherAddress")?.value.trim() || ""

        // NOTE: "photo" is intentionally left out here — it's resolved
        // separately in saveTeacher() after the Storage upload (if any)
        // finishes, so we know the final download URL to store.

    };

}

// ------------------------------------
// Validation
// ------------------------------------

function validateTeacher(teacher) {

    if (teacher.name === "") {

        alert("Teacher Name is Required.");

        return false;

    }

    if (teacher.designation === "") {

        alert("Please Select Designation.");

        return false;

    }

    if (teacher.mobile !== "") {

        if (!/^01[3-9][0-9]{8}$/.test(teacher.mobile)) {

            alert("Invalid Mobile Number.");

            return false;

        }

    }

    if (teacher.email !== "") {

        const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(teacher.email)) {

            alert("Invalid Email Address.");

            return false;

        }

    }

    return true;

}

// ------------------------------------
// Duplicate Teacher ID Check
// (Teacher IDs are readonly and generated via a
// transaction-safe counter, so this now just guards
// against unexpected duplicates using the already-loaded
// local list — no extra Firestore reads needed.)
// ------------------------------------

function duplicateCheck(teacher) {

    return teachers.some(item =>

        item.teacherId === teacher.teacherId &&
        item.docId !== editId

    );

}
// ======================================================
// School Management System V8
// teachers.js
// Part 4
// Photo Upload + Save Teacher + Update Teacher
// ======================================================

import {
    addDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ------------------------------------
// Upload Photo To Firebase Storage (with fallback)
// ------------------------------------

async function uploadTeacherPhoto(teacherId) {

    try {

        const storageRef = ref(storage, `teachers/${teacherId}/photo.jpg`);

        // See students.js uploadStudentPhoto() for why the timeout race
        // is needed — without it, a stuck upload can hang the Save
        // button forever with no error shown to the user.
        const uploadPromise = uploadString(storageRef, photoData, "data_url")
            .then(() => getDownloadURL(storageRef));

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Photo upload timed out")), 15000)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);

    } catch (err) {

        console.warn("Teacher storage upload failed, fallback to photoData:", err);

        return photoData;

    }

}

// ------------------------------------
// Save / Update Teacher
// ------------------------------------

window.saveTeacher = async function () {

    const teacher = getFormData();

    if (!validateTeacher(teacher)) return;

    if (duplicateCheck(teacher)) {

        alert("Teacher ID already exists.");

        return;

    }

    // Holds the final photo URL to save. Defaults to the existing
    // photo (edit mode) or blank (new teacher) unless a new photo
    // is uploaded below.
    let photoURL = existingPhotoURL || "";

    try {

        if (editId === null) {

            // See uploadStudentPhoto()'s comment in students.js — upload
            // the photo BEFORE reserving the ID so a failed/slow upload
            // never burns a teacher ID number.
            let tempPhotoURL = photoURL;

            if (photoChanged && photoData.startsWith("data:")) {
                const tempPath = "temp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
                tempPhotoURL = await uploadTeacherPhoto(tempPath);
            }

            const newTeacherId = await getNextSequentialId({
                counterName: "teachers",
                prefix: "TCH",
                padLength: 6,
                collectionRef: teachersRef,
                idField: "teacherId",
                idRegex: /^TCH-(\d+)$/
            });

            teacher.teacherId = newTeacherId;
            teacher.photo = tempPhotoURL || "";

            await addDoc(
                teachersRef,
                teacher
            );

            alert("Teacher Saved Successfully.");

        } else {

            if (photoChanged && photoData.startsWith("data:")) {
                photoURL = await uploadTeacherPhoto(teacher.teacherId);
            }

            teacher.photo = photoURL || "";

            await updateDoc(

                doc(
                    db,
                    "teachers",
                    editId
                ),

                teacher

            );

            alert("Teacher Updated Successfully.");

        }

        await resetTeacherForm();

    }

    catch (error) {

        console.error(error);

        alert("Save Failed.");

    }

};

// ------------------------------------
// Cancel Edit
// ------------------------------------

window.cancelTeacherEdit = async function () {

    await resetTeacherForm();

};

// ------------------------------------
// Form Submit
// ------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("teacherForm");

    if (!form) return;

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        saveTeacher();

    });

});
// ======================================================
// School Management System V8
// teachers.js
// Part 5
// Realtime Teacher List + Render
// ======================================================

import {
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ------------------------------------
// Realtime Load
// ------------------------------------

const teacherQuery = query(
    teachersRef,
    orderBy("teacherId")
);

onSnapshot(teacherQuery, (snapshot) => {

    teachers = [];

    snapshot.forEach((item) => {

        teachers.push({

            docId: item.id,

            ...item.data()

        });

    });

    renderTeacherTable();

});

// ------------------------------------
// Find Teacher
// ------------------------------------

function findTeacher(docId) {

    return teachers.find(

        teacher => teacher.docId === docId

    );

}

// ------------------------------------
// Render Table
// ------------------------------------

function renderTeacherTable() {

    const table =
        document.getElementById("teacherTableBody");

    if (!table) return;

    table.innerHTML = "";

    teachers.forEach((teacher, index) => {

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td><img src="${teacher.photo || DEFAULT_PHOTO}" style="width:45px;height:45px;border-radius:50%;object-fit:cover;"></td>

<td>${teacher.teacherId || ""}</td>

<td>${teacher.name || ""}</td>

<td>${teacher.designation || ""}</td>

<td>${teacher.subject || ""}</td>

<td>${teacher.mobile || ""}</td>

<td><span class="badge bg-${teacher.status === "Active" ? "success" : "danger"}">${teacher.status || "Active"}</span></td>

<td>

<button
class="btn btn-info btn-sm"
onclick="openTeacherProfile('${teacher.docId}')">

Profile

</button>

<button
class="btn btn-success btn-sm"
onclick="openTeacherIDCard('${teacher.docId}')">

ID

</button>

<button
class="btn btn-primary btn-sm"
onclick="editTeacher('${teacher.docId}')">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteTeacher('${teacher.docId}')">

Delete

</button>

</td>

</tr>

`;

    });

    const countElem = document.getElementById("teacherCount");
    if (countElem) countElem.innerText = teachers.length;

}
// ======================================================
// School Management System V8
// teachers.js
// Part 6
// Edit Teacher + Delete Teacher
// ======================================================

// ------------------------------------
// Edit Teacher
// ------------------------------------

window.editTeacher = function (docId) {

    if (!document.getElementById("teacherId")) {
        localStorage.setItem("editTeacherId", docId);
        window.location.href = "teachers.html";
        return;
    }

    const teacher = findTeacher(docId);

    if (!teacher) return;

    editId = docId;

    if(document.getElementById("teacherId")) document.getElementById("teacherId").value = teacher.teacherId || "";
    if(document.getElementById("teacherName")) document.getElementById("teacherName").value = teacher.name || "";
    if(document.getElementById("fatherName")) document.getElementById("fatherName").value = teacher.father || "";
    if(document.getElementById("motherName")) document.getElementById("motherName").value = teacher.mother || "";
    if(document.getElementById("designation")) document.getElementById("designation").value = teacher.designation || "";
    if(document.getElementById("teacherSubject")) document.getElementById("teacherSubject").value = teacher.subject || "";
    if(document.getElementById("joiningDate")) document.getElementById("joiningDate").value = teacher.joiningDate || "";
    if(document.getElementById("teacherDOB")) document.getElementById("teacherDOB").value = teacher.dob || "";
    if(document.getElementById("teacherGender")) document.getElementById("teacherGender").value = teacher.gender || "";
    if(document.getElementById("teacherReligion")) document.getElementById("teacherReligion").value = teacher.religion || "";
    if(document.getElementById("teacherMobile")) document.getElementById("teacherMobile").value = teacher.mobile || "";
    if(document.getElementById("teacherEmail")) document.getElementById("teacherEmail").value = teacher.email || "";
    if(document.getElementById("teacherSalary")) document.getElementById("teacherSalary").value = teacher.salary || "";
    if(document.getElementById("teacherStatus")) document.getElementById("teacherStatus").value = teacher.status || "";
    if(document.getElementById("teacherAddress")) document.getElementById("teacherAddress").value = teacher.address || "";

    existingPhotoURL = teacher.photo || "";
    photoData = existingPhotoURL;
    photoChanged = false;

    const img =
        document.getElementById("teacherPhotoPreview");

    if (img) {

        img.src = existingPhotoURL || DEFAULT_PHOTO;

    }

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};

async function loadTeacherForEdit() {
    const docId = localStorage.getItem("editTeacherId");
    if (!docId) return;
    try {
        const snapshot = await getDoc(doc(db, "teachers", docId));
        if (!snapshot.exists()) return;
        const teacher = snapshot.data();
        editId = docId;
        if(document.getElementById("teacherId")) document.getElementById("teacherId").value = teacher.teacherId || "";
        if(document.getElementById("teacherName")) document.getElementById("teacherName").value = teacher.name || "";
        if(document.getElementById("fatherName")) document.getElementById("fatherName").value = teacher.father || "";
        if(document.getElementById("motherName")) document.getElementById("motherName").value = teacher.mother || "";
        if(document.getElementById("designation")) document.getElementById("designation").value = teacher.designation || "";
        if(document.getElementById("teacherSubject")) document.getElementById("teacherSubject").value = teacher.subject || "";
        if(document.getElementById("joiningDate")) document.getElementById("joiningDate").value = teacher.joiningDate || "";
        if(document.getElementById("teacherDOB")) document.getElementById("teacherDOB").value = teacher.dob || "";
        if(document.getElementById("teacherGender")) document.getElementById("teacherGender").value = teacher.gender || "";
        if(document.getElementById("teacherReligion")) document.getElementById("teacherReligion").value = teacher.religion || "";
        if(document.getElementById("teacherMobile")) document.getElementById("teacherMobile").value = teacher.mobile || "";
        if(document.getElementById("teacherEmail")) document.getElementById("teacherEmail").value = teacher.email || "";
        if(document.getElementById("teacherSalary")) document.getElementById("teacherSalary").value = teacher.salary || "";
        if(document.getElementById("teacherStatus")) document.getElementById("teacherStatus").value = teacher.status || "";
        if(document.getElementById("teacherAddress")) document.getElementById("teacherAddress").value = teacher.address || "";

        existingPhotoURL = teacher.photo || "";
        photoData = existingPhotoURL;
        photoChanged = false;
        const img = document.getElementById("teacherPhotoPreview");
        if (img) img.src = existingPhotoURL || DEFAULT_PHOTO;

        localStorage.removeItem("editTeacherId");
    } catch (err) {
        console.error(err);
    }
}

// ------------------------------------
// Delete Teacher
// (also removes the photo from Storage, if any, so
// deleted teachers don't leave orphaned files behind)
// ------------------------------------

window.deleteTeacher = async function (docId) {

    if (!confirm("Delete this teacher?")) return;

    try {

        const teacher = findTeacher(docId);

        await deleteDoc(
            doc(db, "teachers", docId)
        );

        if (teacher && teacher.photo) {

            try {

                await deleteObject(
                    ref(storage, `teachers/${teacher.teacherId}/photo.jpg`)
                );

            } catch (storageError) {

                // Non-fatal — the record is already deleted either way.
                console.warn("Could not remove teacher photo:", storageError);

            }

        }

        alert("Teacher Deleted Successfully.");

    }

    catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};
// ======================================================
// School Management System V8
// teachers.js
// Part 7 (FINAL)
// Search + Profile + ID Card + Initialize
// ======================================================

// ------------------------------------
// Search Teacher
// ------------------------------------

window.searchTeacher = function () {

    const keyword = document
        .getElementById("searchTeacher")
        ?.value
        .toLowerCase() || "";

    const table =
        document.getElementById("teacherTableBody");

    if (!table) return;

    table.innerHTML = "";

    const filtered = teachers.filter(teacher => {

        return (

            (teacher.name || "").toLowerCase().includes(keyword) ||

            (teacher.teacherId || "").toLowerCase().includes(keyword) ||

            (teacher.mobile || "").toLowerCase().includes(keyword) ||

            (teacher.subject || "").toLowerCase().includes(keyword)

        );

    });

    filtered.forEach((teacher, index) => {

        table.innerHTML += `

<tr>

<td>${index + 1}</td>

<td><img src="${teacher.photo || DEFAULT_PHOTO}" style="width:45px;height:45px;border-radius:50%;object-fit:cover;"></td>

<td>${teacher.teacherId || ""}</td>

<td>${teacher.name || ""}</td>

<td>${teacher.designation || ""}</td>

<td>${teacher.subject || ""}</td>

<td>${teacher.mobile || ""}</td>

<td><span class="badge bg-${teacher.status === "Active" ? "success" : "danger"}">${teacher.status || "Active"}</span></td>

<td>

<button class="btn btn-info btn-sm"
onclick="openTeacherProfile('${teacher.docId}')">
Profile
</button>

<button class="btn btn-success btn-sm"
onclick="openTeacherIDCard('${teacher.docId}')">
ID
</button>

<button class="btn btn-primary btn-sm"
onclick="editTeacher('${teacher.docId}')">
Edit
</button>

<button class="btn btn-danger btn-sm"
onclick="deleteTeacher('${teacher.docId}')">
Delete
</button>

</td>

</tr>

`;

    });

    const countElem = document.getElementById("teacherCount");
    if (countElem) countElem.innerText = filtered.length;

};

// ------------------------------------
// Open Teacher Profile
// ------------------------------------

window.openTeacherProfile = function(docId){

    localStorage.setItem(
        "teacherProfileId",
        docId
    );

    window.location.href =
    "teachers_profile.html";

};

// ------------------------------------
// Open Teacher ID Card
// ------------------------------------

window.openTeacherIDCard = function(docId){

    localStorage.setItem(
        "teacherProfileId",
        docId
    );

    window.location.href =
    "teachers_incard.html";

};

// ------------------------------------
// Print
// ------------------------------------

window.printTeacherIDCard = function(){

    window.print();

};

// ------------------------------------
// Refresh Table
// ------------------------------------

window.refreshTeacherTable = function(){

    renderTeacherTable();

};

// ------------------------------------
// Total Teachers
// ------------------------------------

window.totalTeachers = function(){

    return teachers.length;

};

// ------------------------------------
// Module Ready
// ------------------------------------

window.TEACHER_MODULE_VERSION = "V8.0";

console.log("==================================");
console.log("Teacher Module V8 Loaded");
console.log("Firebase Connected");
console.log("==================================");
