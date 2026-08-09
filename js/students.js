// ======================================================
// School Management System V8
// students.js
// Part 1
// Firebase Setup + Collection + Global Variables
//
// V8 changes:
// - Student ID now comes from idCounter.js (Firestore
//   transaction) instead of scanning the whole collection.
// - Photos now upload to Firebase Storage and only the
//   download URL is saved in Firestore (no more base64
//   blobs bloating documents).
// ======================================================

import { db, storage } from "./firebase.js";

import { populateClassDropdown } from "./classHelper.js";

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadString,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import { getNextSequentialId, peekNextSequentialId } from "./idCounter.js";

// ======================================================
// Firestore Collection
// ======================================================

const studentsRef = collection(db, "students");

// ======================================================
// Global Variables
// ======================================================

let editId = null;

let photoData = "";       // Data URL for the <img> preview (and upload source)
let photoChanged = false; // true only when the user picks a NEW file
let existingPhotoURL = ""; // photo URL already stored in Firestore (edit mode)

let isSaving = false;

const DEFAULT_PHOTO =
"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%23999999'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const STUDENT_PREFIX = "STD";

const STUDENT_ID_LENGTH = 6;

// ======================================================
// Utility Functions
// ======================================================

function today() {

    return new Date()
        .toISOString()
        .split("T")[0];

}

console.log("================================");
console.log("Student Module V8 Loaded");
console.log("================================");
// ======================================================
// School Management System V8
// students.js
// Part 2
// Student ID + Photo Preview + Reset
// ======================================================

// -------------------------------------
// Generate Student ID (counter-based)
// -------------------------------------

async function generateStudentID() {

    if (editId !== null) return;

    const input = document.getElementById("studentId");

    if (!input) return;

    try {

        input.value = await peekNextSequentialId({
            counterName: "students",
            prefix: STUDENT_PREFIX,
            padLength: STUDENT_ID_LENGTH,
            collectionRef: studentsRef,
            idField: "studentId",
            idRegex: /^STD-(\d+)$/
        });

    } catch (error) {

        console.error(error);

        input.value =
            STUDENT_PREFIX +
            "-000001";

    }

}

// -------------------------------------
// Photo Preview with Auto Compression
// -------------------------------------

function previewStudentPhoto(event) {

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

            // Lightweight JPEG compressed data URL (~25KB)
            photoData = canvas.toDataURL("image/jpeg", 0.75);

            photoChanged = true;

            const img = document.getElementById("studentPhotoPreview");

            if (img) {

                img.src = photoData;

            }

        };

        imgObj.src = e.target.result;

    };

    reader.readAsDataURL(file);

}

// -------------------------------------
// Reset Global Data
// -------------------------------------

function resetGlobalData() {

    editId = null;

    photoData = "";
    photoChanged = false;
    existingPhotoURL = "";

}

// -------------------------------------
// Reset Form
// -------------------------------------

async function resetStudentForm() {

    const form =
        document.getElementById("studentForm");

    if (form) {

        form.reset();

    }

    resetGlobalData();

    const img =
        document.getElementById("studentPhotoPreview");

    if (img) {

        img.src = DEFAULT_PHOTO;

    }

    const admission =
        document.getElementById("admissionDate");

    if (admission) {

        admission.value = today();

    }

    await generateStudentID();

}

// -------------------------------------
// Global Functions
// -------------------------------------

window.previewStudentPhoto = previewStudentPhoto;
window.resetStudentForm = resetStudentForm;
// ======================================================
// School Management System V8
// students.js
// Part 3
// Get Form Data + Validation
// ======================================================

// -------------------------------------
// Get Student Form Data
// -------------------------------------

