// =====================================
// School Management System V6.1
// STABLE AUTH.JS - PART 1
// =====================================

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


// =====================================
// SETTINGS
// =====================================

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
    "fee_due.html",
    "reports.html"
];


// =====================================
// LOCAL DEMO USER
// =====================================

function getLocalDemoUser() {
    try {
        const data = localStorage.getItem("demoUser");

        if (!data) return null;

        return JSON.parse(data);

    } catch (error) {

        console.error("Demo user error:", error);

        return null;
    }
}


// =====================================
// AUTH READY
// =====================================

let authReady = false;
let authReadyUser = null;

let resolveAuthReady;

const authReadyPromise = new Promise((resolve) => {
    resolveAuthReady = resolve;
});


// =====================================
// FIREBASE AUTH STATE
// =====================================

onAuthStateChanged(auth, (user) => {

    authReadyUser = user;
    authReady = true;

    resolveAuthReady(user);

    console.log(
        "Firebase Auth State:",
        user ? user.email : "Not logged in"
    );

});


// =====================================
// WAIT FOR AUTH
// =====================================

async function waitForAuth() {

    if (authReady) {
        return authReadyUser;
    }

    return await authReadyPromise;
}


// =====================================
// SAVE LOGIN TIME
// =====================================

window.saveLoginTime = function () {

    localStorage.setItem(
        "loginTime",
        new Date().toISOString()
    );

};


// =====================================
// LOGIN
// =====================================

window.login = async function () {

    const emailElement =
        document.getElementById("email");

    const passwordElement =
        document.getElementById("password");


    if (!emailElement || !passwordElement) {

        alert("Login form not found.");

        return;
    }


    const email =
        emailElement.value.trim().toLowerCase();

    const password =
        passwordElement.value;


    if (!email || !password) {

        alert(
            "Please enter Email and Password."
        );

        return;
    }


    const remember =
        document.getElementById("rememberMe")?.checked;


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


        // ---------------------------------
        // Persistence
        // ---------------------------------

        await setPersistence(
            auth,
            remember
                ? browserLocalPersistence
                : browserSessionPersistence
        );


        // ---------------------------------
        // Firebase Login
        // ---------------------------------

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = credential.user;


        console.log(
            "Login successful:",
            user.email
        );


        // ---------------------------------
        // Ensure role document
        // ---------------------------------

        await ensureUserRoleDoc(user);


        // ---------------------------------
        // Get role
        // ---------------------------------

        const role =
            await getUserRole();


        if (!role) {

            alert(
                "Login successful, but your account role was not found.\n\n" +
                "Please contact the administrator."
            );

            await signOut(auth);

            return;
        }


        saveLoginTime();


        alert("Login Successful!");


        // ---------------------------------
        // Redirect
        // ---------------------------------

        if (role === "student") {

            window.location.replace(
                "student_dashboard.html"
            );

        } else {

            window.location.replace(
                "dashboard.html"
            );

        }


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        let message =
            "Login failed.";


        switch (error.code) {

            case "auth/invalid-credential":
                message =
                    "Email or password is incorrect.";
                break;


            case "auth/user-not-found":
                message =
                    "This email account was not found.";
                break;


            case "auth/wrong-password":
                message =
                    "Incorrect password.";
                break;


            case "auth/invalid-email":
                message =
                    "Please enter a valid email address.";
                break;


            case "auth/too-many-requests":
                message =
                    "Too many failed attempts. Please try again later.";
                break;


            case "auth/network-request-failed":
                message =
                    "Internet connection problem. Please check your connection.";
                break;


            case "auth/operation-not-allowed":
                message =
                    "Email/Password login is disabled in Firebase Authentication.";
                break;


            case "auth/unauthorized-domain":
                message =
                    "This website domain is not authorized in Firebase Authentication.";
                break;


            default:
                message =
                    error.message || "Unknown login error.";
        }


        alert(
            "Login Failed:\n\n" + message
        );


    } finally {

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.innerHTML =
                "🔐 Login";
        }

    }

};


// =====================================
// CREATE / ENSURE USER ROLE
// =====================================

