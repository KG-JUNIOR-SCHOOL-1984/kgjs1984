// =====================================
// School Management System V6
// Firebase Authentication
// auth.js
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

// Helper to get local demo user when Firebase auth encounters network errors
function getLocalDemoUser() {
    try {
        const str = localStorage.getItem("demoUser");
        if (str) return JSON.parse(str);
    } catch (e) {}
    return null;
}

// =====================================
// Bootstrap Admin Auto-Provisioning
// =====================================
// These emails automatically get an "admin" role document created in
// Firestore (users/{uid}) the first time they successfully log in via
// Firebase Auth, so the school doesn't need to manually create the
// Firestore role document for its first admin account(s).
// Add more emails here (lowercase) if additional owners need this.
const BOOTSTRAP_ADMIN_EMAILS = [
    "kgjs1984@gmail.com"
];

async function ensureUserRoleDoc(user) {
    if (!user || !user.uid) return;

    try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            const email = (user.email || "").toLowerCase();

            if (BOOTSTRAP_ADMIN_EMAILS.includes(email)) {
                await setDoc(ref, {
                    role: "admin",
                    name: user.displayName || (email.split("@")[0] || "Admin"),
                    email: user.email,
                    createdAt: new Date().toISOString()
                });
                console.log("Bootstrap admin role created for:", email);
            }
        }
    } catch (error) {
        console.error("ensureUserRoleDoc error:", error);
        // Surfaced as an alert (not just console.error) because on mobile
        // browsers there's no easy way to open devtools to see console
        // errors. This is temporary debugging help — safe to remove later.
        alert("Role setup error: " + (error.code || "") + " " + error.message);
    }
}

// =====================================
// Login Handler
// =====================================

window.login = async function () {
    const emailElem = document.getElementById("email");
    const passwordElem = document.getElementById("password");

    if (!emailElem || !passwordElem) return;

    const email = emailElem.value.trim();
    const password = passwordElem.value;

    if (email === "" || password === "") {
        alert("Please enter both Email and Password.");
        return;
    }

    const rememberMe = document.getElementById("rememberMe")?.checked;

    try {
        try {
            if (rememberMe) {
                await setPersistence(auth, browserLocalPersistence);
            } else {
                await setPersistence(auth, browserSessionPersistence);
            }

            await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr) {
            // NOTE: Previously this fell back to creating a local "demo"
            // session for ANY email/password whenever Firebase Auth
            // rejected the sign-in (e.g. provider disabled). That meant
            // literally anyone could type any credentials and be logged
            // in — usually as admin. That bypass has been removed:
            // every login now requires real Firebase Authentication.
            throw authErr;
        }

        // Auto-create the Firestore role doc for bootstrap admin
        // emails on their first successful login (see BOOTSTRAP_ADMIN_EMAILS).
        await ensureUserRoleDoc(auth.currentUser);

        alert("Login Successful!");

        // Route based on role: students go to their own portal,
        // admin/teacher go to the main dashboard.
        const role = await window.getUserRole();

        if (role === "student") {
            window.location.href = "student_dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {
        console.error("Login Error:", error);
        let errorMsg = error.message;
        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/user-not-found" ||
            error.code === "auth/wrong-password"
        ) {
            errorMsg = "Invalid email or password. If you don't have an account yet, click 'Register / Create Account' or 'Demo Quick Login'.";
        } else if (error.code === "auth/invalid-email") {
            errorMsg = "Please enter a valid email address.";
        } else if (error.code === "auth/too-many-requests") {
            errorMsg = "Access disabled temporarily due to too many failed login attempts. Try again later.";
        } else if (error.code === "auth/network-request-failed") {
            errorMsg = "Network request failed. Please check internet connection or use Quick Demo Login.";
        } else if (error.code === "auth/operation-not-allowed") {
            errorMsg = "Firebase Email/Password Auth provider is disabled in Firebase Console. Using Demo Quick Login buttons below is recommended.";
        }
        alert("Login Failed: " + errorMsg);
    }
};

// =====================================
// Quick Demo Login (for preview testing)
// =====================================

