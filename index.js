import { auth, rtdb } from './firebase-config.js';
import { ref, get, child, remove, update, query, limitToLast, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

function hideLoadingOverlay() {
    const overlay = document.getElementById('homeLoadingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

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
    // Guaranteed safety timeout: 800ms ke andar overlay har halat mein gayab ho jayegi
    setTimeout(() => {
        hideLoadingOverlay();
    }, 800);

    const uid = localStorage.getItem('ngl_uid');
    if (!uid) {
        window.location.replace("login.html");
        return;
    }

    const homeView = document.getElementById('homeView');
    const inboxView = document.getElementById('inboxView');
    const messageDetailView = document.getElementById('messageDetailView');
    const settingsView = document.getElementById('settingsView');

    const navHomeBtn = document.getElementById('navHomeBtn');
    const navInboxBtn = document.getElementById('navInboxBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    const profileLinkText = document.getElementById('profileLinkText');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const platformLabel = document.getElementById('platformLabel');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareStoryBtn = document.getElementById('shareStoryBtn');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');

    const messagesContainer = document.getElementById('messagesContainer');
    const emptyState = document.getElementById('emptyState');
    const inboxLoadingState = document.getElementById('inboxLoadingState');

    const backToInboxBtn = document.getElementById('backToInboxBtn');
    const detailMsgText = document.getElementById('detailMsgText');
    const detailMsgDate = document.getElementById('detailMsgDate');
    const detailDeleteBtn = document.getElementById('detailDeleteBtn');
    const detailReplyBtn = document.getElementById('detailReplyBtn');

    const howToReplyBtn = document.getElementById('howToReplyBtn');
    const tutorialModal = document.getElementById('tutorialModal');
    const closeTutorialXBtn = document.getElementById('closeTutorialXBtn');
    const currentStepNum = document.getElementById('currentStepNum');
    const tutStep1 = document.getElementById('tutStep1');
    const tutStep2 = document.getElementById('tutStep2');
    const tutStep3 = document.getElementById('tutStep3');
    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');

    let currentStep = 1;
    const totalSteps = 3;

    function updateTutorialView() {
        if (currentStepNum) currentStepNum.innerText = currentStep;
        if (tutStep1) tutStep1.classList.add('hidden');
        if (tutStep2) tutStep2.classList.add('hidden');
        if (tutStep3) tutStep3.classList.add('hidden');

        if (currentStep === 1) {
            if (tutStep1) tutStep1.classList.remove('hidden');
            if (prevStepBtn) prevStepBtn.classList.add('hidden');
            if (nextStepBtn) nextStepBtn.innerText = 'Next';
        } else if (currentStep === 2) {
            if (tutStep2) tutStep2.classList.remove('hidden');
            if (prevStepBtn) prevStepBtn.classList.remove('hidden');
            if (nextStepBtn) nextStepBtn.innerText = 'Next';
        } else if (currentStep === 3) {
            if (tutStep3) tutStep3.classList.remove('hidden');
            if (prevStepBtn) prevStepBtn.classList.remove('hidden');
            if (nextStepBtn) nextStepBtn.innerText = 'Got It!';
        }
    }

    if (howToReplyBtn && tutorialModal) {
        howToReplyBtn.addEventListener('click', () => {
            currentStep = 1;
            updateTutorialView();
            tutorialModal.classList.remove('hidden');
        });
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateTutorialView();
            } else {
                tutorialModal.classList.add('hidden');
            }
        });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateTutorialView();
            }
        });
    }

    if (closeTutorialXBtn && tutorialModal) {
        closeTutorialXBtn.addEventListener('click', () => {
            tutorialModal.classList.add('hidden');
        });
    }

    const pauseLinkOption = document.getElementById('pauseLinkOption');
    const hardRefreshOption = document.getElementById('hardRefreshOption');
    const feedbackOption = document.getElementById('feedbackOption');
    const supportOption = document.getElementById('supportOption');
    const logoutBtn = document.getElementById('logoutBtn');

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    const savedTheme = localStorage.getItem('ngl_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.className = "fas fa-moon";
    } else {
        document.body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.className = "fas fa-sun";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('ngl_theme', isDark ? 'dark' : 'light');
            if (themeIcon) {
                themeIcon.className = isDark ? "fas fa-moon" : "fas fa-sun";
            }
        });
    }

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

    const currentBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    let profileUrl = `${currentBaseUrl}/msgsender.html?u=user`;

    const cachedUsername = localStorage.getItem('ngl_cached_username');
    const cachedAvatar = localStorage.getItem('ngl_cached_avatar');

    if (cachedUsername) {
        profileUrl = `${currentBaseUrl}/msgsender.html?u=${cachedUsername}`;
        if (profileLinkText) profileLinkText.innerText = profileUrl;
        if (platformLabel) platformLabel.innerText = `@${cachedUsername}`;
        if (cachedAvatar && userAvatarImg) userAvatarImg.src = cachedAvatar;
    }

    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `users/${uid}`));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const username = data.username || localStorage.getItem('ngl_username') || 'user';
            profileUrl = `${currentBaseUrl}/msgsender.html?u=${username}`;
            
            localStorage.setItem('ngl_cached_username', username);
            if (data.avatarUrl) {
                localStorage.setItem('ngl_cached_avatar', data.avatarUrl);
                if (userAvatarImg) userAvatarImg.src = data.avatarUrl;
            }

            if (profileLinkText) profileLinkText.innerText = profileUrl;
            if (platformLabel) platformLabel.innerText = `@${username}`;
        }
    } catch (error) {
        console.error("Background sync error:", error);
    } finally {
        hideLoadingOverlay();
    }

    let isInitialLoad = true;
    setTimeout(() => { isInitialLoad = false; }, 1500);

    onChildAdded(ref(rtdb, `messages/${uid}`), (snapshot) => {
        if (isInitialLoad) return;
        if (snapshot.exists()) {
            if (window.AndroidBridge && typeof window.AndroidBridge.showNotification === 'function') {
                window.AndroidBridge.showNotification("Nostelgic NGL", "New Anonymous Message 💬");
            }
        }
    });

    if (changeAvatarBtn && avatarFileInput) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarFileInput.click();
        });

        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Image = event.target.result;
                if (userAvatarImg) userAvatarImg.src = base64Image;
                localStorage.setItem('ngl_cached_avatar', base64Image);

                try {
                    await update(ref(rtdb, `users/${uid}`), { avatarUrl: base64Image });
                    showCustomAlert("Profile photo updated successfully! 🖼️");
                } catch (err) {
                    showCustomAlert("Photo saved locally, but failed to sync online.");
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(profileUrl).then(() => {
                showCustomAlert("Link copied to clipboard! 📋");
            }).catch(() => {
                showCustomAlert("Failed to copy link.");
            });
        });
    }

    if (shareStoryBtn) {
        shareStoryBtn.addEventListener('click', async () => {
            const shareText = `Send me anonymous messages! 💬\n${profileUrl}`;

            if (window.AndroidBridge && typeof window.AndroidBridge.shareText === 'function') {
                window.AndroidBridge.shareText(shareText);
            } else if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Nostelgic NGL',
                        text: 'Send me anonymous messages! 💬',
                        url: profileUrl
                    });
                } catch (err) {
                    console.log("Share dismissed or failed", err);
                }
            } else {
                navigator.clipboard.writeText(profileUrl).then(() => {
                    showCustomAlert("Link copied to clipboard! 📋");
                });
            }
        });
    }

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
                "Logout Account",
                "If you logout, your account and all data will be permanently deleted. Are you sure you want to proceed?",
                async () => {
                    try {
                        await remove(ref(rtdb, `users/${uid}`));
                        await remove(ref(rtdb, `messages/${uid}`));
                    } catch (e) {
                        console.error(e);
                    }
                    localStorage.clear();
                    window.location.replace("login.html");
                }
            );
        });
    }

    function generateStoryReply(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d', { alpha: false });

        const isDarkMode = document.body.classList.contains('dark-mode');

        const templateImg = new Image();
        templateImg.crossOrigin = "anonymous";
        templateImg.src = isDarkMode ? 'ReplyDark.png' : 'ReplyLight.png';

        templateImg.onload = () => {
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

            ctx.font = 'bold 36px Poppins, sans-serif';
            ctx.textAlign = 'center';
            
            const words = text.split(' ');
            let line = '';
            let lines = [];
            const maxWidth = 760;
            
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            const boxX = 120;
            const boxY = 280;
            const boxWidth = 840;
            const headerHeight = 70;
            const lineHeight = 50;
            const padding = 50;
            
            const boxHeight = Math.max(200, headerHeight + (lines.length * lineHeight) + padding);
            const cornerRadius = 35;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);
            ctx.fill();
            ctx.stroke();

            ctx.font = '600 30px Poppins, sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText("Send Me Anonymous Message", 540, boxY + 55);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(boxX + 50, boxY + 85);
            ctx.lineTo(boxX + boxWidth - 50, boxY + 85);
            ctx.stroke();

            ctx.font = 'bold 36px Poppins, sans-serif';
            ctx.fillStyle = '#ffffff';
            
            let startY = boxY + 135;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], 540, startY + (i * lineHeight));
            }

            const dataUrl = canvas.toDataURL('image/png', 0.9);

            if (window.AndroidBridge && typeof window.AndroidBridge.shareStory === 'function') {
                window.AndroidBridge.shareStory(dataUrl);
            } else {
                const downloadLink = document.createElement('a');
                downloadLink.href = dataUrl;
                downloadLink.download = isDarkMode ? 'ReplyDark.png' : 'ReplyLight.png';
                downloadLink.click();
            }
        };

        templateImg.onerror = () => {
            showCustomAlert("Failed to load template image. Check file names.");
        };
    }

    async function loadInboxMessages() {
        messagesContainer.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');
        if (inboxLoadingState) inboxLoadingState.classList.remove('hidden');

        let hasLoadedFromCache = false;

        const cachedMessages = localStorage.getItem(`ngl_messages_${uid}`);
        if (cachedMessages) {
            try {
                const messagesData = JSON.parse(cachedMessages);
                if (messagesData && Object.keys(messagesData).length > 0) {
                    hasLoadedFromCache = true;
                    if (inboxLoadingState) inboxLoadingState.classList.add('hidden');
                    renderMessagesList(messagesData);
              