async function ensureUserRoleDoc(user) {

    if (!user || !user.uid) {
        return;
    }


    const userRef =
        doc(db, "users", user.uid);


    try {

        const snapshot =
            await getDoc(userRef);


        if (snapshot.exists()) {

            return;
        }


        const email =
            (user.email || "")
                .toLowerCase();


        // ---------------------------------
        // Bootstrap Admin
        // ---------------------------------

        if (
            BOOTSTRAP_ADMIN_EMAILS
                .includes(email)
        ) {

            await setDoc(
                userRef,
                {
                    role: "admin",
                    name:
                        user.displayName ||
                        email.split("@")[0] ||
                        "Admin",
                    email: user.email,
                    createdAt:
                        new Date().toISOString()
                }
            );


            console.log(
                "Admin role created:",
                email
            );

        }

    } catch (error) {

        console.error(
            "Role document error:",
            error
        );

        throw error;
    }

}


// =====================================
// GET USER ROLE
// =====================================

async function getUserRole() {

    const user =
        await waitForAuth();


    // ---------------------------------
    // Firebase user
    // ---------------------------------

    if (user) {

        try {

            const userRef =
                doc(db, "users", user.uid);


            const snapshot =
                await getDoc(userRef);


            if (!snapshot.exists()) {

                return null;
            }


            return snapshot.data().role || null;


        } catch (error) {

            console.error(
                "Get role error:",
                error
            );

            return null;
        }
    }


    // ---------------------------------
    // Demo user
    // ---------------------------------

    const demoUser =
        getLocalDemoUser();


    if (
        demoUser &&
        demoUser.role
    ) {

        return demoUser.role;
    }


    return null;
}


// Make available to other JS files

window.getUserRole =
    getUserRole;


// =====================================
// CURRENT USER
// =====================================

window.getCurrentUser = function () {

    return (
        auth.currentUser ||
        getLocalDemoUser()
    );

};


// =====================================
// USER NAME
// =====================================

window.getUserName = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return "";


    return (
        user.displayName ||
        user.name ||
        ""
    );

};


// =====================================
// USER EMAIL
// =====================================

window.getUserEmail = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return "";


    return user.email || "";

};


// =====================================
// USER INFO
// =====================================

window.getUserInfo = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return null;


    return {

        uid: user.uid,

        email: user.email,

        verified:
            user.emailVerified || false

    };

};


// =====================================
// LOGIN STATUS
// =====================================

window.isLoggedIn = function () {

    return (
        auth.currentUser !== null ||
        getLocalDemoUser() !== null
    );

};


// =====================================
// CURRENT UID
// =====================================

window.getCurrentUID = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return "";


    return user.uid;

};


// =====================================
// CURRENT NAME
// =====================================

window.getCurrentName = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return "";


    return (
        user.displayName ||
        user.name ||
        ""
    );

};


// =====================================
// CURRENT EMAIL
// =====================================

window.getCurrentEmail = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return "";


    return user.email || "";

};


// =====================================
// LOGIN TIME
// =====================================

window.getLoginTime = function () {

    return localStorage.getItem(
        "loginTime"
    );

};


// =====================================
// WELCOME
// =====================================

window.showWelcome = function () {

    const user =
        auth.currentUser ||
        getLocalDemoUser();


    if (!user) return;


    console.log(
        "Welcome:",
        user.displayName ||
        user.name ||
        user.email
    );

};
// =====================================
// REGISTER NEW USER
// =====================================

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
        emailElement.value.trim().toLowerCase();

    const password =
        passwordElement.value;

    const role =
        roleElement
            ? roleElement.value
            : "student";


    // ---------------------------------
    // Validation
    // ---------------------------------

    if (!name || !email || !password) {

        alert(
            "Please fill all required fields."
        );

        return;
    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;
    }


    try {

        // ---------------------------------
        // Create Firebase account
        // ---------------------------------

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        // ---------------------------------
        // Save display name
        // ---------------------------------

        await updateProfile(
            user,
            {
                displayName: name
            }
        );


        // ---------------------------------
        // Save role in Firestore
        // ---------------------------------

        await setDoc(
            doc(db, "users", user.uid),
            {
                role: role,
                name: name,
                email: email,
                createdAt:
                    new Date().toISOString()
            }
        );


        // ---------------------------------
        // Save login time
        // ---------------------------------

        saveLoginTime();


        alert(
            "Account created successfully!"
        );


        // ---------------------------------
        // Redirect
        // ---------------------------------

        if (role === "student") {

            window.location.replace(
                "student_dashboard.html"
            );

        } else {

            window.location.replace(
                "dashboard.html"
            );

        }


    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );


        let message =
            "Registration failed.";


        switch (error.code) {

            case "auth/email-already-in-use":

                message =
                    "This email is already registered.";

                break;


            case "auth/invalid-email":

                message =
                    "Please enter a valid email address.";

                break;


            case "auth/weak-password":

                message =
                    "Password is too weak. Use at least 6 characters.";

                break;


            case "auth/operation-not-allowed":

                message =
                    "Email/Password Authentication is disabled in Firebase.";

                break;


            case "auth/unauthorized-domain":

                message =
                    "This website domain is not authorized in Firebase.";

                break;


            default:

                message =
                    error.message ||
                    "Could not create account.";
        }


        alert(
            "Registration Failed:\n\n" +
            message
        );

    }

};


