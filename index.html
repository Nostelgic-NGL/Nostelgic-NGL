import { auth, rtdb } from './firebase-config.js';
import { ref, get, child, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
        window.location.replace("login.html");
        return;
    }

    // Views
    const homeView = document.getElementById('homeView');
    const inboxView = document.getElementById('inboxView');
    const settingsView = document.getElementById('settingsView');

    // Nav Buttons
    const navHomeBtn = document.getElementById('navHomeBtn');
    const navInboxBtn = document.getElementById('navInboxBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    // Home Elements
    const profileLinkText = document.getElementById('profileLinkText');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const platformLabel = document.getElementById('platformLabel');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareStoryBtn = document.getElementById('shareStoryBtn');

    // Inbox Elements
    const messagesContainer = document.getElementById('messagesContainer');
    const emptyState = document.getElementById('emptyState');

    // Settings & Theme
    const logoutBtn = document.getElementById('logoutBtn');
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

    // Switch View Function (Instant & Zero Delay)
    function switchView(viewName) {
        homeView.classList.add('hidden');
        inboxView.classList.add('hidden');
        settingsView.classList.add('hidden');

        navHomeBtn.classList.remove('active');
        navInboxBtn.classList.remove('active');

        if (viewName === 'home') {
            homeView.classList.remove('hidden');
            navHomeBtn.classList.add('active');
        } else if (viewName === 'inbox') {
            inboxView.classList.remove('hidden');
            navInboxBtn.classList.add('active');
            loadInboxMessages(); // Fetch messages instantly on tab click
        } else if (viewName === 'settings') {
            settingsView.classList.remove('hidden');
        }
    }

    if (navHomeBtn) navHomeBtn.addEventListener('click', () => switchView('home'));
    if (navInboxBtn) navInboxBtn.addEventListener('click', () => switchView('inbox'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => switchView('settings'));

    // Load Profile & Generate Link
    const currentBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let profileUrl = `${currentBaseUrl}/msgsender.html?u=user`;

    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const username = data.username || localStorage.getItem('ngl_username');
            profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
            
            if (profileLinkText) profileLinkText.innerText = profileUrl;
            if (platformLabel) platformLabel.innerText = data.platform || 'Instagram';
            if (data.avatarUrl && userAvatarImg) {
                userAvatarImg.src = data.avatarUrl;
            }
        } else {
            const username = localStorage.getItem('ngl_username') || 'user';
            profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
            if (profileLinkText) profileLinkText.innerText = profileUrl;
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        const username = localStorage.getItem('ngl_username') || 'user';
        profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
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

    // Load Inbox Messages Function
    async function loadInboxMessages() {
        try {
            const dbRef = ref(rtdb);
            const snapshot = await get(child(dbRef, `messages/${uid}`));
            
            if (snapshot.exists()) {
                const messagesData = snapshot.val();
                messagesContainer.innerHTML = '';
                emptyState.classList.add('hidden');
                
                const messageKeys = Object.keys(messagesData).reverse();
                
                messageKeys.forEach(msgId => {
                    const msg = messagesData[msgId];
                    const card = document.createElement('div');
                    card.className = 'message-card';
                    
                    const dateString = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Just now';

                    card.innerHTML = `
                        <div class="msg-header">
                            <span>Anonymous</span>
                            <span>${dateString}</span>
                        </div>
                        <div class="msg-text">${escapeHtml(msg.text)}</div>
                        <div class="msg-actions">
                            <button class="btn-delete" data-id="${msgId}"><i class="fas fa-trash"></i> Delete</button>
                            <button class="btn-reply" data-text="${encodeURIComponent(msg.text)}"><i class="fas fa-share"></i> Share Reply</button>
                        </div>
                    `;

                    // Delete Button
                    card.querySelector('.btn-delete').addEventListener('click', async () => {
                        try {
                            await remove(ref(rtdb, `messages/${uid}/${msgId}`));
                            card.remove();
                            if (messagesContainer.children.length === 0) {
                                emptyState.classList.remove('hidden');
                            }
                            showCustomAlert("Message deleted.");
                        } catch (err) {
                            showCustomAlert("Failed to delete message.");
                        }
                    });

                    // Share Reply
                    card.querySelector('.btn-reply').addEventListener('click', (e) => {
                        const replyBtn = e.currentTarget;
                        const text = decodeURIComponent(replyBtn.getAttribute('data-text'));
                        if (navigator.share) {
                            navigator.share({
                                title: 'Nostelgic NGL Reply',
                                text: `"${text}" - answered on my NGL!`,
                            }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(text);
                            showCustomAlert("Message copied to share on your story! 🚀");
                        }
                    });

                    messagesContainer.appendChild(card);
                });
            } else {
                messagesContainer.innerHTML = '';
                emptyState.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            messagesContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        }
    }

    // Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.replace("login.html");
        });
    }
});

// Helper to prevent XSS injection
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
