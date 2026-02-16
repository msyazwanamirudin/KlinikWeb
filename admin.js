// ═══════════════════════════════════════════════
// ADMIN SCRIPTS — Clinic Efficiency Audit
// ═══════════════════════════════════════════════

// --- Security: Disable right-click and dev tool shortcuts ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) e.preventDefault();
    if (e.ctrlKey && ['U', 'u'].includes(e.key)) e.preventDefault();
});

// --- Password visibility toggle ---
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
        btn.title = 'Hide password';
    } else {
        input.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
        btn.title = 'Show password';
    }
}

// --- Helpers ---
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- Particle Background ---
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const COUNT = 45;
    const colors = ['15,118,110', '99,102,241', '244,63,94'];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.s = Math.random() * 2 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.o = Math.random() * 0.35 + 0.1;
            this.c = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.c + ',' + this.o + ')';
            ctx.fill();
        }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new P());

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(); particles[i].draw();
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(15,118,110,' + (0.06 * (1 - dist / 120)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
})();

// --- Step Navigation ---
let currentStep = 1;
function goToStep(n) {
    const isForward = n > currentStep;
    const prev = document.getElementById('step' + currentStep);
    if (prev) prev.classList.remove('active', 'slide-reverse');
    currentStep = n;
    const el = document.getElementById('step' + n);
    el.classList.remove('active', 'slide-reverse');
    void el.offsetWidth;
    if (!isForward) el.classList.add('slide-reverse');
    el.classList.add('active');
    document.getElementById('progressFill').style.width = (n * 25) + '%';
    if (n === 3) loadMetrics();
    if (n === 4) {
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('auditContainer').style.maxWidth = '100%';
        loadInventory();
        loadDoctors();
        checkFirebaseUsage();
    }
}

// --- Tab Switching ---
function switchTab(tab, btn) {
    document.querySelectorAll('.dash-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('pane' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    if (btn) btn.classList.add('active');
    if (tab === 'inventory') loadInventory();
    if (tab === 'roster') { loadRosterAdmin(); loadDoctors(); }
    if (tab === 'promo') loadPromoAdmin();
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'cashflow') loadCashFlow();
    if (tab === 'settings') loadSettings();
    if (tab === 'admin') loadAdminTab();
}

// --- Metrics (Step 2) ---
function animateCounter(el, target) {
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current;
    }, 40);
}

function loadMetrics() {
    const btn = document.getElementById('btnContinue');
    const icon = document.getElementById('scanIcon');
    const text = document.getElementById('scanText');
    btn.disabled = true;

    Promise.all([
        firebaseLoad('inventory', []),
        firebaseLoad('roster/rules', []),
        firebaseLoad('doctors', null),
        firebaseLoad('promo', { enabled: false, items: [] })
    ]).then(([inv, rules, docs, promo]) => {
        const invCount = Array.isArray(inv) ? inv.length : 0;
        const rosterCount = Array.isArray(rules) ? rules.length : 0;
        const docCount = (docs && Array.isArray(docs)) ? docs.length : 5;
        const promoStatus = promo && promo.enabled ? 'Active' : 'Off';

        setTimeout(() => {
            animateCounter(document.getElementById('metricInventory'), invCount);
            animateCounter(document.getElementById('metricRoster'), rosterCount);
            animateCounter(document.getElementById('metricDoctors'), docCount);
            document.getElementById('metricPromo').textContent = promoStatus;
            document.querySelectorAll('.metric-card').forEach(c => c.classList.add('loaded'));

            setTimeout(() => {
                icon.className = 'fas fa-check-circle';
                text.textContent = 'Continue to Dashboard';
                btn.disabled = false;
            }, 800);
        }, 600);
    }).catch(() => {
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = 'Offline — Continue Anyway';
        btn.disabled = false;
    });
}

// --- Auth ---
// HMAC-SHA256 salt for password hashing (prevents rainbow table attacks)
const _HMAC_SALT = 'klinik_haya_2026';

// Default credentials (fallback if Firebase has no saved credentials)
const _DEFAULT_HASH = "681c974cab4a3a51ec4f5601f5cd2f223a1153ee5e39e222c2bad7750c929dff";
const _DEFAULT_EMAIL = "admin@klinik.com";
let _adminEmail = _DEFAULT_EMAIL;
let _adminHash = _DEFAULT_HASH;

// Owner credentials
const _DEFAULT_OWNER_HASH = "257f1f8aaf5820dd6b9bc20394a09bbe64589d111a08d878a4cc994892288c3a";
const _DEFAULT_OWNER_EMAIL = "owner@klinik.com";
let _ownerEmail = _DEFAULT_OWNER_EMAIL;
let _ownerHash = _DEFAULT_OWNER_HASH;

// Role tracking
let _loggedInRole = null; // 'admin' or 'owner'

const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 100 * 365 * 24 * 60 * 60 * 1000;

async function sha256(message) {
    // HMAC-SHA256 with salt for stronger password binding
    const encoder = new TextEncoder();
    const keyData = encoder.encode(_HMAC_SALT);
    const msgData = encoder.encode(message);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, msgData);
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Owner Password System (Developer-hardcoded only) ---
// To change: compute HMAC-SHA256 of your new password with salt 'klinik_haya_2026'
// Command: node -e "const c=require('crypto');console.log(c.createHmac('sha256','klinik_haya_2026').update('YOUR_NEW_PASSWORD').digest('hex'))"
const _OWNER_PASSWORD_HASH = 'f0960a619fb8731c2158d5645327c50f699c3bda7cb47577a387c9fb574fa9cd'; // default: 1234
let _pinCallback = null;

function showPinModal() {
    const modal = document.getElementById('ownerPinModal');
    const input = document.getElementById('ownerPinInput');
    const error = document.getElementById('ownerPinError');
    if (!modal) return;
    modal.style.display = 'flex';
    if (input) { input.value = ''; input.focus(); }
    if (error) error.style.display = 'none';
}

function hidePinModal() {
    const modal = document.getElementById('ownerPinModal');
    if (modal) modal.style.display = 'none';
    _pinCallback = null;
}

function requireOwnerPin(callback) {
    _pinCallback = callback;
    showPinModal();
}

async function verifyOwnerPin() {
    const input = document.getElementById('ownerPinInput');
    const error = document.getElementById('ownerPinError');
    if (!input || !input.value.trim()) return;
    const hash = await sha256(input.value.trim());
    if (hash === _OWNER_PASSWORD_HASH) {
        hidePinModal();
        if (_pinCallback) { const cb = _pinCallback; _pinCallback = null; cb(); }
    } else {
        if (error) { error.textContent = 'Incorrect password'; error.style.display = 'block'; }
        input.value = '';
        input.focus();
    }
}

// Owner password modal Enter key listener
document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('ownerPinInput');
    if (pinInput) pinInput.addEventListener('keyup', e => { if (e.key === 'Enter') verifyOwnerPin(); });
});


function verifyAdminLogin() {
    const errorMsg = document.getElementById('loginError');
    const email = document.getElementById('adminEmailInput').value.trim();
    const password = document.getElementById('adminPasswordInput').value.trim();
    const lockout = JSON.parse(localStorage.getItem('adminLockout') || '{}');

    if (lockout.active && Date.now() < lockout.until) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = "System locked due to too many failed attempts.";
        return;
    }

    // Load credentials from Firebase first, then verify
    Promise.all([
        firebaseLoad('settings/adminCredentials', null),
        firebaseLoad('settings/ownerCredentials', null),
        sha256(password)
    ]).then(([adminCreds, ownerCreds, hash]) => {
        // Update admin credentials from Firebase if available
        if (adminCreds && adminCreds.email && adminCreds.passwordHash) {
            _adminEmail = adminCreds.email;
            _adminHash = adminCreds.passwordHash;
        }
        // Update owner credentials from Firebase if available
        if (ownerCreds && ownerCreds.email && ownerCreds.passwordHash) {
            _ownerEmail = ownerCreds.email;
            _ownerHash = ownerCreds.passwordHash;
        }

        // Check admin account
        if (email === _adminEmail && hash === _adminHash) {
            _loggedInRole = 'admin';
        }
        // Check owner account
        else if (email === _ownerEmail && hash === _ownerHash) {
            _loggedInRole = 'owner';
        }
        else {
            _loggedInRole = null;
        }

        if (_loggedInRole) {
            errorMsg.style.display = 'none';
            localStorage.removeItem('adminLockout');
            localStorage.removeItem('adminAttempts');
            goToStep(3);
            // Update Admin tab visibility based on role
            updateAdminTabVisibility();
            // Real-time listeners
            firebaseListen('inventory', d => { _cachedInventory = d || []; });
            firebaseListen('roster/rules', d => { _cachedRosterRules = d || []; latestRosterRules = d || []; });
            firebaseListen('promo', d => { _cachedPromo = d || { enabled: false, items: [] }; promoData = _cachedPromo; });
            firebaseListen('doctors', d => { _cachedDoctors = (d && Array.isArray(d) && d.length > 0) ? d : [...DEFAULT_DOCTORS]; DOCTORS = _cachedDoctors; });
        } else {
            let attempts = parseInt(localStorage.getItem('adminAttempts') || 0) + 1;
            localStorage.setItem('adminAttempts', attempts);
            if (attempts >= MAX_ATTEMPTS) {
                localStorage.setItem('adminLockout', JSON.stringify({ active: true, until: Date.now() + LOCKOUT_TIME }));
                errorMsg.textContent = "System locked.";
            } else {
                errorMsg.textContent = "Invalid email or password";
            }
            errorMsg.style.display = 'block';
        }
    });
}

