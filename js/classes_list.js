// ======================================================
// School Management System
// classes_list.js
//
// Realtime list of classes with edit/delete.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const classesRef = collection(db, "classes");

let classes = [];

const classQuery = query(classesRef, orderBy("order"));

onSnapshot(classQuery, (snapshot) => {

    classes = [];

    snapshot.forEach((docSnap) => {

        classes.push({
            docId: docSnap.id,
            ...docSnap.data()
        });

    });

    renderClassTable();

}, (error) => {

    console.error("Class List Error:", error);

});

function renderClassTable() {

    const table = document.getElementById("classTableBody");

    if (!table) return;

    table.innerHTML = "";

    classes.forEach((cls, index) => {

        table.innerHTML += `
<tr>
<td>${index + 1}</td>
<td>${cls.name || ""}</td>
<td>${(cls.sections || []).join(", ")}</td>
<td>${cls.classTeacherName || "-"}</td>
<td>
<button class="btn btn-primary btn-sm" onclick="editClass('${cls.docId}')">Edit</button>
<button class="btn btn-danger btn-sm" onclick="deleteClass('${cls.docId}')">Delete</button>
</td>
</tr>
`;

    });

    const countEl = document.getElementById("totalClasses");

    if (countEl) countEl.textContent = classes.length;

}

window.editClass = function (docId) {

    localStorage.setItem("editClassId", docId);

    window.location.href = "classes.html";

};

window.deleteClass = async function (docId) {

    if (!confirm("Delete this class? Existing students/records won't be affected, but this class will disappear from dropdowns.")) return;

    try {

        await deleteDoc(doc(db, "classes", docId));

        alert("Class Deleted Successfully.");

    } catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};

console.log("Class List Module Ready");
