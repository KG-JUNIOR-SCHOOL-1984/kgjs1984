// ======================================================
// School Management System
// studentAuth.js
//
// Lets an admin create a login (Firebase Auth account) for
// a student directly from the Students list, so the student
// can sign in to student_dashboard.html and see their own
// attendance/results/fees/routine/notices.
//
// IMPORTANT: Firebase's client SDK signs you in as whichever
// user you just created with createUserWithEmailAndPassword.
// To avoid kicking the admin out of their own session while
// doing this, we spin up a temporary SECOND Firebase app
// instance just for the account-creation call, then tear it
// down. The admin's real session (in firebase.js) is never
// touched.
// ======================================================

import { db, firebaseConfig } from "./firebase.js";

import {
    initializeApp,
    deleteApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

window.createStudentLogin = async function (studentDocId) {

    try {

        const studentSnap = await getDoc(doc(db, "students", studentDocId));

        if (!studentSnap.exists()) {

            alert("Student not found.");

            return;

        }

        const student = studentSnap.data();

        if (!student.email) {

            alert(
                "This student has no email address on file.\n" +
                "Please add one on the Edit Student page first, then try again."
            );

            return;

        }

        const password = prompt(
            `Set a login password for ${student.name} (${student.studentId}).\n` +
            "At least 6 characters. The student can change it later from their portal.",
            ""
        );

        if (!password) return;

        if (password.length < 6) {

            alert("Password must be at least 6 characters.");

            return;

        }

        let uid = null;
        let secondaryApp = null;
        let isRepair = false;

        try {
            secondaryApp = initializeApp(firebaseConfig, "StudentCreation-" + Date.now());
            const secondaryAuth = getAuth(secondaryApp);

            const credential = await createUserWithEmailAndPassword(
                secondaryAuth,
                student.email,
                password
            );

            uid = credential.user.uid;

            // Sign the temporary session out and discard the secondary app.
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
        } catch (authErr) {
            if (secondaryApp) {
                try { await deleteApp(secondaryApp); } catch (e) {}
            }
            if (authErr.code === "auth/email-already-in-use") {

                const wantsRepair = confirm(
                    "A login account for this email already exists in Firebase Authentication, " +
                    "but it may not be properly linked (this can happen if it was created before " +
                    "Firestore rules allowed saving the role document).\n\n" +
                    "Click OK to repair/relink it now (you'll need the account's User UID from " +
                    "Firebase Console → Authentication → Users tab).\n\n" +
                    "Click Cancel to stop here."
                );

                if (!wantsRepair) return;

                const pastedUid = prompt(
                    "Go to Firebase Console → Authentication → Users, find the row for\n" +
                    student.email + ", and copy its 'User UID' value. Paste it here:",
                    ""
                );

                if (!pastedUid || !pastedUid.trim()) {
                    alert("No UID entered. Nothing was changed.");
                    return;
                }

                uid = pastedUid.trim();
                isRepair = true;

            } else if (authErr.code === "auth/operation-not-allowed" || authErr.code === "auth/unauthorized-domain") {
                alert(
                    "Could not create the login: Email/Password sign-in is disabled for this " +
                    "Firebase project. Enable it in Firebase Console → Authentication → " +
                    "Sign-in method, then try again."
                );
                return;
            } else {
                throw authErr;
            }
        }

        if (!uid) {
            alert("Failed to create login: no account was created.");
            return;
        }

        // Link the new auth account to this student record.
        await setDoc(doc(db, "users", uid), {
            role: "student",
            studentId: student.studentId,
            studentDocId: studentDocId,
            name: student.name,
            email: student.email
        });

        await updateDoc(doc(db, "students", studentDocId), {
            linkedUID: uid,
            hasLogin: true
        });

        if (isRepair) {

            alert(
                `Login repaired and linked!\n\nEmail: ${student.email}\n\n` +
                "The account's role is now set to 'student' and connected to this student record.\n\n" +
                "Note: the password was NOT changed — the student must use whatever password " +
                "was originally set. If that's unknown, reset it from Firebase Console → " +
                "Authentication → Users → ⋮ → Reset password."
            );

        } else {

            alert(
                `Login created!\n\nEmail: ${student.email}\nPassword: ${password}\n\n` +
                "Please share these credentials with the student securely."
            );

        }

    } catch (error) {

        console.error(error);

        if (error.code === "auth/email-already-in-use") {

            alert("A login already exists for this email address.");

        } else {

            alert("Failed to create login: " + error.message);

        }

    }

};