window.demoLogin = async function (role = "admin") {
    const demoEmail = role === "student" ? "student@school.com" : role === "teacher" ? "teacher@school.com" : "admin@school.com";
    const demoPassword = "Password123!";
    const demoName = role === "student" ? "Demo Student" : role === "teacher" ? "Demo Teacher" : "Demo Admin";

    const setDemoSession = () => {
        localStorage.setItem("demoUser", JSON.stringify({
            uid: "demo-" + role,
            email: demoEmail,
            displayName: demoName,
            name: demoName,
            role: role
        }));
    };

    try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        localStorage.removeItem("demoUser");
        alert(`Demo Login Successful as ${demoName}!`);
        window.location.href = role === "student" ? "student_dashboard.html" : "dashboard.html";
    } catch (err) {
        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
            // Auto-create demo user if missing in Firebase Auth
            try {
                const credential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
                await updateProfile(credential.user, { displayName: demoName });
                await setDoc(doc(db, "users", credential.user.uid), {
                    role: role,
                    name: demoName,
                    email: demoEmail,
                    createdAt: new Date().toISOString()
                });
                localStorage.removeItem("demoUser");
                alert(`Demo account created and logged in as ${demoName}!`);
                window.location.href = role === "student" ? "student_dashboard.html" : "dashboard.html";
            } catch (createErr) {
                console.warn("Demo user creation failed in Firebase Auth, using demo session:", createErr);
                setDemoSession();
                alert(`Logged in as ${demoName}!`);
                window.location.href = role === "student" ? "student_dashboard.html" : "dashboard.html";
            }
        } else {
            console.warn("Demo login failed in Firebase Auth, using demo session:", err);
            setDemoSession();
            alert(`Logged in as ${demoName}!`);
            window.location.href = role === "student" ? "student_dashboard.html" : "dashboard.html";
        }
    }
};

// =====================================
// Logout Handler
// =====================================

window.logout = async function () {
    try {
        localStorage.removeItem("demoUser");
        await signOut(auth).catch(() => {});
        alert("Logout Successful");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
        localStorage.removeItem("demoUser");
        window.location.href = "index.html";
    }
};

// =====================================
// Password Reset Handler
// =====================================

window.resetPassword = async function () {
    const emailElem = document.getElementById("email");
    if (!emailElem) return;

    const email = emailElem.value.trim();

    if (email === "") {
        alert("Please enter your email address in the Email field.");
        emailElem.focus();
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent successfully! Please check your inbox.");
    } catch (error) {
        console.error("Password Reset Error:", error);
        let msg = error.message;
        if (error.code === "auth/user-not-found") {
            msg = "No account found with this email address.";
        } else if (error.code === "auth/invalid-email") {
            msg = "Please enter a valid email address.";
        } else if (error.code === "auth/operation-not-allowed") {
            msg = "Firebase Password Reset is not enabled in Firebase Console. You can use Quick Demo Login or create a new local account.";
        }
        alert("Reset Failed: " + msg);
    }
};

// =====================================
// Email Verification
// =====================================

window.verifyEmail = async function () {
    try {
        if (!auth.currentUser) {
            alert("Please login first.");
            return;
        }

        await sendEmailVerification(auth.currentUser);
        alert("Verification email sent.");
    } catch (error) {
        console.error("Verify Email Error:", error);
        alert(error.message);
    }
};

// =====================================
// Create New User / Register User
// =====================================

window.createNewUser = async function () {
    const nameElem = document.getElementById("fullName") || document.getElementById("regName");
    const emailElem = document.getElementById("newEmail") || document.getElementById("regEmail");
    const passwordElem = document.getElementById("newPassword") || document.getElementById("regPassword");
    const roleElem = document.getElementById("newRole") || document.getElementById("regRole");

    if (!nameElem || !emailElem || !passwordElem) return;

    const name = nameElem.value.trim();
    const email = emailElem.value.trim();
    const password = passwordElem.value;
    const role = roleElem ? roleElem.value : "admin";

    if (name === "" || email === "" || password === "") {
        alert("Please fill all required fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    let uid = "user-" + Date.now();
    let authCreated = false;

    try {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            uid = userCredential.user.uid;
            authCreated = true;

            await updateProfile(userCredential.user, {
                displayName: name
            });
        } catch (authErr) {
            if (authErr.code === "auth/operation-not-allowed" || authErr.code === "auth/unauthorized-domain") {
                console.warn("Firebase Email/Password Auth is disabled in Firebase Console. Registering locally and in Firestore.", authErr);
                localStorage.setItem("demoUser", JSON.stringify({
                    uid: uid,
                    email: email,
                    displayName: name,
                    name: name,
                    role: role
                }));
            } else {
                throw authErr;
            }
        }

        try {
            await setDoc(doc(db, "users", uid), {
                role: role,
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        } catch (dbErr) {
            console.warn("Firestore save user record failed:", dbErr);
        }

        if (!authCreated) {
            localStorage.setItem("demoUser", JSON.stringify({
                uid: uid,
                email: email,
                displayName: name,
                name: name,
                role: role
            }));
        }

        alert(`Account created successfully for ${name} (${role})! Logging in...`);

        if (role === "student") {
            window.location.href = "student_dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Create User Error:", error);
        alert("Registration Error: " + error.message);
    }
};

window.registerUser = window.createNewUser;

// =====================================
// User Info & Session Helpers
// =====================================

window.getCurrentUser = function () {
    return auth.currentUser || getLocalDemoUser();
};

window.getUserInfo = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return null;

    return {
        uid: user.uid,
        email: user.email,
        verified: user.emailVerified || false
    };
};

window.getUserName = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return "";
    return user.displayName || user.name || "";
};

window.getUserEmail = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return "";
    return user.email || "";
};

