import { auth, rtdb } from './firebase-config.js';
import { ref, get, child, remove, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Custom Alert Function (Simple OK)
function showCustomAlert(message) {
    const alertModal = document.getElementById('customAlertModal');
    const alertTitle = document.getElementById('customAlertTitle');
    const alertText = document.getElementById('customAlertText');
    const btnGroup = document.getElementById('customAlertBtnGroup');
    
    if (alertTitle) alertTitle.innerText = "Nostelgic NGL";
    if (alertText) alertText.innerText = message;
    
    btnGroup.innerHTML = `<button class="custom-alert-btn custom-alert-ok" id="customAlertOkBtn">OK</button>`;
    if (alertModal) alertModal.classList.remove('hidden');

    document.getElementById('customAlertOkBtn').onclick = () => {
        if (alertModal) alertModal.classList.add('hidden');
    };
}

// Custom Confirmation Function (Yes/No - for Delete & Logout)
function showCustomConfirm(title, message, onConfirm) {
    const alertModal = document.getElementById('customAlertModal');
    const alertTitle = document.getElementById('customAlertTitle');
    const alertText = document.getElementById('customAlertText');
    const btnGroup = document.getElementById('customAlertBtnGroup');
    
    if (alertTitle) alertTitle.innerText = title;
    if (alertText) alertText.innerText = message;
    
    btnGroup.innerHTML = `
        <button class="custom-alert-btn custom-alert-cancel" id="customAlertCancelBtn">Cancel</button>
        <button class="custom-alert-btn custom-alert-ok" id="customAlertConfirmBtn">Confirm</button>
    `;
    if (alertModal) alertModal.classList.remove('hidden');

    document.getElementById('customAlertCancelBtn').onclick = () => {
        if (alertModal) alertModal.classList.add('hidden');
    };

    document.getElementById('customAlertConfirmBtn').onclick = () => {
        if (alertModal) alertModal.classList.add('hidden');
        onConfirm();
    };
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

    // Settings Options
    const pauseLinkOption = document.getElementById('pauseLinkOption');
    const hardRefreshOption = document.getElementById('hardRefreshOption');
    const feedbackOption = document.getElementById('feedbackOption');
    const supportOption = document.getElementById('supportOption');
    const deleteAccountOption = document.getElementById('deleteAccountOption');
    const logoutBtn = document.getElementById('logoutBtn');

    // Theme Elements
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

    // Switch View Function with Active Nav Highlights
    function switchView(viewName) {
        homeView.classList.add('hidden');
        inboxView.classList.add('hidden');
        settingsView.classList.add('hidden');

        navHomeBtn.classList.remove('active');
        navInboxBtn.classList.remove('active');
        settingsBtn.classList.remove('active');

        if (viewName === 'home') {
            homeView.classList.remove('hidden');
            navHomeBtn.classList.add('active');
        } else if (viewName === 'inbox') {
            inboxView.classList.remove('hidden');
            navInboxBtn.classList.add('active');
            loadInboxMessages();
        } else if (viewName === 'settings') {
            settingsView.classList.remove('hidden');
            settingsBtn.classList.add('active');
        }
    }

    if (navHomeBtn) navHomeBtn.addEventListener('click', () => switchView('home'));
    if (navInboxBtn) navInboxBtn.addEventListener('click', () => switchView('inbox'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => switchView('settings'));

    // Load Profile & Generate Link (Optimized with LocalStorage Caching for Super Fast Load)
    const currentBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let profileUrl = `${currentBaseUrl}/msgsender.html?u=user`;

    // 1. Instant Load from Cache
    const cachedUsername = localStorage.getItem('ngl_cached_username');
    const cachedAvatar = localStorage.getItem('ngl_cached_avatar');

    if (cachedUsername) {
        profileUrl = `${currentBaseUrl}/msgsender.html?u=${cachedUsername}`;
        if (profileLinkText) profileLinkText.innerText = profileUrl;
        if (platformLabel) platformLabel.innerText = cachedUsername; // Display Username instead of platform
        if (cachedAvatar && userAvatarImg) userAvatarImg.src = cachedAvatar;
    }

    // 2. Background Sync with Firebase
    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const username = data.username || localStorage.getItem('ngl_username') || 'user';
            profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
            
            // Save to Cache
            localStorage.setItem('ngl_cached_username', username);
            if (data.avatarUrl) localStorage.setItem('ngl_cached_avatar', data.avatarUrl);

            if (profileLinkText) profileLinkText.innerText = profileUrl;
            if (platformLabel) platformLabel.innerText = username; // Display Username here
            if (data.avatarUrl && userAvatarImg) {
                userAvatarImg.src = data.avatarUrl;
            }
        }
    } catch (error) {
        console.error("Background sync error:", error);
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

    // Native Share Sheet Menu Action (Home Share Button)
    if (shareStoryBtn) {
        shareStoryBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Nostelgic NGL',
                        text: 'Send me anonymous messages! 💬',
                        url: profileUrl,
                    });
                } catch (err) {
                    console.log("Share cancelled or failed", err);
                }
            } else {
                navigator.clipboard.writeText(profileUrl);
                showCustomAlert("Link copied to clipboard! 📋");
            }
        });
    }

    // ================= SETTINGS ACTIONS =================
    
    let isLinkPaused = localStorage.getItem('ngl_paused') === 'true';
    if (pauseLinkOption) {
        if (isLinkPaused) pauseLinkOption.querySelector('span').innerHTML = '<i class="fas fa-play-circle" style="color: #22c55e; margin-right: 8px;"></i> Resume my link';
        
        pauseLinkOption.addEventListener('click', () => {
            isLinkPaused = !isLinkPaused;
            localStorage.setItem('ngl_paused', isLinkPaused);
            if (isLinkPaused) {
                pauseLinkOption.querySelector('span').innerHTML = '<i class="fas fa-play-circle" style="color: #22c55e; margin-right: 8px;"></i> Resume my link';
                showCustomAlert("Your link has been paused. Nobody can send messages right now.");
            } else {
                pauseLinkOption.querySelector('span').innerHTML = '<i class="fas fa-pause-circle" style="color: #ec4899; margin-right: 8px;"></i> Pause my link';
                showCustomAlert("Your link is now active again! 🚀");
            }
        });
    }

    // PC Style Hard Refresh (Ctrl+F5 equivalent for Mobile)
    if (hardRefreshOption) {
        hardRefreshOption.addEventListener('click', () => {
            const currentUid = localStorage.getItem('ngl_uid');
            const currentTheme = localStorage.getItem('ngl_theme');
            
            localStorage.clear();
            
            if (currentUid) localStorage.setItem('ngl_uid', currentUid);
            if (currentTheme) localStorage.setItem('ngl_theme', currentTheme);

            window.location.reload(true);
        });
    }

    // Separate Feedback Option (Opens Gmail)
    if (feedbackOption) {
        feedbackOption.addEventListener('click', () => {
            window.location.href = "mailto:Nostelgic.NGL@gmail.com?subject=Feedback%20for%20Nostelgic%20NGL";
        });
    }

    // Separate Support Option (Opens Gmail)
    if (supportOption) {
        supportOption.addEventListener('click', () => {
            window.location.href = "mailto:Nostelgic.NGL@gmail.com?subject=Support%20Request%20-%20Nostelgic%20NGL";
        });
    }

    // Custom Confirmation Modal for Delete Account
    if (deleteAccountOption) {
        deleteAccountOption.addEventListener('click', () => {
            showCustomConfirm(
                "Delete Account",
                "Are you sure you want to delete your account? All messages and data will be permanently removed.",
                async () => {
                    try {
                        await remove(ref(rtdb, `users/${uid}`));
                        await remove(ref(rtdb, `messages/${uid}`));
                        localStorage.clear();
                        window.location.replace("login.html");
                    } catch (err) {
                        showCustomAlert("Failed to delete account. Try again.");
                    }
                }
            );
        });
    }

    // Custom Confirmation Modal for Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showCustomConfirm(
                "Logout",
                "Are you sure you want to logout from your account?",
                () => {
                    localStorage.clear();
                    window.location.replace("login.html");
                }
            );
        });
    }

    // Load Inbox Messages Function (Optimized with limitToLast & Lightning Fast Canvas)
    async function loadInboxMessages() {
        try {
            const messagesQuery = query(ref(rtdb, `messages/${uid}`), limitToLast(50));
            const snapshot = await get(messagesQuery);
            
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

                    // Share Reply - Super Optimized Instant Canvas Generator
                    card.querySelector('.btn-reply').addEventListener('click', (e) => {
                        const replyBtn = e.currentTarget;
                        const text = decodeURIComponent(replyBtn.getAttribute('data-text'));

                        // Create Canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = 1080;
                        canvas.height = 1920;
                        const ctx = canvas.getContext('2d', { alpha: false });

                        // Background Gradient
                        const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
                        bgGradient.addColorStop(0, '#030712');
                        bgGradient.addColorStop(1, '#0f172a');
                        ctx.fillStyle = bgGradient;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Rounded Rect Helper
                        ctx.roundRect = function(x, y, w, h, r) {
                            if (w < 2 * r) r = w / 2;
                            if (h < 2 * r) r = h / 2;
                            this.beginPath();
                            this.moveTo(x + r, y);
                            this.arcTo(x + w, y, x + w, y + h, r);
                            this.arcTo(x + w, y + h, x, y + h, r);
                            this.arcTo(x, y + h, x, y, r);
                            this.arcTo(x, y, x + w, y, r);
                            this.closePath();
                            this.fill();
                        };
                        
                        // Draw Card Box
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                        ctx.shadowBlur = 40;
                        ctx.shadowOffsetY = 20;
                        ctx.fillStyle = '#ffffff';
                        ctx.roundRect(110, 550, 860, 780, 48);
                        ctx.shadowBlur = 0;

                        // Top Header inside card (Gradient Header)
                        ctx.save();
                        ctx.beginPath();
                        ctx.roundRect(110, 550, 860, 220, [48, 48, 0, 0]);
                        ctx.clip();
                        const cardHeaderGrad = ctx.createLinearGradient(110, 550, 970, 770);
                        cardHeaderGrad.addColorStop(0, '#db2777');
                        cardHeaderGrad.addColorStop(1, '#ff5e36');
                        ctx.fillStyle = cardHeaderGrad;
                        ctx.fillRect(110, 550, 860, 220);
                        
                        // Header Text inside Card
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 42px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('send me anonymous messages!', 540, 680);
                        ctx.restore();

                        // Message Text
                        ctx.fillStyle = '#0f172a';
                        ctx.font = 'bold 50px sans-serif';
                        ctx.textAlign = 'center';
                        
                        // Fast Text Wrapping
                        const words = text.split(' ');
                        let line = '';
                        let y = 920;
                        const maxWidth = 760;
                        
                        for (let n = 0; n < words.length; n++) {
                            let testLine = line + words[n] + ' ';
                            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                                ctx.fillText(line, 540, y);
                                line = words[n] + ' ';
                                y += 70;
                            } else {
                                line = testLine;
                            }
                        }
                        ctx.fillText(line, 540, y);

                        // Footer Branding
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = 'bold 30px sans-serif';
                        ctx.fillText('Nostelgic NGL • Anonymous Q&A', 540, 1750);

                        // Instant Data URL & Trigger Story Intent
                        const dataUrl = canvas.toDataURL('image/png', 0.9);
                        window.location.href = `instagram-story://${encodeURIComponent(dataUrl)}`;
                    });

                    messagesContainer.appendChild(card);
                });
            } else {
                messagesContainer.innerHTML = '';
                emptyState.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            messagesContainer.innerHTML = '';
            emptyState.classList.add('hidden');
        }
    }
});

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
