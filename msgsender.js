import { rtdb } from './firebase-config.js';
import { ref, get, child, push, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
    
    const formSection = document.getElementById('formSection');
    const successSection = document.getElementById('successSection');
    const sendAnotherBtn = document.getElementById('sendAnotherBtn');

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

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
        const usernameSnapshot = await get(child(dbRef, `usernames/${username}`));
        if (usernameSnapshot.exists()) {
            targetUid = usernameSnapshot.val().uid;
            
            const userSnapshot = await get(child(dbRef, `users/${targetUid}`));
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                if (headerUsernameTitle) headerUsernameTitle.innerText = `@${userData.username}`;
                
                // Yahan par text update kar diya hai jo user ka naam/username show karega
                if (profileTitleText) {
                    profileTitleText.innerText = `Send anonymous msg to @${userData.username}`;
                }

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
                formSection.classList.add('hidden');
                successSection.classList.remove('hidden');

            } catch (error) {
                console.error("Error sending message:", error);
                showCustomAlert("Failed to send message. Try again.");
            }
        });
    }

    if (sendAnotherBtn) {
        sendAnotherBtn.addEventListener('click', () => {
            successSection.classList.add('hidden');
            formSection.classList.remove('hidden');
        });
    }
});
