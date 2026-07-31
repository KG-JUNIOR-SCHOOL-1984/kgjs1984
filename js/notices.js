// ======================================================
// School Management System
// notices.js
//
// Notice Board: admin/teacher post notices, visible on the
// dashboard and the student portal (see notices_feed.js).
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const noticesRef = collection(db, "notices");

let notices = [];

// ------------------------------------
// Save Notice
// ------------------------------------

window.saveNotice = async function () {

    const title = document.getElementById("noticeTitle")?.value.trim() || "";
    const message = document.getElementById("noticeMessage")?.value.trim() || "";
    const audience = document.getElementById("noticeAudience")?.value || "all";

    if (title === "" || message === "") {

        alert("Title and Message are required.");

        return;

    }

    try {

        await addDoc(noticesRef, {
            title,
            message,
            audience,
            createdAt: serverTimestamp()
        });

        alert("Notice Published Successfully.");

        document.getElementById("noticeForm").reset();

    } catch (error) {

        console.error(error);

        alert("Failed to publish notice: " + error.message);

    }

};

// ------------------------------------
// Realtime Notice List
// ------------------------------------

const noticeQuery = query(noticesRef, orderBy("createdAt", "desc"));

onSnapshot(noticeQuery, (snapshot) => {

    notices = [];

    snapshot.forEach((docSnap) => {

        notices.push({
            docId: docSnap.id,
            ...docSnap.data()
        });

    });

    renderNoticeTable();

}, (error) => {

    console.error("Notice List Error:", error);

});

function formatDate(timestamp) {

    if (!timestamp || !timestamp.toDate) return "";

    return timestamp.toDate().toLocaleDateString();

}

function renderNoticeTable() {

    const table = document.getElementById("noticeTableBody");

    if (!table) return;

    table.innerHTML = "";

    notices.forEach((notice) => {

        table.innerHTML += `
<tr>
<td>${notice.title || ""}</td>
<td>${(notice.message || "").slice(0, 80)}${(notice.message || "").length > 80 ? "..." : ""}</td>
<td><span class="badge bg-secondary">${notice.audience || "all"}</span></td>
<td>${formatDate(notice.createdAt)}</td>
<td><button class="btn btn-danger btn-sm" onclick="deleteNotice('${notice.docId}')">Delete</button></td>
</tr>
`;

    });

}

window.deleteNotice = async function (docId) {

    if (!confirm("Delete this notice?")) return;

    try {

        await deleteDoc(doc(db, "notices", docId));

    } catch (error) {

        console.error(error);

        alert("Delete Failed.");

    }

};

console.log("Notice Module Ready");
