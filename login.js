import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: '',
    username: '',
    avatarBase64: 'Default-User.png'
};

document.addEventListener('DOMContentLoaded', () => {
    const savedUid = localStorage.getItem('ngl_uid');
    if (savedUid) {
        window.location.href = "index.html";
        return;
    }

    const getStartedBtn = document.getElementById('getStartedBtn');
    const instaBtn = document.getElementById('instaBtn');
    const snapBtn = document.getElementById('snapBtn');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const completeBtn = document.getElementById('completeBtn');
    const skipBtn = document.getElementById('skipBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const uploadBtnTrigger = document.getElementById('uploadBtnTrigger');
    const avatarPreviewContainer = document.getElementById('avatarPreviewContainer');

    const triggerFilePicker = (e) => {
        e.preventDefault();
        if (avatarFileInput) {
            avatarFileInput.click();
        }
    };

    if (uploadBtnTrigger) {
        uploadBtnTrigger.addEventListener('click', triggerFilePicker);
        uploadBtnTrigger.addEventListener('touchend', triggerFilePicker);
    }

    if (avatarPreviewContainer) {
        avatarPreviewContainer.addEventListener('click', triggerFilePicker);
        avatarPreviewContainer.addEventListener('touchend', triggerFilePicker);
    }

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
        window.location.href = "index.html";

    } catch (error) {
        loadingOverlay.classList.add('hidden');
        errorMsg.innerText = "Setup failed: " + error.message;
        errorMsg.classList.remove('hidden');
    }
}