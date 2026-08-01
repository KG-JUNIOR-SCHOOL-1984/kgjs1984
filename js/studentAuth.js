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
                alert("A login already exists for this email address.");
                return;
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

        alert(
            `Login created!\n\nEmail: ${student.email}\nPassword: ${password}\n\n` +
            "Please share these credentials with the student securely."
        );

    } catch (error) {

        console.error(error);

        if (error.code === "auth/email-already-in-use") {

            alert("A login already exists for this email address.");

        } else {

            alert("Failed to create login: " + error.message);

        }

    }

};
