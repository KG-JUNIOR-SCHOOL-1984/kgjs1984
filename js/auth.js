// ======================================================
// Gobindaganj KG & Junior School
// School Management System V6.1 Stable
// Firebase Authentication
// ======================================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    createUserWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// CONFIGURATION
// ======================================================

const BOOTSTRAP_ADMIN_EMAILS = [
    "kgjs1984@gmail.com"
];

const ADMIN_ONLY_PAGES = [
    "teachers.html",
    "teachers_list.html",
    "teachers_profile.html",
    "teachers_incard.html",
    "salary.html",
    "salary_list.html",
    "accounts.html",
    "settings.html",
    "fees.html",
    "fees_list.html",
    "fee_receipt.html",
    "reports.html"
];

const STUDENT_PAGES = [
    "student_dashboard.html"
];

const PUBLIC_PAGES = [
    "",
    "index.html",
    "login.html"
];


// ======================================================
// AUTH READY
// ======================================================

let authReady = false;
let authReadyUser = null;

let resolveAuthReady;

const authReadyPromise = new Promise((resolve) => {
    resolveAuthReady = resolve;
});


// ======================================================
// AUTH STATE LISTENER
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (!authReady) {
        authReady = true;
        authReadyUser = user;
        resolveAuthReady(user);
    }

    console.log(
        "Firebase Auth State:",
        user ? user.email : "No user"
    );

    if (user) {
        try {
            await ensureUserRoleDoc(user);
        } catch (error) {
            console.error("Role initialization error:", error);
        }
    }

    await handlePageAccess(user);
});


// ======================================================
// WAIT FOR AUTH
// ======================================================

async function waitForAuthReady() {

    if (authReady) {
        return authReadyUser;
    }

    return await authReadyPromise;
}


// ======================================================
// GET CURRENT PAGE
// ======================================================

function getCurrentPage() {

    return (
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase()
        || "index.html"
    );
}


// ======================================================
// CREATE ADMIN ROLE DOCUMENT
// ======================================================

async function ensureUserRoleDoc(user) {

    if (!user || !user.uid) {
        return;
    }

    const userRef = doc(db, "users", user.uid);

    try {

        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            return;
        }

        const email = (user.email || "").toLowerCase();

        if (BOOTSTRAP_ADMIN_EMAILS.includes(email)) {

            await setDoc(userRef, {

                role: "admin",

                name:
                    user.displayName ||
                    email.split("@")[0] ||
                    "Admin",

                email: user.email,

                createdAt: new Date().toISOString()

            });

            console.log(
                "Admin role created:",
                email
            );
        }

    } catch (error) {

        console.error(
            "ensureUserRoleDoc:",
            error
        );

        // Don't block login because of a role-document error.
    }
}


// ======================================================
// GET USER ROLE
// ======================================================

window.getUserRole = async function () {

    const user = await waitForAuthReady();

    if (!user) {
        return null;
    }

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {

            console.warn(
                "No role document found for:",
                user.email
            );

            return null;
        }

        const data = snapshot.data();

        return data.role || null;

    } catch (error) {

        console.error(
            "getUserRole error:",
            error
        );

        return null;
    }
};


// ======================================================
// LOGIN
// ======================================================

window.login = async function () {

    const emailElement =
        document.getElementById("email");

    const passwordElement =
        document.getElementById("password");

    if (!emailElement || !passwordElement) {

        alert(
            "Login form not found. Please reload the page."
        );

        return;
    }

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    if (!email || !password) {

        alert(
            "Please enter Email and Password."
        );

        return;
    }

    const loginButton =
        document.querySelector(
            '#loginForm button[type="submit"]'
        );

    try {

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.innerHTML =
                "⏳ Logging in...";
        }

        const remember =
            document.getElementById("rememberMe")?.checked;

        if (remember) {

            await setPersistence(
                auth,
                browserLocalPersistence
            );

        } else {

            await setPersistence(
                auth,
                browserSessionPersistence
            );
        }


        // Firebase Email/Password Login
        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;

        console.log(
            "Login successful:",
            user.email
        );


        // Make sure admin role exists
        await ensureUserRoleDoc(user);


        const role =
            await window.getUserRole();


        if (!role) {

            alert(
                "Login successful, but no user role was found.\n\n" +
                "Please create the user's role in Firestore."
            );

            await signOut(auth);

            return;
        }


        alert(
            "Login Successful!\nRole: " + role
        );


        // Redirect
        if (role === "student") {

            window.location.href =
                "student_dashboard.html";

        } else {

            window.location.href =
                "dashboard.html";
        }

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        showAuthError(error);

    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.innerHTML =
                "🔐 Login";
        }
    }
};


