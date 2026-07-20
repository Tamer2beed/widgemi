/* pm.js — نظام الرسائل الخاصة: محادثات محلية لكل عضو، مع عداد غير مقروء. */

let pmConversations = {};   // { userId: [ {from:'me'|'them', text, time} ] }
let pmUnreadCounts = {};    // { userId: count }
let currentPmUserId = null;

function loadPmData() {
    try { pmConversations = JSON.parse(localStorage.getItem('pmConversations') || '{}'); } catch (e) { pmConversations = {}; }
    try { pmUnreadCounts = JSON.parse(localStorage.getItem('pmUnreadCounts') || '{}'); } catch (e) { pmUnreadCounts = {}; }
}
function savePmData() {
    try { localStorage.setItem('pmConversations', JSON.stringify(pmConversations)); } catch (e) {}
    try { localStorage.setItem('pmUnreadCounts', JSON.stringify(pmUnreadCounts)); } catch (e) {}
}

function getTotalUnreadPm() {
    return Object.values(pmUnreadCounts).reduce((sum, n) => sum + (n || 0), 0);
}

function updatePmBadge() {
    const badge = document.getElementById('pmUnreadBadge');
    if (!badge) return;
    const total = getTotalUnreadPm();
    if (total > 0) { badge.textContent = total > 99 ? '99+' : total; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
}

function pmSafe(str) { return (typeof sanitize === 'function') ? sanitize(str) : String(str); }

/* ---------- قائمة المحادثات ---------- */
function openPmListModal() {
    document.getElementById('sideMenu')?.classList.remove('active');
    document.getElementById('onlineUsersPanel')?.classList.remove('active');
    renderPmList();
    document.getElementById('pmListModal')?.classList.remove('hidden');
}

function renderPmList() {
    const listEl = document.getElementById('pmListItems');
    if (!listEl) return;
    const userIds = Object.keys(pmConversations).filter(id => pmConversations[id] && pmConversations[id].length > 0);
    if (userIds.length === 0) {
        listEl.innerHTML = '<div class="text-center text-gray-400 text-xs py-10">لا توجد محادثات خاصة بعد<br>ابدأ محادثة من الضغط على أي عضو</div>';
        return;
    }
    userIds.sort((a, b) => {
        const la = pmConversations[a][pmConversations[a].length - 1];
        const lb = pmConversations[b][pmConversations[b].length - 1];
        return (lb.ts || 0) - (la.ts || 0);
    });
    listEl.innerHTML = userIds.map(uid => {
        const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === String(uid)) : null;
        const last = pmConversations[uid][pmConversations[uid].length - 1];
        const unread = pmUnreadCounts[uid] || 0;
        const name = user ? user.name : 'عضو غادر';
        const avatar = user ? user.avatar : (typeof ME_AVATAR !== 'undefined' ? ME_AVATAR : '');
        return `
        <button class="pm-open-conv-btn w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 border border-gray-100 mb-2" data-user-id="${uid}">
            <img src="${pmSafe(avatar)}" class="w-11 h-11 rounded-xl object-cover border-2 border-purple-200 shrink-0">
            <div class="flex-1 text-right overflow-hidden">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-gray-800 text-sm truncate">${pmSafe(name)}</span>
                    ${unread > 0 ? `<span class="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0">${unread > 9 ? '9+' : unread}</span>` : ''}
                </div>
                <span class="text-gray-400 text-[11px] truncate block">${last.from === 'me' ? 'أنت: ' : ''}${pmSafe(last.text)}</span>
            </div>
        </button>`;
    }).join('');
}

/* ---------- نافذة محادثة فردية ---------- */
function openPmConversation(userId) {
    const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === String(userId)) : null;
    if (!user) { if (typeof showNotification === 'function') showNotification('هذا العضو غير متصل حالياً', 'leave'); return; }
    currentPmUserId = String(userId);
    document.getElementById('pmListModal')?.classList.add('hidden');

    const nameEl = document.getElementById('pmConvName');
    if (nameEl) nameEl.textContent = user.name;
    const avatarEl = document.getElementById('pmConvAvatar');
    if (avatarEl) avatarEl.src = user.avatar;

    pmUnreadCounts[currentPmUserId] = 0;
    savePmData();
    updatePmBadge();

    renderPmConversation();
    document.getElementById('pmConversationModal')?.classList.remove('hidden');
}

function renderPmConversation() {
    const bodyEl = document.getElementById('pmConvBody');
    if (!bodyEl || !currentPmUserId) return;
    const list = pmConversations[currentPmUserId] || [];
    if (list.length === 0) {
        bodyEl.innerHTML = '<div class="text-center text-gray-400 text-xs py-10">ابدأ المحادثة الآن</div>';
    } else {
        bodyEl.innerHTML = list.map(m => `
            <div class="flex ${m.from === 'me' ? 'justify-end' : 'justify-start'} mb-2">
                <div class="max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.from === 'me' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}">
                    ${pmSafe(m.text)}
                    <div class="text-[9px] mt-1 opacity-60">${pmSafe(m.time)}</div>
                </div>
            </div>
        `).join('');
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
}

function sendPmMessage() {
    const input = document.getElementById('pmConvInput');
    if (!input || !currentPmUserId) return;
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const entry = { from: 'me', text, time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), ts: Date.now() };
    if (!pmConversations[currentPmUserId]) pmConversations[currentPmUserId] = [];
    pmConversations[currentPmUserId].push(entry);
    savePmData();
    input.value = '';
    renderPmConversation();

    /* محاكاة رد تلقائي بسيط بعد لحظات (للتجربة فقط) */
    const targetId = currentPmUserId;
    setTimeout(() => simulatePmReply(targetId), 1500 + Math.random() * 2000);
}

const pmAutoReplies = ["تمام، وصلتني رسالتك 👍", "أهلاً بيك، شن أخبارك؟", "حاضر، خلني أرد عليك بعدين", "😄", "ما فهمت قصدك بالضبط، وضّح أكثر", "أوك تمام"];
function simulatePmReply(userId) {
    const user = (typeof mockUsersList !== 'undefined') ? mockUsersList.find(u => String(u.id) === String(userId)) : null;
    if (!user) return;
    const now = new Date();
    const reply = pmAutoReplies[Math.floor(Math.random() * pmAutoReplies.length)];
    const entry = { from: 'them', text: reply, time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), ts: Date.now() };
    if (!pmConversations[userId]) pmConversations[userId] = [];
    pmConversations[userId].push(entry);

    if (currentPmUserId === String(userId) && !document.getElementById('pmConversationModal')?.classList.contains('hidden')) {
        renderPmConversation();
    } else {
        pmUnreadCounts[userId] = (pmUnreadCounts[userId] || 0) + 1;
        if (typeof showNotification === 'function') showNotification(`💬 رسالة جديدة من ${user.name}`, 'join');
    }
    savePmData();
    updatePmBadge();
}

function backToPmList() {
    document.getElementById('pmConversationModal')?.classList.add('hidden');
    currentPmUserId = null;
    openPmListModal();
}

function closePmConversation() {
    document.getElementById('pmConversationModal')?.classList.add('hidden');
    currentPmUserId = null;
}

function initPmSystem() {
    loadPmData();
    updatePmBadge();
}
