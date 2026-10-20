// Import Firebase SDKs from CDN (Mobile & WebView compatible)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Tumhari Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7G84Hb8htLjomY_rSzfNqvi6sIWcNZ0Q",
    authDomain: "nostelgic-ngl.firebaseapp.com",
    databaseURL: "https://nostelgic-ngl-default-rtdb.firebaseio.com",
    projectId: "nostelgic-ngl",
    storageBucket: "nostelgic-ngl.firebasestorage.app",
    messagingSenderId: "815554835287",
    appId: "1:815554835287:web:eb194265b1f2fd13038412",
    measurementId: "G-DRQHDS1PTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporting instances so other files can use them easily
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