// ======================================================
// AUTH ERROR MESSAGE
// ======================================================

function showAuthError(error) {

    let message =
        "Login failed.";

    switch (error.code) {

        case "auth/invalid-credential":
            message =
                "Email অথবা Password ভুল।";
            break;

        case "auth/user-not-found":
            message =
                "এই Email দিয়ে কোনো account পাওয়া যায়নি।";
            break;

        case "auth/wrong-password":
            message =
                "Password ভুল।";
            break;

        case "auth/invalid-email":
            message =
                "সঠিক Email Address দিন।";
            break;

        case "auth/too-many-requests":
            message =
                "অনেকবার ভুল login হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।";
            break;

        case "auth/network-request-failed":
            message =
                "Internet connection অথবা Firebase connection সমস্যা হয়েছে।";
            break;

        case "auth/operation-not-allowed":
            message =
                "Firebase Console-এ Email/Password Authentication চালু নেই।";
            break;

        case "auth/unauthorized-domain":
            message =
                "এই website domain Firebase Authentication-এ Authorized নয়।";
            break;

        case "auth/user-disabled":
            message =
                "এই accountটি Firebase থেকে disabled করা হয়েছে।";
            break;

        default:
            message =
                error.message ||
                "Unknown authentication error.";
    }

    alert(
        "Login Failed:\n\n" +
        message +
        "\n\nError code: " +
        (error.code || "unknown")
    );
}


// ======================================================
// LOGOUT
// ======================================================

window.logout = async function () {

    try {

        await signOut(auth);

        localStorage.removeItem("loginTime");

        alert(
            "Logout Successful"
        );

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

        window.location.href =
            "index.html";
    }
};


// ======================================================
// PASSWORD RESET
// ======================================================

window.resetPassword = async function () {

    const emailElement =
        document.getElementById("email");

    if (!emailElement) {
        return;
    }

    const email =
        emailElement.value.trim();

    if (!email) {

        alert(
            "প্রথমে Email Address লিখুন।"
        );

        emailElement.focus();

        return;
    }

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        alert(
            "Password reset email পাঠানো হয়েছে।\n" +
            "আপনার Email Inbox চেক করুন।"
        );

    } catch (error) {

        console.error(
            "Password Reset Error:",
            error
        );

        let message =
            error.message;

        if (
            error.code ===
            "auth/user-not-found"
        ) {

            message =
                "এই Email দিয়ে কোনো account পাওয়া যায়নি।";
        }

        if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "সঠিক Email Address দিন।";
        }

        alert(
            "Password Reset Failed:\n\n" +
            message
        );
    }
};


// ======================================================
// EMAIL VERIFICATION
// ======================================================

window.verifyEmail = async function () {

    const user =
        await waitForAuthReady();

    if (!user) {

        alert(
            "প্রথমে Login করুন।"
        );

        return;
    }

    try {

        await sendEmailVerification(user);

        alert(
            "Verification email পাঠানো হয়েছে।"
        );

    } catch (error) {

        console.error(
            "Verification Error:",
            error
        );

        alert(
            error.message
        );
    }
};


// ======================================================
// REGISTER USER
// ======================================================

window.createNewUser = async function () {

    const nameElement =
        document.getElementById("fullName") ||
        document.getElementById("regName");

    const emailElement =
        document.getElementById("newEmail") ||
        document.getElementById("regEmail");

    const passwordElement =
        document.getElementById("newPassword") ||
        document.getElementById("regPassword");

    const roleElement =
        document.getElementById("newRole") ||
        document.getElementById("regRole");


    if (
        !nameElement ||
        !emailElement ||
        !passwordElement
    ) {

        alert(
            "Registration form not found."
        );

        return;
    }


    const name =
        nameElement.value.trim();

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    const role =
        roleElement
            ? roleElement.value
            : "teacher";


    if (!name || !email || !password) {

        alert(
            "সব তথ্য পূরণ করুন।"
        );

        return;
    }


    if (password.length < 6) {

        alert(
            "Password কমপক্ষে 6 characters হতে হবে।"
        );

        return;
    }


    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            credential.user;


        await updateProfile(
            user,
            {
                displayName: name
            }
        );


        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {
                role: role,
                name: name,
                email: email,
                createdAt:
                    new Date().toISOString()
            }
        );


        alert(
            "Account তৈরি হয়েছে!\n\n" +
            "Name: " + name +
            "\nRole: " + role
        );


        if (role === "student") {

            window.location.href =
                "student_dashboard.html";

        } else {

            window.location.href =
                "dashboard.html";
        }

    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        let message =
            error.message;

        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "এই Email দিয়ে আগে থেকেই account আছে।";
        }

        if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "সঠিক Email Address দিন।";
        }

        if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "Password আরও শক্তিশালী দিন।";
        }

        if (
            error.code ===
            "auth/operation-not-allowed"
        ) {

            message =
                "Firebase Console-এ Email/Password Authentication চালু করুন।";
        }

        alert(
            "Registration Failed:\n\n" +
            message
        );
    }
};


