import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
let profileUser = urlParams.get('user') ? urlParams.get('user').toLowerCase().trim() : null;

if (!profileUser) {
    profileUser = localStorage.getItem('ngl_logged_user');
}

window.addEventListener('DOMContentLoaded', async () => {
    if (!profileUser) {
        alert("Target user nahi mila!");
        window.location.href = "index.html";
        return;
    }

    document.getElementById('target-username-title').innerText = `@${profileUser}`;

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${profileUser}`));
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.profilePic) {
                const imgTag = document.getElementById('send-img-tag');
                const defaultIcon = document.getElementById('send-default-icon');
                imgTag.src = userData.profilePic;
                imgTag.style.display = 'block';
                defaultIcon.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }

    document.getElementById('btn-send-msg').addEventListener('click', sendMessage);
    document.getElementById('btn-send-another').addEventListener('click', resetToSendScreen);
    document.getElementById('btn-get-own').addEventListener('click', () => {
        window.location.href = "index.html";
    });
});

async function sendMessage() {
    const msgText = document.getElementById('msg-input-box').value.trim();
    if (!msgText) {
        alert("Pehle message toh type kar bhai!");
        return;
    }

    const successOverlay = document.getElementById('success-overlay');
    successOverlay.style.display = 'flex';

    try {
        const newMsgRef = push(ref(db, `users/${profileUser}/messages`));
        await set(newMsgRef, {
            text: msgText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error("Firebase save error:", error);
        successOverlay.style.display = 'none';
        return;
    }

    setTimeout(() => {
        successOverlay.style.display = 'none';
        document.getElementById('view-send-screen').classList.remove('active');
        document.getElementById('view-success-screen').classList.add('active');
    }, 1500);
}

function resetToSendScreen() {
    document.getElementById('msg-input-box').value = "";
    document.getElementById('view-success-screen').classList.remove('active');
    document.getElementById('view-send-screen').classList.add('active');
}