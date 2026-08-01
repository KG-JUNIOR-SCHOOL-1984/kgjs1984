// ======================================================
// School Management System
// noticesFeed.js
//
// Read-only "latest notices" widget. Renders into any
// element with id="noticeFeed". Filters by audience so
// students only see notices meant for "all" or "students"
// (and same idea for teachers).
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const noticesRef = collection(db, "notices");

/**
 * @param {"all"|"students"|"teachers"} viewerAudience - which notices this viewer should see
 */
export function renderNoticeFeed(viewerAudience = "all") {

    const target = document.getElementById("noticeFeed");

    if (!target) return;

    const q = query(noticesRef, orderBy("createdAt", "desc"), limit(5));

    onSnapshot(q, (snapshot) => {

        const notices = [];

        snapshot.forEach((docSnap) => {

            const notice = docSnap.data();

            const audience = notice.audience || "all";

            if (audience === "all" || audience === viewerAudience) {

                notices.push(notice);

            }

        });

        if (notices.length === 0) {

            target.innerHTML = "<p>No new notices available.</p>";

            return;

        }

        target.innerHTML = notices.map((notice) => `
<div class="mb-2 pb-2 border-bottom">
<strong>${notice.title || ""}</strong>
<p class="mb-0 small text-muted">${notice.message || ""}</p>
</div>
`).join("");

    }, (error) => {

        console.error("Notice Feed Error:", error);

        target.innerHTML = "<p class='text-danger small'>Failed to load notices.</p>";

    });

}