// Alias

window.registerUser =
    window.createNewUser;


// =====================================
// DEMO LOGIN
// =====================================

window.demoLogin = async function (
    role = "admin"
) {

    let email;
    let name;


    if (role === "student") {

        email = "student@school.com";
        name = "Demo Student";

    } else if (role === "teacher") {

        email = "teacher@school.com";
        name = "Demo Teacher";

    } else {

        email = "admin@school.com";
        name = "Demo Admin";
    }


    const password =
        "Password123!";


    try {

        // ---------------------------------
        // Try Firebase login
        // ---------------------------------

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        // ---------------------------------
        // Check/create role document
        // ---------------------------------

        const userRef =
            doc(db, "users", user.uid);

        const snapshot =
            await getDoc(userRef);


        if (!snapshot.exists()) {

            await setDoc(
                userRef,
                {
                    role: role,
                    name: name,
                    email: email,
                    createdAt:
                        new Date().toISOString()
                }
            );
        }


        saveLoginTime();


        alert(
            "Demo Login Successful!"
        );


        if (role === "student") {

            window.location.replace(
                "student_dashboard.html"
            );

        } else {

            window.location.replace(
                "dashboard.html"
            );

        }


    } catch (error) {

        console.error(
            "Demo Login Error:",
            error
        );


        // ---------------------------------
        // Do NOT create fake admin session
        // ---------------------------------

        alert(
            "Demo account is not available.\n\n" +
            "Please create the demo account in Firebase Authentication first."
        );

    }

};


// =====================================
// LOGOUT
// =====================================

window.logout = async function () {

    try {

        localStorage.removeItem(
            "demoUser"
        );

        localStorage.removeItem(
            "loginTime"
        );


        await signOut(auth);


        alert(
            "Logout Successful"
        );


        window.location.replace(
            "index.html"
        );


    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );


        localStorage.removeItem(
            "demoUser"
        );


        window.location.replace(
            "index.html"
        );

    }

};


// =====================================
// PASSWORD RESET
// =====================================

window.resetPassword = async function () {

    const emailElement =
        document.getElementById("email");


    if (!emailElement) {

        alert(
            "Email field not found."
        );

        return;
    }


    const email =
        emailElement.value.trim();


    if (!email) {

        alert(
            "Please enter your email address first."
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
            "Password reset email sent successfully.\n\n" +
            "Please check your email inbox."
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
                "No account was found with this email.";

        } else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Please enter a valid email address.";

        } else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            message =
                "Too many requests. Please try again later.";

        }


        alert(
            "Password Reset Failed:\n\n" +
            message
        );

    }

};


// =====================================
// EMAIL VERIFICATION
// =====================================

window.verifyEmail = async function () {

    try {

        const user =
            await waitForAuth();


        if (!user) {

            alert(
                "Please login first."
            );

            return;
        }


        await sendEmailVerification(
            user
        );


        alert(
            "Verification email sent successfully."
        );


    } catch (error) {

        console.error(
            "Email Verification Error:",
            error
        );


        alert(
            "Verification failed:\n\n" +
            (error.message || "Unknown error")
        );

    }

};


// =====================================
// PASSWORD VISIBILITY
// =====================================

window.togglePasswordVisibility =
    function (
        inputId,
        button
    ) {

        const input =
            document.getElementById(inputId);


        if (!input) return;


        if (
            input.type === "password"
        ) {

            input.type = "text";


            if (button) {

                button.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';
            }

        } else {

            input.type = "password";


            if (button) {

                button.innerHTML =
                    '<i class="bi bi-eye"></i>';
            }

        }

    };


// =====================================
// PERMISSION HELPERS
// =====================================

window.isAdmin = async function () {

    const role =
        await getUserRole();

    return role === "admin";

};


window.isTeacher = async function () {

    const role =
        await getUserRole();

    return role === "teacher";

};


