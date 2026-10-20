import { auth, rtdb } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    // Theme Switcher Initialization
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    if (localStorage.getItem('ngl_theme') === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.className = "fas fa-sun";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('ngl_theme', isLight ? 'light' : 'dark');
            themeIcon.className = isLight ? "fas fa-sun" : "fas fa-moon";
        });
    }

    const savedUid = localStorage.getItem('ngl_uid');
    
    // Agar user logged-in nahi hai, toh seedha login.html par bhejo
    if (!savedUid) {
        window.location.href = "login.html";
        return;
    }

    loadDashboard(savedUid);
});

async function loadDashboard(uid) {
    const homeTab = document.getElementById('homeTab');
    const inboxTab = document.getElementById('inboxTab');
    const homeSection = document.getElementById('homeSection');
    const inboxSection = document.getElementById('inboxSection');

    homeTab.onclick = function() {
        homeTab.classList.add('active');
        inboxTab.classList.remove('active');
        homeSection.classList.remove('hidden');
        inboxSection.classList.add('hidden');
    };

    inboxTab.onclick = function() {
        inboxTab.classList.add('active');
        homeTab.classList.remove('active');
        inboxSection.classList.remove('hidden');
        homeSection.classList.add('hidden');
    };

    try {
        const dbRef = ref(rtdb);
        const userSnap = await get(child(dbRef, `users/${uid}`));

        if (userSnap.exists()) {
            const data = userSnap.val();
            
            let avatarImg = data.avatarUrl;
            if (!avatarImg || avatarImg.includes('flaticon.com')) {
                avatarImg = 'Default-User.png';
            }

            document.getElementById('dashAvatar').src = avatarImg;
            document.getElementById('dashPlatform').innerText = data.platform || 'Instagram';

            const currentBaseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            const shareLink = currentBaseUrl + `profile.html?u=${data.username}`;
            document.getElementById('shareLinkInput').value = shareLink;

            document.getElementById('copyLinkBtn').onclick = function() {
                navigator.clipboard.writeText(shareLink);
                alert('Link copied to clipboard!');
            };

            document.getElementById('shareStoryBtn').onclick = async function() {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Nostelgic NGL',
                            text: 'Send me anonymous messages!',
                            url: shareLink,
                        });
                    } catch (err) {}
                } else {
                    navigator.clipboard.writeText(shareLink);
                    alert('Link copied! Paste it on your Instagram/Snapchat story.');
                }
            };
        }

        document.getElementById('logoutBtn').onclick = async function() {
            await signOut(auth);
            localStorage.clear();
            window.location.href = "login.html";
        };

        const messagesRef = ref(rtdb, `messages/${uid}`);
        onValue(messagesRef, (snapshot) => {
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';

            if (!snapshot.exists()) {
                container.innerHTML = `<div style="background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 12px; text-align: center; color: #64748b; font-size: 12px;">No messages yet. Share your link to get confessions!</div>`;
                return;
            }

            snapshot.forEach((childSnap) => {
                const msgData = childSnap.val();
                const msgCard = document.createElement('div');
                msgCard.style = "background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 12px; color: #f8fafc; font-size: 13px; word-break: break-word;";
                msgCard.innerHTML = `
                    <p style="margin-bottom: 6px;">${msgData.message}</p>
                    <span style="font-size: 10px; color: #64748b;">${new Date(msgData.timestamp).toLocaleString()}</span>
                `;
                container.appendChild(msgCard);
            });
        });

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}