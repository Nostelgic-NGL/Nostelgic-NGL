import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

let selectedPlatformName = "";
let usernameValue = "";
let profilePicDataUrl = ""; 

// ==========================================
// THEME SWITCHER LOGIC (Dark / Light Mode)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('ngl_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ngl_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun" style="color: #facc15;"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
}
// ==========================================

function showCustomAlert(message, title = "Nostelgic NGL") {
    return new Promise((resolve) => {
        const modalId = 'custom-alert-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const modalHtml = `
            <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(10px); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;">
                <div style="background: var(--bg-color); border: 1px solid var(--border-color); width: 100%; max-width: 320px; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 15px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15);">
                    <div style="width: 50px; height: 50px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto; color: #8b5cf6; font-size: 22px;">
                        <i class="fa-solid fa-bell"></i>
                    </div>
                    <div>
                        <h3 style="color: var(--text-color); font-size: 16px; font-weight: 700; margin-bottom: 5px;">${title}</h3>
                        <p style="color: var(--sub-text); font-size: 13px; line-height: 1.4; word-break: break-word;">${message}</p>
                    </div>
                    <button id="custom-alert-ok" class="btn-primary" style="padding: 12px; font-size: 14px; border-radius: 14px;">OK</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('custom-alert-ok').onclick = () => {
            document.getElementById(modalId).remove();
            resolve(true);
        };
    });
}

function showCustomConfirm(message, title = "Confirm Action") {
    return new Promise((resolve) => {
        const modalId = 'custom-confirm-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const modalHtml = `
            <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(10px); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;">
                <div style="background: var(--bg-color); border: 1px solid var(--border-color); width: 100%; max-width: 320px; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 15px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.15);">
                    <div style="width: 50px; height: 50px; background: rgba(244, 63, 94, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto; color: #f43f5e; font-size: 22px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                        <h3 style="color: var(--text-color); font-size: 16px; font-weight: 700; margin-bottom: 5px;">${title}</h3>
                        <p style="color: var(--sub-text); font-size: 13px; line-height: 1.4; word-break: break-word;">${message}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="custom-confirm-no" style="flex: 1; padding: 12px; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); font-weight: 600; border-radius: 14px; cursor: pointer;">Cancel</button>
                        <button id="custom-confirm-yes" style="flex: 1; padding: 12px; background: #f43f5e; border: none; color: white; font-weight: 600; border-radius: 14px; cursor: pointer;">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('custom-confirm-yes').onclick = () => {
            document.getElementById(modalId).remove();
            resolve(true);
        };
        document.getElementById('custom-confirm-no').onclick = () => {
            document.getElementById(modalId).remove();
            resolve(false);
        };
    });
}

function goToScreen(screenNumber) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`screen-${screenNumber}`).classList.add('active');
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme(); // Theme initialize karo

    // Theme Toggle Button Event Listener
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    const savedUser = localStorage.getItem('ngl_logged_user');
    const savedPic = localStorage.getItem('ngl_profile_pic');
    
    if (savedUser) {
        usernameValue = savedUser;
        profilePicDataUrl = savedPic || "";
        
        updateDisplayedLink();
        
        const dashImg = document.getElementById('dash-img-tag');
        const dashIcon = document.getElementById('dash-default-icon');
        
        if (profilePicDataUrl) {
            if(dashImg) { dashImg.src = profilePicDataUrl; dashImg.style.display = 'block'; }
            if(dashIcon) dashIcon.style.display = 'none';
        } else {
            if(dashImg) dashImg.style.display = 'none';
            if(dashIcon) dashIcon.style.display = 'block';
        }

        listenToMessages(usernameValue);
        goToScreen(5);
    } else {
        goToScreen(1);
    }

    document.getElementById('btn-screen-1').addEventListener('click', () => goToScreen(2));
    document.getElementById('btn-back-2').addEventListener('click', () => goToScreen(1));
    document.getElementById('btn-back-3').addEventListener('click', () => goToScreen(2));
    document.getElementById('btn-back-4').addEventListener('click', () => goToScreen(3));

    document.getElementById('platform-insta').addEventListener('click', function() {
        selectPlatform('Instagram', this);
    });
    document.getElementById('platform-snap').addEventListener('click', function() {
        selectPlatform('Snapchat', this);
    });

    document.getElementById('next-btn-2').addEventListener('click', () => goToScreen(3));
    document.getElementById('username-input').addEventListener('input', validateUsername);
    document.getElementById('next-btn-3').addEventListener('click', checkAndProceedUsername);
    document.getElementById('file-input').addEventListener('change', previewImage);

    document.getElementById('btn-create-account').addEventListener('click', completeLogin);
    document.getElementById('btn-skip-account').addEventListener('click', completeLogin);
    document.getElementById('btn-copy-link').addEventListener('click', copyLink);
    document.getElementById('btn-share-story').addEventListener('click', copyLink);

    document.getElementById('nav-play-btn').addEventListener('click', showPlayView);
    document.getElementById('nav-inbox-btn').addEventListener('click', showInboxView);
    document.getElementById('nav-settings-btn').addEventListener('click', showSettingsView);
});

