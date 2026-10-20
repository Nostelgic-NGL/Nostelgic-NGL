import { rtdb } from './firebase-config.js';
import { ref, set, get, child, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Custom Alert Function
function showCustomAlert(message, callback) {
    const alertModal = document.getElementById('customAlertModal');
    const alertText = document.getElementById('customAlertText');
    const okBtn = document.getElementById('customAlertOkBtn');
    
    if (alertText) alertText.innerText = message;
    if (alertModal) alertModal.classList.remove('hidden');

    if (okBtn) {
        okBtn.onclick = () => {
            if (alertModal) alertModal.classList.add('hidden');
            if (callback) callback();
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('u');

    const senderAvatarImg = document.getElementById('senderAvatarImg');
    const profileTitleText = document.getElementById('profileTitleText');
    const senderPlatformLabel = document.getElementById('senderPlatformLabel');
    const headerUsernameTitle = document.getElementById('headerUsernameTitle');
    const anonymousMessageInput = document.getElementById('anonymousMessageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    // Theme Toggle Handler
    const savedTheme = localStorage.getItem('ngl_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = "fas fa-sun";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('ngl_theme', isLight ? 'light' : 'dark');
            if (themeIcon) {
                themeIcon.className = isLight ? "fas fa-sun" : "fas fa-moon";
            }
        });
    }

    if (!username) {
        showCustomAlert("Invalid profile link!", () => {
            window.location.replace("index.html");
        });
        return;
    }

    let targetUid = null;

    try {
        const dbRef = ref(rtdb);
        // Find UID from username
        const usernameSnapshot = await get(child(dbRef, `usernames/${username}`));
        if (usernameSnapshot.exists()) {
            targetUid = usernameSnapshot.val().uid;
            
            // Fetch User Profile Data
            const userSnapshot = await get(child(dbRef, `users/${targetUid}`));
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                if (headerUsernameTitle) headerUsernameTitle.innerText = `@${userData.username}`;
                if (profileTitleText) profileTitleText.innerText = `send me anonymous messages!`;
                if (senderPlatformLabel) senderPlatformLabel.innerText = userData.platform || 'Instagram';
                if (userData.avatarUrl && senderAvatarImg) {
                    senderAvatarImg.src = userData.avatarUrl;
                }
            }
        } else {
            showCustomAlert("User not found!", () => {
                window.location.replace("index.html");
            });
            return;
        }
    } catch (error) {
        console.error("Error fetching target user:", error);
    }

    // Send Anonymous Message Action
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', async () => {
            const messageText = anonymousMessageInput.value.trim();
            if (!messageText) {
                showCustomAlert("Please type a message first!");
                return;
            }

            if (!targetUid) {
                showCustomAlert("Recipient not found.");
                return;
            }

            try {
                const newMsgRef = push(ref(rtdb, `messages/${targetUid}`));
                await set(newMsgRef, {
                    text: messageText,
                    createdAt: new Date().toISOString()
                });

                anonymousMessageInput.value = '';
                showCustomAlert("Your anonymous message has been sent successfully! 🚀", () => {
                    // Optional: redirect or reload
                });
            } catch (error) {
                console.error("Error sending message:", error);
                showCustomAlert("Failed to send message. Try again.");
            }
        });
    }
});
