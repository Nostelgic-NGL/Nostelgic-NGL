<!-- Main Profile Card -->
<div class="profile-card">
    <div class="avatar-container">
        <img id="userAvatarImg" src="default-avatar.png" alt="Avatar">
        <button id="changeAvatarBtn" class="camera-btn"><i class="fas fa-camera"></i></button>
    </div>
    <span id="platformLabel" class="username-label">@user</span>
    
    <div class="link-box">
        <span id="profileLinkText">https://...</span>
    </div>

    <!-- Full Width Copy Link Button & Share Button -->
    <div class="action-buttons-row" style="display: flex; gap: 10px; width: 100%;">
        <button id="copyLinkBtn" class="btn-primary" style="flex: 2;"><i class="fas fa-copy"></i> Copy Link</button>
        <button id="shareStoryBtn" class="btn-gradient" style="flex: 1;"><i class="fas fa-share-alt"></i> Share</button>
    </div>
</div>

<!-- Niche Ek Aur Naya Matching Card -->
<div class="extra-promo-card" style="background: var(--card-bg, #1e293b); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; margin-top: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
    <h3 style="color: var(--text-color, #fff); font-size: 18px; margin-bottom: 8px; font-weight: 600;">Share on Instagram Story 🚀</h3>
    <p style="color: var(--subtext-color, #94a3b8); font-size: 14px; margin-bottom: 15px;">Get more anonymous messages by sharing your link directly on your story!</p>
    <button id="extraShareStoryBtn" class="btn-gradient" style="width: 100%; padding: 12px; border-radius: 12px; border: none; color: #fff; font-weight: 600; background: linear-gradient(135deg, #ec4899, #8b5cf6); cursor: pointer;"><i class="fab fa-instagram"></i> Share Now</button>
</div>
