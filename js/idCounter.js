// ======================================================
// School Management System
// idCounter.js
//
// Generates sequential IDs (STD-000001, TCH-000001, ...)
// WITHOUT scanning the entire collection on every call.
//
// How it works:
// - A small "counters" collection holds one document per
//   ID type (e.g. counters/students -> { lastNumber: 42 }).
// - getNextSequentialId() increments that number atomically
//   inside a Firestore transaction, so concurrent form
//   submissions can never collide.
// - The very first time it's called for a given counter (the
//   counter document doesn't exist yet), it does ONE scan of
//   the existing collection to find the current highest number
//   already in use, seeds the counter with it, and every call
//   after that is a cheap single-document transaction.
// ======================================================

import { db } from "./firebase.js";

import {
    doc,
    runTransaction,
    getDocs,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/**
 * Previews the next sequential ID without updating/incrementing the database counter.
 */
export async function peekNextSequentialId({
    counterName,
    prefix,
    padLength,
    collectionRef,
    idField,
    idRegex
}) {
    const counterRef = doc(db, "counters", counterName);

    try {
        const snap = await getDoc(counterRef);

        let lastNumber = 0;

        if (snap.exists()) {
            lastNumber = snap.data().lastNumber || 0;
        } else {
            const snapshot = await getDocs(collectionRef);

            snapshot.forEach((docSnap) => {
                const value = docSnap.data()[idField];

                if (!value) return;

                const match = value.match(idRegex);

                if (match) {
                    const num = parseInt(match[1], 10);

                    if (num > lastNumber) lastNumber = num;
                }
            });
        }

        return prefix + "-" + String(lastNumber + 1).padStart(padLength, "0");
    } catch (err) {
        console.error("peekNextSequentialId error:", err);
        return prefix + "-" + String(1).padStart(padLength, "0");
    }
}

/**
 * @param {Object} options
 * @param {string} options.counterName  - Document id inside "counters" collection, e.g. "students"
 * @param {string} options.prefix       - ID prefix, e.g. "STD"
 * @param {number} options.padLength    - Zero-padding length, e.g. 6 -> "000001"
 * @param {import("firebase/firestore").CollectionReference} options.collectionRef - Collection to scan on first-ever run
 * @param {string} options.idField      - Field name holding the existing formatted id, e.g. "studentId"
 * @param {RegExp} options.idRegex      - Regex to pull the numeric part out of existing ids, e.g. /^STD-(\d+)$/
 */
export async function getNextSequentialId({
    counterName,
    prefix,
    padLength,
    collectionRef,
    idField,
    idRegex
}) {

    const counterRef = doc(db, "counters", counterName);

    try {

        const nextNumber = await runTransaction(db, async (transaction) => {

            const snap = await transaction.get(counterRef);

            if (!snap.exists()) {
                // Signal that we need to seed the counter (handled below,
                // outside the transaction, since a collection scan isn't
                // allowed inside a Firestore transaction).
                throw { code: "NEEDS_INIT" };
            }

            const next = (snap.data().lastNumber || 0) + 1;

            transaction.update(counterRef, { lastNumber: next });

            return next;

        });

        return prefix + "-" + String(nextNumber).padStart(padLength, "0");

    } catch (err) {

        if (err && err.code === "NEEDS_INIT") {

            return await seedAndGenerate({
                counterRef,
                prefix,
                padLength,
                collectionRef,
                idField,
                idRegex
            });

        }

        throw err;

    }

}

// One-time migration path: scan the collection once to find the
// current highest number in use, then seed the counter document.
async function seedAndGenerate({ counterRef, prefix, padLength, collectionRef, idField, idRegex }) {

    const snapshot = await getDocs(collectionRef);

    let lastNumber = 0;

    snapshot.forEach((docSnap) => {

        const value = docSnap.data()[idField];

        if (!value) return;

        const match = value.match(idRegex);

        if (match) {

            const num = parseInt(match[1]);

            if (num > lastNumber) lastNumber = num;

        }

    });

    // Seed inside a fresh transaction (race-safe even if two tabs hit
    // "NEEDS_INIT" at the same time).
    const nextNumber = await runTransaction(db, async (transaction) => {

        const snap = await transaction.get(counterRef);

        const current = snap.exists() ? (snap.data().lastNumber || 0) : lastNumber;

        const next = current + 1;

        transaction.set(counterRef, { lastNumber: next });

        return next;

    });

    return prefix + "-" + String(nextNumber).padStart(padLength, "0");

}