window.isStudent = async function () {

    const role =
        await getUserRole();

    return role === "student";

};


window.hasPermission =
    async function (roleName) {

        const role =
            await getUserRole();

        return role === roleName;

    };
// =====================================
// SCHOOL MANAGEMENT SYSTEM V6.1
// STABLE AUTH.JS - PART 3
// AUTH GUARD
// =====================================


// =====================================
// GET CURRENT PAGE
// =====================================

function getCurrentPage() {

    return (
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase()
        || "index.html"
    );

}


// =====================================
// PUBLIC PAGES
// =====================================

const PUBLIC_PAGES = [
    "",
    "index.html",
    "login.html"
];


// =====================================
// STUDENT PAGES
// =====================================

const STUDENT_PAGES = [
    "student_dashboard.html"
];


// =====================================
// AUTH GUARD
// =====================================

async function runAuthGuard() {

    try {

        // ---------------------------------
        // Wait until Firebase finishes
        // restoring login session
        // ---------------------------------

        const firebaseUser =
            await waitForAuth();


        // ---------------------------------
        // Check local demo session
        // ---------------------------------

        const demoUser =
            getLocalDemoUser();


        const activeUser =
            firebaseUser || demoUser;


        const currentPage =
            getCurrentPage();


        console.log(
            "AUTH GUARD:",
            currentPage,
            activeUser
                ? activeUser.email
                : "NOT LOGGED IN"
        );


        // =================================
        // PUBLIC PAGE
        // =================================

        if (
            PUBLIC_PAGES.includes(
                currentPage
            )
        ) {

            // ---------------------------------
            // Login page without user
            // ---------------------------------

            if (!activeUser) {

                return;
            }


            // ---------------------------------
            // Already logged in
            // ---------------------------------

            const role =
                await getUserRole();


            if (role === "student") {

                window.location.replace(
                    "student_dashboard.html"
                );

            } else if (
                role === "admin" ||
                role === "teacher"
            ) {

                window.location.replace(
                    "dashboard.html"
                );
            }


            return;
        }


        // =================================
        // PROTECTED PAGE
        // =================================

        if (!activeUser) {

            console.log(
                "No authenticated user."
            );


            window.location.replace(
                "login.html"
            );


            return;
        }


        // =================================
        // GET ROLE
        // =================================

        const role =
            await getUserRole();


        console.log(
            "CURRENT USER ROLE:",
            role
        );


        // =================================
        // ROLE NOT FOUND
        // =================================

        if (!role) {

            alert(
                "Your account is logged in, " +
                "but no role is assigned.\n\n" +
                "Please contact the administrator."
            );


            await signOut(auth)
                .catch(() => {});


            localStorage.removeItem(
                "demoUser"
            );


            window.location.replace(
                "login.html"
            );


            return;
        }


        // =================================
        // STUDENT PAGE
        // =================================

        if (
            STUDENT_PAGES.includes(
                currentPage
            )
        ) {

            if (
                role !== "student" &&
                role !== "admin"
            ) {

                alert(
                    "Access Denied.\n\n" +
                    "Student access is required."
                );


                window.location.replace(
                    "dashboard.html"
                );


                return;
            }


            return;
        }


        // =================================
        // ADMIN ONLY PAGE
        // =================================

        if (
            ADMIN_ONLY_PAGES.includes(
                currentPage
            )
        ) {

            if (role !== "admin") {

                alert(
                    "Access Denied.\n\n" +
                    "Administrator access is required."
                );


                window.location.replace(
                    "dashboard.html"
                );


                return;
            }


            return;
        }


        // =================================
        // OTHER PROTECTED PAGES
        // =================================

        // Admin and teacher can access
        // normal management pages.

        if (
            role === "admin" ||
            role === "teacher"
        ) {

            return;
        }


        // =================================
        // UNKNOWN ROLE
        // =================================

        alert(
            "You do not have permission " +
            "to access this page."
        );


        window.location.replace(
            "dashboard.html"
        );


    } catch (error) {

        console.error(
            "AUTH GUARD ERROR:",
            error
        );


        // Do not create a redirect loop.

        if (
            getCurrentPage() !==
            "login.html"
        ) {

            window.location.replace(
                "login.html"
            );
        }

    }

}


// =====================================
// RUN AUTH GUARD
// =====================================

runAuthGuard();


// =====================================
// END OF STABLE AUTH.JS
// =====================================

console.log(
    "School Management System V6.1 Stable Auth Loaded"
);
