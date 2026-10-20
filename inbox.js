import { auth, rtdb } from './firebase-config.js';
import { ref, get, child, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Custom Alert Function
function showCustomAlert(message) {
    const alertModal = document.getElementById('customAlertModal');
    const alertText = document.getElementById('customAlertText');
    const okBtn = document.getElementById('customAlertOkBtn');
    
    if (alertText) alertText.innerText = message;
    if (alertModal) alertModal.classList.remove('hidden');

    if (okBtn) {
        okBtn.onclick = () => {
            if (alertModal) alertModal.classList.add('hidden');
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const uid = localStorage.getItem('ngl_uid');
    if (!uid) {
        window.location.replace("login.html");
        return;
    }

    const messagesContainer = document.getElementById('messagesContainer');
    const emptyState = document.getElementById('emptyState');
    const toHomeBtn = document.getElementById('toHomeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
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

    // Fetch Messages from Realtime Database
    try {
        const dbRef = ref(rtdb);
        const snapshot = await get(child(dbRef, `messages/${uid}`));
        
        if (snapshot.exists()) {
            const messagesData = snapshot.val();
            messagesContainer.innerHTML = '';
            
            // Convert to array and sort newest first
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

                // Delete Button Logic
                const deleteBtn = card.querySelector('.btn-delete');
                deleteBtn.addEventListener('click', async () => {
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

                // Share Reply Button Logic
                const replyBtn = card.querySelector('.btn-reply');
                replyBtn.addEventListener('click', () => {
                    const text = decodeURIComponent(replyBtn.getAttribute('data-text'));
                    if (navigator.share) {
                        navigator.share({
                            title: 'Nostelgic NGL Reply',
                            text: `"${text}" - answered on my NGL!`,
                        }).catch(() => {});
                    } else {
                        navigator.clipboard.writeText(text);
                        showCustomAlert("Message copied to share on your story! 🚀");
                    }
                });

                messagesContainer.appendChild(card);
            });
        } else {
            messagesContainer.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error loading messages:", error);
        messagesContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    }

    // Navigation Buttons
    if (toHomeBtn) {
        toHomeBtn.addEventListener('click', () => {
            window.location.replace("index.html");
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.replace("settings.html");
        });
    }
});

// Helper to prevent XSS injection
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
