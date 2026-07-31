// ======================================================
// School Management System
// routine.js
//
// Class-wise weekly timetable. One Firestore document per
// class (routines/{className}) holding a "days" map, e.g.
// { Saturday: [ {time, subject, teacher}, ... ], ... }
// ======================================================

import { db } from "./firebase.js";

import { populateClassDropdown } from "./classHelper.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const teachersRef = collection(db, "teachers");

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

let currentClass = "";
let schedule = {}; // { Saturday: [ {time, subject, teacher} ] , ... }

// ------------------------------------
// Load Teacher Names (for the "Teacher" dropdown in each row)
// ------------------------------------

let teacherNames = [];

async function loadTeacherNames() {

    try {

        const snapshot = await getDocs(query(teachersRef, orderBy("name")));

        teacherNames = snapshot.docs.map((d) => d.data().name).filter(Boolean);

    } catch (error) {

        console.error(error);

    }

}

// ------------------------------------
// Load Routine For Selected Class
// ------------------------------------

async function loadRoutine(className) {

    currentClass = className;

    schedule = {};

    DAYS.forEach((day) => { schedule[day] = []; });

    if (!className) {

        renderDayTabs();

        return;

    }

    try {

        const snapshot = await getDoc(doc(db, "routines", className));

        if (snapshot.exists()) {

            const data = snapshot.data();

            DAYS.forEach((day) => {

                schedule[day] = (data.days && data.days[day]) ? data.days[day] : [];

            });

        }

    } catch (error) {

        console.error(error);

    }

    renderDayTabs();

}

// ------------------------------------
// Render Day Tabs + Tables
// ------------------------------------

function renderDayTabs() {

    const container = document.getElementById("routineDays");

    if (!container) return;

    if (!currentClass) {

        container.innerHTML = '<p class="text-muted">Please select a class above to manage its routine.</p>';

        return;

    }

    container.innerHTML = DAYS.map((day) => {

        const rows = (schedule[day] || []).map((period, idx) => `
<tr>
<td>${period.time || ""}</td>
<td>${period.subject || ""}</td>
<td>${period.teacher || ""}</td>
<td><button class="btn btn-danger btn-sm" onclick="removePeriod('${day}', ${idx})">Remove</button></td>
</tr>
`).join("");

        return `
<div class="card mb-3 shadow-sm">
<div class="card-header bg-light fw-bold">${day}</div>
<div class="card-body">

<div class="table-responsive mb-3">
<table class="table table-sm align-middle">
<thead><tr><th>Time</th><th>Subject</th><th>Teacher</th><th></th></tr></thead>
<tbody>${rows || '<tr><td colspan="4" class="text-muted">No periods added</td></tr>'}</tbody>
</table>
</div>

<div class="row g-2">
<div class="col-md-3"><input type="text" class="form-control form-control-sm" id="time_${day}" placeholder="e.g. 10:00-10:40"></div>
<div class="col-md-3"><input type="text" class="form-control form-control-sm" id="subject_${day}" placeholder="Subject"></div>
<div class="col-md-3">
<select class="form-select form-select-sm" id="teacher_${day}">
<option value="">-- Teacher --</option>
${teacherNames.map((n) => `<option value="${n}">${n}</option>`).join("")}
</select>
</div>
<div class="col-md-3"><button class="btn btn-primary btn-sm w-100" onclick="addPeriod('${day}')">+ Add Period</button></div>
</div>

</div>
</div>
`;

    }).join("");

}

// ------------------------------------
// Add / Remove Period
// ------------------------------------

window.addPeriod = function (day) {

    const time = document.getElementById(`time_${day}`)?.value.trim() || "";
    const subject = document.getElementById(`subject_${day}`)?.value.trim() || "";
    const teacher = document.getElementById(`teacher_${day}`)?.value || "";

    if (time === "" || subject === "") {

        alert("Time and Subject are required.");

        return;

    }

    schedule[day] = schedule[day] || [];

    schedule[day].push({ time, subject, teacher });

    renderDayTabs();

};

window.removePeriod = function (day, idx) {

    schedule[day].splice(idx, 1);

    renderDayTabs();

};

// ------------------------------------
// Save Routine
// ------------------------------------

window.saveRoutine = async function () {

    if (!currentClass) {

        alert("Please select a class first.");

        return;

    }

    try {

        await setDoc(doc(db, "routines", currentClass), {

            className: currentClass,
            days: schedule

        });

        alert("Routine Saved Successfully.");

    } catch (error) {

        console.error(error);

        alert("Save Failed: " + error.message);

    }

};

// ------------------------------------
// Class Selector Change
// ------------------------------------

window.onRoutineClassChange = function () {

    const className = document.getElementById("routineClass")?.value || "";

    loadRoutine(className);

};

// ------------------------------------
// Initialize
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    await populateClassDropdown("routineClass");

    await loadTeacherNames();

    renderDayTabs();

    console.log("Routine Module Ready");

});
