import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: 'instagram',
    username: '',
    avatarBase64: 'Default-User.png'
};

// Custom Alert Helper Function
function showCustomAlert(message) {
    const alertModal = document.getElementById('customAlertModal');
    const alertText = document.getElementById('customAlertText');
    const okBtn = document.getElementById('customAlertOkBtn');
    
    if (alertText) alertText.innerText = message;
    if (alertModal) alertModal.classList.remove('hidden');

    if (okBtn) {
        okBtn.onclick = () => {
            alertModal.classList.add('hidden');
        };
    }
}

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
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.add('hidden');
        if (step3) step3.classList.add('hidden');

        if (currentStep === 1) {
            if (step1) step1.classList.remove('hidden');
        } else if (currentStep === 2) {
            if (step2) step2.classList.remove('hidden');
        } else if (currentStep === 3) {
            if (step3) step3.classList.remove('hidden');
        }
    }

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentStep = 1;
            updateStepView();
        });
    }

    const handleBack = (e) => {
        if (e) e.preventDefault();
        if (currentStep > 1) {
            currentStep--;
            updateStepView();
        } else {
            currentStep = 0;
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
            if (step1) step1.classList.add('hidden');
        }
    };

    if (step1BackBtn) step1BackBtn.addEventListener('click', handleBack);
    if (step2BackBtn) step2BackBtn.addEventListener('click', handleBack);
    if (step3BackBtn) step3BackBtn.addEventListener('click', handleBack);

    // Platform Selection Logic with Custom Alert for Snapchat
    platformCards.forEach(card => {
        const selectAction = (e) => {
            if (e) e.preventDefault();
            const targetCard = e.currentTarget;
            const platform = targetCard.getAttribute('data-platform');

            if (platform === 'snapchat') {
                showCustomAlert("Feature Coming Soon In Next Update");
                return;
            }

            platformCards.forEach(c => {
                c.classList.remove('selected');
                const indicator = c.querySelector('.radio-indicator');
                if (indicator) {
                    indicator.innerHTML = '<div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid #475569;"></div>';
                }
            });
            
            targetCard.classList.add('selected');
            userData.platform = platform;
            const activeIndicator = targetCard.querySelector('.radio-indicator');
            if (activeIndicator) {
                activeIndicator.innerHTML = '<div style="width: 20px; height: 20px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; border-radius: 50%; background: #030712;"></div></div>';
            }
        };

        card.addEventListener('click', selectAction);
        card.addEventListener('touchend', selectAction);
    });

    if (platformNextBtn) {
        platformNextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentStep = 2;
            updateStepView();
            if (usernameInput) usernameInput.focus();
        });
    }

    if (usernameNextBtn) {
        usernameNextBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim().toLowerCase().replace('@', '');
            if (!username || username.length < 3) {
                showCustomAlert("Username must be at least 3 characters long.");
                return;
            }

            try {
                const dbRef = ref(rtdb);
                const snapshot = await get(child(dbRef, `usernames/${username}`));
                if (snapshot.exists()) {
                    showCustomAlert("This username is already taken. Try another one.");
                    return;
                }
                userData.username = username;
                currentStep = 3;
                updateStepView();
            } catch (error) {
                showCustomAlert("Error: " + error.message);
            }
        });
    }

    const triggerGallery = (e) => {
        if (e) e.preventDefault();
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
                        if (completeBtn) completeBtn.innerText = "Create Account 🚀";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const finishSetup = async (e) => {
        if (e) e.preventDefault();
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
            showCustomAlert("Setup failed: " + error.message);
        }
    };

    if (completeBtn) completeBtn.addEventListener('click', finishSetup);
    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.preventDefault();
            userData.avatarBase64 = 'Default-User.png';
            finishSetup();
        });
    }
});