// --- Admin Tab Visibility ---
function updateAdminTabVisibility() {
    const adminTabBtn = document.getElementById('tabAdmin');
    if (!adminTabBtn) return;
    if (_loggedInRole === 'owner') {
        adminTabBtn.style.display = '';
    } else {
        adminTabBtn.style.display = 'none';
    }
}

// Enter key on password
document.addEventListener('DOMContentLoaded', () => {
    const pass = document.getElementById('adminPasswordInput');
    if (pass) pass.addEventListener('keyup', e => { if (e.key === 'Enter') verifyAdminLogin(); });
});

// --- Lockout Reset ---
function resetLockout() {
    if (!confirm('This will clear the login lockout.\nYou will still need valid credentials to log in.\n\nProceed?')) return;
    localStorage.removeItem('adminLockout');
    localStorage.removeItem('adminAttempts');
    const errorMsg = document.getElementById('loginError');
    if (errorMsg) {
        errorMsg.style.display = 'block';
        errorMsg.style.color = '#34d399';
        errorMsg.textContent = '✅ Lockout cleared. You may try logging in again.';
        setTimeout(() => { errorMsg.style.display = 'none'; errorMsg.style.color = ''; }, 4000);
    }
}

// --- Global Cache ---
let _cachedRosterRules = null;
let _cachedInventory = null;
let _cachedPromo = null;
let _cachedDoctors = null;
// _sessionBandwidthBytes is declared in firebase-config.js

// --- Doctors ---
const DEFAULT_DOCTORS = [
    "Dr. Alia Syamim (Fertility)", "Dr. Sarah Lee (Pediatric)",
    "Dr. Hanim (General)", "Dr. Wong (Locum)", "Dr. Amin (Specialist)"
];
let DOCTORS = [...DEFAULT_DOCTORS];

function loadDoctors() {
    return firebaseLoad('doctors', null).then(docs => {
        DOCTORS = (docs && Array.isArray(docs) && docs.length > 0) ? docs : [...DEFAULT_DOCTORS];
        _cachedDoctors = DOCTORS;
        populateDoctorSelect();
        renderDoctorList();
        return DOCTORS;
    });
}
function addDoctor() {
    const input = document.getElementById('newDoctorName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return alert('Please enter a doctor name');
    if (DOCTORS.includes(name)) return alert('Doctor already exists');
    DOCTORS.push(name);
    firebaseSave('doctors', DOCTORS).then(() => { input.value = ''; populateDoctorSelect(); renderDoctorList(); });
}
function removeDoctor(index) {
    const docName = DOCTORS[index];
    if (!confirm(`Remove ${docName}?\n\nAll roster rules for this doctor will also be deleted.`)) return;
    requireOwnerPin(() => {
        DOCTORS.splice(index, 1);
        firebaseSave('doctors', DOCTORS).then(() => {
            populateDoctorSelect(); renderDoctorList();
            firebaseLoad('roster/rules', []).then(rules => {
                const cleaned = rules.filter(r => r.doc !== docName);
                if (cleaned.length !== rules.length) {
                    firebaseSave('roster/rules', cleaned).then(() => { invalidateRosterCache(); loadRosterAdmin(); });
                }
            });
        });
    });
}
function renderDoctorList() {
    const list = document.getElementById('doctorManageList');
    if (!list) return;
    if (DOCTORS.length === 0) { list.innerHTML = '<div class="text-muted small text-center p-2">No doctors</div>'; return; }
    const sorted = DOCTORS.map((doc, i) => ({ name: String(doc || ''), idx: i })).sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML = sorted.map(item => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1 px-2">
            <span class="small fw-semibold">${escapeHTML(item.name)}</span>
            <button onclick="removeDoctor(${item.idx})" class="btn btn-outline-danger btn-sm border-0 py-0"><i class="fas fa-times"></i></button>
        </div>`).join('');
}
function populateDoctorSelect() {
    const sel = document.getElementById('rosterDocSelect');
    if (!sel) return;
    sel.innerHTML = '';
    DOCTORS.forEach(doc => { const opt = document.createElement('option'); opt.value = doc; opt.textContent = doc; sel.appendChild(opt); });
}

// --- Inventory ---
let latestInventory = [];
let _invSortBy = 'name';

function setInventorySort(sortBy) { _invSortBy = sortBy; filterInventory(); }
function toggleInventoryForm() { const f = document.getElementById('inventoryForm'); f.style.display = f.style.display === 'none' ? 'block' : 'none'; }
function loadInventory() {
    firebaseLoad('inventory', []).then(items => { latestInventory = items; renderInventory(items, document.getElementById('inventoryList'), document.getElementById('inventoryEmpty')); });
}
function renderInventory(items, list, empty) {
    if (!list) return;
    const searchTerm = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    const filterCat = document.getElementById('invFilterCategory') ? document.getElementById('invFilterCategory').value : 'All';
    items = items.map((item, index) => ({ ...item, originalIndex: index })).filter(item => {
        return (item.name || '').toLowerCase().includes(searchTerm) && (filterCat === 'All' || item.category === filterCat);
    });
    if (items.length === 0) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    switch (_invSortBy) {
        case 'name': items.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
        case 'category': items.sort((a, b) => (a.category || '').localeCompare(b.category || '')); break;
        case 'stock': items.sort((a, b) => parseInt(a.qty || 0) - parseInt(b.qty || 0)); break;
        case 'stock-desc': items.sort((a, b) => parseInt(b.qty || 0) - parseInt(a.qty || 0)); break;
        case 'expiry': default: items.sort((a, b) => { if (!a.expiry) return 1; if (!b.expiry) return -1; return new Date(a.expiry) - new Date(b.expiry); }); break;
    }
    let html = '';
    const catColors = { 'Medicine': 'bg-primary', 'Supplements': 'bg-success', 'Equipment': 'bg-info', 'Stationery': 'bg-warning', 'Others': 'bg-secondary' };
    items.forEach(item => {
        let statusBadge = '';
        if (item.expiry) {
            const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) statusBadge = '<span class="badge bg-danger ms-1">EXPIRED</span>';
            else if (daysLeft < 60) statusBadge = `<span class="badge bg-warning ms-1">Exp: ${item.expiry}</span>`;
            else statusBadge = `<span class="badge bg-secondary ms-1" style="font-size:0.65rem">Exp: ${item.expiry}</span>`;
        }
        html += `<tr><td><div class="fw-bold">${escapeHTML(item.name)}</div><span class="badge ${catColors[item.category] || 'bg-secondary'}" style="font-size:0.7rem">${item.category || 'Medicine'}</span>${statusBadge}</td><td><span class="small text-muted">${item.category || 'Medicine'}</span></td><td><div class="d-flex align-items-center gap-2"><button onclick="updateStock(${item.originalIndex},-1)" class="btn btn-outline-danger btn-sm py-0 px-2 fw-bold">-</button><span class="fw-bold" style="min-width:30px;text-align:center">${item.qty}</span><button onclick="updateStock(${item.originalIndex},1)" class="btn btn-outline-success btn-sm py-0 px-2 fw-bold">+</button></div></td><td class="text-end"><button onclick="deleteInventoryItem(${item.originalIndex})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    list.innerHTML = html;
}
function filterInventory() { renderInventory(latestInventory, document.getElementById('inventoryList'), document.getElementById('inventoryEmpty')); }
function updateStock(index, change) {
    firebaseLoad('inventory', []).then(items => {
        if (items[index]) { let q = parseInt(items[index].qty) + change; if (q < 0) q = 0; items[index].qty = q; firebaseSave('inventory', items).then(() => loadInventory()); }
    });
}
function addInventoryItem() {
    const name = document.getElementById('invName').value.trim();
    const qty = parseInt(document.getElementById('invQty').value);
    const expiry = document.getElementById('invExpiry').value;
    const category = document.getElementById('invCategory').value;
    if (!name || isNaN(qty)) return alert("Name and Quantity are required");
    firebaseLoad('inventory', []).then(items => {
        const ei = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase() && i.expiry === expiry);
        if (ei !== -1) { items[ei].qty = parseInt(items[ei].qty) + qty; alert(`Updated stock for ${items[ei].name}. New Qty: ${items[ei].qty}`); }
        else items.push({ name, qty, expiry, category });
        firebaseSave('inventory', items).then(() => { document.getElementById('invName').value = ''; document.getElementById('invQty').value = ''; document.getElementById('invExpiry').value = ''; toggleInventoryForm(); loadInventory(); });
    });
}
function deleteInventoryItem(index) {
    if (!confirm("Remove this item permanently?")) return;
    requireOwnerPin(() => {
        firebaseLoad('inventory', []).then(items => { items.splice(index, 1); firebaseSave('inventory', items).then(() => loadInventory()); });
    });
}

// --- Roster ---
let latestRosterRules = [];
let _adminRosterViewMode = 'weekly';
let _adminRosterViewMonth = new Date();
let _adminRosterViewWeek = new Date();
const _d = _adminRosterViewWeek.getDay();
const _diff = _adminRosterViewWeek.getDate() - _d + (_d === 0 ? -6 : 1);
_adminRosterViewWeek.setDate(_diff);
let _editingRuleIndex = -1;

function invalidateRosterCache() { _cachedRosterRules = null; }
function switchAdminRosterView(mode) {
    _adminRosterViewMode = mode;
    const w = document.getElementById('adminWeeklyOverview'), m = document.getElementById('adminMonthlyOverview');
    if (mode === 'weekly') { if (w) w.style.display = 'block'; if (m) m.style.display = 'none'; renderWeeklyOverview(latestRosterRules || []); }
    else { if (w) w.style.display = 'none'; if (m) m.style.display = 'block'; renderAdminMonthlyOverview(latestRosterRules || []); }
}
function changeAdminRosterMonth(d) { _adminRosterViewMonth.setMonth(_adminRosterViewMonth.getMonth() + d); renderAdminMonthlyOverview(latestRosterRules || []); }
function changeAdminRosterWeek(d) { _adminRosterViewWeek.setDate(_adminRosterViewWeek.getDate() + (d * 7)); renderWeeklyOverview(latestRosterRules || []); }
function getWeekOfMonth(date) { const f = new Date(date.getFullYear(), date.getMonth(), 1); const dow = f.getDay() === 0 ? 6 : f.getDay() - 1; return Math.ceil((date.getDate() + dow) / 7); }

function loadRosterAdmin() {
    invalidateRosterCache();
    firebaseLoad('roster/rules', []).then(rules => {
        _cachedRosterRules = rules || [];
        latestRosterRules = rules;
        renderRosterList(rules);
        if (_adminRosterViewMode === 'weekly') renderWeeklyOverview(rules);
        else renderAdminMonthlyOverview(rules);
    });
}

function renderAdminMonthlyOverview(rules) {
    const container = document.getElementById('adminRosterCalendar');
    const label = document.getElementById('adminRosterMonthLabel');
    if (!container) return;
    const viewDate = new Date(_adminRosterViewMonth.getFullYear(), _adminRosterViewMonth.getMonth(), 1);
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    if (label) label.textContent = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const today = new Date(), todayISO = today.toISOString().split('T')[0];
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), daysInMonth = lastDay.getDate();
    let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<div class="roster-cal-grid">';
    dayHeaders.forEach(dh => { html += `<div class="roster-cal-header">${dh}</div>`; });
    for (let e = 0; e < startDow; e++) html += '<div class="roster-cal-cell roster-cal-empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day), dateISO = d.toISOString().split('T')[0], dayIdx = d.getDay();
        const isToday = dateISO === todayISO, isPast = d < today && !isToday;
        const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
        const weekRules = rules.filter(r => r.type === 'weekly' && r.day === dayIdx);
        let activeRules = dateRules.length > 0 ? dateRules : (weekRules.length > 0 ? weekRules : []);
        html += `<div class="roster-cal-cell${isToday ? ' roster-cal-today' : ''}${isPast ? ' roster-cal-past' : ''}">`;
        html += `<div class="roster-cal-date">${day}</div>`;
        activeRules.forEach(r => {
            const isOff = r.shift === 'Off', cls = isOff ? 'roster-shift-off' : 'roster-shift-on', doc = r.doc.replace(/ \(.*\)/, '');
            html += `<div class="roster-cal-entry ${cls}"><span class="roster-doc-name">${isOff ? '<s>' + doc + '</s>' : doc}</span><span class="roster-shift-label">${isOff ? 'OFF' : r.shift}</span></div>`;
        });
        html += '</div>';
    }
    const totalCells = startDow + daysInMonth, rem = totalCells % 7;
    if (rem > 0) for (let e = 0; e < 7 - rem; e++) html += '<div class="roster-cal-cell roster-cal-empty"></div>';
    html += '</div>';
    container.innerHTML = html;
}

