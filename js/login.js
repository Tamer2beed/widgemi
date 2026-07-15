/* login.js — تسجيل الدخول: مطابقة الاسم بدون حساسية لحالة الأحرف، مع عرض الاسم كما كُتب بالضبط. */

const AVATAR_PLACEHOLDER_COLORS = ['#9333ea','#2563eb','#16a34a','#dc2626','#ea580c','#0891b2','#db2777','#4f46e5','#65a30d','#0d9488'];
function buildPlaceholderAvatar(color) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='50' cy='38' r='18' fill='white'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='28' fill='white'/%3E%3C/svg%3E`;
}
const AVATAR_OPTIONS = AVATAR_PLACEHOLDER_COLORS.map(buildPlaceholderAvatar);

let selectedLoginAvatar = AVATAR_OPTIONS[0];
let currentLoginTab = 'guest';
let loggedInAccountId = null;

function renderAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;
    grid.innerHTML = AVATAR_OPTIONS.map((src) => `
        <button class="avatar-option-btn rounded-full overflow-hidden border-2 w-14 h-14 ${src === selectedLoginAvatar ? 'border-purple-500' : 'border-transparent'}" data-avatar-src="${src}">
            <img src="${src}" class="w-full h-full object-cover">
        </button>
    `).join('');
}

function selectLoginAvatar(src) {
    selectedLoginAvatar = src;
    const preview = document.getElementById('loginAvatarPreview');
    if (preview) preview.src = src;
    renderAvatarGrid();
}

function handleCustomAvatarUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        selectLoginAvatar(e.target.result);
        document.getElementById('avatarPickerModal')?.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function updateRegisteredPasswordFields() {
    if (currentLoginTab !== 'registered') return;
    const name = (document.getElementById('loginUsernameInput')?.value || '').trim().toLowerCase();
    const namePwInput = document.getElementById('loginNamePasswordInput');
    if (name === 'master') namePwInput?.classList.remove('hidden');
    else namePwInput?.classList.add('hidden');
}

function switchLoginTab(tab) {
    currentLoginTab = tab;
    document.querySelectorAll('.login-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    const namePwInput = document.getElementById('loginNamePasswordInput');
    const roomPwInput = document.getElementById('loginRoomPasswordInput');
    if (tab === 'guest') {
        namePwInput?.classList.add('hidden');
        roomPwInput?.classList.add('hidden');
    } else if (tab === 'member') {
        namePwInput?.classList.add('hidden');
        roomPwInput?.classList.remove('hidden');
        if (roomPwInput) roomPwInput.placeholder = 'كلمة المرور';
    } else if (tab === 'registered') {
        roomPwInput?.classList.remove('hidden');
        if (roomPwInput) roomPwInput.placeholder = 'كلمة المرور';
        updateRegisteredPasswordFields();
    }
}

async function attemptLogin() {
    const name = document.getElementById('loginUsernameInput')?.value.trim();
    if (!name) { if (typeof showNotification === 'function') showNotification('يرجى إدخال اسم المستخدم', 'leave'); return; }

    if (currentLoginTab === 'guest') {
        if (name.toLowerCase() === 'master') { if (typeof showNotification === 'function') showNotification('⛔ هذا الاسم محجوز للنظام', 'leave'); return; }
        if (typeof findAccountByName === 'function' && findAccountByName(name)) { if (typeof showNotification === 'function') showNotification('⛔ هذا الاسم محجوز لعضو مسجّل — استخدم تبويب عضو أو مسجل', 'leave'); return; }
        finishLogin(name, 'member', false, null, false);
        return;
    }

    if (typeof adminAccounts === 'undefined' || typeof findAccountByName !== 'function') {
        if (typeof showNotification === 'function') showNotification('النظام غير جاهز بعد، حاول مجدداً', 'leave');
        return;
    }
    const account = findAccountByName(name);

    if (currentLoginTab === 'member') {
        const pw = document.getElementById('loginRoomPasswordInput')?.value.trim();
        if (!pw) { if (typeof showNotification === 'function') showNotification('يرجى إدخال كلمة المرور', 'leave'); return; }
        if (!account || account.role === 'super_master') { if (typeof showNotification === 'function') showNotification('اسم المستخدم غير موجود — إذا كان "master" استخدم تبويب مسجل', 'leave'); return; }
        const hash = await hashPassword(pw);
        if (hash !== account.passwordHash) { if (typeof showNotification === 'function') showNotification('كلمة المرور غير صحيحة', 'leave'); return; }
        if (account.mustChangePassword) { openForcedSingleChange(account, name); return; }
        finishLogin(name, account.role, account.role !== 'member', account.id, true);
        return;
    }

    if (currentLoginTab === 'registered') {
        if (name.toLowerCase() === 'master') {
            const namePw = document.getElementById('loginNamePasswordInput')?.value.trim();
            const roomPw = document.getElementById('loginRoomPasswordInput')?.value.trim();
            if (!namePw || !roomPw) { if (typeof showNotification === 'function') showNotification('يرجى إدخال كلمتي المرور', 'leave'); return; }
            if (!account || account.role !== 'super_master') { if (typeof showNotification === 'function') showNotification('بيانات الدخول غير صحيحة', 'leave'); return; }
            const nameHash = await hashPassword(namePw);
            const roomHash = await hashPassword(roomPw);
            if (nameHash !== account.namePasswordHash || roomHash !== account.roomPasswordHash) { if (typeof showNotification === 'function') showNotification('بيانات الدخول غير صحيحة', 'leave'); return; }
            if (account.mustChangePassword) {
                loggedInAccountId = account.id;
                document.getElementById('forcedChangeSubtitle').textContent = `مرحباً ${name} — يجب تعيين كلمتي مرور جديدتين ومختلفتين قبل المتابعة`;
                document.getElementById('forcedNewNamePassword').value = '';
                document.getElementById('forcedNewRoomPassword').value = '';
                window.__pendingLoginDisplayName = name;
                document.getElementById('forcedPasswordChangeModal')?.classList.remove('hidden');
                return;
            }
            finishLogin(name, account.role, true, account.id, true);
            return;
        }

        if (typeof showNotification === 'function') showNotification('تبويب "مسجل" مخصص فقط للاسم المحجوز master — استخدم تبويب "عضو" لبقية الحسابات', 'leave');
        return;
    }
}

function openForcedSingleChange(account, displayName) {
    loggedInAccountId = account.id;
    window.__pendingLoginDisplayName = displayName;
    document.getElementById('forcedSingleChangeSubtitle').textContent = `مرحباً ${displayName} — يجب تعيين كلمة مرور جديدة قبل المتابعة`;
    document.getElementById('forcedSingleNewPassword').value = '';
    document.getElementById('forcedSinglePasswordChangeModal')?.classList.remove('hidden');
}

async function submitForcedSinglePasswordChange() {
    const newPw = document.getElementById('forcedSingleNewPassword')?.value.trim();
    if (!newPw) { if (typeof showNotification === 'function') showNotification('يرجى إدخال كلمة مرور جديدة', 'leave'); return; }
    const account = adminAccounts.find(a => a.id === loggedInAccountId);
    if (!account) return;
    account.passwordHash = await hashPassword(newPw);
    account.mustChangePassword = false;
    saveAdminAccounts();
    document.getElementById('forcedSinglePasswordChangeModal')?.classList.add('hidden');
    const displayName = window.__pendingLoginDisplayName || account.name;
    finishLogin(displayName, account.role, account.role !== 'member', account.id, true);
    if (typeof showNotification === 'function') showNotification('✅ تم تحديث كلمة المرور بنجاح', 'join');
}

async function submitForcedPasswordChange() {
    const newNamePw = document.getElementById('forcedNewNamePassword')?.value.trim();
    const newRoomPw = document.getElementById('forcedNewRoomPassword')?.value.trim();
    if (!newNamePw || !newRoomPw) { if (typeof showNotification === 'function') showNotification('يرجى تعبئة الحقلين', 'leave'); return; }
    if (newNamePw === newRoomPw) { if (typeof showNotification === 'function') showNotification('يجب أن تختلف كلمتا المرور عن بعضهما', 'leave'); return; }
    const account = adminAccounts.find(a => a.id === loggedInAccountId);
    if (!account) return;
    account.namePasswordHash = await hashPassword(newNamePw);
    account.roomPasswordHash = await hashPassword(newRoomPw);
    account.mustChangePassword = false;
    saveAdminAccounts();
    document.getElementById('forcedPasswordChangeModal')?.classList.add('hidden');
    const displayName = window.__pendingLoginDisplayName || account.name;
    finishLogin(displayName, account.role, true, account.id, true);
    if (typeof showNotification === 'function') showNotification('✅ تم تحديث كلمتي المرور بنجاح', 'join');
}

function saveOrClearLoginData(name) {
    try {
        const remember = document.getElementById('rememberLoginCheckbox')?.checked;
        if (remember) {
            localStorage.setItem('savedLoginData', JSON.stringify({ tab: currentLoginTab, name, avatar: selectedLoginAvatar }));
        } else {
            localStorage.removeItem('savedLoginData');
        }
    } catch (e) {}
}

function loadSavedLoginData() {
    try {
        const s = localStorage.getItem('savedLoginData');
        if (!s) return;
        const data = JSON.parse(s);
        if (data.tab) switchLoginTab(data.tab);
        if (data.name) { const ui = document.getElementById('loginUsernameInput'); if (ui) ui.value = data.name; }
        if (data.avatar) selectLoginAvatar(data.avatar);
        const cb = document.getElementById('rememberLoginCheckbox');
        if (cb) cb.checked = true;
        updateRegisteredPasswordFields();
    } catch (e) {}
}

function finishLogin(name, role, isOwner, accountId, hasAccount) {
    saveOrClearLoginData(name);
    if (typeof ME_USER !== 'undefined') {
        ME_USER.name = name;
        ME_USER.avatar = selectedLoginAvatar;
        ME_USER.role = role;
        ME_USER.isOwner = !!isOwner;
        ME_USER.accountId = accountId || null;
        ME_USER.hasAccount = !!hasAccount;
    }
    document.getElementById('loginScreen')?.classList.add('hidden');
    if (typeof renderOnlineUsers === 'function') renderOnlineUsers();
    if (typeof showNotification === 'function') showNotification(`👋 أهلاً بك ${name}`, 'join');
}

function initLoginScreen() {
    try {
        selectLoginAvatar(AVATAR_OPTIONS[0]);
        switchLoginTab('guest');
        renderAvatarGrid();
        loadSavedLoginData();
        document.getElementById('customAvatarInput')?.addEventListener('change', (e) => handleCustomAvatarUpload(e.target.files[0]));
        document.getElementById('loginUsernameInput')?.addEventListener('input', updateRegisteredPasswordFields);
    } catch (err) {
        console.error('فشل تهيئة شاشة الدخول (initLoginScreen):', err);
    }
}