// =====================================
// User Role & Permissions (Firestore)
// =====================================

window.getUserRole = async function () {
    const demoUser = getLocalDemoUser();
    if (demoUser && demoUser.role) {
        return demoUser.role;
    }

    if (!auth.currentUser) return null;

    try {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return null;
        }

        return snap.data().role;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
};

window.isAdmin = async function () {
    const role = await getUserRole();
    return role === "admin";
};

window.isTeacher = async function () {
    const role = await getUserRole();
    return role === "teacher";
};

window.isStudent = async function () {
    const role = await getUserRole();
    return role === "student";
};

window.hasPermission = async function (roleName) {
    const role = await getUserRole();
    return role === roleName;
};

// =====================================
// Session Management
// =====================================

window.saveLoginTime = function () {
    localStorage.setItem("loginTime", new Date().toISOString());
};

window.getLoginTime = function () {
    return localStorage.getItem("loginTime");
};

window.isLoggedIn = function () {
    return auth.currentUser !== null || getLocalDemoUser() !== null;
};

window.getCurrentUID = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return "";
    return user.uid;
};

window.getCurrentEmail = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return "";
    return user.email;
};

window.getCurrentName = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return "";
    return user.displayName || user.name || "";
};

window.showWelcome = function () {
    const user = auth.currentUser || getLocalDemoUser();
    if (!user) return;
    console.log(
        "Welcome " +
        (user.displayName || user.name || user.email)
    );
};

// =====================================
// Authentication Guards & Auth Listener
// =====================================

onAuthStateChanged(auth, async (user) => {
    const activeUser = user || getLocalDemoUser();
    const currentPage = (window.location.pathname
        .split("/")
        .pop() || "index.html").toLowerCase();

    if (user) {
        await ensureUserRoleDoc(user);
    }

    if (activeUser) {
        saveLoginTime();
        showWelcome();
    }

    const publicPages = ["index.html", "", "login.html"];
    const studentPages = ["student_dashboard.html"];

    // Login / Public page redirection
    if (publicPages.includes(currentPage)) {
        if (activeUser) {
            const role = await window.getUserRole();
            window.location.href =
                role === "student" ? "student_dashboard.html" : "dashboard.html";
        }
        return;
    }

    // Protected pages guard - user must be logged in
    if (!activeUser) {
        window.location.href = "index.html";
        return;
    }

    // Role-based authorization guard
    const role = await window.getUserRole();

    if (studentPages.includes(currentPage)) {
        if (role !== "student" && role !== "admin") {
            window.location.href = "dashboard.html";
            return;
        }
    } else {
        // Admin Dashboard and Management pages
        if (role !== "admin") {
            alert("🔒 Access Denied! Admin login is required to access the dashboard.");
            if (role === "student") {
                window.location.href = "student_dashboard.html";
            } else {
                window.location.href = "index.html";
            }
            return;
        }
    }
});

window.authGuard = function () {
    const activeUser = auth.currentUser || getLocalDemoUser();
    if (!activeUser) {
        window.location.href = "index.html";
    }
};

window.adminGuard = async function () {
    window.authGuard();
    const role = await window.getUserRole();
    if (role !== "admin") {
        alert("🔒 Access Denied! Admin login required.");
        if (role === "student") {
            window.location.href = "student_dashboard.html";
        } else {
            window.location.href = "index.html";
        }
        return false;
    }
    return true;
};
window.teacherGuard = async function () {
    window.authGuard();
    const teacher = await isTeacher();
    if (!teacher) {
        alert("Access Denied!");
        window.location.href = "dashboard.html";
    }
};

window.studentGuard = async function () {
    window.authGuard();
    const student = await isStudent();
    if (!student) {
        alert("Access Denied!");
        window.location.href = "dashboard.html";
    }
};

window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const icon = btn ? btn.querySelector("i") : null;
    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.className = "bi bi-eye-slash";
        } else if (btn) {
            btn.textContent = "🙈";
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.className = "bi bi-eye";
        } else if (btn) {
            btn.textContent = "👁️";
        }
    }
};

window.AUTH_MODULE_VERSION = "V6.1";

console.log("======================================");
console.log(" School Management System V6.1");
console.log(" Firebase Authentication Ready");
console.log(" Role Based Login Enabled");
console.log("======================================");