function renderWeeklyOverview(rules) {
    const container = document.getElementById('adminWeeklyOverview');
    if (!container) return;
    const startOfWeek = new Date(_adminRosterViewWeek);
    const weekNum = getWeekOfMonth(startOfWeek);
    const monthName = startOfWeek.toLocaleDateString('en-GB', { month: 'short' });
    let html = `<div class="border rounded overflow-hidden shadow-sm"><div class="px-3 py-2 d-flex align-items-center justify-content-between" style="background:var(--primary)"><div class="d-flex align-items-center gap-2"><i class="fas fa-calendar-week" style="color:white"></i><span class="fw-bold small text-uppercase" style="color:white">Weekly Overview</span></div><div class="d-flex align-items-center gap-2"><button class="btn btn-sm btn-link p-0" style="color:white" onclick="changeAdminRosterWeek(-1)"><i class="fas fa-chevron-left"></i></button><span class="fw-bold small mx-1" style="min-width:90px;text-align:center;color:white">Week ${weekNum} of ${monthName}</span><button class="btn btn-sm btn-link p-0" style="color:white" onclick="changeAdminRosterWeek(1)"><i class="fas fa-chevron-right"></i></button></div></div><div class="table-responsive"><table class="table table-bordered table-sm mb-0 align-middle" style="font-size:0.8rem"><thead class="table-light"><tr><th class="text-center" style="width:14.28%">Mon</th><th class="text-center" style="width:14.28%">Tue</th><th class="text-center" style="width:14.28%">Wed</th><th class="text-center" style="width:14.28%">Thu</th><th class="text-center" style="width:14.28%">Fri</th><th class="text-center" style="width:14.28%">Sat</th><th class="text-center" style="width:14.28%">Sun</th></tr></thead><tbody><tr>`;
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
        const dateISO = d.toISOString().split('T')[0], dayIdx = d.getDay(), isToday = d.toDateString() === new Date().toDateString();
        const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
        const weekRules = rules.filter(r => r.type === 'weekly' && r.day === dayIdx);
        let activeRules = dateRules.length > 0 ? dateRules : (weekRules.length > 0 ? weekRules : []);
        let cell = `<div class="fw-bold mb-1" style="font-size:0.7rem;color:#64748b">${d.getDate()}/${d.getMonth() + 1}</div>`;
        activeRules.forEach(r => {
            const isOff = r.shift === 'Off', style = isOff ? 'text-decoration:line-through;color:#999' : 'color:var(--primary-light);font-weight:600';
            cell += `<div style="${style}">${r.doc.replace(/ \(.*\)/, '')}</div>`;
            cell += isOff ? '<div style="font-size:0.7rem;color:#fb7185">OFF</div>' : `<div style="font-size:0.7rem;color:#64748b">${r.shift}</div>`;
        });
        html += `<td class="text-center p-2"${isToday ? ' style="background:rgba(15,118,110,0.1)"' : ''}>${cell}</td>`;
    }
    html += '</tr></tbody></table></div></div>';
    container.innerHTML = html;
}

