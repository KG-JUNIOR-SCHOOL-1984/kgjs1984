// ==========================================
// School Management System V6
// reports.js
// ==========================================

// ------------------------------------------
// Student Report
// ------------------------------------------

window.openStudentReport = function () {

    window.location.href = "students.html";

};

// ------------------------------------------
// Teacher Report
// ------------------------------------------

window.openTeacherReport = function () {

    window.location.href = "teachers.html";

};

// ------------------------------------------
// Fees Report
// ------------------------------------------

window.openFeesReport = function () {

    window.location.href = "fees_list.html";

};

// ------------------------------------------
// Attendance Report
// ------------------------------------------

window.openAttendanceReport = function () {

    window.location.href = "attendance_list.html";

};

// ------------------------------------------
// Result Report
// ------------------------------------------

window.openResultReport = function () {

    window.location.href = "result_list.html";

};

// ------------------------------------------
// Print Report
// ------------------------------------------

window.printReports = function () {

    window.print();

};

// ------------------------------------------
// Initialize
// ------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    console.log("Reports Module Initialized");

});

// ------------------------------------------
// Module Version
// ------------------------------------------

window.REPORT_MODULE_VERSION = "V6.0";

// ------------------------------------------
// Ready Message
// ------------------------------------------

console.log("======================================");
console.log(" School Management System V6");
console.log(" Reports Module Loaded");
console.log("======================================");
