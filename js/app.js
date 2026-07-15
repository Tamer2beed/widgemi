function sanitizeText(str) { return String(str).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showNotification(msg, type='join') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const el = document.createElement('div');
    el.className = `notification-${type}`;
    el.textContent = msg;
    area.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

async function loadComponent(id, url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} عند تحميل ${url}`);
        const el = document.getElementById(id);
        if (!el) throw new Error(`العنصر ${id} غير موجود`);
        el.innerHTML = await res.text();
        return true;
    } catch (err) {
        console.error(`فشل تحميل المكوّن (${id} <- ${url}):`, err);
        return false;
    }
}

function isSingleEmoji(text) {
    const trimmed = text.trim();
    return /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u.test(trimmed);
}

function formatMessageText(text) {
    const trimmed = text.trim();
    if (isSingleEmoji(trimmed)) {
        return `<span class="text-4xl leading-none inline-block">${sanitizeText(trimmed)}</span>`;
    }
    return sanitizeText(text);
}

function applyChatTheme(theme) {
    const cc = document.getElementById('chatContainer');
    if (!cc) return;
    cc.classList.remove('chat-bg');
    cc.style.background = '';
    if (theme === 'dark') { cc.style.background = '#1a1a2e'; }
    else if (theme === 'blue') { cc.style.background = '#dbeafe'; }
    else { cc.classList.add('chat-bg'); theme = 'dots'; }
    localStorage.setItem('chatTheme', theme);
}

const ADMIN_SUBPAGES = [
    'adminAppearanceSubMenu', 'adminWelcomeSubMenu', 'adminLoginLogsSubMenu',
    'adminLogoutLogsSubMenu', 'adminBannedSubMenu', 'adminManageAdminsSubMenu',
    'adminActivityLogSubMenu'
];

function showAdminSubpage(id) {
    document.getElementById('adminMainPage')?.classList.add('hidden');
    ADMIN_SUBPAGES.forEach(p => document.getElementById(p)?.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
}

function showAdminMainPage() {
    ADMIN_SUBPAGES.forEach(p => document.getElementById(p)?.classList.add('hidden'));
    document.getElementById('adminMainPage')?.classList.remove('hidden');
}

async function initEventHandlers() {
    try {
        const settingsModal = document.getElementById('settingsModal');
        const adminModal = document.getElementById('adminModal');
        const statusModal = document.getElementById('statusModal');
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        const emojiPicker = document.getElementById('emojiPicker');
        const moreOptMenu = document.getElementById('moreOptionsMenu');
        const sideMenu = document.getElementById('sideMenu');

        applyUserInterfaceSettings();
        initSidebarTouchEvents();
        applyChatTheme(localStorage.getItem('chatTheme') || 'dots');
        if (typeof initLoginLogs === 'function') initLoginLogs();
        if (typeof initAdminAccounts === 'function') await initAdminAccounts();
        if (typeof initLoginScreen === 'function') initLoginScreen();
        if (typeof renderRoomsScreen === 'function') renderRoomsScreen();

        const savedPM = localStorage.getItem('userPMPrivacy') || 'members_only';
        const pmRadio = document.querySelector(`input[name="pmPrivacyOption"][value="${savedPM}"]`);
        if (pmRadio) pmRadio.checked = true;

        document.body.addEventListener('click', async (e) => {
            try {
                const target = e.target;

                if (target.closest('#menuBtn')) {
                    const opening = !sideMenu?.classList.contains('active');
                    if (opening) {
                        const onlinePanel = document.getElementById('onlineUsersPanel');
                        if (onlinePanel?.classList.contains('active')) {
                            onlinePanel.classList.remove('active');
                            onlinePanel.style.transform = 'translateX(-100%)';
                            if (typeof isPanelOpen !== 'undefined') isPanelOpen = false;
                        }
                    }
                    sideMenu?.classList.toggle('active');
                    return;
                }
                if (sideMenu && !target.closest('#sideMenu') && !target.closest('#menuBtn')) sideMenu.classList.remove('active');

                if (target.closest('#onlineUsersToggleBtn')) { toggleOnlinePanel(); return; }

                const userCard = target.closest('.user-card-item');
                if (userCard && userCard.dataset.userId) { openMemberContextMenu(userCard.dataset.userId); return; }

                if (target.closest('#closeMemberContextBtn')) { document.getElementById('memberContextModal')?.classList.add('hidden'); return; }
                if (target.id === 'memberContextModal') { document.getElementById('memberContextModal').classList.add('hidden'); return; }
                if (target.closest('#memberContextPrivateChatBtn')) { startPrivateChatPlaceholder(); return; }
                if (target.closest('#memberContextProfileBtn')) { openMemberProfile(contextMenuTargetUserId); return; }
                if (target.closest('#memberContextIgnoreBtn')) { toggleIgnoreMember(); return; }
                if (target.closest('#memberContextReportBtn')) { reportMember(); return; }
                if (target.closest('#closeMemberProfileBtn')) { document.getElementById('memberProfileModal')?.classList.add('hidden'); return; }
                if (target.id === 'memberProfileModal') { document.getElementById('memberProfileModal').classList.add('hidden'); return; }
                if (typeof isPanelOpen !== 'undefined' && isPanelOpen && !target.closest('#onlineUsersPanel')) { toggleOnlinePanel(); return; }

                if (target.closest('#menuStatus')) { statusModal?.classList.remove('hidden'); sideMenu?.classList.remove('active'); return; }
                if (target.closest('#menuSettings')) {
                    settingsModal?.classList.remove('hidden');
                    document.getElementById('settingsMainMenu')?.classList.remove('hidden');
                    document.getElementById('fontSettingsSubMenu')?.classList.add('hidden');
                    document.getElementById('pmSettingsSubMenu')?.classList.add('hidden');
                    sideMenu?.classList.remove('active');
                    return;
                }
                if (target.closest('#menuAddFav')) { alert('تمت الإضافة إلى المفضلة'); sideMenu?.classList.remove('active'); return; }
                if (target.closest('#menuClearText')) { if (chatInput) chatInput.value = ''; sideMenu?.classList.remove('active'); return; }
                if (target.closest('#menuReport')) { alert('تم إرسال البلاغ'); sideMenu?.classList.remove('active'); return; }
                if (target.closest('#menuAdminPanel')) {
                    const authorized = typeof ME_USER !== 'undefined' && ME_USER.hasAccount && ME_USER.role !== 'member';
                    if (!authorized) {
                        if (typeof showNotification === 'function') showNotification('🔒 لوحة التحكم متاحة فقط للمشرفين المسجَّلين (Admin فأعلى)', 'leave');
                        sideMenu?.classList.remove('active');
                        return;
                    }
                    showAdminMainPage();
                    const masterOnly = typeof canAccessMasterOnlyFeatures === 'function' && canAccessMasterOnlyFeatures();
                    const superAdminOnly = typeof canManageAdmins === 'function' && canManageAdmins();
                    ['goToWelcomeBtn', 'goToAppearanceBtn', 'goToBannedBtn', 'goToActivityLogBtn'].forEach(id => {
                        document.getElementById(id)?.classList.toggle('hidden', !masterOnly);
                    });
                    ['goToLoginLogsBtn', 'goToLogoutLogsBtn', 'goToAdminsBtn'].forEach(id => {
                        document.getElementById(id)?.classList.toggle('hidden', !superAdminOnly);
                    });
                    adminModal?.classList.remove('hidden');
                    sideMenu?.classList.remove('active');
                    return;
                }
                

                if (target.closest('#closeStatusModalBtn')) { statusModal?.classList.add('hidden'); return; }
                if (target.id === 'statusModal') { statusModal.classList.add('hidden'); return; }
                const statusBtn = target.closest('.status-option-item');
                if (statusBtn) {
                    const newStatus = statusBtn.dataset.status;
                    const newColor = statusBtn.dataset.color || '#22c55e';
                    ME_USER.status = newStatus;
                    ME_USER.statusColor = newColor;
                    localStorage.setItem('myStatus', newStatus);
                    localStorage.setItem('myStatusColor', newColor);
                    if (typeof renderOnlineUsers === 'function') renderOnlineUsers();
                    statusModal?.classList.add('hidden');
                    showNotification(`✅ تم تغيير حالتك إلى: ${newStatus}`, 'join');
                    return;
                }

                if (target.closest('#closeAdminBtn')) { adminModal?.classList.add('hidden'); return; }
                if (target.closest('#goToAppearanceBtn')) { if (typeof canAccessMasterOnlyFeatures === 'function' && !canAccessMasterOnlyFeatures()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Master فما فوق', 'leave'); return; } showAdminSubpage('adminAppearanceSubMenu'); return; }
                if (target.closest('#backFromAppearanceBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToWelcomeBtn')) { if (typeof canAccessMasterOnlyFeatures === 'function' && !canAccessMasterOnlyFeatures()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Master فما فوق', 'leave'); return; } showAdminSubpage('adminWelcomeSubMenu'); return; }
                if (target.closest('#backFromWelcomeBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToLoginLogsBtn')) { if (typeof canManageAdmins === 'function' && !canManageAdmins()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Super Admin فما فوق', 'leave'); return; } resetLoginLogsFilter(); showAdminSubpage('adminLoginLogsSubMenu'); return; }
                if (target.closest('#backFromLoginLogsBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToLogoutLogsBtn')) { if (typeof canManageAdmins === 'function' && !canManageAdmins()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Super Admin فما فوق', 'leave'); return; } showAdminSubpage('adminLogoutLogsSubMenu'); if (typeof renderLogoutLogs === 'function') renderLogoutLogs(); return; }
                if (target.closest('#backFromLogoutLogsBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToBannedBtn')) { if (typeof canAccessMasterOnlyFeatures === 'function' && !canAccessMasterOnlyFeatures()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Master فما فوق', 'leave'); return; } showAdminSubpage('adminBannedSubMenu'); if (typeof renderBannedList === 'function') renderBannedList(); return; }
                if (target.closest('#backFromBannedBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToAdminsBtn')) {
                    if (typeof canManageAdmins === 'function' && !canManageAdmins()) {
                        if (typeof showNotification === 'function') showNotification('🔒 إدارة المشرفين متاحة فقط لـ Super Admin فما فوق', 'leave');
                        return;
                    }
                    showAdminSubpage('adminManageAdminsSubMenu');
                    if (typeof renderAdminAccounts === 'function') renderAdminAccounts();
                    return;
                }
                if (target.closest('#backFromAdminsBtn')) { showAdminMainPage(); return; }
                if (target.closest('#goToActivityLogBtn')) { if (typeof canAccessMasterOnlyFeatures === 'function' && !canAccessMasterOnlyFeatures()) { if (typeof showNotification === 'function') showNotification('🔒 متاحة فقط لـ Master فما فوق', 'leave'); return; } showAdminSubpage('adminActivityLogSubMenu'); if (typeof renderActivityLog === 'function') renderActivityLog(); return; }
                if (target.closest('#backFromActivityLogBtn')) { showAdminMainPage(); return; }

                if (target.closest('#logsOnlineCard')) { filterLoginLogsOnline(); return; }
                if (target.closest('#loginShowAllBtn')) { resetLoginLogsFilter(); return; }

                if (target.closest('#bannedRepeatCard')) { openRepeatBannedModal(); return; }
                if (target.closest('#closeRepeatBannedBtn')) { document.getElementById('repeatBannedModal')?.classList.add('hidden'); return; }
                if (target.id === 'repeatBannedModal') { document.getElementById('repeatBannedModal').classList.add('hidden'); return; }

                const roleOption = target.closest('.promote-role-option');
                if (roleOption) {
                    document.querySelectorAll('.promote-role-option').forEach(el => el.classList.remove('selected'));
                    roleOption.classList.add('selected');
                    promoteSelectedRole = roleOption.dataset.role;
                    return;
                }
                if (target.closest('#cancelPromoteBtn')) { document.getElementById('promoteModal')?.classList.add('hidden'); return; }
                if (target.closest('#confirmPromoteBtn')) { confirmPromote(); return; }
                if (target.id === 'promoteModal') { document.getElementById('promoteModal').classList.add('hidden'); return; }

                const kickBtn = target.closest('.log-kick-btn');
                if (kickBtn) {
                    const logId = kickBtn.dataset.logid;
                    openConfirmModal('طرد العضو', 'هل تريد طرد هذا العضو من الغرفة الآن؟', 'طرد', 'bg-purple-600', () => kickUserFromLog(logId));
                    return;
                }
                const banPermBtn = target.closest('.log-ban-perm-btn');
                if (banPermBtn) {
                    const logId = banPermBtn.dataset.logid;
                    openConfirmModal('حظر دائم', 'سيتم حظر هذا العضو نهائياً من الغرفة. هل أنت متأكد؟', 'تأكيد الحظر', 'bg-red-600', () => banUserFromLog(logId, 'perm'));
                    return;
                }
                if (target.closest('#cancelConfirmModalBtn')) { document.getElementById('confirmActionModal')?.classList.add('hidden'); pendingConfirmAction = null; return; }
                if (target.closest('#confirmModalConfirmBtn')) {
                    if (typeof pendingConfirmAction === 'function') pendingConfirmAction();
                    document.getElementById('confirmActionModal')?.classList.add('hidden');
                    pendingConfirmAction = null;
                    return;
                }
                if (target.id === 'confirmActionModal') { document.getElementById('confirmActionModal').classList.add('hidden'); pendingConfirmAction = null; return; }

                const banTempBtn = target.closest('.log-ban-temp-btn');
                if (banTempBtn) { openTempBanModal(banTempBtn.dataset.logid); return; }
                if (target.closest('#cancelTempBanBtn')) { document.getElementById('tempBanModal')?.classList.add('hidden'); return; }
                if (target.closest('#confirmTempBanBtn')) { confirmTempBan(); return; }
                if (target.id === 'tempBanModal') { document.getElementById('tempBanModal').classList.add('hidden'); return; }

                const banUnbanBtn = target.closest('.ban-unban-btn');
                if (banUnbanBtn) { unbanUserFromLog(banUnbanBtn.dataset.logid); return; }
                const banExtendBtn = target.closest('.ban-extend-btn');
                if (banExtendBtn) { extendBanFromList(banExtendBtn.dataset.logid); return; }
                const unbanBtn = target.closest('.log-unban-btn');
                if (unbanBtn) { unbanUserFromLog(unbanBtn.dataset.logid); return; }

                /* شاشة تسجيل الدخول */
                const loginTabBtn = target.closest('.login-tab-btn');
                if (loginTabBtn) { switchLoginTab(loginTabBtn.dataset.tab); return; }
                if (target.closest('#openAvatarPickerBtn')) { renderAvatarGrid(); document.getElementById('avatarPickerModal')?.classList.remove('hidden'); return; }
                if (target.closest('#closeAvatarPickerBtn')) { document.getElementById('avatarPickerModal')?.classList.add('hidden'); return; }
                if (target.id === 'avatarPickerModal') { document.getElementById('avatarPickerModal').classList.add('hidden'); return; }
                const avatarOptBtn = target.closest('.avatar-option-btn');
                if (avatarOptBtn) { selectLoginAvatar(avatarOptBtn.dataset.avatarSrc); document.getElementById('avatarPickerModal')?.classList.add('hidden'); return; }
                if (target.closest('#loginCancelBtn')) { const ui = document.getElementById('loginUsernameInput'); if (ui) ui.value = ''; return; }
                if (target.closest('#loginSubmitBtn')) { await attemptLogin(); return; }

                if (target.closest('#submitForcedChangeBtn')) { await submitForcedPasswordChange(); return; }

                if (target.closest('#submitForcedSingleChangeBtn')) { await submitForcedSinglePasswordChange(); return; }

                if (target.closest('#menuLogout')) { document.getElementById('sideMenu')?.classList.remove('active'); if (typeof openRoomsScreen === 'function') openRoomsScreen(); return; }

                const countryToggleBtn = target.closest('.country-toggle-btn');
                if (countryToggleBtn) { toggleCountry(countryToggleBtn.dataset.country); return; }
                const roomSelectBtn = target.closest('.room-select-btn');
                if (roomSelectBtn) { selectRoom(roomSelectBtn.dataset.room); return; }

                /* تغيير كلمة المرور */
                const changePwBtn = target.closest('.admin-acc-changepw-btn');
                if (changePwBtn) { openChangePasswordModal(changePwBtn.dataset.id); return; }
                if (target.closest('#cancelChangePasswordBtn')) { document.getElementById('changePasswordModal')?.classList.add('hidden'); return; }
                if (target.closest('#confirmChangePasswordBtn')) { await submitChangePassword(); return; }
                if (target.id === 'changePasswordModal') { document.getElementById('changePasswordModal').classList.add('hidden'); return; }

                /* إدارة المشرفين */
                if (target.closest('#addAdminBtn')) { openAddAdminModal(); return; }
                if (target.closest('#cancelAddAdminBtn')) { document.getElementById('addAdminModal')?.classList.add('hidden'); return; }
                if (target.id === 'addAdminModal') { document.getElementById('addAdminModal').classList.add('hidden'); return; }
                const newAdminRoleOpt = target.closest('.new-admin-role-option');
                if (newAdminRoleOpt) {
                    document.querySelectorAll('.new-admin-role-option').forEach(el => el.classList.remove('selected'));
                    newAdminRoleOpt.classList.add('selected');
                    newAdminSelectedRole = newAdminRoleOpt.dataset.role;
                    if (typeof updateAddAdminPasswordFields === 'function') updateAddAdminPasswordFields();
                    return;
                }
                if (target.closest('#submitAddAdminBtn')) { await submitAddAdmin(); return; }

                const masterColorOpt = target.closest('.master-color-option');
                if (masterColorOpt) {
                    document.querySelectorAll('.master-color-option').forEach(el => el.classList.remove('selected'));
                    masterColorOpt.classList.add('selected');
                    masterColorSelected = masterColorOpt.dataset.color;
                    return;
                }
                if (target.closest('#cancelMasterColorBtn')) { document.getElementById('masterColorModal')?.classList.add('hidden'); pendingNewAdminData = null; return; }
                if (target.closest('#confirmMasterColorBtn')) { confirmMasterColor(); return; }
                if (target.id === 'masterColorModal') { document.getElementById('masterColorModal').classList.add('hidden'); return; }

                const admPromoteBtn = target.closest('.admin-acc-promote-btn');
                if (admPromoteBtn) { promoteAdminAccount(admPromoteBtn.dataset.id); return; }
                const admDemoteBtn = target.closest('.admin-acc-demote-btn');
                if (admDemoteBtn) {
                    openConfirmModal('تخفيض المشرف', 'هل تريد تخفيض رتبة هذا المشرف؟', 'تخفيض', 'bg-amber-600', () => demoteAdminAccount(admDemoteBtn.dataset.id));
                    return;
                }
                const admDeleteBtn = target.closest('.admin-acc-delete-btn');
                if (admDeleteBtn) {
                    openConfirmModal('حذف المشرف', 'سيتم حذف هذا المشرف نهائياً من القائمة.', 'حذف', 'bg-red-600', () => deleteAdminAccount(admDeleteBtn.dataset.id));
                    return;
                }

                if (target.closest('#clearActivityLogBtn')) {
                    openConfirmModal('مسح سجل التغييرات', 'سيتم مسح كل سجل الإجراءات بالكامل. لا يمكن التراجع.', 'مسح الكل', 'bg-red-600', () => { if (typeof clearActivityLog === 'function') clearActivityLog(); });
                    return;
                }
                if (target.closest('#clearLoginLogsBtn')) {
                    openConfirmModal('مسح سجل الدخول', 'سيتم مسح كل سجلات الدخول بالكامل. لا يمكن التراجع.', 'مسح الكل', 'bg-red-600', clearAllLoginLogs);
                    return;
                }
                if (target.closest('#clearLogoutLogsBtn')) {
                    openConfirmModal('مسح سجل الخروج', 'سيتم مسح كل سجلات الخروج بالكامل. لا يمكن التراجع.', 'مسح الكل', 'bg-red-600', clearAllLogoutLogs);
                    return;
                }

                const themeBtn = target.closest('.chat-theme-btn');
                if (themeBtn) { applyChatTheme(themeBtn.dataset.theme); showNotification('🎨 تم تطبيق المظهر الجديد', 'join'); return; }
                if (target.closest('#adminClearAllBtn')) {
                    openConfirmModal('مسح كل الرسائل', 'سيتم مسح كل رسائل المحادثة الحالية.', 'مسح', 'bg-red-600', () => {
                        const ml = document.getElementById('messagesList'); if (ml) ml.innerHTML = '';
                    });
                    return;
                }

                if (target.closest('#closeSettingsBtn')) { settingsModal?.classList.add('hidden'); return; }
                if (target.closest('#goToFontSettingsBtn')) { document.getElementById('settingsMainMenu')?.classList.add('hidden'); document.getElementById('fontSettingsSubMenu')?.classList.remove('hidden'); return; }
                if (target.closest('#backToMainMenuBtn')) { document.getElementById('fontSettingsSubMenu')?.classList.add('hidden'); document.getElementById('settingsMainMenu')?.classList.remove('hidden'); return; }
                if (target.closest('#goToPMSettingsBtn')) { document.getElementById('settingsMainMenu')?.classList.add('hidden'); document.getElementById('pmSettingsSubMenu')?.classList.remove('hidden'); return; }
                if (target.closest('#backToMainMenuFromPMBtn')) { document.getElementById('pmSettingsSubMenu')?.classList.add('hidden'); document.getElementById('settingsMainMenu')?.classList.remove('hidden'); return; }
                if (target.closest('#saveSettingsBtn')) {
                    localStorage.setItem('userFontSize', globalFontSize);
                    localStorage.setItem('userFontColor', globalFontColor);
                    localStorage.setItem('userFontWeight', globalFontWeight);
                    applyUserInterfaceSettings();
                    settingsModal?.classList.add('hidden');
                    return;
                }
                if (target.closest('#savePMSettingsBtn')) {
                    const sel = document.querySelector('input[name="pmPrivacyOption"]:checked');
                    if (sel) { localStorage.setItem('userPMPrivacy', sel.value); globalPMPrivacy = sel.value; }
                    settingsModal?.classList.add('hidden');
                    return;
                }
                if (target.closest('#moreOptionsBtn')) { moreOptMenu?.classList.toggle('show'); return; }
                if (target.closest('#clearChatBtn')) { const ml = document.getElementById('messagesList'); if (ml) ml.innerHTML = ''; moreOptMenu?.classList.remove('show'); return; }
                if (target.closest('#sendImageBtn')) { alert('الميزة قيد التطوير'); moreOptMenu?.classList.remove('show'); return; }
                if (moreOptMenu && !target.closest('#moreOptionsMenu') && !target.closest('#moreOptionsBtn')) moreOptMenu.classList.remove('show');
                if (target.closest('#emojiBtn')) { emojiPicker?.classList.toggle('show'); return; }
                if (target.closest('.emoji-btn')) { if (chatInput) { chatInput.value += target.textContent; chatInput.focus(); } emojiPicker?.classList.remove('show'); return; }
                if (emojiPicker && !target.closest('#emojiPicker') && !target.closest('#emojiBtn')) emojiPicker.classList.remove('show');
            } catch (err) { console.error('خطأ أثناء معالجة نقرة:', err); }
        });

        const fontSizeRange = document.getElementById('fontSizeRange');
        const fontSizePreview = document.getElementById('fontSizePreview');
        const fontLivePreview = document.getElementById('fontLivePreview');
        const hueRange = document.getElementById('hueRange');
        const colorBtns = document.querySelectorAll('#colorPaletteContainer button');
        const fontWeightNormalBtn = document.getElementById('fontWeightNormalBtn');
        const fontWeightBoldBtn = document.getElementById('fontWeightBoldBtn');

        function updateWeightUI(w) {
            fontWeightBoldBtn?.classList.toggle('bg-purple-600', w === 'bold');
            fontWeightBoldBtn?.classList.toggle('shadow-md', w === 'bold');
            fontWeightNormalBtn?.classList.toggle('bg-purple-600', w === 'normal');
            fontWeightNormalBtn?.classList.toggle('shadow-md', w === 'normal');
            if (fontLivePreview) fontLivePreview.style.fontWeight = w;
        }
        fontWeightNormalBtn?.addEventListener('click', ()=>{ globalFontWeight='normal'; updateWeightUI('normal'); });
        fontWeightBoldBtn?.addEventListener('click', ()=>{ globalFontWeight='bold'; updateWeightUI('bold'); });
        if (fontSizeRange) {
            fontSizeRange.value = parseInt(globalFontSize);
            if (fontSizePreview) fontSizePreview.textContent = globalFontSize;
            fontSizeRange.addEventListener('input', (e)=>{ globalFontSize = e.target.value + 'px'; if (fontSizePreview) fontSizePreview.textContent = globalFontSize; if (fontLivePreview) fontLivePreview.style.fontSize = globalFontSize; });
        }
        hueRange?.addEventListener('input', (e)=>{ globalFontColor = `hsl(${e.target.value},100%,45%)`; if (fontLivePreview) fontLivePreview.style.color = globalFontColor; });
        colorBtns.forEach(b => b.addEventListener('click', ()=>{ globalFontColor = b.dataset.color; if (fontLivePreview) fontLivePreview.style.color = globalFontColor; }));

        function sendMessage() {
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;
            const now = new Date().toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' });
            const formatted = formatMessageText(text);
            const div = document.createElement('div');
            div.className = "flex items-start max-w-[85%] self-start gap-2";
            div.innerHTML = `<div class="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-md border-2 border-white shrink-0"><i class="fa-solid fa-user text-sm"></i></div><div class="bg-purple-100 rounded-2xl shadow-sm border border-purple-200 p-3 w-full"><div class="flex justify-between items-center mb-1 gap-4"><span class="font-bold text-purple-900 text-xs">أنا</span><span class="text-[9px] text-purple-400">${sanitizeText(now)}</span></div><div class="chat-msg-text leading-relaxed break-words" style="color:${sanitizeText(globalFontColor)};">${formatted}</div></div>`;
            document.getElementById('messagesList')?.appendChild(div);
            chatInput.value = '';
            applyUserInterfaceSettings();
            const cc = document.getElementById('chatContainer');
            if (cc) cc.scrollTop = cc.scrollHeight;
        }
        sendBtn?.addEventListener('click', sendMessage);
        chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

        startSimulation();

        if (typeof initSpeakerFeature === 'function') initSpeakerFeature();

    } catch (err) {
        console.error('فشل تهيئة أحداث الواجهة (initEventHandlers):', err);
    }
}

async function initApp() {
    await loadComponent('header-component', 'header.html');
    await loadComponent('footer-component', 'footer.html');
    setTimeout(() => { initEventHandlers(); }, 300);
}

initApp();