function renderRosterList(rules) {
    const list = document.getElementById('rosterList'), empty = document.getElementById('rosterEmpty'), btnDelete = document.getElementById('btnDeleteSelected');
    if (!list) return;
    if (btnDelete) btnDelete.disabled = true;
    const selectAll = document.getElementById('selectAllRules'); if (selectAll) selectAll.checked = false;
    if (rules.length === 0) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    let displayRules = rules.map((r, i) => ({ ...r, _origIdx: i }));
    displayRules.sort((a, b) => { if (a.type === 'date' && b.type === 'weekly') return -1; if (a.type === 'weekly' && b.type === 'date') return 1; if (a.type === 'date' && b.type === 'date') return new Date(a.date) - new Date(b.date); return a.day - b.day; });
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = '';
    displayRules.forEach(rule => {
        let whenLabel = '', badgeHtml = '';
        if (rule.type === 'weekly') { whenLabel = 'Every ' + days[rule.day]; badgeHtml = '<span class="badge bg-info text-dark">Weekly</span>'; }
        else { const d = new Date(rule.date + 'T00:00:00'); whenLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (' + days[d.getDay()] + ')'; badgeHtml = '<span class="badge bg-primary">Date</span>'; }
        html += `<tr><td class="text-center"><input type="checkbox" class="form-check-input rule-checkbox" value="${rule._origIdx}" onchange="updateBatchButtons()"></td><td><div class="fw-semibold">${whenLabel}</div><div class="small text-muted">${badgeHtml} &bull; ${escapeHTML(rule.shift)}</div></td><td>${escapeHTML(rule.doc)}</td><td class="text-end"><button onclick="editRosterRule(${rule._origIdx})" class="btn btn-outline-primary btn-sm border-0 me-1"><i class="fas fa-pen"></i></button><button onclick="deleteRosterRule(${rule._origIdx})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    list.innerHTML = html;
}

function toggleAllRules(source) { document.querySelectorAll('.rule-checkbox').forEach(cb => cb.checked = source.checked); updateBatchButtons(); }
function updateBatchButtons() { document.getElementById('btnDeleteSelected').disabled = document.querySelectorAll('.rule-checkbox:checked').length === 0; }
function deleteSelectedRules() {
    const checked = document.querySelectorAll('.rule-checkbox:checked'); if (checked.length === 0) return;
    if (!confirm(`Delete ${checked.length} selected rules?`)) return;
    requireOwnerPin(() => {
        const indices = Array.from(checked).map(cb => parseInt(cb.value)).sort((a, b) => b - a);
        firebaseLoad('roster/rules', []).then(rules => { indices.forEach(idx => { if (idx >= 0 && idx < rules.length) rules.splice(idx, 1); }); firebaseSave('roster/rules', rules); invalidateRosterCache(); loadRosterAdmin(); });
    });
}
function clearAllRules() {
    if (!confirm("⚠️ Delete ALL roster rules?")) return;
    if (!confirm("🔴 This cannot be undone. Confirm?")) return;
    requireOwnerPin(() => {
        firebaseSave('roster/rules', []); invalidateRosterCache(); loadRosterAdmin();
    });
}
function editRosterRule(index) {
    const rule = latestRosterRules[index]; if (!rule) return;
    _editingRuleIndex = index;
    const form = document.getElementById('rosterForm'); form.style.display = 'block';
    if (rule.type === 'weekly') { document.getElementById('ruleWeekly').checked = true; document.getElementById('rosterDay').value = rule.day; }
    else { document.getElementById('ruleDate').checked = true; document.getElementById('rosterDateStart').value = rule.date; document.getElementById('rosterDateEnd').value = ''; }
    toggleRuleInputs();
    document.getElementById('rosterDocSelect').value = rule.doc;
    document.getElementById('rosterShift').value = rule.shift;
    const saveBtn = form.querySelector('button[onclick="addRosterRule()"]'); if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Update Rule';
    form.scrollIntoView({ behavior: 'smooth' });
}
function toggleRosterForm() {
    const form = document.getElementById('rosterForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') { _editingRuleIndex = -1; document.getElementById('ruleDate').checked = true; document.getElementById('rosterDateStart').value = ''; document.getElementById('rosterDateEnd').value = ''; document.getElementById('rosterShift').value = 'Full Day'; toggleRuleInputs(); const btn = form.querySelector('button[onclick="addRosterRule()"]'); if (btn) btn.innerHTML = '<i class="fas fa-save me-1"></i>Save Rule'; }
}
function toggleRuleInputs() {
    const isWeekly = document.getElementById('ruleWeekly').checked;
    document.getElementById('inputDateGroup').style.display = isWeekly ? 'none' : 'block';
    document.getElementById('inputDayGroup').style.display = isWeekly ? 'block' : 'none';
}
function addRosterRule() {
    const isWeekly = document.getElementById('ruleWeekly').checked;
    const doc = document.getElementById('rosterDocSelect').value, shift = document.getElementById('rosterShift').value;
    let newRules = [];
    if (isWeekly) { newRules.push({ type: 'weekly', day: parseInt(document.getElementById('rosterDay').value), doc, shift }); }
    else {
        const startVal = document.getElementById('rosterDateStart').value, endVal = document.getElementById('rosterDateEnd').value;
        if (!startVal) return alert("Please select a date");
        if (endVal && endVal < startVal) return alert("End date before start date");
        if (endVal) { let curr = new Date(startVal); const end = new Date(endVal); if (Math.ceil(Math.abs(end - curr) / (1000 * 60 * 60 * 24)) > 31) return alert("Max 31 days"); while (curr <= end) { newRules.push({ type: 'date', date: curr.toISOString().split('T')[0], doc, shift }); curr.setDate(curr.getDate() + 1); } }
        else newRules.push({ type: 'date', date: startVal, doc, shift });
    }
    firebaseLoad('roster/rules', []).then(rules => {
        let dups = [];
        newRules.forEach(nr => { const ei = rules.findIndex((r, idx) => idx !== _editingRuleIndex && r.type === nr.type && (nr.type === 'weekly' ? r.day === nr.day : r.date === nr.date) && r.doc === nr.doc && r.shift === nr.shift); if (ei !== -1) dups.push(`${nr.date || 'Day ' + nr.day} `); });
        if (dups.length > 0) { alert('Duplicate: ' + dups.join(', ')); return; }
        if (_editingRuleIndex >= 0 && newRules.length === 1) rules[_editingRuleIndex] = newRules[0]; else rules.push(...newRules);
        firebaseSave('roster/rules', rules).then(() => { _editingRuleIndex = -1; invalidateRosterCache(); document.getElementById('rosterForm').style.display = 'none'; loadRosterAdmin(); });
    });
}
function deleteRosterRule(index) {
    if (!confirm("Delete this rule?")) return;
    requireOwnerPin(() => {
        firebaseLoad('roster/rules', []).then(rules => { if (index >= 0 && index < rules.length) { rules.splice(index, 1); firebaseSave('roster/rules', rules).then(() => { invalidateRosterCache(); loadRosterAdmin(); }); } });
    });
}

// --- Promo ---
let promoData = { enabled: false, items: [] };
function loadPromoAdmin() {
    firebaseLoad('promo', { enabled: false, items: [] }).then(data => { promoData = data || { enabled: false, items: [] }; if (!promoData.items) promoData.items = []; _cachedPromo = promoData; renderPromoAdmin(); });
}
function togglePromoSection() { promoData.enabled = document.getElementById('promoToggle').checked; firebaseSave('promo', promoData); }
function previewPromoImage() {
    const url = document.getElementById('promoImageUrl').value.trim(), preview = document.getElementById('promoImagePreview');
    if (!url) { preview.innerHTML = '<span class="text-muted small">Enter a URL above</span>'; return; }
    preview.innerHTML = '<span style="color:var(--primary-light)" class="small"><i class="fas fa-spinner fa-spin me-1"></i>Loading...</span>';
    const img = new Image();
    img.onload = () => { const sizeKB = url.startsWith('data:') ? Math.round(url.length * 0.75 / 1024) : 0; preview.innerHTML = `<img src="${url}" class="img-fluid rounded" style="max-height:150px" alt="Preview"><div class="small mt-1" style="color:#10b981"><i class="fas fa-check-circle me-1"></i>${sizeKB > 0 ? sizeKB + ' KB' : 'Loaded'}</div>`; };
    img.onerror = () => { preview.innerHTML = '<div class="small" style="color:#fb7185"><i class="fas fa-times-circle me-1"></i>Failed to load</div>'; };
    img.src = url;
}
function addPromoItem() {
    const imageUrl = document.getElementById('promoImageUrl').value.trim(), text = document.getElementById('promoText').value.trim();
    if (!imageUrl) return alert('Please provide an image');
    promoData.items.push({ image: imageUrl, text: text }); _cachedPromo = promoData;
    firebaseSave('promo', promoData).then(() => { document.getElementById('promoImageUrl').value = ''; document.getElementById('promoImageUrl').type = 'text'; document.getElementById('promoText').value = ''; document.getElementById('promoImagePreview').innerHTML = '<span class="text-muted small">Enter a URL or upload</span>'; renderPromoAdmin(); });
}
function handlePromoFileUpload(input) {
    const file = input.files[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { alert('Invalid image type'); input.value = ''; return; }
    if (file.size > 500 * 1024) { alert('Image too large (max 500KB)'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => {
        const b64 = e.target.result;
        document.getElementById('promoImageUrl').value = b64;
        document.getElementById('promoImageUrl').type = 'hidden';
        const sizeKB = (file.size / 1024).toFixed(0);
        document.getElementById('promoImagePreview').innerHTML = `<img src="${b64}" class="img-fluid rounded" style="max-height:150px" alt="Preview"><div class="small mt-1" style="color:#10b981"><i class="fas fa-check-circle me-1"></i>${sizeKB} KB</div>`;
    };
    reader.readAsDataURL(file);
}
function deletePromoItem(index) {
    if (!confirm('Remove this promo?')) return;
    requireOwnerPin(() => {
        promoData.items.splice(index, 1); firebaseSave('promo', promoData).then(() => renderPromoAdmin());
    });
}
function renderPromoAdmin() {
    const list = document.getElementById('promoItemList'), toggle = document.getElementById('promoToggle');
    if (!list) return; if (toggle) toggle.checked = promoData.enabled;
    if (promoData.items.length === 0) { list.innerHTML = '<div class="text-center text-muted p-3"><i class="fas fa-images fs-3 mb-2 d-block" style="color:#475569"></i>No promo items yet</div>'; return; }
    list.innerHTML = promoData.items.map((item, i) => `
            <div class="d-flex gap-2 align-items-start border-bottom py-2">
                <img src="${item.image}" class="rounded" style="width:60px;height:60px;object-fit:cover" onerror="this.style.background='#1e293b';this.src=''" alt="Promo">
                    <div class="flex-grow-1"><div class="small fw-bold text-truncate" style="max-width:200px">${escapeHTML(item.text) || '<em class="text-muted">No caption</em>'}</div><div style="font-size:0.7rem;color:#475569;word-break:break-all">${escapeHTML(item.image).substring(0, 50)}...</div></div>
                    <button onclick="deletePromoItem(${i})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button>
                </div>`).join('');
}

// --- Firebase Usage ---
const FB_LIMITS = { storageMB: 1024, bandwidthMB: 10240, base64WarnMB: 5 };
function flushBandwidthEstimate() {
    if (_sessionBandwidthBytes === 0) return Promise.resolve();
    const mk = new Date().toISOString().slice(0, 7);
    return firebaseLoad(`_usage/${mk}`, { bytes: 0 }).then(u => { const updated = { bytes: (u.bytes || 0) + _sessionBandwidthBytes }; _sessionBandwidthBytes = 0; return firebaseSave(`_usage/${mk}`, updated); });
}
function checkFirebaseUsage() {
    const container = document.getElementById('firebaseUsageAlerts'); if (!container) return;
    container.innerHTML = '<div class="text-center small py-2" style="color:#64748b"><i class="fas fa-spinner fa-spin me-1"></i>Checking usage...</div>';
    const paths = ['roster/rules', 'inventory', 'promo', 'doctors', 'expenses', 'settings'];
    const mk = new Date().toISOString().slice(0, 7);
    Promise.all([...paths.map(p => firebaseLoad(p, null)), firebaseLoad(`_usage/${mk}`, { bytes: 0 })]).then(results => {
        const dataResults = results.slice(0, paths.length), usageData = results[paths.length];
        let totalStorageBytes = 0, totalBase64Bytes = 0;
        dataResults.forEach((data, i) => { if (data !== null) { totalStorageBytes += new Blob([JSON.stringify(data)]).size; if (paths[i] === 'promo' && data.items) data.items.forEach(item => { if (item.image && item.image.startsWith('data:')) totalBase64Bytes += new Blob([item.image]).size; }); } });
        const storageMB = totalStorageBytes / (1024 * 1024), storagePercent = Math.min((storageMB / FB_LIMITS.storageMB) * 100, 100);
        const bandwidthBytes = (usageData.bytes || 0) + _sessionBandwidthBytes, bandwidthMB = bandwidthBytes / (1024 * 1024), bandwidthPercent = Math.min((bandwidthMB / FB_LIMITS.bandwidthMB) * 100, 100);
        const base64MB = totalBase64Bytes / (1024 * 1024), base64Percent = Math.min((base64MB / FB_LIMITS.base64WarnMB) * 100, 100);
        flushBandwidthEstimate();
        const barColor = pct => pct >= 100 ? '#dc3545' : pct >= 85 ? '#f0ad4e' : '#059669';
        const dot = pct => pct >= 100 ? '🔴' : pct >= 85 ? '🟡' : '🟢';
        const hasWarn = storagePercent >= 85 || bandwidthPercent >= 85 || base64Percent >= 85;
        const accent = hasWarn ? (storagePercent >= 100 || bandwidthPercent >= 100 ? '#dc3545' : '#f0ad4e') : '#059669';
        const fmtSize = mb => mb < 1 ? (mb * 1024).toFixed(0) + ' KB' : mb.toFixed(1) + ' MB';
        const row = (ico, lbl, used, limit, pct) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:0.65rem">${dot(pct)}</span><span style="font-size:0.72rem;color:#94a3b8;min-width:72px;white-space:nowrap"><i class="fas ${ico}" style="width:13px;text-align:center;color:${barColor(pct)};margin-right:3px;font-size:0.65rem"></i>${lbl}</span><div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden"><div style="width:${Math.max(pct, 1)}%;height:100%;background:${barColor(pct)};border-radius:3px;transition:width 0.6s"></div></div><span style="font-size:0.65rem;color:#64748b;min-width:88px;text-align:right">${used} / ${limit}</span></div>`;
        container.innerHTML = `<div style="border:1px solid ${accent}30;border-left:3px solid ${accent};border-radius:12px;padding:12px 16px;background:rgba(255,255,255,0.02)"><div style="font-size:0.72rem;font-weight:700;color:${accent};margin-bottom:8px;display:flex;align-items:center;gap:5px"><i class="fas ${hasWarn ? 'fa-exclamation-triangle' : 'fa-shield-alt'}" style="font-size:0.65rem"></i>${hasWarn ? 'Firebase Usage Warning' : 'Firebase — All Clear'}</div>${row('fa-database', 'Storage', fmtSize(storageMB), '1 GB', storagePercent)}${row('fa-download', 'Bandwidth', fmtSize(bandwidthMB), '10 GB/mo', bandwidthPercent)}${base64MB > 0 ? row('fa-image', 'Base64', fmtSize(base64MB), '5 MB', base64Percent) : ''}</div>`;
    }).catch(() => { container.innerHTML = ''; });
}

// --- Touch Swipe for Audit Steps ---
(function () {
    let startX = 0, startY = 0;
    const container = document.getElementById('auditContainer');
    if (!container) return;
    container.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    container.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
            if (dx < 0 && currentStep === 1) {
                // Swipe left = go to auth (only from welcome)
                goToStep(2);
            } else if (dx > 0 && currentStep === 2) {
                // Swipe right = back to welcome
                goToStep(1);
            }
        }
    }, { passive: true });
})();