function getFormData() {

    return {

        studentId: document.getElementById("studentId")?.value.trim() || "",

        name: document.getElementById("studentName")?.value.trim() || "",

        father: document.getElementById("fatherName")?.value.trim() || "",

        mother: document.getElementById("motherName")?.value.trim() || "",

        studentClass: document.getElementById("studentClass")?.value || "",

        roll: document.getElementById("studentRoll")?.value.trim() || "",

        section: document.getElementById("studentSection")?.value || "",

        medium: document.getElementById("studentMedium")?.value || "",

        session: document.getElementById("studentSession")?.value || "",

        admissionDate: document.getElementById("admissionDate")?.value || "",

        gender: document.getElementById("studentGender")?.value || "",

        religion: document.getElementById("studentReligion")?.value || "",

        dob: document.getElementById("studentDOB")?.value || "",

        blood: document.getElementById("studentBlood")?.value || "",

        email: document.getElementById("studentEmail")?.value.trim() || "",

        status: document.getElementById("studentStatus")?.value || "Active",

        address: document.getElementById("studentAddress")?.value.trim() || "",

        monthlyFee: Number(document.getElementById("monthlyFee")?.value || 0),

        admissionFee: Number(document.getElementById("admissionFee")?.value || 0),

        guardianName: document.getElementById("guardianName")?.value.trim() || "",

        guardianMobile: document.getElementById("guardianMobile")?.value.trim() || "",

        guardianOccupation: document.getElementById("guardianOccupation")?.value.trim() || ""

        // NOTE: "photo" is intentionally left out here — it's resolved
        // separately in saveStudent() after the Storage upload (if any)
        // finishes, so we know the final download URL to store.

    };

}

// -------------------------------------
// Validation
// -------------------------------------

function validateStudent(student) {

    if (student.name === "") {

        alert("Student Name is Required.");

        return false;

    }

    if (student.studentClass === "") {

        alert("Please Select Class.");

        return false;

    }

    if (student.guardianMobile !== "") {

        if (!/^01[3-9][0-9]{8}$/.test(student.guardianMobile)) {

            alert("Invalid Guardian Mobile Number.");

            return false;

        }

    }

    if (student.email !== "") {

        const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(student.email)) {

            alert("Invalid Email Address.");

            return false;

        }

    }

    return true;

}
// ======================================================
// School Management System V8
// students.js
// Part 4
// Photo Upload + Save Student + Update Student
// ======================================================

// -------------------------------------
// Upload Photo To Firebase Storage (with fallback)
// -------------------------------------

async function uploadStudentPhoto(studentId) {

    try {

        const storageRef = ref(storage, `students/${studentId}/photo.jpg`);

        // NOTE: uploadString/getDownloadURL can hang indefinitely (never
        // resolve OR reject) if Firebase Storage isn't enabled for this
        // project, or the storage domain is blocked by the network —
        // without a timeout, "await" here would freeze the Save button
        // forever with no error shown. Race against a timeout so we
        // always fall back to the base64 image instead of hanging.
        const uploadPromise = uploadString(storageRef, photoData, "data_url")
            .then(() => getDownloadURL(storageRef));

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Photo upload timed out")), 15000)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);

    } catch (err) {

        console.warn("Storage upload failed, falling back to compressed base64 image:", err);

        return photoData;

    }

}

// -------------------------------------
// Save / Update Student
// -------------------------------------

