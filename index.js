import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: '',
    username: '',
    avatarBase64: 'Default-User.png'
};

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
    
    // 1. STATE CHECK: Agar user pehle se logged-in hai, toh Dashboard dikhao
    if (savedUid) {
        loadDashboard(savedUid);
        return;
    }

    // 2. ONBOARDING SETUP FLOW (Agar logged-in nahi hai)
    const getStartedBtn = document.getElementById('getStartedBtn');
    const instaBtn = document.getElementById('instaBtn');
    const snapBtn = document.getElementById('snapBtn');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const completeBtn = document.getElementById('completeBtn');
    const skipBtn = document.getElementById('skipBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userData.avatarBase64 = e.target.result;
                    const previewImg = document.getElementById('previewImg');
                    const cameraIcon = document.getElementById('cameraIcon');
                    
                    previewImg.src = userData.avatarBase64;
                    previewImg.classList.remove('hidden');
                    cameraIcon.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('step1').classList.remove('hidden');
            document.getElementById('stepIndicator').innerText = "Step 1 of 3: Select Platform";
        });
    }

    if (instaBtn) {
        instaBtn.addEventListener('click', () => selectPlatform('instagram'));
    }

    if (snapBtn) {
        snapBtn.addEventListener('click', () => selectPlatform('snapchat'));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextToStep3);
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('step2').classList.add('hidden');
            document.getElementById('step1').classList.remove('hidden');
            document.getElementById('stepIndicator').innerText = "Step 1 of 3: Select Platform";
        });
    }

    if (completeBtn) {
        completeBtn.addEventListener('click', async () => {
            await saveUserDataToDatabase();
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            userData.avatarBase64 = 'Default-User.png';
            await saveUserDataToDatabase();
        });
    }
});

function selectPlatform(platform) {
    userData.platform = platform;
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('stepIndicator').innerText = "Step 2 of 3: Choose Username";
}

async function nextToStep3() {
    const username = document.getElementById('usernameInput').value.trim().toLowerCase();
    const errorMsg = document.getElementById('errorMessage');
    
    errorMsg.classList.add('hidden');

    if (!username || username.length < 3) {
        errorMsg.innerText = "Username must be at least 3 characters long.";
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `usernames/${username}`));

        if (snapshot.exists()) {
            errorMsg.innerText = "This username is already taken. Try another one.";
            errorMsg.classList.remove('hidden');
            return;
        }

        userData.username = username;
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.remove('hidden');
        document.getElementById('stepIndicator').innerText = "Step 3 of 3: Profile Photo";
    } catch (error) {
        errorMsg.innerText = "Error: " + error.message;
        errorMsg.classList.remove('hidden');
    }
}

async function saveUserDataToDatabase() {
    const errorMsg = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    loadingOverlay.classList.remove('hidden');

    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        await set(ref(rtdb, 'users/' + user.uid), {
            uid: user.uid,
            username: userData.username,
            platform: userData.platform,
            avatarUrl: userData.avatarBase64,
            createdAt: new Date().toISOString()
        });

        await set(ref(rtdb, 'usernames/' + userData.username), {
            uid: user.uid
        });

        localStorage.setItem('ngl_uid', user.uid);
        localStorage.setItem('ngl_username', userData.username);

        loadingOverlay.classList.add('hidden');
        loadDashboard(user.uid);

    } catch (error) {
        loadingOverlay.classList.add('hidden');
        errorMsg.innerText = "Setup failed: " + error.message;
        errorMsg.classList.remove('hidden');
    }
}

// 3. LOAD DASHBOARD FUNCTION
async function loadDashboard(uid) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const headerLogoArea = document.getElementById('headerLogoArea');
    
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.add('hidden');
    if (step3) step3.classList.add('hidden');
    if (headerLogoArea) headerLogoArea.style.display = 'none';

    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) dashboardView.classList.remove('hidden');

    // Tab Switching Logic
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
                    } catch (err) {
                        console.log('Share canceled or failed');
                    }
                } else {
                    navigator.clipboard.writeText(shareLink);
                    alert('Link copied! Paste it on your Instagram/Snapchat story.');
                }
            };
        }

        document.getElementById('logoutBtn').onclick = async function() {
            await signOut(auth);
            localStorage.clear();
            window.location.reload();
        };

        const messagesRef = ref(rtdb, `messages/${uid}`);
        onValue(messagesRef, (snapshot) => {
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';

            if (!snapshot.exists()) {
                container.innerHTML = `<div style="background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; text-align: center; color: #64748b; font-size: 11px;">No messages yet. Share your link to get confessions!</div>`;
                return;
            }

            snapshot.forEach((childSnap) => {
                const msgData = childSnap.val();
                const msgCard = document.createElement('div');
                msgCard.style = "background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; color: #f8fafc; font-size: 12px; word-break: break-word;";
                msgCard.innerHTML = `
                    <p style="margin-bottom: 4px;">${msgData.message}</p>
                    <span style="font-size: 9px; color: #64748b;">${new Date(msgData.timestamp).toLocaleString()}</span>
                `;
                container.appendChild(msgCard);
            });
        });

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}