function selectPlatform(platform, element) {
    document.querySelectorAll('.platform-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    selectedPlatformName = platform;
    document.getElementById('next-btn-2').disabled = false;
}

function validateUsername() {
    const inputElement = document.getElementById('username-input');
    inputElement.value = inputElement.value.toLowerCase().trim();
    const input = inputElement.value;
    const errorMsg = document.getElementById('username-error');
    const nextBtn = document.getElementById('next-btn-3');

    if (input.length === 0) {
        errorMsg.innerText = "Username cannot be empty";
        nextBtn.disabled = true;
    } else if (input.length < 3) {
        errorMsg.innerText = "Username must be at least 3 characters";
        nextBtn.disabled = true;
    } else if (!/^[a-z0-9_]+$/.test(input)) {
        errorMsg.innerText = "Only small letters, numbers, and underscores allowed";
        nextBtn.disabled = true;
    } else {
        errorMsg.innerText = "";
        nextBtn.disabled = false;
        usernameValue = input;
    }
}

async function checkAndProceedUsername() {
    const input = document.getElementById('username-input').value.trim().toLowerCase();
    const errorMsg = document.getElementById('username-error');
    if (!input) return;

    try {
        const snapshot = await get(child(ref(db), `users/${input}`));
        if (snapshot.exists()) {
            errorMsg.innerText = "Username already taken! Choose another.";
            document.getElementById('next-btn-3').disabled = true;
        } else {
            errorMsg.innerText = "";
            usernameValue = input;
            goToScreen(4);
        }
    } catch (error) {
        goToScreen(4);
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicDataUrl = e.target.result;
            const previewImg = document.getElementById('uploaded-img-tag');
            const defaultIcon = document.getElementById('default-pic-icon');
            if(previewImg) { previewImg.src = profilePicDataUrl; previewImg.style.display = 'block'; }
            if(defaultIcon) defaultIcon.style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
}

async function completeLogin() {
    if (!usernameValue) return;
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    localStorage.setItem('ngl_logged_user', usernameValue);
    localStorage.setItem('ngl_profile_pic', profilePicDataUrl);

    try {
        await set(ref(db, 'users/' + usernameValue), {
            username: usernameValue,
            platform: selectedPlatformName || "Instagram",
            profilePic: profilePicDataUrl || "",
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error(error);
    }

    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        updateDisplayedLink();
        
        const dashImg = document.getElementById('dash-img-tag');
        const dashIcon = document.getElementById('dash-default-icon');
        if (profilePicDataUrl) {
            if(dashImg) { dashImg.src = profilePicDataUrl; dashImg.style.display = 'block'; }
            if(dashIcon) dashIcon.style.display = 'none';
        } else {
            if(dashImg) dashImg.style.display = 'none';
            if(dashIcon) dashIcon.style.display = 'block';
        }

        listenToMessages(usernameValue);
        goToScreen(5);
    }, 2500);
}

function getExactSendLink() {
    const currentDomain = window.location.origin + window.location.pathname.replace('index.html', '');
    return `${currentDomain}send.html?user=${usernameValue}`;
}

function updateDisplayedLink() {
    const linkEl = document.getElementById('display-link-text');
    if(linkEl) {
        linkEl.innerText = getExactSendLink();
        linkEl.style.fontSize = "11px";
        linkEl.style.wordBreak = "break-all";
    }
}

async function copyLink() {
    const sendLink = getExactSendLink();
    navigator.clipboard.writeText(sendLink);
    await showCustomAlert("Link copied to clipboard!\n" + sendLink, "Success");
}

let cachedMessages = [];

function listenToMessages(username) {
    const msgRef = ref(db, `users/${username}/messages`);
    onValue(msgRef, (snapshot) => {
        cachedMessages = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach((key) => {
                cachedMessages.push({ id: key, ...data[key] });
            });
        }
        const count = cachedMessages.length;
        const badgeEl = document.getElementById('mini-msg-count');
        if(badgeEl) badgeEl.innerText = count;
    });
}

function showPlayView() {
    document.getElementById('nav-play-btn').classList.add('active');
    document.getElementById('nav-inbox-btn').classList.remove('active');
    
    document.getElementById('main-content-view').innerHTML = `
        <div class="play-view-container">
            <div class="preview-story-card">
                <div class="story-avatar-wrap">
                    <i class="fa-solid fa-user" id="dash-default-icon" style="${profilePicDataUrl ? 'display:none;' : ''}"></i>
                    <img id="dash-img-tag" src="${profilePicDataUrl || ''}" alt="Avatar" style="${profilePicDataUrl ? 'display:block;' : 'display:none;'} width:100%; height:100%; object-fit:cover;">
                    <span class="edit-badge"><i class="fa-solid fa-pen"></i></span>
                </div>
                <h3>send me anonymous messages!</h3>
            </div>

            <div class="story-dots">
                <span></span>
                <span class="active"></span>
                <span></span>
            </div>

            <div class="ngl-step-box">
                <span class="step-title">Step 1: Copy your link</span>
                <div class="link-display-text" id="display-link-text">${getExactSendLink()}</div>
                <button class="ngl-btn-outline" id="btn-copy-link-inner">copy link</button>
            </div>

            <div class="ngl-step-box">
                <span class="step-title">Step 2: Share link on your story</span>
                <button class="ngl-btn-gradient" id="btn-share-story-inner">Share!</button>
            </div>
        </div>
    `;

    document.getElementById('btn-copy-link-inner').addEventListener('click', copyLink);
    document.getElementById('btn-share-story-inner').addEventListener('click', copyLink);
}

function showInboxView() {
    document.getElementById('nav-inbox-btn').classList.add('active');
    document.getElementById('nav-play-btn').classList.remove('active');

    let html = `<div style="display: flex; flex-direction: column; gap: 10px; max-height: 450px; overflow-y: auto; padding-right: 4px;">`;
    
    if (cachedMessages.length === 0) {
        html += `
            <div class="ngl-step-box" style="text-align: center; padding: 40px 15px; color: var(--sub-text);">
                <i class="fa-regular fa-comment-dots" style="font-size: 36px; color: #8b5cf6; margin-bottom: 8px;"></i>
                <p style="font-size: 13px;">No messages yet! Share your link to get questions.</p>
            </div>
        `;
    } else {
        cachedMessages.reverse().forEach(msg => {
            html += `
                <div onclick="openNglReplyCard('${encodeURIComponent(msg.text)}', '${msg.id}')" style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 14px 16px; border-radius: 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                        <div style="width: 44px; height: 44px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; flex-shrink: 0; font-size: 18px;">
                            💌
                        </div>
                        <div style="display: flex; flex-direction: column; overflow: hidden; text-align: left;">
                            <span style="font-size: 14px; font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${msg.text}</span>
                            <span style="font-size: 11px; color: var(--sub-text);">${msg.time || 'recently'}</span>
                        </div>
                    </div>
                    <div style="color: var(--sub-text); font-size: 14px; padding-left: 10px;">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            `;
        });
    }
    html += `</div>`;
    document.getElementById('main-content-view').innerHTML = html;
}

window.openNglReplyCard = function(encodedText, msgId) {
    const text = decodeURIComponent(encodedText);
    const modalHtml = `
        <div id="ngl-reply-modal" style="position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(11,15,25,0.9); backdrop-filter: blur(15px); z-index: 1000; display: flex; flex-direction: column; justify-content: space-between; padding: 25px 20px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <i class="fa-solid fa-triangle-exclamation" style="color: #94a3b8; font-size: 18px; cursor: pointer;" onclick="showCustomAlert('Message reported successfully.', 'Report')"></i>
                <div style="display: flex; gap: 15px;">
                    <i class="fa-brands fa-instagram" style="color: #fff; font-size: 20px;"></i>
                    <i class="fa-brands fa-twitter" style="color: #64748b; font-size: 20px;"></i>
                    <i class="fa-brands fa-snapchat" style="color: #64748b; font-size: 20px;"></i>
                </div>
                <i class="fa-solid fa-xmark" style="color: #fff; font-size: 22px; cursor: pointer;" onclick="closeNglModal()"></i>
            </div>

            <div id="ngl-story-preview-card" style="width: 100%; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="width: 100%; height: 130px; background: linear-gradient(135deg, #ff9a9e, #fad0c4, #ffd1ff); display: flex; justify-content: center; align-items: center; padding: 15px; text-align: center;">
                    <h3 style="color: white; font-size: 22px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">send me anonymous messages!</h3>
                </div>
                <div style="padding: 30px 20px; text-align: center; background: #ffffff;">
                    <p style="color: #111827; font-size: 18px; font-weight: 700; word-break: break-word;">${text}</p>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-primary" onclick="showCustomAlert('Hints feature coming soon!', 'Coming Soon')" style="background: #ec4899; font-weight: 700; border-radius: 16px; padding: 15px;">
                    see hints
                </button>
                <button class="btn-primary" onclick="shareToInstagramDirect()" style="background: #111827; color: #ffffff; font-weight: 700; border-radius: 16px; padding: 15px; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    <i class="fa-brands fa-instagram"></i> reply
                </button>
                <button onclick="deleteMessage('${msgId}')" style="background: transparent; border: none; color: #f43f5e; font-size: 13px; cursor: pointer; padding: 5px; font-weight: 600;">
                    Delete message
                </button>
            </div>

        </div>
    `;
    const container = document.createElement('div');
    container.innerHTML = modalHtml;
    document.body.appendChild(container);
};

window.shareToInstagramDirect = async function() {
    const cardElement = document.getElementById('ngl-story-preview-card');
    if (!cardElement) {
        closeNglModal();
        return;
    }

    try {
        const canvas = await html2canvas(cardElement, { scale: 2, backgroundColor: null });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "ngl-story.png", { type: "image/png" });
            const filesArray = [file];

            if (navigator.canShare && navigator.canShare({ files: filesArray })) {
                try {
                    await navigator.share({
                        files: filesArray,
                        title: 'Nostelgic NGL',
                        text: 'Check out my anonymous message!'
                    });
                } catch (error) {
                    console.log("Share cancelled:", error);
                }
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'ngl-story.png';
                link.click();
                await showCustomAlert("Story image downloaded! You can now upload it directly to Instagram.", "Downloaded");
            }
        });
    } catch (err) {
        console.error("Error generating story image:", err);
        window.location.href = "instagram://story-camera";
    }
    
    closeNglModal();
};

