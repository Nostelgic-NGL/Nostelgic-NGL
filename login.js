import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: 'instagram',
    username: '',
    avatarBase64: 'Default-User.png'
};

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
    
    const platformCards = document.querySelectorAll('.platform-card-ngl');
    const platformNextBtn = document.getElementById('platformNextBtn');
    
    const usernameInput = document.getElementById('usernameInput');
    const usernameErrorText = document.getElementById('usernameErrorText');
    const usernameNextBtn = document.getElementById('usernameNextBtn');

    const avatarInput = document.getElementById('avatarInput');
    const selectPhotoBtn = document.getElementById('selectPhotoBtn');
    const avatarContainer = document.getElementById('avatarContainer');
    const avatarPreview = document.getElementById('avatarPreview');
    const createAccountBtn = document.getElementById('createAccountBtn');

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

    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (usernameErrorText) usernameErrorText.classList.add('hidden');
        });
    }

    // From Step 2 to Step 3 (Username Validation check before moving to photo upload)
    if (usernameNextBtn) {
        usernameNextBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim().toLowerCase().replace('@', '');
            
            if (usernameErrorText) usernameErrorText.classList.add('hidden');

            if (!username || username.length < 3) {
                if (usernameErrorText) {
                    usernameErrorText.innerText = "Username must be at least 3 characters long.";
                    usernameErrorText.classList.remove('hidden');
                }
                return;
            }

            try {
                const dbRef = ref(rtdb);
                const snapshot = await get(child(dbRef, `usernames/${username}`));
                if (snapshot.exists()) {
                    if (usernameErrorText) {
                        usernameErrorText.innerText = "This username is not available for use. Please try a different one.";
                        usernameErrorText.classList.remove('hidden');
                    }
                    return;
                }
                userData.username = username;
                
                // Move to Step 3: Avatar Upload
                currentStep = 3;
                updateStepView();

            } catch (error) {
                if (usernameErrorText) {
                    usernameErrorText.innerText = "Error: " + error.message;
                    usernameErrorText.classList.remove('hidden');
                }
            }
        });
    }

    // Avatar Selection & Compression Handler
    const handlePhotoSelect = () => {
        if (avatarInput) avatarInput.click();
    };

    if (selectPhotoBtn) selectPhotoBtn.addEventListener('click', handlePhotoSelect);
    if (avatarContainer) avatarContainer.addEventListener('click', handlePhotoSelect);

    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 200; // Resize to max 200px for database optimization
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        userData.avatarBase64 = compressedDataUrl;
                        if (avatarPreview) avatarPreview.src = compressedDataUrl;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Step 3: Final Account Creation & Firebase Write
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) loadingOverlay.classList.remove('hidden');

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
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                alert("Account Creation Error: " + error.message);
            }
        });
    }
});
