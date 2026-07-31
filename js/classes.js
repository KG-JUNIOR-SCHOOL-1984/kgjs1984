// ======================================================
// School Management System
// classes.js
//
// Class Management: add/edit a class (e.g. "Class 5"),
// its sections (A/B/C...), and its assigned class teacher.
// This becomes the single source of truth that class
// dropdowns across the app pull from (see classHelper.js).
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
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const classesRef = collection(db, "classes");
const teachersRef = collection(db, "teachers");

let editId = null;

// ------------------------------------
// Load Teachers Into "Class Teacher" Dropdown
// ------------------------------------

async function loadTeacherOptions() {

    const select = document.getElementById("classTeacher");

    if (!select) return;

    try {

        const snapshot = await getDocs(
            query(teachersRef, orderBy("name"))
        );

        select.innerHTML = '<option value="">-- No Class Teacher --</option>';

        snapshot.forEach((docSnap) => {

            const teacher = docSnap.data();

            const opt = document.createElement("option");
            opt.value = docSnap.id;
            opt.textContent = teacher.name || docSnap.id;
            opt.dataset.name = teacher.name || "";

            select.appendChild(opt);

        });

    } catch (error) {

        console.error("loadTeacherOptions error:", error);

    }

}

// ------------------------------------
// Get Form Data
// ------------------------------------

function getFormData() {

    const sectionsRaw = document.getElementById("classSections")?.value.trim() || "";

    const sections = sectionsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

    const teacherSelect = document.getElementById("classTeacher");
    const teacherId = teacherSelect?.value || "";
    const teacherName = teacherId
        ? (teacherSelect.options[teacherSelect.selectedIndex]?.dataset.name || "")
        : "";

    return {
        name: document.getElementById("className")?.value.trim() || "",
        order: Number(document.getElementById("classOrder")?.value || 0),
        sections,
        classTeacherId: teacherId,
        classTeacherName: teacherName
    };

}

function validateClass(cls) {

    if (cls.name === "") {

        alert("Class Name is Required.");

        return false;

    }

    if (cls.sections.length === 0) {

        alert("At least one Section is required (comma separated, e.g. A, B).");

        return false;

    }

    return true;

}

// ------------------------------------
// Save / Update Class
// ------------------------------------

window.saveClass = async function () {

    const cls = getFormData();

    if (!validateClass(cls)) return;

    try {

        if (editId === null) {

            await addDoc(classesRef, cls);

            alert("Class Added Successfully.");

        } else {

            await updateDoc(doc(db, "classes", editId), cls);

            alert("Class Updated Successfully.");

        }

        window.resetClassForm();

    } catch (error) {

        console.error(error);

        alert("Save Failed: " + error.message);

    }

};

// ------------------------------------
// Reset Form
// ------------------------------------

window.resetClassForm = function () {

    const form = document.getElementById("classForm");

    if (form) form.reset();

    editId = null;

    const submitBtn = document.getElementById("classSubmitBtn");

    if (submitBtn) submitBtn.textContent = "Save Class";

};

// ------------------------------------
// Load Class For Edit
// ------------------------------------

async function loadClassForEdit() {

    const docId = localStorage.getItem("editClassId");

    if (!docId) return;

    try {

        const snapshot = await getDoc(doc(db, "classes", docId));

        if (!snapshot.exists()) return;

        const cls = snapshot.data();

        editId = docId;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal("className", cls.name || "");
        setVal("classOrder", cls.order || 0);
        setVal("classSections", (cls.sections || []).join(", "));

        const teacherSelect = document.getElementById("classTeacher");

        if (teacherSelect && cls.classTeacherId) {

            teacherSelect.value = cls.classTeacherId;

        }

        const submitBtn = document.getElementById("classSubmitBtn");

        if (submitBtn) submitBtn.textContent = "Update Class";

        localStorage.removeItem("editClassId");

    } catch (error) {

        console.error(error);

    }

}

// ------------------------------------
// Initialize
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    await loadTeacherOptions();

    await loadClassForEdit();

    const form = document.getElementById("classForm");

    if (form) {

        form.addEventListener("submit", (e) => {

            e.preventDefault();

            window.saveClass();

        });

    }

    console.log("Class Module Ready");

});