// ═══════════════════════════════════════════════
// ANALYTICS TAB
// ═══════════════════════════════════════════════
function loadAnalytics() {
    const container = document.getElementById('analyticsContent');
    if (!container) return;
    container.innerHTML = '<div class="text-center p-4" style="color:#64748b"><i class="fas fa-spinner fa-spin me-1"></i>Loading analytics...</div>';
    Promise.all([
        firebaseLoad('inventory', []),
        firebaseLoad('roster/rules', []),
        firebaseLoad('doctors', []),
        firebaseLoad('promo', { enabled: false, items: [] }),
        firebaseLoad('expenses', [])
    ]).then(([inv, rules, docs, promo, expenses]) => {
        inv = inv || []; rules = rules || []; docs = docs || [];
        const items = Array.isArray(inv) ? inv : [];
        const rosterRules = Array.isArray(rules) ? rules : [];
        const doctors = Array.isArray(docs) ? docs : [];
        const expList = Array.isArray(expenses) ? expenses : [];

        // Inventory stats
        const lowStock = items.filter(i => parseInt(i.qty || 0) <= 5 && parseInt(i.qty || 0) > 0);
        const outOfStock = items.filter(i => parseInt(i.qty || 0) === 0);
        const now = new Date();
        const expired = items.filter(i => i.expiry && new Date(i.expiry) < now);
        const expiringSoon = items.filter(i => {
            if (!i.expiry) return false;
            const d = Math.ceil((new Date(i.expiry) - now) / 86400000);
            return d >= 0 && d <= 30;
        });

        // Roster stats
        const todayDay = now.getDay();
        const todayStr = now.toISOString().slice(0, 10);
        const todayRules = rosterRules.filter(r => {
            if (r.type === 'weekly' && parseInt(r.day) === todayDay) return true;
            if (r.type === 'date') {
                if (r.dateStart && !r.dateEnd && r.dateStart === todayStr) return true;
                if (r.dateStart && r.dateEnd && todayStr >= r.dateStart && todayStr <= r.dateEnd) return true;
            }
            return false;
        });

        // Cash flow stats
        const thisMonth = now.toISOString().slice(0, 7);
        const monthEntries = expList.filter(e => (e.date || '').startsWith(thisMonth));
        const monthIncome = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const monthExpenses = monthEntries.filter(e => e.type !== 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const monthNet = monthIncome - monthExpenses;

        // Build analytics HTML
        let html = '';

        // Quick stats row
        html += '<div class="row g-3 mb-4">';
        const statCard = (icon, color, value, label) => `<div class="col-6 col-md-3"><div class="metric-card"><div class="metric-icon" style="background:${color}15"><i class="fas ${icon}" style="color:${color}"></i></div><div class="metric-value" style="font-size:1.5rem">${value}</div><div class="metric-label">${label}</div></div></div>`;
        html += statCard('fa-boxes', '#14b8a6', items.length, 'Total Items');
        html += statCard('fa-user-md', '#818cf8', doctors.length, 'Doctors');
        html += statCard('fa-calendar-check', '#fbbf24', rosterRules.length, 'Roster Rules');
        const netColor = monthNet >= 0 ? '#34d399' : '#fb7185';
        html += statCard('fa-exchange-alt', netColor, (monthNet >= 0 ? '+' : '') + 'RM ' + monthNet.toFixed(0), 'Net This Month');
        html += '</div>';

        // Cash flow mini-summary
        html += '<h6 class="fw-bold small text-uppercase mb-2" style="color:#94a3b8"><i class="fas fa-chart-bar me-1"></i>Cash Flow This Month</h6>';
        html += '<div class="row g-2 mb-4">';
        html += `<div class="col-4"><div class="p-2 rounded border text-center" style="background:rgba(52,211,153,0.06)"><div style="font-size:0.65rem;color:#94a3b8">Income</div><div class="fw-bold" style="font-size:0.95rem;color:#34d399">RM ${monthIncome.toFixed(0)}</div></div></div>`;
        html += `<div class="col-4"><div class="p-2 rounded border text-center" style="background:rgba(251,113,133,0.06)"><div style="font-size:0.65rem;color:#94a3b8">Expenses</div><div class="fw-bold" style="font-size:0.95rem;color:#fb7185">RM ${monthExpenses.toFixed(0)}</div></div></div>`;
        html += `<div class="col-4"><div class="p-2 rounded border text-center" style="background:rgba(129,140,248,0.06)"><div style="font-size:0.65rem;color:#94a3b8">Net</div><div class="fw-bold" style="font-size:0.95rem;color:${netColor}">${monthNet >= 0 ? '+' : ''}RM ${monthNet.toFixed(0)}</div></div></div>`;
        html += '</div>';

        // Alerts section
        html += '<h6 class="fw-bold small text-uppercase mb-2" style="color:#94a3b8"><i class="fas fa-bell me-1"></i>Alerts & Insights</h6>';

        if (outOfStock.length === 0 && lowStock.length === 0 && expired.length === 0 && expiringSoon.length === 0 && todayRules.length > 0) {
            html += '<div class="analytics-alert analytics-alert-ok"><i class="fas fa-check-circle me-2"></i>All systems healthy — no alerts</div>';
        }

        if (outOfStock.length > 0) {
            html += `<div class="analytics-alert analytics-alert-danger"><i class="fas fa-exclamation-circle me-2"></i><strong>${outOfStock.length} item(s) OUT OF STOCK</strong><div class="mt-1" style="font-size:0.78rem;color:#fca5a5">${outOfStock.map(i => escapeHTML(i.name)).join(', ')}</div></div>`;
        }
        if (expired.length > 0) {
            html += `<div class="analytics-alert analytics-alert-danger"><i class="fas fa-skull-crossbones me-2"></i><strong>${expired.length} EXPIRED item(s)</strong><div class="mt-1" style="font-size:0.78rem;color:#fca5a5">${expired.map(i => escapeHTML(i.name) + ' (' + i.expiry + ')').join(', ')}</div></div>`;
        }
        if (lowStock.length > 0) {
            html += `<div class="analytics-alert analytics-alert-warn"><i class="fas fa-exclamation-triangle me-2"></i><strong>${lowStock.length} item(s) low stock (≤5)</strong><div class="mt-1" style="font-size:0.78rem;color:#fcd34d">${lowStock.map(i => escapeHTML(i.name) + ' (' + i.qty + ')').join(', ')}</div></div>`;
        }
        if (expiringSoon.length > 0) {
            html += `<div class="analytics-alert analytics-alert-warn"><i class="fas fa-clock me-2"></i><strong>${expiringSoon.length} item(s) expiring within 30 days</strong><div class="mt-1" style="font-size:0.78rem;color:#fcd34d">${expiringSoon.map(i => escapeHTML(i.name) + ' (' + i.expiry + ')').join(', ')}</div></div>`;
        }
        if (todayRules.length === 0) {
            html += '<div class="analytics-alert analytics-alert-info"><i class="fas fa-info-circle me-2"></i>No roster rules set for today</div>';
        } else {
            const todayDocs = todayRules.map(r => r.doctor + ' — ' + r.shift).join(', ');
            html += `<div class="analytics-alert analytics-alert-ok"><i class="fas fa-stethoscope me-2"></i><strong>Today\'s Schedule:</strong> ${todayDocs}</div>`;
        }

        // Promo status
        const promoEnabled = promo && promo.enabled;
        const promoCount = promo && promo.items ? promo.items.length : 0;
        html += `<div class="analytics-alert analytics-alert-info"><i class="fas fa-bullhorn me-2"></i>Promo: ${promoEnabled ? '<span style="color:#34d399">Active</span>' : '<span style="color:#94a3b8">Disabled</span>'} — ${promoCount} item(s)</div>`;

        // Inventory by category breakdown
        html += '<h6 class="fw-bold small text-uppercase mt-4 mb-2" style="color:#94a3b8"><i class="fas fa-chart-pie me-1"></i>Inventory by Category</h6>';
        const catCounts = {};
        items.forEach(i => { const c = i.category || 'Others'; catCounts[c] = (catCounts[c] || 0) + 1; });
        const catColors = { 'Medicine': '#14b8a6', 'Supplements': '#34d399', 'Equipment': '#818cf8', 'Stationery': '#fbbf24', 'Others': '#94a3b8' };
        html += '<div class="d-flex flex-wrap gap-2">';
        Object.entries(catCounts).forEach(([cat, count]) => {
            const color = catColors[cat] || '#94a3b8';
            html += `<div style="background:${color}15;border:1px solid ${color}30;border-radius:10px;padding:8px 14px;font-size:0.8rem"><span style="color:${color};font-weight:700">${count}</span> <span style="color:#94a3b8">${cat}</span></div>`;
        });
        html += '</div>';

        container.innerHTML = html;
    }).catch(() => {
        container.innerHTML = '<div class="text-center p-4" style="color:#fb7185"><i class="fas fa-exclamation-triangle me-1"></i>Failed to load analytics</div>';
    });
}

// ═══════════════════════════════════════════════
// CASH FLOW TRACKER
// ═══════════════════════════════════════════════
let latestCashFlow = [];
const CF_INCOME_CATS = ['Consultation', 'Procedure', 'Lab Test', 'Pharmacy', 'Insurance', 'Others'];
const CF_EXPENSE_CATS = ['Supplies', 'Utilities', 'Payroll', 'Maintenance', 'Equipment', 'Others'];
const CF_CAT_COLORS = {
    'Consultation': '#14b8a6', 'Procedure': '#818cf8', 'Lab Test': '#a78bfa', 'Pharmacy': '#34d399', 'Insurance': '#38bdf8',
    'Supplies': '#f97316', 'Utilities': '#818cf8', 'Payroll': '#fbbf24', 'Maintenance': '#fb7185', 'Equipment': '#2dd4bf', 'Others': '#94a3b8'
};

function toggleCashFlowForm() {
    const f = document.getElementById('cfForm');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
    if (f.style.display === 'block') {
        document.getElementById('cfDate').value = new Date().toISOString().slice(0, 10);
        updateCFCategories();
    }
}

function updateCFCategories() {
    const sel = document.getElementById('cfCategory');
    const isIncome = document.getElementById('cfTypeIncome').checked;
    const cats = isIncome ? CF_INCOME_CATS : CF_EXPENSE_CATS;
    sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function loadCashFlow() {
    firebaseLoad('expenses', []).then(data => {
        latestCashFlow = Array.isArray(data) ? data : [];
        // Auto-migrate old entries without type
        let migrated = false;
        latestCashFlow.forEach(e => { if (!e.type) { e.type = 'expense'; migrated = true; } });
        if (migrated) firebaseSave('expenses', latestCashFlow);
        populateCFMonthFilter();
        populateCFCategoryFilter();
        renderCashFlow();
    });
}

function populateCFMonthFilter() {
    const sel = document.getElementById('cfFilterMonth');
    if (!sel) return;
    const months = new Set();
    latestCashFlow.forEach(e => { if (e.date) months.add(e.date.slice(0, 7)); });
    const sorted = Array.from(months).sort().reverse();
    sel.innerHTML = '<option value="all">All Months</option>';
    sorted.forEach(m => {
        const d = new Date(m + '-01');
        sel.innerHTML += `<option value="${m}">${d.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>`;
    });
}

function populateCFCategoryFilter() {
    const sel = document.getElementById('cfFilterCategory');
    if (!sel) return;
    const cats = new Set();
    latestCashFlow.forEach(e => { if (e.category) cats.add(e.category); });
    sel.innerHTML = '<option value="All">All Categories</option>';
    Array.from(cats).sort().forEach(c => { sel.innerHTML += `<option value="${c}">${c}</option>`; });
}

function renderCashFlow() {
    const list = document.getElementById('cfList');
    const empty = document.getElementById('cfEmpty');
    const summary = document.getElementById('cfSummary');
    if (!list) return;

    const fMonth = document.getElementById('cfFilterMonth') ? document.getElementById('cfFilterMonth').value : 'all';
    const fType = document.getElementById('cfFilterType') ? document.getElementById('cfFilterType').value : 'all';
    const fCat = document.getElementById('cfFilterCategory') ? document.getElementById('cfFilterCategory').value : 'All';

    let filtered = latestCashFlow.map((e, i) => ({ ...e, _idx: i })).filter(e => {
        if (fMonth !== 'all' && !(e.date || '').startsWith(fMonth)) return false;
        if (fType !== 'all' && e.type !== fType) return false;
        if (fCat !== 'All' && e.category !== fCat) return false;
        return true;
    });
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Summary — always based on ALL data (not filtered)
    const allIncome = latestCashFlow.filter(e => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const allExpense = latestCashFlow.filter(e => e.type !== 'income').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const netBalance = allIncome - allExpense;

    let sumHtml = '<div class="row g-2 mb-3">';
    sumHtml += `<div class="col-4"><div class="p-3 rounded border text-center" style="background:rgba(52,211,153,0.06)"><div style="font-size:0.7rem;color:#94a3b8">Income</div><div class="fw-bold" style="font-size:1.1rem;color:#34d399"><i class="fas fa-arrow-up me-1" style="font-size:0.7rem"></i>RM ${allIncome.toFixed(2)}</div></div></div>`;
    sumHtml += `<div class="col-4"><div class="p-3 rounded border text-center" style="background:rgba(251,113,133,0.06)"><div style="font-size:0.7rem;color:#94a3b8">Expenses</div><div class="fw-bold" style="font-size:1.1rem;color:#fb7185"><i class="fas fa-arrow-down me-1" style="font-size:0.7rem"></i>RM ${allExpense.toFixed(2)}</div></div></div>`;
    const netColor = netBalance >= 0 ? '#34d399' : '#fb7185';
    const netIcon = netBalance >= 0 ? 'fa-chart-line' : 'fa-exclamation-triangle';
    sumHtml += `<div class="col-4"><div class="p-3 rounded border text-center" style="background:rgba(129,140,248,0.06)"><div style="font-size:0.7rem;color:#94a3b8">Net Balance</div><div class="fw-bold" style="font-size:1.1rem;color:${netColor}"><i class="fas ${netIcon} me-1" style="font-size:0.7rem"></i>RM ${netBalance.toFixed(2)}</div></div></div>`;
    sumHtml += '</div>';

    // Category breakdown bar (for filtered data)
    if (filtered.length > 0) {
        const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const catTotals = {};
        filtered.forEach(e => { const c = e.category || 'Others'; catTotals[c] = (catTotals[c] || 0) + parseFloat(e.amount || 0); });
        sumHtml += '<div style="display:flex;height:6px;border-radius:3px;overflow:hidden;gap:1px;margin-bottom:6px">';
        Object.entries(catTotals).forEach(([cat, amt]) => {
            sumHtml += `<div style="width:${(amt / total) * 100}%;background:${CF_CAT_COLORS[cat] || '#94a3b8'}" title="${cat}: RM ${amt.toFixed(2)}"></div>`;
        });
        sumHtml += '</div><div class="d-flex flex-wrap gap-2">';
        Object.entries(catTotals).forEach(([cat, amt]) => {
            sumHtml += `<span style="font-size:0.7rem;color:${CF_CAT_COLORS[cat] || '#94a3b8'}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${CF_CAT_COLORS[cat] || '#94a3b8'};margin-right:3px"></span>${cat}: RM ${amt.toFixed(2)}</span>`;
        });
        sumHtml += '</div>';
    }
    if (summary) summary.innerHTML = sumHtml;

    // Table
    if (filtered.length === 0) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';

    // Update batch buttons
    const btnCFDelete = document.getElementById('btnDeleteSelectedCF');
    const selectAllCF = document.getElementById('selectAllCF');
    if (btnCFDelete) btnCFDelete.disabled = true;
    if (selectAllCF) selectAllCF.checked = false;

    let html = '';
    filtered.forEach(e => {
        const isIncome = e.type === 'income';
        const typeBadge = isIncome
            ? '<span class="badge bg-success" style="font-size:0.65rem"><i class="fas fa-arrow-up me-1"></i>Income</span>'
            : '<span class="badge bg-danger" style="font-size:0.65rem"><i class="fas fa-arrow-down me-1"></i>Expense</span>';
        const amtColor = isIncome ? '#34d399' : '#fb7185';
        const amtPrefix = isIncome ? '+' : '-';
        html += `<tr><td class="text-center"><input type="checkbox" class="form-check-input cf-checkbox" value="${e._idx}" onchange="updateCFBatchButtons()"></td><td>${e.date || '—'}</td><td>${typeBadge}</td><td>${escapeHTML(e.desc || '')}</td><td><span class="badge" style="font-size:0.65rem;background:${CF_CAT_COLORS[e.category] || '#94a3b8'}20;color:${CF_CAT_COLORS[e.category] || '#94a3b8'};border:1px solid ${CF_CAT_COLORS[e.category] || '#94a3b8'}40">${e.category || 'Others'}</span></td><td class="text-end fw-bold" style="color:${amtColor}">${amtPrefix} RM ${parseFloat(e.amount || 0).toFixed(2)}</td><td class="text-end"><button onclick="deleteCashFlowEntry(${e._idx})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    list.innerHTML = html;
}

function addCashFlowEntry() {
    const date = document.getElementById('cfDate').value;
    const desc = document.getElementById('cfDesc').value.trim();
    const amount = parseFloat(document.getElementById('cfAmount').value);
    const category = document.getElementById('cfCategory').value;
    const type = document.getElementById('cfTypeIncome').checked ? 'income' : 'expense';
    if (!desc || isNaN(amount) || amount <= 0) { alert('Please fill in all fields'); return; }
    latestCashFlow.push({ date, desc, amount: amount.toFixed(2), category, type });
    firebaseSave('expenses', latestCashFlow);
    document.getElementById('cfDesc').value = '';
    document.getElementById('cfAmount').value = '';
    document.getElementById('cfForm').style.display = 'none';
    populateCFMonthFilter();
    populateCFCategoryFilter();
    renderCashFlow();
}

function deleteCashFlowEntry(index) {
    if (!confirm('Delete this transaction?')) return;
    requireOwnerPin(() => {
        latestCashFlow.splice(index, 1);
        firebaseSave('expenses', latestCashFlow);
        populateCFMonthFilter();
        populateCFCategoryFilter();
        renderCashFlow();
    });
}

function toggleAllCF(source) { document.querySelectorAll('.cf-checkbox').forEach(cb => cb.checked = source.checked); updateCFBatchButtons(); }
function updateCFBatchButtons() { const btn = document.getElementById('btnDeleteSelectedCF'); if (btn) btn.disabled = document.querySelectorAll('.cf-checkbox:checked').length === 0; }
function deleteSelectedCF() {
    const checked = document.querySelectorAll('.cf-checkbox:checked'); if (checked.length === 0) return;
    if (!confirm(`Delete ${checked.length} selected transaction(s)?`)) return;
    requireOwnerPin(() => {
        const indices = Array.from(checked).map(cb => parseInt(cb.value)).sort((a, b) => b - a);
        indices.forEach(idx => { if (idx >= 0 && idx < latestCashFlow.length) latestCashFlow.splice(idx, 1); });
        firebaseSave('expenses', latestCashFlow);
        populateCFMonthFilter();
        populateCFCategoryFilter();
        renderCashFlow();
    });
}

// ═══════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════
const SETTINGS_FIELDS = ['setClinicName', 'setAddress', 'setPhone', 'setEmail', 'setHoursWeekday', 'setHoursWeekend', 'setWhatsApp', 'setFacebook', 'setInstagram', 'setTikTok', 'setThreads', 'setMapEmbed'];

function toggle247() {
    const checked = document.getElementById('set247').checked;
    const hoursDiv = document.getElementById('hoursInputs');
    if (hoursDiv) hoursDiv.style.display = checked ? 'none' : 'block';
}

function loadSettings() {
    firebaseLoad('settings', {}).then(data => {
        if (!data) data = {};
        SETTINGS_FIELDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = data[id] || '';
        });
        // Handle 24/7 toggle
        const is247 = data.set247 === true || data.set247 === 'true';
        const toggle = document.getElementById('set247');
        if (toggle) { toggle.checked = is247; toggle247(); }
    });
}

function saveSettings() {
    const data = {};
    SETTINGS_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value.trim();
    });
    // 24/7 toggle
    const toggle = document.getElementById('set247');
    if (toggle) {
        data.set247 = toggle.checked;
        if (toggle.checked) {
            data.setHoursWeekday = 'Open 24 Hours';
            data.setHoursWeekend = 'Open 24 Hours';
        }
    }
    // Auto-extract src from full iframe tag if pasted
    if (data.setMapEmbed && data.setMapEmbed.includes('<iframe')) {
        const match = data.setMapEmbed.match(/src="([^"]+)"/);
        if (match) {
            data.setMapEmbed = match[1];
            document.getElementById('setMapEmbed').value = match[1];
        }
    }
    firebaseSave('settings', data).then(() => {
        const status = document.getElementById('settingsSaveStatus');
        if (status) {
            status.innerHTML = '<span style="color:#34d399"><i class="fas fa-check me-1"></i>Settings saved successfully!</span>';
            setTimeout(() => { status.innerHTML = ''; }, 3000);
        }
    });
}

function testMapEmbed() {
    const input = document.getElementById('setMapEmbed');
    const status = document.getElementById('mapPreviewStatus');
    const container = document.getElementById('mapPreviewContainer');
    const iframe = document.getElementById('mapPreviewIframe');
    let url = (input ? input.value.trim() : '');

    if (!url) {
        status.innerHTML = '<span style="color:#fb7185"><i class="fas fa-times-circle me-1"></i>Please enter a URL first</span>';
        container.style.display = 'none';
        return;
    }

    // Auto-extract src from full iframe tag
    if (url.includes('<iframe')) {
        const match = url.match(/src="([^"]+)"/);
        if (match) {
            url = match[1];
            input.value = url;
        } else {
            status.innerHTML = '<span style="color:#fb7185"><i class="fas fa-times-circle me-1"></i>Could not extract URL from iframe tag</span>';
            container.style.display = 'none';
            return;
        }
    }

    // Validate URL format
    if (!url.startsWith('https://www.google.com/maps/embed')) {
        status.innerHTML = '<span style="color:#fbbf24"><i class="fas fa-exclamation-triangle me-1"></i>URL should start with <code>https://www.google.com/maps/embed</code></span>';
    } else {
        status.innerHTML = '<span style="color:#14b8a6"><i class="fas fa-spinner fa-spin me-1"></i>Loading map preview...</span>';
    }

    // Show preview
    container.style.display = 'block';
    iframe.src = url;
    iframe.onload = function () {
        status.innerHTML = '<span style="color:#34d399"><i class="fas fa-check-circle me-1"></i>Map loaded successfully!</span>';
    };
    iframe.onerror = function () {
        status.innerHTML = '<span style="color:#fb7185"><i class="fas fa-times-circle me-1"></i>Failed to load map. Check the URL.</span>';
        container.style.display = 'none';
    };
}

// ═══════════════════════════════════════════════
// ADMIN TAB (Owner-Only)
// ═══════════════════════════════════════════════
let _adminTabUnlocked = false;

function maskEmail(email) {
    if (!email) return '—';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    return user.slice(0, 3) + '***@' + domain;
}

function loadAdminTab() {
    const gate = document.getElementById('adminPinGate');
    const content = document.getElementById('adminContent');
    if (!gate || !content) return;
    if (_adminTabUnlocked) {
        gate.style.display = 'none';
        content.style.display = 'block';
        renderAdminContent();
    } else {
        gate.style.display = 'block';
        content.style.display = 'none';
    }
}

function unlockAdminTab() {
    requireOwnerPin(() => {
        _adminTabUnlocked = true;
        loadAdminTab();
    });
}

function renderAdminContent() {
    const info = document.getElementById('adminCredInfo');
    if (!info) return;
    firebaseLoad('settings/adminCredentials', null).then(creds => {
        const email = (creds && creds.email) ? creds.email : _adminEmail;
        const hasCustomCreds = !!(creds && creds.email);
        info.innerHTML = `
            <div class="d-flex align-items-center gap-3 p-3 rounded border mb-3" style="background:rgba(255,255,255,0.03)">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(15,118,110,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fas fa-user-shield" style="color:var(--primary-light)"></i>
                </div>
                <div>
                    <div class="small" style="color:#94a3b8">Current Admin Email</div>
                    <div class="fw-bold" style="font-size:0.95rem">${maskEmail(email)}</div>
                </div>
                <div class="ms-auto">
                    <span class="badge ${hasCustomCreds ? 'bg-success' : 'bg-warning text-dark'}" style="font-size:0.65rem">${hasCustomCreds ? 'Custom' : 'Default'}</span>
                </div>
            </div>`;
    });
}

async function changeAdminEmail() {
    const currentPwd = prompt('Enter your CURRENT password to verify:');
    if (!currentPwd) return;
    const currentHash = await sha256(currentPwd.trim());

    // Load latest credentials
    const creds = await firebaseLoad('settings/adminCredentials', null);
    const storedHash = (creds && creds.passwordHash) ? creds.passwordHash : _adminHash;

    if (currentHash !== storedHash) {
        alert('❌ Incorrect password.');
        return;
    }

    const newEmail = prompt('Enter the NEW admin email:');
    if (!newEmail || !newEmail.trim() || !newEmail.includes('@')) {
        alert('❌ Invalid email address.');
        return;
    }

    const updated = {
        email: newEmail.trim(),
        passwordHash: storedHash
    };
    _adminEmail = newEmail.trim();
    firebaseSave('settings/adminCredentials', updated).then(() => {
        alert('✅ Admin email changed successfully!\n\nNew email: ' + newEmail.trim());
        renderAdminContent();
    });
}

async function changeAdminPassword() {
    const currentPwd = prompt('Enter your CURRENT password:');
    if (!currentPwd) return;
    const currentHash = await sha256(currentPwd.trim());

    // Load latest credentials
    const creds = await firebaseLoad('settings/adminCredentials', null);
    const storedHash = (creds && creds.passwordHash) ? creds.passwordHash : _adminHash;
    const storedEmail = (creds && creds.email) ? creds.email : _adminEmail;

    if (currentHash !== storedHash) {
        alert('❌ Incorrect current password.');
        return;
    }

    const newPwd = prompt('Enter a NEW password (min 6 characters):');
    if (!newPwd || newPwd.trim().length < 6) {
        alert('❌ Password must be at least 6 characters.');
        return;
    }

    const confirmPwd = prompt('Confirm your new password:');
    if (confirmPwd !== newPwd) {
        alert('❌ Passwords do not match.');
        return;
    }

    const newHash = await sha256(newPwd.trim());
    const updated = {
        email: storedEmail,
        passwordHash: newHash
    };
    _adminHash = newHash;
    firebaseSave('settings/adminCredentials', updated).then(() => {
        alert('✅ Password changed successfully!\n\nYou will need to use the new password next time you log in.');
    });
}