async function saveStudent() {

    if (isSaving) return;

    const student = getFormData();

    if (!validateStudent(student)) return;

    // Student IDs are readonly and generated via a transaction-safe
    // counter (idCounter.js), so a full-collection duplicate scan is
    // no longer needed here — the counter guarantees uniqueness.

    // Holds the final photo URL to save. Defaults to the existing
    // photo (edit mode) or blank (new student) unless a new photo
    // is uploaded below.
    let photoURL = existingPhotoURL || "";

    isSaving = true;

    try {

        // Resolve the final photo URL:
        // - New photo picked -> upload it, use the returned URL
        // - Editing, no new photo picked -> keep the existing URL
        // - New student, no photo picked -> leave blank
        if (editId === null) {

            // Upload the photo BEFORE reserving the sequential ID. The ID
            // counter increments the moment it's reserved (Firestore
            // transaction), even if the save fails afterwards — so any
            // step that can fail or take a while (like a photo upload)
            // must happen first, or a failed/retried save silently burns
            // an ID number (e.g. jumping from STD-000005 to STD-000007
            // with no STD-000006 ever created).
            let tempPhotoURL = photoURL;

            if (photoChanged && photoData.startsWith("data:")) {
                const tempPath = "temp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
                tempPhotoURL = await uploadStudentPhoto(tempPath);
            }

            const newId = await getNextSequentialId({
                counterName: "students",
                prefix: STUDENT_PREFIX,
                padLength: STUDENT_ID_LENGTH,
                collectionRef: studentsRef,
                idField: "studentId",
                idRegex: /^STD-(\d+)$/
            });

            student.studentId = newId;
            student.photo = tempPhotoURL || "";

            await addDoc(studentsRef, student);

            alert("Student Added Successfully.");

        } else {

            if (photoChanged && photoData.startsWith("data:")) {
                photoURL = await uploadStudentPhoto(student.studentId);
            }

            student.photo = photoURL || "";

            await updateDoc(
                doc(db, "students", editId),
                student
            );

            alert("Student Updated Successfully.");

        }

        await resetStudentForm();

    } catch (error) {

        console.error(error);

        alert(error.message);

    } finally {

        isSaving = false;

    }

}

// -------------------------------------
// Cancel Edit
// -------------------------------------

function cancelEdit() {

    resetStudentForm();

}

// -------------------------------------
// Global Functions
// -------------------------------------

window.saveStudent = saveStudent;

window.cancelEdit = cancelEdit;

// ======================================================
// School Management System V8
// students.js
// Part 5 (FINAL)
// Edit Mode + Initialization
// ======================================================

// -------------------------------------
// Load Student For Edit
// -------------------------------------

async function loadStudentForEdit() {

    const docId = localStorage.getItem("editStudentId");

    if (!docId) return;

    try {

        const snapshot =
            await getDoc(doc(db, "students", docId));

        if (!snapshot.exists()) return;

        const student = snapshot.data();

        editId = docId;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

        setVal("studentId", student.studentId || "");
        setVal("studentName", student.name || "");
        setVal("fatherName", student.father || "");
        setVal("motherName", student.mother || "");
        setVal("studentClass", student.studentClass || "");
        setVal("studentRoll", student.roll || "");
        setVal("studentSection", student.section || "");
        setVal("studentMedium", student.medium || "");
        setVal("studentSession", student.session || "");
        setVal("admissionDate", student.admissionDate || "");
        setVal("studentGender", student.gender || "");
        setVal("studentReligion", student.religion || "");
        setVal("studentDOB", student.dob || "");
        setVal("studentBlood", student.blood || "");
        setVal("studentEmail", student.email || "");
        setVal("studentStatus", student.status || "");
        setVal("studentAddress", student.address || "");
        setVal("monthlyFee", student.monthlyFee || "");
        setVal("admissionFee", student.admissionFee || "");
        setVal("guardianName", student.guardianName || "");
        setVal("guardianMobile", student.guardianMobile || "");
        setVal("guardianOccupation", student.guardianOccupation || "");

        existingPhotoURL = student.photo || "";
        photoData = existingPhotoURL;
        photoChanged = false;

        const img =
            document.getElementById("studentPhotoPreview");

        if (img) {

            img.src = existingPhotoURL || DEFAULT_PHOTO;

        }

        localStorage.removeItem("editStudentId");

    } catch (error) {

        console.error(error);

    }

}

// -------------------------------------
// Initialization
// -------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    await generateStudentID();

    await populateClassDropdown("studentClass");

    await loadStudentForEdit();

    const admission =
        document.getElementById("admissionDate");

    if (admission && admission.value === "") {

        admission.value = today();

    }

    const img =
        document.getElementById("studentPhotoPreview");

    if (img && photoData === "") {

        img.src = DEFAULT_PHOTO;

    }

    console.log("================================");
    console.log("Student Module Ready");
    console.log("Version : V8");
    console.log("================================");

});

const studentForm = document.getElementById("studentForm");

if (studentForm) {

    studentForm.addEventListener("submit", function (e) {

        e.preventDefault();

        saveStudent();

    });

}
