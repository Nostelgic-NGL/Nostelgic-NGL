import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: 'instagram',
    username: '',
    avatarBase64: 'Default-User.png'
};

document.addEventListener('DOMContentLoaded', () => {
    const savedUid = localStorage.getItem('ngl_uid');
    if (savedUid) {
        window.location.href = "index.html";
        return;
    }

    const welcomeScreen = document.getElementById('welcomeScreen');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const step1BackBtn = document.getElementById('step1BackBtn');
    const step2BackBtn = document.getElementById('step2BackBtn');
    const step3BackBtn = document.getElementById('step3BackBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    const platformCards = document.querySelectorAll('.platform-card-ngl');
    const platformNextBtn = document.getElementById('platformNextBtn');
    const usernameInput = document.getElementById('usernameInput');
    const usernameNextBtn = document.getElementById('usernameNextBtn');
    
    const avatarPreviewContainer = document.getElementById('avatarPreviewContainer');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const completeBtn = document.getElementById('completeBtn');

    let currentStep = 0;

    function updateStepView() {
        welcomeScreen.classList.add('hidden');
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');

        if (currentStep === 1) {
            step1.classList.remove('hidden');
        } else if (currentStep === 2) {
            step2.classList.remove('hidden');
        } else if (currentStep === 3) {
            step3.classList.remove('hidden');
        }
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            currentStep = 1;
            updateStepView();
        });
    }

    const handleBack = () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepView();
        } else {
            currentStep = 0;
            welcomeScreen.classList.remove('hidden');
            step1.classList.add('hidden');
        }
    };

    if (step1BackBtn) step1BackBtn.addEventListener('click', handleBack);
    if (step2BackBtn) step2BackBtn.addEventListener('click', handleBack);
    if (step3BackBtn) step3BackBtn.addEventListener('click', handleBack);

    // Platform Card Selection Logic
    platformCards.forEach(card => {
        const selectAction = () => {
            platformCards.forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.radio-indicator').innerHTML = '<div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid #475569;"></div>';
            });
            card.classList.add('selected');
            userData.platform = card.getAttribute('data-platform');
            card.querySelector('.radio-indicator').innerHTML = '<div style="width: 20px; height: 20px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; border-radius: 50%; background: #030712;"></div></div>';
        };

        card.addEventListener('click', selectAction);
        card.addEventListener('touchend', (e) => {
            e.preventDefault();
            selectAction();
        });
    });

    if (platformNextBtn) {
        platformNextBtn.addEventListener('click', () => {
            currentStep = 2;
            updateStepView();
            if (usernameInput) usernameInput.focus();
        });
    }

    if (usernameNextBtn) {
        usernameNextBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim().toLowerCase().replace('@', '');
            if (!username || username.length < 3) {
                alert("Username must be at least 3 characters long.");
                return;
            }

            try {
                const dbRef = ref(rtdb);
                const snapshot = await get(child(dbRef, `usernames/${username}`));
                if (snapshot.exists()) {
                    alert("This username is already taken. Try another one.");
                    return;
                }
                userData.username = username;
                currentStep = 3;
                updateStepView();
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }

    // Profile Photo Upload Trigger
    const triggerGallery = (e) => {
        e.preventDefault();
        if (avatarFileInput) avatarFileInput.click();
    };

    if (avatarPreviewContainer) {
        avatarPreviewContainer.addEventListener('click', triggerGallery);
        avatarPreviewContainer.addEventListener('touchend', triggerGallery);
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    userData.avatarBase64 = e.target.result;
                    const previewImg = document.getElementById('previewImg');
                    const defaultUserIcon = document.getElementById('defaultUserIcon');
                    
                    if (previewImg && defaultUserIcon) {
                        previewImg.src = userData.avatarBase64;
                        previewImg.classList.remove('hidden');
                        defaultUserIcon.classList.add('hidden');
                        completeBtn.innerText = "Create Account 🚀";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const finishSetup = async () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');

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

            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            window.location.href = "index.html";

        } catch (error) {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            alert("Setup failed: " + error.message);
        }
    };

    if (completeBtn) completeBtn.addEventListener('click', finishSetup);
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            userData.avatarBase64 = 'Default-User.png';
            finishSetup();
        });
    }
});