window.closeNglModal = function() {
    const modal = document.getElementById('ngl-reply-modal');
    if(modal) modal.remove();
};

window.deleteMessage = async function(msgId) {
    const confirmed = await showCustomConfirm("Delete this message? This action cannot be undone.", "Delete Message");
    if (confirmed) {
        try {
            await remove(ref(db, `users/${usernameValue}/messages/${msgId}`));
            closeNglModal();
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }
};

function showSettingsView() {
    document.getElementById('nav-play-btn').classList.remove('active');
    document.getElementById('nav-inbox-btn').classList.remove('active');

    document.getElementById('main-content-view').innerHTML = `
        <div style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 18px; border-radius: 24px; display: flex; flex-direction: column; gap: 12px; max-height: 440px; overflow-y: auto; text-align: left;">
            <h4 style="font-size: 16px; color: var(--text-color); font-weight: 700;"><i class="fa-solid fa-gear"></i> Account Settings</h4>
            <p style="font-size: 12px; color: var(--sub-text); margin-bottom: 5px;">Logged in as <b>@${usernameValue}</b></p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border-color); font-size: 13px; color: var(--text-color); font-weight: 600;">
                <span><i class="fa-solid fa-pause"></i> Pause my link</span>
                <input type="checkbox" id="pause-link-toggle" style="accent-color: #8b5cf6; cursor: pointer; width: 16px; height: 16px;">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-color); padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border-color); font-size: 13px; color: var(--text-color); font-weight: 600;">
                <span><i class="fa-solid fa-bell"></i> Notifications</span>
                <input type="checkbox" id="notif-toggle" checked style="accent-color: #8b5cf6; cursor: pointer; width: 16px; height: 16px;">
            </div>

            <button onclick="showCustomAlert('No users blocked yet!', 'Blocked Users')" style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; color: var(--text-color); font-size: 13px; font-weight: 600; cursor: pointer;">
                <span><i class="fa-solid fa-ban"></i> Blocked Users</span>
                <i class="fa-solid fa-chevron-right" style="font-size: 11px; color: var(--sub-text);"></i>
            </button>

            <button onclick="showCustomAlert('Terms of Use: Use Nostelgic NGL responsibly and respect others privacy.', 'Terms of Use')" style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; color: var(--text-color); font-size: 13px; font-weight: 600; cursor: pointer;">
                <span><i class="fa-solid fa-file-contract"></i> Terms of Use</span>
                <i class="fa-solid fa-chevron-right" style="font-size: 11px; color: var(--sub-text);"></i>
            </button>

            <button onclick="showCustomAlert('Privacy Policy: Your messages are 100% anonymous and secure.', 'Privacy Policy')" style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; color: var(--text-color); font-size: 13px; font-weight: 600; cursor: pointer;">
                <span><i class="fa-solid fa-shield-halved"></i> Privacy Policy</span>
                <i class="fa-solid fa-chevron-right" style="font-size: 11px; color: var(--sub-text);"></i>
            </button>

            <a href="https://instagram.com/Jitu_Gurjar_99" target="_blank" class="btn-primary" style="text-decoration: none; background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 5px; font-size: 14px; padding: 12px;">
                <i class="fa-brands fa-instagram"></i> Follow the Developer
            </a>

            <button class="btn-primary" id="delete-account-btn" style="background: rgba(244, 63, 94, 0.1); border: 1px solid #f43f5e; color: #f43f5e; font-size: 14px; padding: 12px;">
                <i class="fa-solid fa-trash"></i> Delete Account
            </button>
        </div>
    `;

    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        const confirmed = await showCustomConfirm("Are you sure you want to delete your account? This will permanently remove your profile and messages.", "Delete Account");
        if (confirmed) {
            try {
                await remove(ref(db, `users/${usernameValue}`));
            } catch (error) {
                console.error("Error deleting account:", error);
            }

            localStorage.removeItem('ngl_logged_user');
            localStorage.removeItem('ngl_profile_pic');
            window.location.reload();
        }
    });
}