window.registerUser =
    window.createNewUser;


// ======================================================
// USER INFORMATION
// ======================================================

window.getCurrentUser = function () {

    return auth.currentUser || null;
};


window.getUserInfo = function () {

    const user =
        auth.currentUser;

    if (!user) {
        return null;
    }

    return {

        uid: user.uid,

        email: user.email,

        name:
            user.displayName || "",

        verified:
            user.emailVerified || false
    };
};


window.getUserName = function () {

    const user =
        auth.currentUser;

    return user
        ? user.displayName || ""
        : "";
};


window.getUserEmail = function () {

    const user =
        auth.currentUser;

    return user
        ? user.email || ""
        : "";
};


window.getCurrentUID = function () {

    const user =
        auth.currentUser;

    return user
        ? user.uid
        : "";
};


window.getCurrentEmail = function () {

    const user =
        auth.currentUser;

    return user
        ? user.email
        : "";
};


window.getCurrentName = function () {

    const user =
        auth.currentUser;

    return user
        ? user.displayName || ""
        : "";
};


// ======================================================
// ROLE CHECKS
// ======================================================

window.isAdmin = async function () {

    return (
        await window.getUserRole()
    ) === "admin";
};


window.isTeacher = async function () {

    return (
        await window.getUserRole()
    ) === "teacher";
};


window.isStudent = async function () {

    return (
        await window.getUserRole()
    ) === "student";
};


window.hasPermission = async function (
    roleName
) {

    return (
        await window.getUserRole()
    ) === roleName;
};


// ======================================================
// SESSION
// ======================================================

window.saveLoginTime = function () {

    localStorage.setItem(
        "loginTime",
        new Date().toISOString()
    );
};


window.getLoginTime = function () {

    return localStorage.getItem(
        "loginTime"
    );
};


window.isLoggedIn = function () {

    return auth.currentUser !== null;
};


// ======================================================
// PAGE ACCESS CONTROL
// ======================================================

async function handlePageAccess(user) {

    const currentPage =
        getCurrentPage();


    // -------------------------------
    // Public pages
    // -------------------------------

    if (
        PUBLIC_PAGES.includes(
            currentPage
        )
    ) {

        if (user) {

            const role =
                await window.getUserRole();

            if (role === "student") {

                if (
                    currentPage ===
                    "login.html"
                ) {

                    window.location.href =
                        "student_dashboard.html";
                }

            } else if (
                currentPage ===
                "login.html"
            ) {

                window.location.href =
                    "dashboard.html";
            }
        }

        return;
    }


    // -------------------------------
    // Protected pages
    // -------------------------------

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    window.saveLoginTime();


    const role =
        await window.getUserRole();


    // -------------------------------
    // No role
    // -------------------------------

    if (!role) {

        alert(
            "আপনার account-এর role পাওয়া যায়নি।\n\n" +
            "Firestore users/" +
            user.uid +
            " document পরীক্ষা করুন।"
        );

        await signOut(auth);

        window.location.href =
            "login.html";

        return;
    }


    // -------------------------------
    // Student page
    // -------------------------------

    if (
        STUDENT_PAGES.includes(
            currentPage
        )
    ) {

        if (
            role !== "student" &&
            role !== "admin"
        ) {

            window.location.href =
                "dashboard.html";
        }

        return;
    }


    // -------------------------------
    // Admin-only page
    // -------------------------------

    if (
        ADMIN_ONLY_PAGES.includes(
            currentPage
        )
    ) {

        if (role !== "admin") {

            alert(
                "Access Denied\n\n" +
                "এই page শুধুমাত্র Admin ব্যবহার করতে পারবেন।"
            );

            window.location.href =
                "dashboard.html";
        }

        return;
    }


    // ------------------
