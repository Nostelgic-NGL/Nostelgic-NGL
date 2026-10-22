import { auth, rtdb } from './firebase-config.js';
import { ref, get, child, remove, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Internet Connection Checker & Retry Logic
function checkInternetConnection() {
    const modal = document.getElementById('noInternetModal');
    if (!navigator.onLine) {
        if (modal) modal.classList.remove('hidden');
    } else {
        if (modal) modal.classList.add('hidden');
    }
}

window.addEventListener('load', () => {
    checkInternetConnection();
    
    const retryBtn = document.getElementById('retryConnectionBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (navigator.onLine) {
                window.location.reload();
            } else {
                retryBtn.style.transform = 'scale(0.95)';
                setTimeout(() => retryBtn.style.transform = 'scale(1)', 150);
                showCustomAlert("Still offline! Please check your Wi-Fi or Mobile Data.");
            }
        });
    }
});

window.addEventListener('online', checkInternetConnection);
window.addEventListener('offline', checkInternetConnection);

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

// Custom Confirmation Function (Yes/No - for Logout)
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
    checkInternetConnection();

    const uid = localStorage.getItem('ngl_uid');
    if (!uid) {
        window.location.replace("login.html");
        return;
    }

    // Views
    const homeView = document.getElementById('homeView');
    const inboxView = document.getElementById('inboxView');
    const messageDetailView = document.getElementById('messageDetailView');
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
    const homeLoadingOverlay = document.getElementById('homeLoadingOverlay');

    // Inbox Elements
    const messagesContainer = document.getElementById('messagesContainer');
    const emptyState = document.getElementById('emptyState');

    // Detail View Elements
    const backToInboxBtn = document.getElementById('backToInboxBtn');
    const detailMsgText = document.getElementById('detailMsgText');
    const detailMsgDate = document.getElementById('detailMsgDate');
    const detailDeleteBtn = document.getElementById('detailDeleteBtn');
    const detailReplyBtn = document.getElementById('detailReplyBtn');

    // Settings Options
    const pauseLinkOption = document.getElementById('pauseLinkOption');
    const hardRefreshOption = document.getElementById('hardRefreshOption');
    const feedbackOption = document.getElementById('feedbackOption');
    const supportOption = document.getElementById('supportOption');
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
        messageDetailView.classList.add('hidden');
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
        } else if (viewName === 'detail') {
            messageDetailView.classList.remove('hidden');
            navInboxBtn.classList.add('active');
        } else if (viewName === 'settings') {
            settingsView.classList.remove('hidden');
            settingsBtn.classList.add('active');
        }
    }

    if (navHomeBtn) navHomeBtn.addEventListener('click', () => switchView('home'));
    if (navInboxBtn) navInboxBtn.addEventListener('click', () => switchView('inbox'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => switchView('settings'));
    if (backToInboxBtn) backToInboxBtn.addEventListener('click', () => switchView('inbox'));

    // Load Profile & Generate Link
    const currentBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let profileUrl = `${currentBaseUrl}/msgsender.html?u=user`;

    const cachedUsername = localStorage.getItem('ngl_cached_username');
    const cachedAvatar = localStorage.getItem('ngl_cached_avatar');

    if (cachedUsername) {
        profileUrl = `${currentBaseUrl}/msgsender.html?u=${cachedUsername}`;
        if (profileLinkText) profileLinkText.innerText = profileUrl;
        if (platformLabel) platformLabel.innerText = `@${cachedUsername}`;
        if (cachedAvatar && userAvatarImg) userAvatarImg.src = cachedAvatar;
        
        if (homeLoadingOverlay) {
            homeLoadingOverlay.style.opacity = '0';
            setTimeout(() => homeLoadingOverlay.classList.add('hidden'), 300);
        }
    }

    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const username = data.username || localStorage.getItem('ngl_username') || 'user';
            profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
            
            localStorage.setItem('ngl_cached_username', username);
            if (data.avatarUrl) localStorage.setItem('ngl_cached_avatar', data.avatarUrl);

            if (profileLinkText) profileLinkText.innerText = profileUrl;
            if (platformLabel) platformLabel.innerText = `@${username}`;
            if (data.avatarUrl && userAvatarImg) {
                userAvatarImg.src = data.avatarUrl;
            }
        }
    } catch (error) {
        console.error("Background sync error:", error);
    } finally {
        if (homeLoadingOverlay) {
            homeLoadingOverlay.style.opacity = '0';
            setTimeout(() => homeLoadingOverlay.classList.add('hidden'), 300);
        }
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
        shareStoryBtn.addEventListener('click', async () => {
            const shareData = {
                title: 'Nostelgic NGL',
                text: 'Send me anonymous messages! 💬',
                url: profileUrl
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log("Share dismissed or failed", err);
                }
            } else {
                window.location.href = `native-share://${encodeURIComponent(profileUrl)}`;
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

    if (feedbackOption) {
        feedbackOption.addEventListener('click', () => {
            window.location.href = "mailto:Nostelgic.NGL@gmail.com?subject=Feedback%20for%20Nostelgic%20NGL";
        });
    }

    if (supportOption) {
        supportOption.addEventListener('click', () => {
            window.location.href = "mailto:Nostelgic.NGL@gmail.com?subject=Support%20Request%20-%20Nostelgic%20NGL";
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showCustomConfirm(
                "Logout & Delete Account",
                "Are you sure you want to logout? Logging out will permanently delete your account and all messages.",
                async () => {
                    try {
                        await remove(ref(rtdb, `users/${uid}`));
                        await remove(ref(rtdb, `messages/${uid}`));
                        localStorage.clear();
                        window.location.replace("login.html");
                    } catch (err) {
                        showCustomAlert("Failed to process logout. Try again.");
                    }
                }
            );
        });
    }

    // Helper function to generate story reply canvas and trigger native share sheet
    function generateStoryReply(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d', { alpha: false });

        const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
        bgGradient.addColorStop(0, '#030712');
        bgGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#ffffff';
        ctx.roundRect(110, 550, 860, 780, 48);
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(110, 550, 860, 220, [48, 48, 0, 0]);
        ctx.clip();
        const cardHeaderGrad = ctx.createLinearGradient(110, 550, 970, 770);
        cardHeaderGrad.addColorStop(0, '#db2777');
        cardHeaderGrad.addColorStop(1, '#ff5e36');
        ctx.fillStyle = cardHeaderGrad;
        ctx.fillRect(110, 550, 860, 220);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('send me anonymous messages!', 540, 680);
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        
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

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('Nostelgic NGL • Anonymous Q&A', 540, 1750);

        const dataUrl = canvas.toDataURL('image/png', 0.9);

        // Trigger native share intent scheme so Android opens the share menu directly to Instagram
        window.location.href = `native-share://${encodeURIComponent(dataUrl)}`;
    }

    // Load Inbox Messages Function
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

                    // Inbox Preview showing "New Message!" like real NGL
                    card.innerHTML = `
                        <div class="msg-header">
                            <span style="color: #ec4899; font-weight: 700;"><i class="fas fa-envelope"></i> New Message!</span>
                            <span>${dateString}</span>
                        </div>
                        <div class="msg-text">${escapeHtml(msg.text)}</div>
                    `;

                    // Open Message Detail Screen on Click
                    card.addEventListener('click', () => {
                        detailMsgText.innerText = msg.text;
                        detailMsgDate.innerText = dateString;
                        switchView('detail');

                        // Setup Delete Action in Detail View
                        detailDeleteBtn.onclick = async () => {
                            try {
                                await remove(ref(rtdb, `messages/${uid}/${msgId}`));
                                switchView('inbox');
                                showCustomAlert("Message deleted.");
                            } catch (err) {
                                showCustomAlert("Failed to delete message.");
                            }
                        };

                        // Setup Reply / Story Share Action in Detail View
                        detailReplyBtn.onclick = () => {
                            generateStoryReply(msg.text);
                        };
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
