// ======================================================
// School Management System
// classHelper.js
//
// Shared helper so every page's class dropdown pulls from
// the single "classes" collection (managed on classes.html)
// instead of each page hardcoding its own list.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const classesRef = collection(db, "classes");

/**
 * Fetch all classes, sorted by their "order" field (falls back to name).
 * Returns [{ docId, name, sections, classTeacherId, classTeacherName }]
 */
export async function fetchClasses() {

    try {

        const q = query(classesRef, orderBy("order"));

        const snapshot = await getDocs(q);

        return snapshot.docs.map((docSnap) => ({
            docId: docSnap.id,
            ...docSnap.data()
        }));

    } catch (error) {

        console.error("fetchClasses error:", error);

        return [];

    }

}

/**
 * Fill a <select> element (by id) with <option> tags built from the
 * classes collection. Keeps the select's first placeholder option
 * (if any) and appends class names after it.
 *
 * @param {string} selectId
 * @param {string} [selectedValue] - pre-select this class name if present
 */
export async function populateClassDropdown(selectId, selectedValue = "") {

    const select = document.getElementById(selectId);

    if (!select) return;

    const classes = await fetchClasses();

    // If the "classes" collection is empty (e.g. a fresh Firebase
    // project where no classes have been added via the Classes page
    // yet), leave the select's existing options (the default list
    // written in the HTML) untouched instead of wiping them out.
    if (classes.length === 0) {
        console.warn(`No classes found in Firestore — keeping the default options already in #${selectId}. Add classes via the Classes page to override them.`);
        return;
    }

    // Keep any existing placeholder ("Select Class") option, drop the rest.
    const placeholder = select.querySelector('option[value=""]');

    select.innerHTML = "";

    if (placeholder) {

        select.appendChild(placeholder);

    } else {

        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Select Class";
        select.appendChild(opt);

    }

    classes.forEach((cls) => {

        const opt = document.createElement("option");
        opt.value = cls.name;
        opt.textContent = cls.name;

        if (cls.name === selectedValue) {
            opt.selected = true;
        }

        select.appendChild(opt);

    });

}

/**
 * Fill a <select> with the section list of one specific class
 * (used for the "Section" dropdown once a class is chosen).
 */
export async function populateSectionDropdown(selectId, className, selectedValue = "") {

    const select = document.getElementById(selectId);

    if (!select) return;

    select.innerHTML = '<option value="">Select Section</option>';

    if (!className) return;

    const classes = await fetchClasses();

    const cls = classes.find((c) => c.name === className);

    const sections = (cls && cls.sections) ? cls.sections : [];

    sections.forEach((section) => {

        const opt = document.createElement("option");
        opt.value = section;
        opt.textContent = section;

        if (section === selectedValue) {
            opt.selected = true;
        }

        select.appendChild(opt);

    });

}
