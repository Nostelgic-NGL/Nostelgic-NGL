import { auth, rtdb } from './firebase-config.js';
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let userData = {
    platform: 'instagram',
    username: '',
    avatarBase64: 'Default-User.png'
};

let isChecking = false;
let checkTimer = null;
let isUsernameAvailable = false;

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
    const usernameStatusText = document.getElementById('usernameStatusText');
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

    // Real-time automatic checking with character validation & 20 character limit
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const rawValue = usernameInput.value;
            const username = rawValue.toLowerCase().replace('@', '');
            
            isUsernameAvailable = false;
            if (usernameNextBtn) {
                usernameNextBtn.style.opacity = "0.5";
                usernameNextBtn.style.cursor = "not-allowed";
                usernameNextBtn.setAttribute('disabled', 'true');
            }

            // Check if username contains only small letters, numbers, and underscore
            const isValidFormat = /^[a-z0-9_]*$/.test(username);

            if (!isValidFormat) {
                if (usernameStatusText) {
                    usernameStatusText.innerHTML = `<span style="color: #ef4444;">Only small letters, numbers, and underscore (_) are allowed.</span>`;
                    usernameStatusText.classList.remove('hidden');
                }
                return;
            }

            if (!username || username.length < 3) {
                if (usernameStatusText) {
                    if (username.length > 0) {
                        usernameStatusText.innerHTML = `<span style="color: #ef4444;">Username must be at least 3 characters long.</span>`;
                        usernameStatusText.classList.remove('hidden');
                    } else {
                        usernameStatusText.classList.add('hidden');
                    }
                }
                return;
            }

            if (username.length > 20) {
                if (usernameStatusText) {
                    usernameStatusText.innerHTML = `<span style="color: #ef4444;">Username cannot exceed 20 characters.</span>`;
                    usernameStatusText.classList.remove('hidden');
                }
                return;
            }

            // Show "Checking username, please wait..." with spinner
            if (usernameStatusText) {
                usernameStatusText.innerHTML = `<div style="display: inline-flex; align-items: center; gap: 8px; color: #94a3b8;"><div style="width: 14px; height: 14px; border: 2px solid #94a3b8; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div> Checking username, please wait...</div>`;
                usernameStatusText.classList.remove('hidden');
            }

            clearTimeout(checkTimer);
            checkTimer = setTimeout(async () => {
                try {
                    const dbRef = ref(rtdb);
                    const snapshot = await get(child(dbRef, `usernames/${username}`));
                    
                    const currentTyped = usernameInput.value.toLowerCase().replace('@', '');
                    if (currentTyped !== username) return;

                    if (snapshot.exists()) {
                        if (usernameStatusText) {
                            usernameStatusText.innerHTML = `<span style="color: #ef4444;">This username is not available for use. Please try a different one.</span>`;
                            usernameStatusText.classList.remove('hidden');
                        }
                        isUsernameAvailable = false;
                    } else {
                        if (usernameStatusText) {
                            usernameStatusText.innerHTML = `<span style="color: #22c55e; font-weight: 600;"><i class="fas fa-check-circle"></i> Username is available!</span>`;
                            usernameStatusText.classList.remove('hidden');
                        }
                        isUsernameAvailable = true;
                        userData.username = username;

                        if (usernameNextBtn) {
                            usernameNextBtn.style.opacity = "1";
                            usernameNextBtn.style.cursor = "pointer";
                            usernameNextBtn.removeAttribute('disabled');
                        }
                    }
                } catch (error) {
                    if (usernameStatusText) {
                        usernameStatusText.innerHTML = `<span style="color: #ef4444;">Connection error. Please try again.</span>`;
                        usernameStatusText.classList.remove('hidden');
                    }
                }
            }, 500);
        });
    }

    if (usernameNextBtn) {
        usernameNextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isUsernameAvailable) return;
            
            currentStep = 3;
            updateStepView();
        });
    }

    // Avatar Selection & High Quality Handler
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
                        
                        const size = 500;
                        canvas.width = size;
                        canvas.height = size;

                        let startX = 0, startY = 0, drawSize = 0;
                        if (img.width > img.height) {
                            drawSize = img.height;
                            startX = (img.width - img.height) / 2;
                            startY = 0;
                        } else {
                            drawSize = img.width;
                            startX = 0;
                            startY = (img.height - img.width) / 2;
                        }

                        ctx.drawImage(img, startX, startY, drawSize, drawSize, 0, 0, size, size);

                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
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
            if (isChecking) return;
            isChecking = true;

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
                isChecking = false;
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                alert("Account Creation Error: " + error.message);
            }
        });
    }
});
