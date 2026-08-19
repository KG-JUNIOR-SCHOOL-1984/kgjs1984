// ======================================================
// School Management System
// teachers_import.js
//
// Bulk-add teachers from an Excel (.xlsx/.xls) file.
// Mirrors students_import.js -- see that file for the
// full explanation of how the parsing/import works.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getNextSequentialId } from "./idCounter.js";

const teachersRef = collection(db, "teachers");

const TEACHER_PREFIX = "TCH";
const TEACHER_ID_LENGTH = 6;

const TEMPLATE_COLUMNS = [
    "Name",
    "Designation",
    "Subject",
    "JoiningDate (YYYY-MM-DD)",
    "DOB (YYYY-MM-DD)",
    "Gender",
    "Religion",
    "Mobile",
    "Email",
    "Salary",
    "Status (Active/Inactive)",
    "Father",
    "Mother",
    "Address"
];

// ------------------------------------
// Download a blank template.
// ------------------------------------

window.downloadTeacherTemplate = function () {

    if (!window.XLSX) {
        alert("Excel library not loaded. Please refresh the page and try again.");
        return;
    }

    const sampleRow = {
        "Name": "Salma Akter",
        "Designation": "Assistant Teacher",
        "Subject": "English",
        "JoiningDate (YYYY-MM-DD)": "2026-01-01",
        "DOB (YYYY-MM-DD)": "1990-03-12",
        "Gender": "Female",
        "Religion": "Islam",
        "Mobile": "01711111111",
        "Email": "",
        "Salary": 15000,
        "Status (Active/Inactive)": "Active",
        "Father": "",
        "Mother": "",
        "Address": "Gobindaganj, Gaibandha"
    };

    const worksheet = window.XLSX.utils.json_to_sheet([sampleRow], { header: TEMPLATE_COLUMNS });

    const workbook = window.XLSX.utils.book_new();

    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");

    window.XLSX.writeFile(workbook, "teacher_admission_template.xlsx");

};

// ------------------------------------
// Read a value out of a parsed Excel row,
// tolerant of the exact header text used.
// ------------------------------------

function pick(row, ...keys) {

    for (const key of keys) {

        for (const rowKey of Object.keys(row)) {

            if (rowKey.trim().toLowerCase().startsWith(key.toLowerCase())) {

                const value = row[rowKey];

                return value === undefined || value === null ? "" : String(value).trim();

            }

        }

    }

    return "";

}

function setStatus(message, isError) {

    const box = document.getElementById("teacherImportStatus");

    if (!box) return;

    box.style.display = "block";

    box.className = "px-3 pt-2 " + (isError ? "text-danger" : "text-primary");

    box.innerText = message;

}

// ------------------------------------
// Handle file selection -> parse -> import
// ------------------------------------

window.handleTeacherExcelImport = async function (event) {

    const file = event.target.files[0];

    event.target.value = "";

    if (!file) return;

    if (!window.XLSX) {
        alert("Excel library not loaded. Please refresh the page and try again.");
        return;
    }

    setStatus("Reading file...", false);

    let rows;

    try {

        const data = await file.arrayBuffer();

        const workbook = window.XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[firstSheetName];

        rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });

    } catch (error) {

        console.error(error);

        setStatus("Could not read the Excel file. Please check the format.", true);

        return;

    }

    if (!rows || rows.length === 0) {

        setStatus("No rows found in the file.", true);

        return;

    }

    if (!confirm(`Import ${rows.length} teacher(s) from this file?`)) {

        setStatus("", false);

        document.getElementById("teacherImportStatus").style.display = "none";

        return;

    }

    let successCount = 0;

    const skipped = [];

    for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        setStatus(`Importing ${i + 1} of ${rows.length}...`, false);

        const name = pick(row, "Name");

        const designation = pick(row, "Designation");

        if (name === "") {

            skipped.push(`Row ${i + 2}: missing Name`);

            continue;

        }

        if (designation === "") {

            skipped.push(`Row ${i + 2} (${name}): missing Designation`);

            continue;

        }

        const mobile = pick(row, "Mobile");

        if (mobile !== "" && !/^01[3-9][0-9]{8}$/.test(mobile)) {

            skipped.push(`Row ${i + 2} (${name}): invalid Mobile Number`);

            continue;

        }

        const teacher = {

            name,
            designation,
            subject: pick(row, "Subject"),
            joiningDate: pick(row, "JoiningDate"),
            dob: pick(row, "DOB"),
            gender: pick(row, "Gender"),
            religion: pick(row, "Religion"),
            mobile,
            email: pick(row, "Email"),
            salary: Number(pick(row, "Salary") || 0),
            status: pick(row, "Status") || "Active",
            father: pick(row, "Father"),
            mother: pick(row, "Mother"),
            address: pick(row, "Address"),
            photo: ""

        };

        try {

            teacher.teacherId = await getNextSequentialId({
                counterName: "teachers",
                prefix: TEACHER_PREFIX,
                padLength: TEACHER_ID_LENGTH,
                collectionRef: teachersRef,
                idField: "teacherId",
                idRegex: /^TCH-(\d+)$/
            });

            await addDoc(teachersRef, teacher);

            successCount++;

        } catch (error) {

            console.error(error);

            skipped.push(`Row ${i + 2} (${name}): save failed`);

        }

    }

    let summary = `Import finished: ${successCount} of ${rows.length} teacher(s) added.`;

    if (skipped.length > 0) {

        summary += `\n\nSkipped:\n` + skipped.join("\n");

    }

    setStatus(`${successCount} of ${rows.length} imported.` + (skipped.length ? ` ${skipped.length} skipped.` : ""), skipped.length > 0);

    alert(summary);

};

console.log("==================================");
console.log("Teacher Excel Import Module Loaded");
console.log("==================================");
