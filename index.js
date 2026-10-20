import { auth, rtdb } from './firebase-config.js';
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Custom Alert Function
function showCustomAlert(message) {
    const alertModal = document.getElementById('customAlertModal');
    const alertText = document.getElementById('customAlertText');
    const okBtn = document.getElementById('customAlertOkBtn');
    
    if (alertText) alertText.innerText = message;
    if (alertModal) alertModal.classList.remove('hidden');

    if (okBtn) {
        okBtn.onclick = () => {
            if (alertModal) alertModal.classList.add('hidden');
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const uid = localStorage.getItem('ngl_uid');
    if (!uid) {
        window.location.href = "login.html";
        return;
    }

    const profileLinkText = document.getElementById('profileLinkText');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const platformLabel = document.getElementById('platformLabel');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareStoryBtn = document.getElementById('shareStoryBtn');
    const toInboxBtn = document.getElementById('toInboxBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    // Theme Toggle Initialization & Handler
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

    // Generate Shareable Link
    const currentBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let profileUrl = `${currentBaseUrl}/profile.html?u=user`;

    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const username = data.username || localStorage.getItem('ngl_username');
            profileUrl = `${currentBaseUrl}/profile.html?u=${username}`;
            
            if (profileLinkText) profileLinkText.innerText = profileUrl;
            if (platformLabel) platformLabel.innerText = data.platform || 'Instagram';
            if (data.avatarUrl && userAvatarImg) {
                userAvatarImg.src = data.avatarUrl;
            }
        } else {
            const username = localStorage.getItem('ngl_username') || 'user';
            profileUrl = `${currentBaseUrl}/profile.html?u=${username}`;
            if (profileLinkText) profileLinkText.innerText = profileUrl;
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        const username = localStorage.getItem('ngl_username') || 'user';
        profileUrl = `${currentBaseUrl}/profile.html?u=${username}`;
        if (profileLinkText) profileLinkText.innerText = profileUrl;
    }

    // Copy Link Action
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(profileUrl).then(() => {
                showCustomAlert("Link copied to clipboard! 📋");
            }).catch(() => {
                showCustomAlert("Failed to copy link.");
            });
        });
    }

    // Share Story Action
    if (shareStoryBtn) {
        shareStoryBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Nostelgic NGL',
                    text: 'Send me anonymous messages!',
                    url: profileUrl,
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(profileUrl);
                showCustomAlert("Link copied! Share it on your story 🚀");
            }
        });
    }

    // Navigation to Inbox
    if (toInboxBtn) {
        toInboxBtn.addEventListener('click', () => {
            window.location.href = "inbox.html";
        });
    }

    // Navigation to Settings Page
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = "settings.html";
        });
    }
});
