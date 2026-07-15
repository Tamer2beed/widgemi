/* members.js — قائمة إجراءات الضغط على عضو: محادثة خاصة / ملف شخصي / تجاهل / تبليغ. */

let contextMenuTargetUserId = null;

function getIgnoredUserIds() { try { return JSON.parse(localStorage.getItem('ignoredUserIds') || '[]'); } catch (e) { return []; } }
function saveIgnoredUserIds(list) { try { localStorage.setItem('ignoredUserIds', JSON.stringify(list)); } catch (e) {} }
function isUserIgnored(userId) { return getIgnoredUserIds().map(String).includes(String(userId)); }

function openMemberContextMenu(userId) {
    if (String(userId) === 'me') return;
    const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === String(userId)) : null;
    if (!user) return;
    contextMenuTargetUserId = userId;
    const nameEl = document.getElementById('memberContextName');
    if (nameEl) nameEl.textContent = user.name;
    const ignoreBtn = document.getElementById('memberContextIgnoreBtn');
    if (ignoreBtn) ignoreBtn.innerHTML = isUserIgnored(userId)
        ? '<i class="fa-solid fa-volume-high ml-2"></i> إلغاء التجاهل'
        : '<i class="fa-solid fa-volume-xmark ml-2"></i> تجاهل';
    document.getElementById('memberContextModal')?.classList.remove('hidden');
}

function openMemberProfile(userId) {
    const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === String(userId)) : null;
    if (!user) return;
    document.getElementById('memberContextModal')?.classList.add('hidden');
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.src = user.avatar;
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = user.name;
    const statusEl = document.getElementById('profileStatus');
    if (statusEl) statusEl.textContent = user.status || '';
    const roleEl = document.getElementById('profileRoleBadge');
    if (roleEl) {
        const roleColor = (typeof getRoleDisplayColor === 'function') ? getRoleDisplayColor(user.role) : null;
        if (roleColor && user.isOwner && typeof ADMIN_ROLE_LABELS !== 'undefined') {
            roleEl.style.display = 'inline-block';
            roleEl.style.background = roleColor + '30';
            roleEl.style.color = roleColor;
            roleEl.textContent = ADMIN_ROLE_LABELS[user.role] || '';
        } else {
            roleEl.style.display = 'none';
        }
    }
    document.getElementById('memberProfileModal')?.classList.remove('hidden');
}

function toggleIgnoreMember() {
    if (!contextMenuTargetUserId) return;
    let list = getIgnoredUserIds();
    const idStr = String(contextMenuTargetUserId);
    const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === idStr) : null;
    if (list.map(String).includes(idStr)) {
        list = list.filter(x => String(x) !== idStr);
        if (typeof showNotification === 'function') showNotification(`🔊 تم إلغاء تجاهل ${user ? user.name : 'العضو'}`, 'join');
    } else {
        list.push(contextMenuTargetUserId);
        if (typeof showNotification === 'function') showNotification(`🔇 تم تجاهل ${user ? user.name : 'العضو'} - لن تظهر رسائله لك`, 'leave');
    }
    saveIgnoredUserIds(list);
    document.getElementById('memberContextModal')?.classList.add('hidden');
    if (typeof renderOnlineUsers === 'function') renderOnlineUsers();
}

function reportMember() {
    document.getElementById('memberContextModal')?.classList.add('hidden');
    if (typeof showNotification === 'function') showNotification('🚩 تم إرسال البلاغ، شكراً لك', 'leave');
}

function startPrivateChatPlaceholder() {
    document.getElementById('memberContextModal')?.classList.add('hidden');
    if (typeof showNotification === 'function') showNotification('💬 الرسائل الخاصة قيد التطوير حالياً', 'leave');
}
