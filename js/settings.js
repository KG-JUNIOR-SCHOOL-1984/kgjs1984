// ======================================================
// School Management System V7
// settings.js
//
// Loads/saves the single "school settings" document that
// settings.html edits (school info, logo, admin info).
// ======================================================

import { db, storage } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadString,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// ======================================================
// Document Reference (single settings doc)
// ======================================================

const settingsDocRef = doc(db, "settings", "school");

const DEFAULT_LOGO = "images/logo.png";

let logoData = "";       // Data URL for preview / upload source
let logoChanged = false; // true only when the user picks a NEW file

// ======================================================
// Load Existing Settings
// ======================================================

async function loadSettings() {

    try {

        const snap = await getDoc(settingsDocRef);

        if (!snap.exists()) return;

        const data = snap.data();

        const fields = [
            "schoolName", "eiin", "principalName", "currentSession",
            "schoolAddress", "schoolMobile", "schoolEmail", "schoolWebsite",
            "adminName", "adminEmail", "adminUsername"
        ];

        fields.forEach((field) => {

            const el = document.getElementById(field);

            if (el && data[field] !== undefined) {

                el.value = data[field];

            }

        });

        const preview = document.getElementById("logoPreview");

        if (preview && data.schoolLogo) {

            preview.src = data.schoolLogo;

        }

    } catch (error) {

        console.error("Load Settings Error:", error);

    }

}

// ======================================================
// School Logo Preview with Auto Compression
// ======================================================

function previewSchoolLogo(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;

    }

    const reader = new FileReader();

    reader.onload = function (e) {

        const imgObj = new Image();

        imgObj.onload = function () {

            const canvas = document.createElement("canvas");

            let width = imgObj.width;
            let height = imgObj.height;

            const MAX_SIZE = 400;

            if (width > height) {

                if (width > MAX_SIZE) {

                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;

                }

            } else {

                if (height > MAX_SIZE) {

                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;

                }

            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(imgObj, 0, 0, width, height);

            logoData = canvas.toDataURL("image/png", 0.9);

            logoChanged = true;

            const preview = document.getElementById("logoPreview");

            if (preview) {

                preview.src = logoData;

            }

        };

        imgObj.src = e.target.result;

    };

    reader.readAsDataURL(file);

}

window.previewSchoolLogo = previewSchoolLogo;

// ======================================================
// Upload Logo To Storage (falls back to data URL on failure)
// ======================================================

async function uploadSchoolLogo() {

    try {

        const storageRef = ref(storage, "settings/school-logo.png");

        const uploadPromise = uploadString(storageRef, logoData, "data_url")
            .then(() => getDownloadURL(storageRef));

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Logo upload timed out")), 15000)
        );

        return await Promise.race([uploadPromise, timeoutPromise]);

    } catch (error) {

        console.warn("Logo upload failed, falling back to data URL:", error);

        return logoData;

    }

}

// ======================================================
// Save Settings
// ======================================================

async function saveSettings(event) {

    event.preventDefault();

    const getVal = (id) => {

        const el = document.getElementById(id);

        return el ? el.value.trim() : "";

    };

    const settings = {
        schoolName: getVal("schoolName"),
        eiin: getVal("eiin"),
        principalName: getVal("principalName"),
        currentSession: getVal("currentSession"),
        schoolAddress: getVal("schoolAddress"),
        schoolMobile: getVal("schoolMobile"),
        schoolEmail: getVal("schoolEmail"),
        schoolWebsite: getVal("schoolWebsite"),
        adminName: getVal("adminName"),
        adminEmail: getVal("adminEmail"),
        adminUsername: getVal("adminUsername"),
        updatedAt: new Date().toISOString()
    };

    try {

        if (logoChanged && logoData.startsWith("data:")) {

            settings.schoolLogo = await uploadSchoolLogo();

        }

        await setDoc(settingsDocRef, settings, { merge: true });

        logoChanged = false;

        alert("Settings saved successfully!");

    } catch (error) {

        console.error("Save Settings Error:", error);

        alert("Failed to save settings. Please try again.");

    }

}

// ======================================================
// Initialization
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    const form = document.getElementById("settingsForm");

    if (form) {

        form.addEventListener("submit", saveSettings);

        form.addEventListener("reset", () => {

            const preview = document.getElementById("logoPreview");

            if (preview) preview.src = DEFAULT_LOGO;

            logoData = "";
            logoChanged = false;

            setTimeout(loadSettings, 0);

        });

    }

});
