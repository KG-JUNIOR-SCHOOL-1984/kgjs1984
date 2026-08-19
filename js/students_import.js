// ======================================================
// School Management System
// students_import.js
//
// Bulk-add students from an Excel (.xlsx/.xls) file.
// Uses the SheetJS library (loaded via CDN in students.html,
// exposed globally as window.XLSX) to parse the file in the
// browser -- nothing is uploaded anywhere except the final
// student records, which go straight to Firestore the same
// way a normal "Save Student" submit would.
//
// Each row gets its own auto-generated Student ID via the
// same transaction-safe counter used by the admission form,
// so importing never collides with IDs created manually.
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getNextSequentialId } from "./idCounter.js";

const studentsRef = collection(db, "students");

const STUDENT_PREFIX = "STD";
const STUDENT_ID_LENGTH = 6;

// Column headers expected in the Excel file (in this order).
// Only "Name" and "Class" are required -- everything else can
// be left blank and will just be saved as an empty field.
const TEMPLATE_COLUMNS = [
    "Name",
    "Class",
    "Roll",
    "Section",
    "Session",
    "AdmissionDate (YYYY-MM-DD)",
    "Status (Active/Inactive/Transferred)",
    "Gender",
    "Religion",
    "DOB (YYYY-MM-DD)",
    "Blood Group",
    "Email",
    "MonthlyFee",
    "AdmissionFee",
    "Father",
    "FatherMobile",
    "FatherOccupation",
    "Mother",
    "MotherMobile",
    "MotherOccupation",
    "Address",
    "GuardianName",
    "GuardianMobile",
    "GuardianOccupation"
];

// ------------------------------------
// Download a blank template so the school
// always fills in the right columns.
// ------------------------------------

window.downloadStudentTemplate = function () {

    if (!window.XLSX) {
        alert("Excel library not loaded. Please refresh the page and try again.");
        return;
    }

    const sampleRow = {
        "Name": "Rahim Uddin",
        "Class": "Class 1",
        "Roll": 5,
        "Section": "A",
        "Session": "2026",
        "AdmissionDate (YYYY-MM-DD)": "2026-01-15",
        "Status (Active/Inactive/Transferred)": "Active",
        "Gender": "Male",
        "Religion": "Islam",
        "DOB (YYYY-MM-DD)": "2019-05-10",
        "Blood Group": "B+",
        "Email": "",
        "MonthlyFee": 500,
        "AdmissionFee": 1000,
        "Father": "Karim Uddin",
        "FatherMobile": "01711111111",
        "FatherOccupation": "Farmer",
        "Mother": "Rahima Begum",
        "MotherMobile": "",
        "MotherOccupation": "Housewife",
        "Address": "Gobindaganj, Gaibandha",
        "GuardianName": "Karim Uddin",
        "GuardianMobile": "01711111111",
        "GuardianOccupation": "Farmer"
    };

    const worksheet = window.XLSX.utils.json_to_sheet([sampleRow], { header: TEMPLATE_COLUMNS });

    const workbook = window.XLSX.utils.book_new();

    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    window.XLSX.writeFile(workbook, "student_admission_template.xlsx");

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

    const box = document.getElementById("studentImportStatus");

    if (!box) return;

    box.style.display = "block";

    box.className = "px-3 pt-2 " + (isError ? "text-danger" : "text-primary");

    box.innerText = message;

}

// ------------------------------------
// Handle file selection -> parse -> import
// ------------------------------------

window.handleStudentExcelImport = async function (event) {

    const file = event.target.files[0];

    event.target.value = ""; // allow re-selecting the same file later

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

    if (!confirm(`Import ${rows.length} student(s) from this file?`)) {

        setStatus("", false);

        document.getElementById("studentImportStatus").style.display = "none";

        return;

    }

    let successCount = 0;

    const skipped = [];

    for (let i = 0; i < rows.length; i++) {

        const row = rows[i];

        setStatus(`Importing ${i + 1} of ${rows.length}...`, false);

        const name = pick(row, "Name");

        const studentClass = pick(row, "Class");

        if (name === "") {

            skipped.push(`Row ${i + 2}: missing Name`);

            continue;

        }

        if (studentClass === "") {

            skipped.push(`Row ${i + 2} (${name}): missing Class`);

            continue;

        }

        const guardianMobile = pick(row, "GuardianMobile");

        if (guardianMobile !== "" && !/^01[3-9][0-9]{8}$/.test(guardianMobile)) {

            skipped.push(`Row ${i + 2} (${name}): invalid Guardian Mobile`);

            continue;

        }

        const student = {

            name,
            studentClass,
            roll: pick(row, "Roll"),
            section: pick(row, "Section"),
            session: pick(row, "Session"),
            admissionDate: pick(row, "AdmissionDate"),
            status: pick(row, "Status") || "Active",
            gender: pick(row, "Gender"),
            religion: pick(row, "Religion"),
            dob: pick(row, "DOB"),
            blood: pick(row, "Blood"),
            email: pick(row, "Email"),
            monthlyFee: Number(pick(row, "MonthlyFee") || 0),
            admissionFee: Number(pick(row, "AdmissionFee") || 0),
            father: pick(row, "Father"),
            fatherMobile: pick(row, "FatherMobile"),
            fatherOccupation: pick(row, "FatherOccupation"),
            mother: pick(row, "Mother", "MotherName"),
            motherMobile: pick(row, "MotherMobile"),
            motherOccupation: pick(row, "MotherOccupation"),
            address: pick(row, "Address"),
            guardianName: pick(row, "GuardianName"),
            guardianMobile,
            guardianOccupation: pick(row, "GuardianOccupation"),
            photo: ""

        };

        try {

            student.studentId = await getNextSequentialId({
                counterName: "students",
                prefix: STUDENT_PREFIX,
                padLength: STUDENT_ID_LENGTH,
                collectionRef: studentsRef,
                idField: "studentId",
                idRegex: /^STD-(\d+)$/
            });

            await addDoc(studentsRef, student);

            successCount++;

        } catch (error) {

            console.error(error);

            skipped.push(`Row ${i + 2} (${name}): save failed`);

        }

    }

    let summary = `Import finished: ${successCount} of ${rows.length} student(s) added.`;

    if (skipped.length > 0) {

        summary += `\n\nSkipped:\n` + skipped.join("\n");

    }

    setStatus(`${successCount} of ${rows.length} imported.` + (skipped.length ? ` ${skipped.length} skipped.` : ""), skipped.length > 0);

    alert(summary);

};

console.log("==================================");
console.log("Student Excel Import Module Loaded");
console.log("==================================");
