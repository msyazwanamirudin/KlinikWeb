// ═══════════════════════════════════════════════
// ADMIN SCRIPTS — Clinic Efficiency Audit
// ═══════════════════════════════════════════════

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
    if (n === 2) loadMetrics();
    if (n === 4) {
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('auditContainer').style.maxWidth = '100%';
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
const ADMIN_HASH_SHA = "8d90ed647b948fa80c3c9bbf5316c78f151723f52fb9d6101f818af8afff69ec";
const ADMIN_EMAIL = "admin@klinik.com";
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 100 * 365 * 24 * 60 * 60 * 1000;

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    sha256(password).then(hash => {
        if (email === ADMIN_EMAIL && hash === ADMIN_HASH_SHA) {
            errorMsg.style.display = 'none';
            localStorage.removeItem('adminLockout');
            localStorage.removeItem('adminAttempts');
            goToStep(4);
            loadInventory();
            loadDoctors();
            checkFirebaseUsage();
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

// Enter key on password
document.addEventListener('DOMContentLoaded', () => {
    const pass = document.getElementById('adminPasswordInput');
    if (pass) pass.addEventListener('keyup', e => { if (e.key === 'Enter') verifyAdminLogin(); });
});

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
    const catColors = { 'Medicine': 'bg-primary', 'Supplements': 'bg-success', 'Equipment': 'bg-info text-dark', 'Stationery': 'bg-warning text-dark', 'Others': 'bg-secondary' };
    items.forEach(item => {
        let statusBadge = '';
        if (item.expiry) {
            const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) statusBadge = '<span class="badge bg-danger ms-1">EXPIRED</span>';
            else if (daysLeft < 60) statusBadge = `<span class="badge bg-warning text-dark ms-1">Exp: ${item.expiry}</span>`;
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
    firebaseLoad('inventory', []).then(items => { items.splice(index, 1); firebaseSave('inventory', items).then(() => loadInventory()); });
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
        html += `< tr ><td class="text-center"><input type="checkbox" class="form-check-input rule-checkbox" value="${rule._origIdx}" onchange="updateBatchButtons()"></td><td><div class="fw-semibold">${whenLabel}</div><div class="small text-muted">${badgeHtml} &bull; ${escapeHTML(rule.shift)}</div></td><td>${escapeHTML(rule.doc)}</td><td class="text-end"><button onclick="editRosterRule(${rule._origIdx})" class="btn btn-outline-primary btn-sm border-0 me-1"><i class="fas fa-pen"></i></button><button onclick="deleteRosterRule(${rule._origIdx})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button></td></tr > `;
    });
    list.innerHTML = html;
}

function toggleAllRules(source) { document.querySelectorAll('.rule-checkbox').forEach(cb => cb.checked = source.checked); updateBatchButtons(); }
function updateBatchButtons() { document.getElementById('btnDeleteSelected').disabled = document.querySelectorAll('.rule-checkbox:checked').length === 0; }
function deleteSelectedRules() {
    const checked = document.querySelectorAll('.rule-checkbox:checked'); if (checked.length === 0) return;
    if (!confirm(`Delete ${checked.length} selected rules ? `)) return;
    const indices = Array.from(checked).map(cb => parseInt(cb.value)).sort((a, b) => b - a);
    firebaseLoad('roster/rules', []).then(rules => { indices.forEach(idx => { if (idx >= 0 && idx < rules.length) rules.splice(idx, 1); }); firebaseSave('roster/rules', rules); invalidateRosterCache(); loadRosterAdmin(); });
}
function clearAllRules() {
    if (!confirm("⚠️ Delete ALL roster rules?")) return;
    if (!confirm("🔴 This cannot be undone. Confirm?")) return;
    firebaseSave('roster/rules', []); invalidateRosterCache(); loadRosterAdmin();
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
    firebaseLoad('roster/rules', []).then(rules => { if (index >= 0 && index < rules.length) { rules.splice(index, 1); firebaseSave('roster/rules', rules).then(() => { invalidateRosterCache(); loadRosterAdmin(); }); } });
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
    img.onload = () => { preview.innerHTML = `< img src = "${escapeHTML(url)}" class="img-fluid rounded" style = "max-height:150px" alt = "Preview" > <div class="small mt-1" style="color:#10b981"><i class="fas fa-check-circle me-1"></i>Loaded</div>`; };
    img.onerror = () => { preview.innerHTML = '<div class="small" style="color:#fb7185"><i class="fas fa-times-circle me-1"></i>Failed to load</div>'; };
    img.src = url;
}
function addPromoItem() {
    const imageUrl = document.getElementById('promoImageUrl').value.trim(), text = document.getElementById('promoText').value.trim();
    if (!imageUrl) return alert('Please provide an image');
    promoData.items.push({ image: imageUrl, text: text }); _cachedPromo = promoData;
    firebaseSave('promo', promoData).then(() => { document.getElementById('promoImageUrl').value = ''; document.getElementById('promoText').value = ''; document.getElementById('promoImagePreview').innerHTML = '<span class="text-muted small">Enter a URL or upload</span>'; renderPromoAdmin(); });
}
function handlePromoFileUpload(input) {
    const file = input.files[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { alert('Invalid image type'); input.value = ''; return; }
    if (file.size > 500 * 1024) { alert('Image too large (max 500KB)'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => { const b64 = e.target.result; document.getElementById('promoImageUrl').value = b64; document.getElementById('promoImagePreview').innerHTML = `< img src = "${b64}" class="img-fluid rounded" style = "max-height:150px" alt = "Preview" > <div class="small mt-1" style="color:#10b981"><i class="fas fa-check-circle me-1"></i>${(file.size / 1024).toFixed(0)} KB</div>`; };
    reader.readAsDataURL(file);
}
function deletePromoItem(index) {
    if (!confirm('Remove this promo?')) return;
    promoData.items.splice(index, 1); firebaseSave('promo', promoData).then(() => renderPromoAdmin());
}
function renderPromoAdmin() {
    const list = document.getElementById('promoItemList'), toggle = document.getElementById('promoToggle');
    if (!list) return; if (toggle) toggle.checked = promoData.enabled;
    if (promoData.items.length === 0) { list.innerHTML = '<div class="text-center text-muted p-3"><i class="fas fa-images fs-3 mb-2 d-block" style="color:#475569"></i>No promo items yet</div>'; return; }
    list.innerHTML = promoData.items.map((item, i) => `
            < div class="d-flex gap-2 align-items-start border-bottom py-2" >
                <img src="${escapeHTML(item.image)}" class="rounded" style="width:60px;height:60px;object-fit:cover" onerror="this.style.background='#1e293b';this.src=''" alt="Promo">
                    <div class="flex-grow-1"><div class="small fw-bold text-truncate" style="max-width:200px">${escapeHTML(item.text) || '<em class="text-muted">No caption</em>'}</div><div style="font-size:0.7rem;color:#475569;word-break:break-all">${escapeHTML(item.image).substring(0, 50)}...</div></div>
                    <button onclick="deletePromoItem(${i})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button>
                </div>`).join('');
}

// --- Firebase Usage ---
const FB_LIMITS = { storageMB: 1024, bandwidthMB: 10240, base64WarnMB: 5 };
function flushBandwidthEstimate() {
    if (_sessionBandwidthBytes === 0) return Promise.resolve();
    const mk = new Date().toISOString().slice(0, 7);
    return firebaseLoad(`_usage / ${mk} `, { bytes: 0 }).then(u => { const updated = { bytes: (u.bytes || 0) + _sessionBandwidthBytes }; _sessionBandwidthBytes = 0; return firebaseSave(`_usage / ${mk} `, updated); });
}
function checkFirebaseUsage() {
    const container = document.getElementById('firebaseUsageAlerts'); if (!container) return;
    container.innerHTML = '<div class="text-center small py-2" style="color:#64748b"><i class="fas fa-spinner fa-spin me-1"></i>Checking usage...</div>';
    const paths = ['roster/rules', 'inventory', 'promo', 'doctors'];
    const mk = new Date().toISOString().slice(0, 7);
    Promise.all([...paths.map(p => firebaseLoad(p, null)), firebaseLoad(`_usage / ${mk} `, { bytes: 0 })]).then(results => {
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
        const row = (ico, lbl, used, limit, pct) => `< div style = "display:flex;align-items:center;gap:8px;margin-bottom:6px" ><span style="font-size:0.65rem">${dot(pct)}</span><span style="font-size:0.72rem;color:#94a3b8;min-width:72px;white-space:nowrap"><i class="fas ${ico}" style="width:13px;text-align:center;color:${barColor(pct)};margin-right:3px;font-size:0.65rem"></i>${lbl}</span><div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden"><div style="width:${Math.max(pct, 1)}%;height:100%;background:${barColor(pct)};border-radius:3px;transition:width 0.6s"></div></div><span style="font-size:0.65rem;color:#64748b;min-width:88px;text-align:right">${used} / ${limit}</span></div > `;
        container.innerHTML = `< div style = "border:1px solid ${accent}30;border-left:3px solid ${accent};border-radius:12px;padding:12px 16px;background:rgba(255,255,255,0.02)" > <div style="font-size:0.72rem;font-weight:700;color:${accent};margin-bottom:8px;display:flex;align-items:center;gap:5px"><i class="fas ${hasWarn ? 'fa-exclamation-triangle' : 'fa-shield-alt'}" style="font-size:0.65rem"></i>${hasWarn ? 'Firebase Usage Warning' : 'Firebase — All Clear'}</div>${row('fa-database', 'Storage', fmtSize(storageMB), '1 GB', storagePercent)}${row('fa-download', 'Bandwidth', fmtSize(bandwidthMB), '10 GB/mo', bandwidthPercent)}${base64MB > 0 ? row('fa-image', 'Base64', fmtSize(base64MB), '5 MB', base64Percent) : ''}</div > `;
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
            if (dx < 0 && currentStep < 3) {
                // Swipe left = next (only on pre-auth steps)
                if (currentStep === 1) goToStep(2);
                else if (currentStep === 2 && !document.getElementById('btnContinue').disabled) goToStep(3);
            } else if (dx > 0 && currentStep > 1 && currentStep <= 3) {
                // Swipe right = back
                goToStep(currentStep - 1);
            }
        }
    }, { passive: true });
})();

