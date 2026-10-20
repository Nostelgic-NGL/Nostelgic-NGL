import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setdoc, 
    getDoc 
} from "https://www.gstatic.com/firestore/v10.8.0/firestore.js"; // Note: setdoc ki jagah setDoc hai neeche code me

let isLoginMode = true;

// Tab Switcher Logic (Login <-> Sign Up)
window.switchTab = function(mode) {
    const loginBtn = document.getElementById('loginTabBtn');
    const signupBtn = document.getElementById('signupTabBtn');
    const usernameField = document.getElementById('usernameField');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMessage');
    
    errorMsg.classList.add('hidden');

    if (mode === 'login') {
        isLoginMode = true;
        loginBtn.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-pink-600 text-white transition";
        signupBtn.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 transition";
        usernameField.classList.add('hidden');
        submitBtn.innerText = "Login";
    } else {
        isLoginMode = false;
        signupBtn.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-pink-600 text-white transition";
        loginBtn.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 transition";
        usernameField.classList.remove('hidden');
        submitBtn.innerText = "Create Account";
    }
}

// Form Submit Handler (Auth Logic)
window.handleAuth = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const usernameInput = document.getElementById('username');
    const errorMsg = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    errorMsg.classList.add('hidden');
    submitBtn.innerText = "Please wait...";
    submitBtn.disabled = true;

    try {
        if (isLoginMode) {
            // Login User
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";
        } else {
            // Sign Up User
            const username = usernameInput.value.trim().toLowerCase();
            
            if (!username || username.length < 3) {
                throw new Error("Username kam se kam 3 characters ka hona chahiye.");
            }

            // Create Firebase Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save Username mapping in Firestore
            // Firestore import fix: getFirestore methods are lowercase/camelCase correctly
            const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email,
                username: username,
                createdAt: new Date().toISOString()
            });

            // Also map username to uid for easy profile lookup later
            await setDoc(doc(db, "usernames", username), {
                uid: user.uid
            });

            window.location.href = "dashboard.html";
        }
    } catch (error) {
        errorMsg.innerText = error.message;
        errorMsg.classList.remove('hidden');
        submitBtn.innerText = isLoginMode ? "Login" : "Create Account";
        submitBtn.disabled = false;
    }
}

// Agar user pehle se logged-in hai toh seedha dashboard bhej do
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = "dashboard.html";
    }
});
