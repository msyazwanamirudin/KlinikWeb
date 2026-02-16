AOS.init({ duration: 800, once: true });

// --- Loading Screen Dismissal ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
});

// --- Navbar Scroll Effect & ScrollSpy ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section, footer');

// --- Mobile Navbar Auto-Collapse on Link Click ---
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const navCollapse = document.getElementById('navContent');
        if (navCollapse && navCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse, { toggle: false });
            bsCollapse.hide();
        }
    });
});

window.addEventListener('scroll', function () {
    const nav = document.querySelector('.navbar');

    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');


    let current = '';


    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 150)) {
            const id = section.getAttribute('id');
            if (id) current = id;
        }
    });

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = 'mainFooter';
    }

    navLinks.forEach(link => {
        link.classList.remove('active-nav');

        const href = link.getAttribute('href');
        if (href && href.includes(current) && current !== '') {
            link.classList.add('active-nav');
        }
    });

    // --- Mobile Bottom Nav Active State ---
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-section]');
    bottomNavItems.forEach(item => {
        item.classList.remove('active');
        const section = item.getAttribute('data-section');
        if (section && section === current) {
            item.classList.add('active');
        }
    });

    const backToTop = document.getElementById('backToTop');
    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

// --- SCROLL TO TOP (HOME / BUTTON) ---
function scrollToTop(e) {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('backToTop').addEventListener('click', scrollToTop);


document.querySelectorAll('a[href="#home"]').forEach(anchor => {
    anchor.addEventListener('click', scrollToTop);
});

// --- Typing Effect (Simple) ---
const words = ["Your Family", "Your Future", "Your Baby", "Your Health"];
let i = 0;
let typeInterval = null;

function typeWriter() {
    const element = document.getElementById("typewriter");
    if (typeInterval) return; // Prevent duplicate intervals
    typeInterval = setInterval(() => {
        i = (i + 1) % words.length;
        element.style.opacity = 0;
        setTimeout(() => {
            element.textContent = words[i];
            element.style.opacity = 1;
        }, 500);
    }, 3000);
}
document.getElementById("typewriter").style.transition = "opacity 0.5s";
typeWriter();

// --- HTML Sanitization Helper (XSS Prevention) ---
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- GLOBAL IN-MEMORY CACHE ---
let _cachedRosterRules = null; // null = not yet loaded
let _cachedInventory = null;
let _cachedPromo = null;
let _cachedDoctors = null;

// --- CLINIC SETTINGS (Dynamic from Firebase) ---
let _clinicWhatsApp = '60172032048'; // default fallback

function applyClinicSettings() {
    firebaseLoad('settings', {}).then(data => {
        if (!data || typeof data !== 'object') return;

        // Clinic Name
        if (data.setClinicName) {
            const navName = document.getElementById('navClinicName');
            if (navName) navName.textContent = data.setClinicName;
            const footerName = document.getElementById('footerClinicName');
            if (footerName) footerName.textContent = data.setClinicName;
            document.title = data.setClinicName + ' | Premium Care';
        }
        // Address
        if (data.setAddress) {
            const el = document.getElementById('footerAddress');
            if (el) el.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>' + data.setAddress;
        }
        // Phone
        if (data.setPhone) {
            const el = document.getElementById('footerPhone');
            if (el) el.innerHTML = '<i class="fas fa-phone me-2"></i>' + data.setPhone;
            const callBtn = document.getElementById('footerCallNow');
            if (callBtn) callBtn.href = 'tel:' + data.setPhone.replace(/[^\d+]/g, '');
        }
        // Email
        if (data.setEmail) {
            const el = document.getElementById('footerEmail');
            if (el) el.innerHTML = '<i class="fas fa-envelope me-2"></i>' + data.setEmail;
        }
        // Operating Hours (Weekday)
        if (data.setHoursWeekday) {
            const el = document.getElementById('footerHoursWeekday');
            if (el) el.textContent = data.setHoursWeekday;
        }
        // WhatsApp
        if (data.setWhatsApp) {
            _clinicWhatsApp = data.setWhatsApp.replace(/[^\d]/g, '');
            const el = document.getElementById('footerWhatsApp');
            if (el) el.href = 'https://wa.me/' + _clinicWhatsApp;
        }
        // Facebook
        if (data.setFacebook) {
            const el = document.getElementById('footerFacebook');
            if (el) el.href = data.setFacebook;
        }
        // Instagram
        if (data.setInstagram) {
            const el = document.getElementById('footerInstagram');
            if (el) el.href = data.setInstagram;
        }
        // Map Embed
        if (data.setMapEmbed) {
            let mapUrl = data.setMapEmbed;
            // Auto-extract src from full iframe tag if accidentally saved
            if (mapUrl.includes('<iframe')) {
                const match = mapUrl.match(/src="([^"]+)"/);
                if (match) mapUrl = match[1];
            }
            if (mapUrl.startsWith('https://www.google.com/maps')) {
                const el = document.getElementById('footerMapEmbed');
                if (el) el.src = mapUrl;
                console.log('✅ Map embed loaded successfully');
            } else {
                console.warn('⚠️ Map embed URL ignored — not a valid Google Maps embed URL');
            }
        }

        console.log('✅ Clinic settings applied');
    }).catch(err => {
        console.warn('⚠️ Could not load clinic settings:', err.message);
    });
}

function getCachedRoster() {
    if (_cachedRosterRules !== null) return Promise.resolve(_cachedRosterRules);
    return firebaseLoad('roster/rules', []).then(rules => {
        _cachedRosterRules = rules || [];
        return _cachedRosterRules;
    });
}

function invalidateRosterCache() {
    _cachedRosterRules = null;
}

function getCachedPromo() {
    if (_cachedPromo !== null) return Promise.resolve(_cachedPromo);
    return firebaseLoad('promo', { enabled: false, items: [] }).then(data => {
        _cachedPromo = data || { enabled: false, items: [] };
        if (!_cachedPromo.items) _cachedPromo.items = [];
        return _cachedPromo;
    });
}

function getCachedDoctors() {
    if (_cachedDoctors !== null) return Promise.resolve(_cachedDoctors);
    return firebaseLoad('doctors', null).then(docs => {
        _cachedDoctors = (docs && Array.isArray(docs) && docs.length > 0) ? docs : [...DEFAULT_DOCTORS];
        return _cachedDoctors;
    });
}

// --- LIVE STATUS LOGIC (Refined & Synced) ---
function updateLiveStatus() {
    const now = new Date();
    const hour = now.getHours();
    const statusText = document.getElementById('liveStatusText');
    const statusDot = document.getElementById('liveStatusDot');

    // Footer Elements
    const footerText = document.getElementById('footerStatusText');
    const footerDot = document.getElementById('footerStatusDot');


    const isBreak = hour >= 12 && hour < 14;
    const isOpen = hour >= 9 && hour < 22;

    let text = "";
    let color = "";
    let shadow = "";
    let anim = "";

    if (isOpen) {
        if (isBreak) {
            text = "Doctor on Break (Resume 2:00 PM)";
            color = "#eab308";
            shadow = "none";
            anim = "none";
        } else {
            text = "Clinic Open";
            color = "#22c55e";
            shadow = "0 0 10px #22c55e";
            anim = "pulse 2s infinite";
        }
    } else {
        text = "Clinic Closed (Opens 9:00 AM)";
        color = "#ef4444";
        shadow = "none";
        anim = "none";
    }


    if (statusText) statusText.innerHTML = text;
    if (statusDot) {
        statusDot.style.backgroundColor = color;
        statusDot.style.boxShadow = shadow;
        statusDot.style.animation = anim;
    }


    if (footerText) footerText.innerHTML = text;
    if (footerDot) {
        footerDot.style.backgroundColor = color;
        footerDot.style.boxShadow = shadow;
        footerDot.style.animation = anim; // SYNC GLOWING ANIMATION
    }

    updateDoctorRoster(isOpen);
}

// --- PUBLIC ROSTER VIEW (PATIENT MODAL) ---

function updateDoctorRoster(isOpen) {
    const docText = document.getElementById('doctorDutyText');
    const topDocText = document.getElementById('topDoctorDuty');

    if (!isOpen) {
        if (docText) docText.innerHTML = "<span class='text-muted'>-</span>";
        if (topDocText) topDocText.innerHTML = "-";
        return;
    }

    const now = new Date();
    const day = now.getDay();
    const dateISO = now.toISOString().split('T')[0];


    getCachedRoster().then(rules => {
        const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
        const weekRules = rules.filter(r => r.type === 'weekly' && r.day === day);

        let activeRules = [];
        if (dateRules.length > 0) activeRules = dateRules;
        else if (weekRules.length > 0) activeRules = weekRules;

        let displayHtml = "";
        let simpleText = "";

        if (activeRules.length > 0) {
            displayHtml = activeRules.map(r => `<div>${r.doc} <span class="small text-muted">(${r.shift})</span></div>`).join('');
            simpleText = activeRules.map(r => r.doc).join(', ');
        } else {
            displayHtml = `<span class="text-muted fst-italic">No doctor on duty</span>`;
            simpleText = "No doctor on duty";
        }

        if (docText) docText.innerHTML = displayHtml;
        if (topDocText) topDocText.innerHTML = simpleText;
    });
}

function openRosterModal() {
    const modal = document.getElementById('rosterModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        generatePublicRoster();
    }
}

function closeRosterModal() {
    const modal = document.getElementById('rosterModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// --- MONTH CALENDAR STATE ---
let _rosterViewMonth = new Date(); // Tracks which month is displayed

function changeRosterMonth(delta) {
    _rosterViewMonth.setMonth(_rosterViewMonth.getMonth() + delta);
    generatePublicRoster();
}

function generatePublicRoster() {
    const container = document.getElementById('publicRosterCalendar');
    const label = document.getElementById('rosterMonthLabel');
    if (!container) return;

    const viewDate = new Date(_rosterViewMonth.getFullYear(), _rosterViewMonth.getMonth(), 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Update month label
    if (label) {
        label.textContent = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    getCachedRoster().then(rules => {
        const today = new Date();
        const todayISO = today.toISOString().split('T')[0];


        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;


        const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let html = '<div class="roster-cal-grid">';
        dayHeaders.forEach(dh => {
            html += `<div class="roster-cal-header">${dh}</div>`;
        });


        for (let e = 0; e < startDow; e++) {
            html += '<div class="roster-cal-cell roster-cal-empty"></div>';
        }


        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(year, month, day);
            const dateISO = d.toISOString().split('T')[0];
            const dayIdx = d.getDay();
            const isToday = dateISO === todayISO;
            const isPast = d < today && !isToday;


            const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
            const weekRules = rules.filter(r => r.type === 'weekly' && r.day === dayIdx);
            let activeRules = dateRules.length > 0 ? dateRules : (weekRules.length > 0 ? weekRules : []);


            const todayClass = isToday ? ' roster-cal-today' : '';
            const pastClass = isPast ? ' roster-cal-past' : '';
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

            html += `<div class="roster-cal-cell${todayClass}${pastClass}">`;
            html += `<div class="roster-cal-date">${day}<span class="roster-cal-day-name">${dayLabel}</span></div>`;

            activeRules.forEach(r => {
                const isOff = r.shift === 'Off';
                const shiftClass = isOff ? 'roster-shift-off' : 'roster-shift-on';
                const docDisplay = r.doc.replace(/ \(.*\)/, '');
                const shiftLabel = isOff ? 'OFF' : r.shift;
                html += `<div class="roster-cal-entry ${shiftClass}">`;
                html += `<span class="roster-doc-name">${isOff ? '<s>' + docDisplay + '</s>' : docDisplay}</span>`;
                html += `<span class="roster-shift-label">${shiftLabel}</span>`;
                html += `</div>`;
            });

            html += `</div>`;
        }


        const totalCells = startDow + daysInMonth;
        const remainder = totalCells % 7;
        if (remainder > 0) {
            for (let e = 0; e < 7 - remainder; e++) {
                html += '<div class="roster-cal-cell roster-cal-empty"></div>';
            }
        }

        html += '</div>';
        container.innerHTML = html;
    });
}


// --- ADVANCED ADMIN SYSTEM (LocalStorage CMS) ---


const ADMIN_HASH_SHA = "8d90ed647b948fa80c3c9bbf5316c78f151723f52fb9d6101f818af8afff69ec";
const ADMIN_EMAIL = "admin@klinik.com";
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 100 * 365 * 24 * 60 * 60 * 1000; // Permanent Lockout


async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


const DEFAULT_DOCTORS = [
    "Dr. Alia Syamim (Fertility)",
    "Dr. Sarah Lee (Pediatric)",
    "Dr. Hanim (General)",
    "Dr. Wong (Locum)",
    "Dr. Amin (Specialist)"
];
let DOCTORS = [...DEFAULT_DOCTORS];



function loadDoctors() {
    return firebaseLoad('doctors', null).then(docs => {
        if (docs && Array.isArray(docs) && docs.length > 0) {
            DOCTORS = docs;
        } else {
            DOCTORS = [...DEFAULT_DOCTORS];
        }
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
    firebaseSave('doctors', DOCTORS).then(() => {
        input.value = '';
        populateDoctorSelect();
        renderDoctorList();
    });
}

function removeDoctor(index) {
    const docName = DOCTORS[index];
    if (!confirm(`Remove ${docName}?\n\nAll roster rules for this doctor will also be deleted.`)) return;
    DOCTORS.splice(index, 1);
    firebaseSave('doctors', DOCTORS).then(() => {
        populateDoctorSelect();
        renderDoctorList();

        firebaseLoad('roster/rules', []).then(rules => {
            const cleaned = rules.filter(r => r.doc !== docName);
            if (cleaned.length !== rules.length) {
                firebaseSave('roster/rules', cleaned).then(() => {
                    invalidateRosterCache();
                    loadRosterAdmin();
                });
            }
        });
    });
}

function renderDoctorList() {
    const list = document.getElementById('doctorManageList');
    if (!list) return;
    if (DOCTORS.length === 0) {
        list.innerHTML = '<div class="text-muted small text-center p-2">No doctors registered</div>';
        return;
    }

    const sorted = DOCTORS.map((doc, i) => ({ name: String(doc || ''), idx: i })).sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML = sorted.map(item => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1 px-2">
            <span class="small fw-semibold text-dark">${escapeHTML(item.name)}</span>
            <button onclick="removeDoctor(${item.idx})" class="btn btn-outline-danger btn-sm border-0 py-0" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// 1. Security: Disable Right Click & Inspect Shortcuts
function blockContextMenu(event) { event.preventDefault(); }
function blockShortcuts(event) {

    if (event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
        (event.ctrlKey && event.key === 'u')) {
        event.preventDefault();
    }
}

document.addEventListener('contextmenu', blockContextMenu);
document.addEventListener('keydown', blockShortcuts);

function enableDebugMode() {
    document.removeEventListener('contextmenu', blockContextMenu);
    document.removeEventListener('keydown', blockShortcuts);

}

document.addEventListener('DOMContentLoaded', () => {

    loadDoctors();


    getCachedRoster().then(() => {
        updateLiveStatus();
    });


    loadPromoPublic();


    applyClinicSettings();


    const passInput = document.getElementById('adminPasswordInput');
    if (passInput) {
        passInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') verifyAdminLogin();
        });
    }
});

// --- UI MANAGERS ---
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminLoginScreen').style.display = 'block';
    document.getElementById('adminControlScreen').style.display = 'none';


    document.getElementById('adminEmailInput').value = '';
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('loginError').style.display = 'none';


    const title = document.querySelector('#adminLoginScreen p');
    if (title) {
        title.ondblclick = () => {
            if (confirm("Reset Security Lockout?")) {
                localStorage.removeItem('adminLockout');
                localStorage.removeItem('adminAttempts');
                alert("Lockout Reset.");
                document.getElementById('loginError').style.display = 'none';
            }
        };
    }

    document.body.classList.add('modal-open');


    const nav = document.getElementById('navbar-main');
    const topBtn = document.getElementById('backToTop');
    const chatBtn = document.querySelector('.chat-widget-btn');
    const chatWin = document.getElementById('chatWindow');

    if (nav) nav.style.display = 'none';
    if (topBtn) topBtn.style.display = 'none';
    if (chatBtn) chatBtn.style.display = 'none';
    if (chatWin) chatWin.style.display = 'none';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.body.classList.remove('modal-open');


    const nav = document.getElementById('navbar-main');
    const topBtn = document.getElementById('backToTop');
    const chatBtn = document.querySelector('.chat-widget-btn');

    if (nav) nav.style.display = '';
    if (topBtn) topBtn.style.display = '';
    if (chatBtn) chatBtn.style.display = '';
}

function verifyAdminLogin() {
    const errorMsg = document.getElementById('loginError');
    const email = document.getElementById('adminEmailInput').value.trim();
    const password = document.getElementById('adminPasswordInput').value.trim();


    const lockout = JSON.parse(localStorage.getItem('adminLockout') || '{}');
    if (lockout.active && Date.now() < lockout.until) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = "System Locked due to too many failed attempts.";
        return;
    }


    sha256(password).then(hash => {


        if (email === ADMIN_EMAIL && hash === ADMIN_HASH_SHA) {

            document.getElementById('adminLoginScreen').style.display = 'none';
            document.getElementById('adminControlScreen').style.display = 'block';
            loadInventory();
            loadDoctors();
            enableDebugMode();
            checkFirebaseUsage();


            firebaseListen('inventory', (data) => {
                _cachedInventory = data || [];
                localStorage.setItem('fb_inventory', JSON.stringify(_cachedInventory));
            });
            firebaseListen('roster/rules', (data) => {
                _cachedRosterRules = data || [];
                localStorage.setItem('fb_roster_rules', JSON.stringify(_cachedRosterRules));
                const rosterModal = document.getElementById('rosterModal');
                if (rosterModal && rosterModal.style.display === 'flex') {
                    generatePublicRoster();
                }
            });
            firebaseListen('promo', (data) => {
                _cachedPromo = data || { enabled: false, items: [] };
                if (!_cachedPromo.items) _cachedPromo.items = [];
                promoData = _cachedPromo;
            });
            firebaseListen('doctors', (data) => {
                _cachedDoctors = (data && Array.isArray(data) && data.length > 0) ? data : [...DEFAULT_DOCTORS];
                DOCTORS = _cachedDoctors;
            });


            localStorage.removeItem('adminLockout');
            localStorage.removeItem('adminAttempts');
        } else {

            let attempts = parseInt(localStorage.getItem('adminAttempts') || 0) + 1;
            localStorage.setItem('adminAttempts', attempts);

            if (attempts >= MAX_ATTEMPTS) {
                const unlockTime = Date.now() + LOCKOUT_TIME;
                localStorage.setItem('adminLockout', JSON.stringify({ active: true, until: unlockTime }));
                errorMsg.innerText = "System Locked.";
            } else {
                errorMsg.innerText = "Invalid Email or Password";
            }
            errorMsg.style.display = 'block';
        }
    });
}


function switchAdminTab(tab, event) {
    if (event) event.preventDefault();

    document.querySelectorAll('.admin-tab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-pills .nav-link').forEach(el => el.classList.remove('active'));

    if (tab === 'inventory') {
        document.getElementById('tabInventory').style.display = 'block';
        loadInventory();
        // Reset filters
        if (document.getElementById('invSearch')) {
            document.getElementById('invSearch').value = '';
            document.getElementById('invFilterCategory').value = 'All';
        }
    } else if (tab === 'roster') {
        document.getElementById('tabRoster').style.display = 'block';
        loadRosterAdmin();
        loadDoctors();
    } else if (tab === 'promo') {
        document.getElementById('tabPromo').style.display = 'block';
        loadPromoAdmin();
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// --- FIREBASE USAGE MONITORING ---
const FB_LIMITS = {
    storageMB: 1024,
    bandwidthMB: 10240,
    connections: 100,
    base64WarnMB: 5
};
const FB_THRESHOLD = 0.85;

function flushBandwidthEstimate() {
    if (_sessionBandwidthBytes === 0) return Promise.resolve();
    const monthKey = new Date().toISOString().slice(0, 7);
    const path = `_usage/${monthKey}`;
    return firebaseLoad(path, { bytes: 0 }).then(usage => {
        const updated = { bytes: (usage.bytes || 0) + _sessionBandwidthBytes };
        _sessionBandwidthBytes = 0;
        return firebaseSave(path, updated).then(() => updated);
    });
}

function checkFirebaseUsage() {
    const container = document.getElementById('firebaseUsageAlerts');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted small py-2"><i class="fas fa-spinner fa-spin me-1"></i>Checking usage...</div>';

    const paths = ['roster/rules', 'inventory', 'promo', 'doctors'];
    const monthKey = new Date().toISOString().slice(0, 7);

    Promise.all([
        ...paths.map(p => firebaseLoad(p, null)),
        firebaseLoad(`_usage/${monthKey}`, { bytes: 0 })
    ]).then(results => {
        const dataResults = results.slice(0, paths.length);
        const usageData = results[paths.length];

        let totalStorageBytes = 0;
        let totalBase64Bytes = 0;

        dataResults.forEach((data, i) => {
            if (data !== null) {
                totalStorageBytes += new Blob([JSON.stringify(data)]).size;
                if (paths[i] === 'promo' && data.items) {
                    data.items.forEach(item => {
                        if (item.image && item.image.startsWith('data:')) {
                            totalBase64Bytes += new Blob([item.image]).size;
                        }
                    });
                }
            }
        });

        const storageMB = totalStorageBytes / (1024 * 1024);
        const storagePercent = Math.min((storageMB / FB_LIMITS.storageMB) * 100, 100);

        const bandwidthBytes = (usageData.bytes || 0) + _sessionBandwidthBytes;
        const bandwidthMB = bandwidthBytes / (1024 * 1024);
        const bandwidthPercent = Math.min((bandwidthMB / FB_LIMITS.bandwidthMB) * 100, 100);

        const base64MB = totalBase64Bytes / (1024 * 1024);
        const base64Percent = Math.min((base64MB / FB_LIMITS.base64WarnMB) * 100, 100);

        flushBandwidthEstimate();

        const barColor = (pct) => pct >= 100 ? '#dc3545' : pct >= 85 ? '#f0ad4e' : '#198754';
        const dot = (pct) => pct >= 100 ? '\ud83d\udd34' : pct >= 85 ? '\ud83d\udfe1' : '\ud83d\udfe2';
        const hasWarn = storagePercent >= 85 || bandwidthPercent >= 85 || base64Percent >= 85;
        const accent = hasWarn ? (storagePercent >= 100 || bandwidthPercent >= 100 ? '#dc3545' : '#f0ad4e') : '#198754';

        const row = (ico, lbl, used, limit, pct, last) => `
            <div style="display:flex;align-items:center;gap:8px;${last ? '' : 'margin-bottom:6px;'}">
                <span style="font-size:0.65rem;">${dot(pct)}</span>
                <span style="font-size:0.72rem;color:#555;min-width:72px;white-space:nowrap;"><i class="fas ${ico}" style="width:13px;text-align:center;color:${barColor(pct)};margin-right:3px;font-size:0.65rem;"></i>${lbl}</span>
                <div style="flex:1;background:#e9ecef;border-radius:3px;height:5px;overflow:hidden;">
                    <div style="width:${Math.max(pct, 1)}%;height:100%;background:${barColor(pct)};border-radius:3px;transition:width 0.6s ease;"></div>
                </div>
                <span style="font-size:0.65rem;color:#999;min-width:88px;text-align:right;">${used} / ${limit}</span>
            </div>`;

        const fmtSize = (mb) => mb < 1 ? (mb * 1024).toFixed(0) + ' KB' : mb.toFixed(1) + ' MB';

        container.innerHTML = `
            <div style="border:1px solid ${accent}30;border-left:3px solid ${accent};border-radius:8px;padding:10px 14px 10px 12px;background:${hasWarn ? '#fffdf5' : '#f8fdf8'};position:relative;">
                <div onclick="this.parentElement.style.display='none'" style="position:absolute;top:6px;right:10px;cursor:pointer;color:#bbb;font-size:0.85rem;line-height:1;padding:2px 4px;border-radius:4px;" onmouseover="this.style.color='#666';this.style.background='#0001'" onmouseout="this.style.color='#bbb';this.style.background='none'">&times;</div>
                <div style="font-size:0.72rem;font-weight:700;color:${accent};margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                    <i class="fas ${hasWarn ? 'fa-exclamation-triangle' : 'fa-shield-alt'}" style="font-size:0.65rem;"></i>
                    ${hasWarn ? 'Firebase Usage Warning' : 'Firebase — All Clear'}
                </div>
                ${row('fa-database', 'Storage', fmtSize(storageMB), '1 GB', storagePercent, false)}
                ${row('fa-download', 'Bandwidth', fmtSize(bandwidthMB), '10 GB/mo', bandwidthPercent, base64MB <= 0)}
                ${base64MB > 0 ? row('fa-image', 'Base64 Img', fmtSize(base64MB), '5 MB', base64Percent, true) : ''}
                ${hasWarn ? '<div style="font-size:0.65rem;color:#9a6700;margin-top:6px;border-top:1px solid #f0e6c8;padding-top:5px;"><i class="fas fa-lightbulb me-1" style="color:#e6a817;"></i>Use external image URLs (Imgur, Cloudinary) to reduce usage.</div>' : ''}
            </div>`;

        console.log(`\ud83d\udcca Firebase Usage \u2014 Storage: ${storageMB.toFixed(2)} MB | Bandwidth: ${bandwidthMB.toFixed(1)} MB | Base64: ${base64MB.toFixed(1)} MB`);
    }).catch(err => {
        console.warn('Firebase usage check failed:', err);
        container.innerHTML = '';
    });
}


// --- ADMIN ROSTER STATE ---
let latestRosterRules = [];
let _adminRosterViewMode = 'weekly'; // 'weekly' or 'monthly'
let _adminRosterViewMonth = new Date();
let _adminRosterViewWeek = new Date();
// Align to current Monday
const _d = _adminRosterViewWeek.getDay();
const _diff = _adminRosterViewWeek.getDate() - _d + (_d === 0 ? -6 : 1);
_adminRosterViewWeek.setDate(_diff);

function switchAdminRosterView(mode) {
    _adminRosterViewMode = mode;
    const weeklyDiv = document.getElementById('adminWeeklyOverview');
    const monthlyDiv = document.getElementById('adminMonthlyOverview');

    if (mode === 'weekly') {
        if (weeklyDiv) weeklyDiv.style.display = 'block';
        if (monthlyDiv) monthlyDiv.style.display = 'none';
        renderWeeklyOverview(latestRosterRules || []);
    } else {
        if (weeklyDiv) weeklyDiv.style.display = 'none';
        if (monthlyDiv) monthlyDiv.style.display = 'block';
        renderAdminMonthlyOverview(latestRosterRules || []);
    }
}

function changeAdminRosterMonth(delta) {
    _adminRosterViewMonth.setMonth(_adminRosterViewMonth.getMonth() + delta);
    renderAdminMonthlyOverview(latestRosterRules || []);
}

function changeAdminRosterWeek(delta) {
    _adminRosterViewWeek.setDate(_adminRosterViewWeek.getDate() + (delta * 7));
    renderWeeklyOverview(latestRosterRules || []);
}

function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0 .. Sun=6
    const adjustedDate = date.getDate() + dayOfWeek;
    return Math.ceil(adjustedDate / 7);
}

function loadRosterAdmin() {
    invalidateRosterCache();
    firebaseLoad('roster/rules', []).then(rules => {
        _cachedRosterRules = rules || [];
        latestRosterRules = rules;
        renderRosterList(rules);


        if (_adminRosterViewMode === 'weekly') {
            renderWeeklyOverview(rules);
        } else {
            renderAdminMonthlyOverview(rules);
        }
    });
}

function renderAdminMonthlyOverview(rules) {
    const container = document.getElementById('adminRosterCalendar');
    const label = document.getElementById('adminRosterMonthLabel');
    if (!container) return;

    const viewDate = new Date(_adminRosterViewMonth.getFullYear(), _adminRosterViewMonth.getMonth(), 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();


    if (label) {
        label.textContent = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];


    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;


    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = '<div class="roster-cal-grid">';
    dayHeaders.forEach(dh => {
        html += `<div class="roster-cal-header">${dh}</div>`;
    });


    for (let e = 0; e < startDow; e++) {
        html += '<div class="roster-cal-cell roster-cal-empty"></div>';
    }


    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateISO = d.toISOString().split('T')[0];
        const dayIdx = d.getDay();
        const isToday = dateISO === todayISO;
        const isPast = d < today && !isToday;


        const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
        const weekRules = rules.filter(r => r.type === 'weekly' && r.day === dayIdx);
        let activeRules = dateRules.length > 0 ? dateRules : (weekRules.length > 0 ? weekRules : []);



        const todayClass = isToday ? ' roster-cal-today' : '';
        const pastClass = isPast ? ' roster-cal-past' : '';
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

        html += `<div class="roster-cal-cell${todayClass}${pastClass}">`;
        html += `<div class="roster-cal-date">${day}<span class="roster-cal-day-name">${dayLabel}</span></div>`;

        activeRules.forEach(r => {
            const isOff = r.shift === 'Off';
            const shiftClass = isOff ? 'roster-shift-off' : 'roster-shift-on';
            const docDisplay = r.doc.replace(/ \(.*\)/, '');
            const shiftLabel = isOff ? 'OFF' : r.shift;
            html += `<div class="roster-cal-entry ${shiftClass}">`;
            html += `<span class="roster-doc-name">${isOff ? '<s>' + docDisplay + '</s>' : docDisplay}</span>`;
            html += `<span class="roster-shift-label">${shiftLabel}</span>`;
            html += `</div>`;
        });

        html += `</div>`;
    }


    const totalCells = startDow + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder > 0) {
        for (let e = 0; e < 7 - remainder; e++) {
            html += '<div class="roster-cal-cell roster-cal-empty"></div>';
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

function renderWeeklyOverview(rules) {
    const container = document.getElementById('adminWeeklyOverview');
    if (!container) return;


    const startOfWeek = new Date(_adminRosterViewWeek);
    const weekNum = getWeekOfMonth(startOfWeek);
    const monthName = startOfWeek.toLocaleDateString('en-GB', { month: 'short' });
    const weekLabel = `Week ${weekNum} of ${monthName}`;

    let html = `<div class="border rounded shadow-sm overflow-hidden">
        <div class="bg-primary text-white px-3 py-2 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
                <i class="fas fa-calendar-week"></i>
                <span class="fw-bold small text-uppercase">Weekly Overview</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-link text-white p-0 hover-opacity" onclick="changeAdminRosterWeek(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="fw-bold small mx-1" style="min-width: 90px; text-align: center;">${weekLabel}</span>
                <button class="btn btn-sm btn-link text-white p-0 hover-opacity" onclick="changeAdminRosterWeek(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <div class="table-responsive">
        <table class="table table-bordered table-sm mb-0 align-middle roster-week-table" style="font-size: 0.8rem;">
            <thead class="table-light">
                <tr>
                    <th class="text-center" style="width: 14.28%;">Mon</th>
                    <th class="text-center" style="width: 14.28%;">Tue</th>
                    <th class="text-center" style="width: 14.28%;">Wed</th>
                    <th class="text-center" style="width: 14.28%;">Thu</th>
                    <th class="text-center" style="width: 14.28%;">Fri</th>
                    <th class="text-center" style="width: 14.28%;">Sat</th>
                    <th class="text-center" style="width: 14.28%;">Sun</th>
                </tr>
            </thead>
            <tbody><tr>`;


    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);

        const dateISO = d.toISOString().split('T')[0];
        const dayIdx = d.getDay();

        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();


        const dateRules = rules.filter(r => r.type === 'date' && r.date === dateISO);
        const weekRules = rules.filter(r => r.type === 'weekly' && r.day === dayIdx);
        let activeRules = dateRules.length > 0 ? dateRules : (weekRules.length > 0 ? weekRules : []);



        let cellContent = `<div class="fw-bold mb-1 text-secondary" style="font-size:0.7rem;">${d.getDate()}/${d.getMonth() + 1}</div>`;

        activeRules.forEach(r => {
            const isOff = r.shift === 'Off';
            const style = isOff ? 'text-decoration: line-through; color: #999;' : 'color: #0d6efd; font-weight: 600;';
            const shortDoc = r.doc.replace(/ \(.*\)/, '');
            cellContent += `<div style="${style}">${shortDoc}</div>`;
            if (!isOff) cellContent += `<div class="text-muted" style="font-size:0.7rem;">${r.shift}</div>`;
            else cellContent += `<div class="text-danger" style="font-size:0.7rem;">OFF</div>`;
        });

        const bgClass = isToday ? 'bg-warning bg-opacity-10' : '';
        html += `<td class="text-center p-2 ${bgClass}">${cellContent}</td>`;
    }

    html += `</tr></tbody></table></div></div>`;
    container.innerHTML = html;
}

function renderRosterList(rules) {
    const list = document.getElementById('rosterList');
    const empty = document.getElementById('rosterEmpty');
    const btnDelete = document.getElementById('btnDeleteSelected');
    if (!list) return;


    if (btnDelete) btnDelete.disabled = true;
    const selectAll = document.getElementById('selectAllRules');
    if (selectAll) selectAll.checked = false;

    if (rules.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';


    let displayRules = rules.map((r, i) => ({ ...r, _origIdx: i }));


    displayRules.sort((a, b) => {
        if (a.type === 'date' && b.type === 'weekly') return -1;
        if (a.type === 'weekly' && b.type === 'date') return 1;
        if (a.type === 'date' && b.type === 'date') return new Date(a.date) - new Date(b.date);
        return a.day - b.day;
    });

    let html = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    displayRules.forEach((rule) => {
        let whenLabel = '';
        let badgeHtml = '';

        if (rule.type === 'weekly') {
            whenLabel = 'Every ' + days[rule.day];
            badgeHtml = '<span class="badge bg-info text-dark">Weekly</span>';
        } else {
            const d = new Date(rule.date + 'T00:00:00');
            whenLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (' + days[d.getDay()] + ')';
            badgeHtml = '<span class="badge bg-primary">Date</span>';
        }

        html += `
        <tr>
            <td class="text-center">
                <input type="checkbox" class="form-check-input rule-checkbox" 
                    value="${rule._origIdx}" onchange="updateBatchButtons()">
            </td>
            <td>
                <div class="fw-semibold text-dark">${whenLabel}</div>
                <div class="small text-muted">${badgeHtml} &bull; ${escapeHTML(rule.shift)}</div>
            </td>
            <td class="text-dark">${escapeHTML(rule.doc)}</td>
            <td class="text-end">
                <button onclick="editRosterRule(${rule._origIdx})" class="btn btn-outline-primary btn-sm border-0 me-1" title="Edit"><i class="fas fa-pen"></i></button>
                <button onclick="deleteRosterRule(${rule._origIdx})" class="btn btn-outline-danger btn-sm border-0" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });

    list.innerHTML = html;
}

// Batch Operations
function toggleAllRules(source) {
    document.querySelectorAll('.rule-checkbox').forEach(cb => cb.checked = source.checked);
    updateBatchButtons();
}

function updateBatchButtons() {
    const anyChecked = document.querySelectorAll('.rule-checkbox:checked').length > 0;
    document.getElementById('btnDeleteSelected').disabled = !anyChecked;
}

function deleteSelectedRules() {
    const checked = document.querySelectorAll('.rule-checkbox:checked');
    if (checked.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${checked.length} selected rules ? `)) return;

    const indices = Array.from(checked).map(cb => parseInt(cb.value));

    indices.sort((a, b) => b - a);

    firebaseLoad('roster/rules', []).then(rules => {
        indices.forEach(idx => {
            if (idx >= 0 && idx < rules.length) rules.splice(idx, 1);
        });
        firebaseSave('roster/rules', rules);
        invalidateRosterCache();
        loadRosterAdmin();
        alert("Selected rules deleted.");
    });
}

function clearAllRules() {
    if (!confirm("⚠️ DANGER: Are you sure you want to delete ALL roster rules?")) return;
    if (!confirm("🔴 DOUBLE CHECK: This actions cannot be undone. Confirm clear all?")) return;

    firebaseSave('roster/rules', []);
    invalidateRosterCache();
    loadRosterAdmin();
    alert("All rules cleared.");
}

let _editingRuleIndex = -1;

function editRosterRule(index) {
    const rule = latestRosterRules[index];
    if (!rule) return;

    _editingRuleIndex = index;


    const form = document.getElementById('rosterForm');
    form.style.display = 'block';


    if (rule.type === 'weekly') {
        document.getElementById('ruleWeekly').checked = true;
        document.getElementById('rosterDay').value = rule.day;
    } else {
        document.getElementById('ruleDate').checked = true;
        document.getElementById('rosterDateStart').value = rule.date;
        document.getElementById('rosterDateEnd').value = '';
    }
    toggleRuleInputs();

    document.getElementById('rosterDocSelect').value = rule.doc;
    document.getElementById('rosterShift').value = rule.shift;


    const saveBtn = form.querySelector('button[onclick="addRosterRule()"]');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Update Rule';


    form.scrollIntoView({ behavior: 'smooth' });
}

function toggleRosterForm() {
    const form = document.getElementById('rosterForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {

        _editingRuleIndex = -1;
        document.getElementById('ruleDate').checked = true;
        document.getElementById('rosterDateStart').value = '';
        document.getElementById('rosterDateEnd').value = '';
        document.getElementById('rosterShift').value = 'Full Day';
        toggleRuleInputs();

        const saveBtn = form.querySelector('button[onclick="addRosterRule()"]');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Rule';
    }
}

function toggleRuleInputs() {
    const isWeekly = document.getElementById('ruleWeekly').checked;
    document.getElementById('inputDateGroup').style.display = isWeekly ? 'none' : 'block';
    document.getElementById('inputDayGroup').style.display = isWeekly ? 'block' : 'none';
}

function addRosterRule() {
    const isWeekly = document.getElementById('ruleWeekly').checked;
    const doc = document.getElementById('rosterDocSelect').value;
    const shift = document.getElementById('rosterShift').value;

    let newRulesToAdd = [];

    if (isWeekly) {
        newRulesToAdd.push({
            type: 'weekly',
            day: parseInt(document.getElementById('rosterDay').value),
            doc, shift
        });
    } else {
        const startDateVal = document.getElementById('rosterDateStart').value;
        const endDateVal = document.getElementById('rosterDateEnd').value;

        if (!startDateVal) return alert("Please select a date");

        if (endDateVal && endDateVal < startDateVal) {
            return alert("End date cannot be before start date");
        }

        if (endDateVal) {

            let curr = new Date(startDateVal);
            const end = new Date(endDateVal);

            const diffTime = Math.abs(end - curr);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 31) return alert("Range too large. Max 31 days allowed.");

            while (curr <= end) {
                newRulesToAdd.push({
                    type: 'date',
                    date: curr.toISOString().split('T')[0],
                    doc, shift
                });
                curr.setDate(curr.getDate() + 1);
            }
        } else {

            newRulesToAdd.push({
                type: 'date',
                date: startDateVal,
                doc, shift
            });
        }
    }

    firebaseLoad('roster/rules', []).then(rules => {
        let conflicts = [];
        let duplicates = [];


        newRulesToAdd.forEach(newRule => {
            let existingIndex = -1;

            if (newRule.type === 'weekly') {
                existingIndex = rules.findIndex((r, idx) =>
                    idx !== _editingRuleIndex &&
                    r.type === 'weekly' &&
                    r.day === newRule.day &&
                    r.doc === newRule.doc &&
                    r.shift === newRule.shift
                );
            } else {
                existingIndex = rules.findIndex((r, idx) =>
                    idx !== _editingRuleIndex &&
                    r.type === 'date' &&
                    r.date === newRule.date &&
                    r.doc === newRule.doc &&
                    r.shift === newRule.shift
                );
            }

            if (existingIndex !== -1) {
                duplicates.push(`${newRule.date || 'Day ' + newRule.day} (${newRule.doc} - ${newRule.shift})`);
            }
        });

        if (duplicates.length > 0) {
            alert(`Error: Duplicate assignments found: \n` + duplicates.slice(0, 3).join('\n') + (duplicates.length > 3 ? '\n...' : ''));
            return;
        }

        // CROSS-TYPE CONFLICT: Same Doctor on overlapping Date vs Weekly
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        newRulesToAdd.forEach(newRule => {
            if (newRule.type === 'date') {

                const dateObj = new Date(newRule.date);
                const dayOfWeek = dateObj.getDay();
                const weeklyConflict = rules.find((r, idx) =>
                    idx !== _editingRuleIndex &&
                    r.type === 'weekly' && r.day === dayOfWeek && r.doc === newRule.doc
                );
                if (weeklyConflict) {
                    conflicts.push(`${newRule.doc} already has a recurring ${days[dayOfWeek]} rule. Delete the weekly rule first.`);
                }
            } else if (newRule.type === 'weekly') {

                const dateConflict = rules.find((r, idx) => {
                    if (idx === _editingRuleIndex) return false;
                    if (r.type !== 'date' || r.doc !== newRule.doc) return false;
                    return new Date(r.date).getDay() === newRule.day;
                });
                if (dateConflict) {
                    conflicts.push(`${newRule.doc} already has a date-specific rule on a ${days[newRule.day]}. Delete it first.`);
                }
            }
        });

        if (conflicts.length > 0) {
            alert(`Error: Schedule conflict detected: \n` + conflicts.slice(0, 3).join('\n') + (conflicts.length > 3 ? '\n...' : ''));
            return;
        }


        if (_editingRuleIndex >= 0 && newRulesToAdd.length === 1) {
            rules[_editingRuleIndex] = newRulesToAdd[0];
        } else {
            rules.push(...newRulesToAdd);
        }

        firebaseSave('roster/rules', rules).then(() => {
            _editingRuleIndex = -1;
            invalidateRosterCache();
            const form = document.getElementById('rosterForm');
            form.style.display = 'none';

            const saveBtn = form.querySelector('button[onclick="addRosterRule()"]');
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Rule';
            loadRosterAdmin();
        });
    });
}

function deleteRosterRule(index) {
    if (!confirm("Delete this rule?")) return;
    firebaseLoad('roster/rules', []).then(rules => {
        if (index >= 0 && index < rules.length) {
            rules.splice(index, 1);
            firebaseSave('roster/rules', rules).then(() => {
                invalidateRosterCache();
                loadRosterAdmin();
            });
        }
    });
}

function populateDoctorSelect() {
    const sel = document.getElementById('rosterDocSelect');
    if (!sel) return;
    sel.innerHTML = '';
    DOCTORS.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc;
        opt.textContent = doc;
        sel.appendChild(opt);
    });
}

// --- INVENTORY MANAGEMENT ---
let latestInventory = [];
let _invSortBy = 'name';

function setInventorySort(sortBy) {
    _invSortBy = sortBy;
    filterInventory();
}

function toggleInventoryForm() {
    const form = document.getElementById('inventoryForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function loadInventory() {
    const list = document.getElementById('inventoryList');
    const empty = document.getElementById('inventoryEmpty');


    firebaseLoad('inventory', []).then(items => {
        latestInventory = items;
        renderInventory(items, list, empty);
    });
}

function renderInventory(items, list, empty) {
    if (!list) return;


    const searchTerm = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    const filterCat = document.getElementById('invFilterCategory') ? document.getElementById('invFilterCategory').value : 'All';


    items = items.map((item, index) => ({ ...item, originalIndex: index })).filter(item => {
        const matchName = item.name.toLowerCase().includes(searchTerm);
        const matchCat = filterCat === 'All' || item.category === filterCat;
        return matchName && matchCat;
    });

    if (items.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    let html = '';

    switch (_invSortBy) {
        case 'name':
            items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'category':
            items.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
            break;
        case 'stock':
            items.sort((a, b) => parseInt(a.qty || 0) - parseInt(b.qty || 0));
            break;
        case 'stock-desc':
            items.sort((a, b) => parseInt(b.qty || 0) - parseInt(a.qty || 0));
            break;
        case 'expiry':
        default:
            items.sort((a, b) => {
                if (!a.expiry) return 1;
                if (!b.expiry) return -1;
                return new Date(a.expiry) - new Date(b.expiry);
            });
            break;
    }

    items.forEach((item) => {
        let statusClass = '';
        let statusBadge = '';

        if (item.expiry) {
            const today = new Date();
            const expDate = new Date(item.expiry);
            const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) {
                statusClass = 'table-danger';
                statusBadge = '<span class="badge bg-danger ms-1">EXPIRED</span>';
            } else if (daysLeft < 60) {
                statusClass = 'table-warning';
                statusBadge = `<span class="badge bg-warning text-dark ms-1">Exp: ${item.expiry}</span>`;
            } else {
                statusBadge = `<span class="badge bg-secondary ms-1" style="font-size:0.65rem">Exp: ${item.expiry}</span>`;
            }
        }

        const catColors = {
            'Medicine': 'bg-primary',
            'Supplements': 'bg-success',
            'Equipment': 'bg-info text-dark',
            'Stationery': 'bg-warning text-dark',
            'Others': 'bg-secondary'
        };
        const badgeClass = catColors[item.category] || 'bg-secondary';

        html += `
        <tr class="${statusClass}">
            <td>
                <div class="fw-bold text-dark">${escapeHTML(item.name)}</div>
                <span class="badge ${badgeClass}" style="font-size:0.7rem">${item.category || 'Medicine'}</span>
                ${statusBadge}
            </td>
            <td>
                 <span class="small text-muted">${item.category || 'Medicine'}</span>
            </td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <button onclick="updateStock(${item.originalIndex}, -1)" class="btn btn-outline-danger btn-sm py-0 px-2 fw-bold">-</button>
                    <span class="fw-bold" style="min-width: 30px; text-align: center;">${item.qty}</span>
                    <button onclick="updateStock(${item.originalIndex}, 1)" class="btn btn-outline-success btn-sm py-0 px-2 fw-bold">+</button>
                </div>
            </td>
            <td class="text-end">
                <button onclick="deleteInventoryItem(${item.originalIndex})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });

    list.innerHTML = html;
}

function filterInventory() {
    const list = document.getElementById('inventoryList');
    const empty = document.getElementById('inventoryEmpty');
    renderInventory(latestInventory, list, empty);
}

function updateStock(index, change) {
    firebaseLoad('inventory', []).then(items => {
        if (items[index]) {
            let newQty = parseInt(items[index].qty) + change;
            if (newQty < 0) newQty = 0;
            items[index].qty = newQty;
            firebaseSave('inventory', items).then(() => loadInventory());
        }
    });
}

function addInventoryItem() {
    const name = document.getElementById('invName').value.trim();
    const qty = parseInt(document.getElementById('invQty').value);
    const expiry = document.getElementById('invExpiry').value;
    const category = document.getElementById('invCategory').value;

    if (!name || isNaN(qty)) return alert("Name and Quantity are required");

    firebaseLoad('inventory', []).then(items => {

        const existingIndex = items.findIndex(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item.expiry === expiry
        );

        if (existingIndex !== -1) {
            items[existingIndex].qty = parseInt(items[existingIndex].qty) + qty;
            alert(`Updated stock for ${items[existingIndex].name}.New Qty: ${items[existingIndex].qty} `);
        } else {
            items.push({ name, qty, expiry, category });
        }

        firebaseSave('inventory', items).then(() => {

            document.getElementById('invName').value = '';
            document.getElementById('invQty').value = '';
            document.getElementById('invExpiry').value = '';
            toggleInventoryForm();
            loadInventory();
        });
    });
}

function deleteInventoryItem(index) {
    if (!confirm("Remove this item permanently?")) return;
    firebaseLoad('inventory', []).then(items => {
        items.splice(index, 1);
        firebaseSave('inventory', items).then(() => loadInventory());
    });
}


// --- PROMO MANAGEMENT SYSTEM ---
let promoData = { enabled: false, items: [] };

function loadPromoAdmin() {
    firebaseLoad('promo', { enabled: false, items: [] }).then(data => {
        promoData = data || { enabled: false, items: [] };
        if (!promoData.items) promoData.items = [];
        _cachedPromo = promoData;
        renderPromoAdmin();
    });
}

function loadPromoPublic() {
    getCachedPromo().then(data => {
        promoData = data;
        renderPromoPublic();
    });
}

function togglePromoSection() {
    const toggle = document.getElementById('promoToggle');
    promoData.enabled = toggle.checked;
    firebaseSave('promo', promoData).then(() => {
        renderPromoPublic();
    });
}

function previewPromoImage() {
    const url = document.getElementById('promoImageUrl').value.trim();
    const preview = document.getElementById('promoImagePreview');
    if (!url) {
        preview.innerHTML = '<span class="text-muted small">Enter a URL above to preview</span>';
        return;
    }
    preview.innerHTML = '<span class="text-primary small"><i class="fas fa-spinner fa-spin me-1"></i>Loading...</span>';
    const img = new Image();
    img.onload = () => {
        preview.innerHTML = `
            <img src="${escapeHTML(url)}" class="img-fluid rounded" style="max-height:150px;" alt="Preview">
            <div class="text-success small mt-1"><i class="fas fa-check-circle me-1"></i>Image loaded successfully</div>
        `;
    };
    img.onerror = () => {
        preview.innerHTML = `
            <div class="text-danger small"><i class="fas fa-times-circle me-1"></i>Failed to load image. Check the URL.</div>
        `;
    };
    img.src = url;
}

function addPromoItem() {
    const imageUrl = document.getElementById('promoImageUrl').value.trim();
    const text = document.getElementById('promoText').value.trim();
    if (!imageUrl) return alert('Please provide an image (URL or upload)');

    promoData.items.push({ image: imageUrl, text: text });
    _cachedPromo = promoData;
    firebaseSave('promo', promoData).then(() => {
        document.getElementById('promoImageUrl').value = '';
        document.getElementById('promoText').value = '';
        document.getElementById('promoImagePreview').innerHTML = '<span class="text-muted small">Enter a URL or upload an image</span>';
        renderPromoAdmin();
        renderPromoPublic();
    });
}

function handlePromoFileUpload(input) {
    const file = input.files[0];
    if (!file) return;


    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG, WebP, or GIF)');
        input.value = '';
        return;
    }
    if (file.size > 500 * 1024) {
        alert('Image too large. Please use an image under 500 KB to stay within Firebase free tier.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        document.getElementById('promoImageUrl').value = base64;

        const preview = document.getElementById('promoImagePreview');
        preview.innerHTML = `
            <img src="${base64}" class="img-fluid rounded" style="max-height:150px;" alt="Preview">
            <div class="text-success small mt-1"><i class="fas fa-check-circle me-1"></i>Image loaded (${(file.size / 1024).toFixed(0)} KB)</div>
        `;
    };
    reader.readAsDataURL(file);
}

function deletePromoItem(index) {
    if (!confirm('Remove this promo item?')) return;
    promoData.items.splice(index, 1);
    firebaseSave('promo', promoData).then(() => {
        renderPromoAdmin();
        renderPromoPublic();
    });
}

function renderPromoAdmin() {
    const list = document.getElementById('promoItemList');
    const toggle = document.getElementById('promoToggle');
    if (!list) return;

    if (toggle) toggle.checked = promoData.enabled;

    if (promoData.items.length === 0) {
        list.innerHTML = '<div class="text-center text-muted p-3"><i class="fas fa-images fs-3 mb-2 d-block text-secondary"></i>No promo items added yet</div>';
        return;
    }

    list.innerHTML = promoData.items.map((item, i) => `
        <div class="d-flex gap-2 align-items-start border-bottom py-2">
            <img src="${escapeHTML(item.image)}" class="rounded" style="width:60px;height:60px;object-fit:cover;"
                onerror="this.style.background='#f0f0f0';this.src='';this.alt='Failed'" alt="Promo">
            <div class="flex-grow-1">
                <div class="small fw-bold text-truncate" style="max-width:200px;">${escapeHTML(item.text) || '<em class="text-muted">No caption</em>'}</div>
                <div class="text-muted" style="font-size:0.7rem;word-break:break-all;">${escapeHTML(item.image).substring(0, 50)}...</div>
            </div>
            <button onclick="deletePromoItem(${i})" class="btn btn-outline-danger btn-sm border-0"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function renderPromoPublic() {
    const container = document.getElementById('promoPublicSection');
    if (!container) return;

    if (!promoData.enabled || !promoData.items || promoData.items.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    let slidesHtml = promoData.items.map((item, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <div class="promo-slide-inner">
                <img src="${escapeHTML(item.image)}" class="promo-slide-img" alt="Promo ${i + 1}"
                    onerror="this.style.background='linear-gradient(135deg,#ccfbf1,#0f766e)';this.style.minHeight='300px';this.src='';">
                ${item.text ? `<div class="promo-slide-caption">
                    <div class="promo-caption-inner">
                        <i class="fas fa-sparkles promo-caption-icon"></i>
                        <span class="promo-caption-text">${escapeHTML(item.text)}</span>
                    </div>
                </div>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="container py-4">
            <div class="text-center mb-3">
                <span class="text-primary fw-bold letter-spacing-2 text-uppercase small">Special Offers</span>
                <h3 class="fw-bold mt-1">Promotions</h3>
            </div>
            <div id="promoCarousel" class="carousel slide rounded-4 overflow-hidden shadow" data-bs-ride="carousel" data-bs-interval="4000">
                <div class="carousel-inner">${slidesHtml}</div>
                ${promoData.items.length > 1 ? `
                    <button class="carousel-control-prev" type="button" data-bs-target="#promoCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#promoCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon"></span>
                    </button>
                    <div class="carousel-indicators">
                        ${promoData.items.map((_, i) => `<button type="button" data-bs-target="#promoCarousel" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}" style="width:8px;height:8px;border-radius:50%;"></button>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// --- PUBLIC HEALTH TOOLS ---
function calculateBMI() {
    const hInput = document.getElementById('bmiHeight');
    const wInput = document.getElementById('bmiWeight');
    const resultDiv = document.getElementById('bmiResult');

    if (!hInput.value || !wInput.value) return alert("Enter valid height & weight");

    const h = parseFloat(hInput.value) / 100;
    const w = parseFloat(wInput.value);


    resultDiv.innerHTML = '<span class="text-primary"><i class="fas fa-spinner fa-spin me-2"></i>Calculating...</span>';

    setTimeout(() => {
        const bmi = (w / (h * h)).toFixed(1);
        let status = "";
        let color = "";
        let advice = "";

        if (bmi < 18.5) {
            status = "Underweight";
            color = "text-info";
            advice = "Eat more nutrient-rich foods.";
        } else if (bmi < 25) {
            status = "Normal";
            color = "text-success";
            advice = "Great! Maintain your balanced diet.";
        } else if (bmi < 30) {
            status = "Overweight";
            color = "text-warning";
            advice = "Consider regular exercise.";
        } else {
            status = "Obese";
            color = "text-danger";
            advice = "Please consult a doctor for advice.";
        }

        resultDiv.innerHTML = `
        <div> BMI: <span class="display-6 fw-bold ${color}">${bmi}</span></div>
            <div class="fw-bold ${color}">${status}</div>
            <div class="small text-muted mt-1"><i class="fas fa-info-circle me-1"></i>${advice}</div>
    `;
    }, 800);
}

function calculateDueDate() {
    const lmpInput = document.getElementById('lmpDate');
    const resultDiv = document.getElementById('eddResult');

    const lmp = new Date(lmpInput.value);
    if (isNaN(lmp)) return alert("Select a date");


    resultDiv.innerHTML = '<span class="text-primary"><i class="fas fa-spinner fa-spin me-2"></i>Calculating...</span>';

    setTimeout(() => {
        const due = new Date(lmp);
        due.setDate(lmp.getDate() + 280);

        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateStr = due.toLocaleDateString('en-US', options);

        resultDiv.innerHTML = `
        <div class="small text-muted mb-1">Estimated Due Date:</div>
            <div class="h5 fw-bold text-primary mb-0">${dateStr}</div>
            <div class="small text-muted mt-1">based on 40-week gestation</div>
    `;
    }, 800);
}




setInterval(updateLiveStatus, 300000);

// --- HIDE STATUS BAR ON FOOTER SCROLL (runs on load) ---
(function () {
    const footer = document.getElementById('mainFooter');
    const statusBar = document.querySelector('.status-bar');
    const navbar = document.querySelector('.navbar');
    const contactLink = document.querySelector('a[href="#mainFooter"]');

    if (footer && statusBar) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statusBar.classList.add('hidden-bar');
                    if (navbar) navbar.classList.add('move-up');


                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    if (contactLink) {
                        contactLink.classList.add('active');
                        contactLink.classList.add('active-nav');
                    }

                } else {
                    statusBar.classList.remove('hidden-bar');
                    if (navbar) navbar.classList.remove('move-up');


                    if (contactLink) {
                        contactLink.classList.remove('active');
                        contactLink.classList.remove('active-nav');
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(footer);
    }
})();


// --- WHATSAPP BOOKING LOGIC (With Confirmation) ---
function bookViaWhatsApp(serviceName, details = "") {

    const confirmAction = confirm("We are redirecting you to WhatsApp to complete your booking securely. Continue?");

    if (!confirmAction) return;

    const phone = _clinicWhatsApp || "60172032048";
    let message = `Hi Klinik, I would like to book an appointment.`;

    if (serviceName) {
        message += `\nService: ${serviceName} `;
    }
    if (details) {
        message += `\nDetails: ${details} `;
    }

    message += `\n\nCould you please let me know the available slots?`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}


// --- Contact Modal Logic ---
function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// --- Chat Bot Logic (Refined) ---
let chatState = {
    step: 0,
    flow: null,
    answers: [],
    bookingData: {},
    history: [] // For Undo/Back
};

function toggleChat() {
    const chat = document.getElementById('chatWindow');
    if (chat.style.display === 'flex') {
        chat.style.display = 'none';
    } else {
        chat.style.display = 'flex';
        // If first time/empty, show welcome? handled by HTML init.
    }
}

function addMessage(text, isUser = false) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = isUser ? 'msg msg-user' : 'msg msg-bot';
    div.innerHTML = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'msg msg-bot';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function toggleInput(show) {
    const area = document.getElementById('chatInputArea');
    if (show) {
        area.style.display = 'flex';
        setTimeout(() => document.getElementById('chatInput').focus(), 100);
    } else {
        area.style.display = 'none';
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') handleInputSubmit();
}

function handleInputSubmit() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (text) {
        input.value = '';
        handleUserChoice(text);
    }
}

function resetChat() {
    chatState = { step: 0, flow: null, answers: [], bookingData: {}, history: [] };
    toggleInput(false);
    const chatBody = document.getElementById('chatBody');
    chatBody.innerHTML = `
        <div class="msg msg-bot">
            Hello! 👋 Welcome back. How may I assist you today?
        </div>
    `;
    addMainMenu();
}

function addMainMenu() {
    addQuickReplies(['Check Symptoms', 'Book Appointment', 'Fertility Info']);
}

function saveState() {
    // Deep copy state for history
    chatState.history.push(JSON.parse(JSON.stringify({
        step: chatState.step,
        flow: chatState.flow,
        answers: chatState.answers,
        bookingData: chatState.bookingData
    })));
}

function goBack() {
    // Remove any stale quick replies first
    const qr = document.getElementById('quickReplies');
    if (qr) qr.remove();

    if (chatState.history.length === 0) {
        addMessage("We're back at the beginning. How can I help you?");
        resetChat();
        return;
    }
    const prev = chatState.history.pop();
    chatState.step = prev.step;
    chatState.flow = prev.flow;
    chatState.answers = prev.answers;
    chatState.bookingData = prev.bookingData;

    // Re-trigger display based on state
    if (chatState.flow === 'booking') {
        askBookingQuestion();
    } else if (chatState.flow) {
        nextQuestion(); // Reruns question generation based on step
    } else {
        addMessage("Sure, let me take you back. What would you like to do?");
        addMainMenu();
    }
}

function handleUserChoice(choice) {
    const qr = document.getElementById('quickReplies');
    if (qr) qr.remove();

    if (choice === 'Start Over' || choice === 'Back to Start') { resetChat(); return; }
    if (choice === 'Back') {
        addMessage("Back", true); // Log 'Back' action
        goBack();
        return;
    }

    addMessage(choice, true);
    toggleInput(false);
    showTyping();

    // Randomize Think Time (0.5s - 1.0s)
    const delay = Math.floor(Math.random() * 500) + 500;

    setTimeout(() => {
        removeTyping();
        processChatFlow(choice);
    }, delay);
}

function processChatFlow(choice) {
    // 0. Global Intercepts
    if (choice === 'Yes, Book Now') {
        const currentService = chatState.bookingData.service;
        chatState.bookingData = {}; // Clear everything to avoid stale data

        // Preserve context if coming from a flow
        if (chatState.flow && chatState.flow !== 'booking') {
            chatState.bookingData.service = `Assessment (${chatState.flow})`;
        } else {
            chatState.bookingData.service = currentService || 'General Booking';
        }
        startBookingFlow();
        return;
    }

    // 1. Main Menu Selection
    if (chatState.flow === null) {
        if (choice === 'Check Symptoms') {
            chatState.answers = []; // Reset answers
            saveState();
            addMessage("I'd be happy to help assess your condition. Could you tell me what seems to be the main concern?");
            addQuickReplies(['High Fever (Dengue?)', 'General Fever/Flu', 'Other / Pain', 'Back']);
        } else if (choice === 'High Fever (Dengue?)') {
            startFlow('dengue');
        } else if (choice === 'General Fever/Flu') {
            startFlow('fever');
        } else if (choice === 'Other / Pain') {
            startFlow('general');
        } else if (choice === 'Book Appointment') {
            chatState.bookingData = {}; // Clear previous data
            chatState.bookingData.service = 'General Booking';
            startBookingFlow();
        } else if (choice === 'Fertility Info') {
            saveState();
            addMessage("Dr. Alia is our fertility expert. Connect with us for a Follicle Scan (RM60).");
            addQuickReplies(['Book Scan', 'Chat with Specialist', 'Back']);
        } else if (choice === 'Book Scan') {
            chatState.bookingData = {}; // Clear previous data
            chatState.bookingData.service = 'Follicle Scan';
            startBookingFlow();
        } else if (choice === 'Chat with Specialist') {
            // FIX: Chat with Specialist Flow
            addMessage("Connecting you to our Fertility Specialist on WhatsApp...");
            setTimeout(() => {
                bookViaWhatsApp('Fertility Specialist Chat', 'I have questions about fertility treatments.');
                addMessage("I've opened WhatsApp for you. Feel free to come back here if you need anything else!");
                addQuickReplies(['Back to Start']); // Don't auto-show menu, just a back button
            }, 1000);
        } else {
            // Default Fallback
            addMessage("I didn't quite catch that. Here are some options:");
            addMainMenu();
        }
        return;
    }

    // 2. Booking Flow
    if (chatState.flow === 'booking') {
        handleBookingStep(choice);
        return;
    }

    // 3. Symptom Checker
    saveState();
    chatState.answers.push(choice);
    chatState.step++;
    nextQuestion();
}

function startFlow(flowType) {
    saveState();
    chatState.flow = flowType;
    chatState.step = 0;
    chatState.answers = [];
    nextQuestion();
}

function nextQuestion() {
    const step = chatState.step;
    const flow = chatState.flow;

    let questions = [];
    let options = [];

    // Define Questions
    if (flow === 'dengue') {
        questions = [
            "Have you been experiencing a sudden high fever, above 38.5°C? 🤒",
            "Are you feeling any severe pain behind your eyes?",
            "Have you noticed any severe joint or muscle pain?",
            "Do you see any skin rash or red spots on your body?",
            "Have you experienced any bleeding from your nose or gums?"
        ];
    } else if (flow === 'fever') {
        questions = [
            "How long have you been having this fever?",
            "Has your temperature gone above 38°C?",
            "Are you also experiencing a cough or sore throat?",
            "Are you having any difficulty breathing?",
            "Are you still able to eat and drink comfortably?"
        ];
        options = [
            ['Less than 2 Days', 'More than 3 Days'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No']
        ];
    } else if (flow === 'general') {
        questions = [
            "On a scale of 1 to 10, how would you rate your pain level?",
            "Do you have any known drug allergies we should be aware of?",
            "Are you currently taking any medication?",
            "Has this been a recurring issue for you?",
            "Are you currently pregnant or breastfeeding?"
        ];
        options = [
            ['Mild (1-3)', 'Severe (>7)'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No']
        ];
    }

    if (step < questions.length) {
        addMessage(questions[step]);
        let currentOptions = ['Yes', 'No'];
        if (options.length > 0 && options[step]) currentOptions = options[step];
        currentOptions.push('Back');
        addQuickReplies(currentOptions);
    } else {
        finishFlow(flow);
    }
}

function finishFlow(flowName) {
    const answers = chatState.answers;
    // Risk Logic
    let risk = "Low";
    let tips = "Monitor symptoms and stay hydrated.";

    // Simple Heuristics
    if (flowName === 'dengue') {
        const yesCount = answers.filter(a => a === 'Yes').length;
        if (yesCount >= 3) {
            risk = "High";
            tips = "Please seek immediate medical attention. Possible Dengue signs detected.";
        } else {
            risk = "Medium";
            tips = "Monitor for bleeding or persistent fever. Visit us if symptoms worsen.";
        }
    } else if (flowName === 'fever') {
        if (answers[0] === '> 3 Days' || answers[1] === 'Yes' || answers[3] === 'Yes') {
            risk = "High";
            tips = "High fever or breathing issues require doctor evaluation.";
        } else {
            tips = "Rest well, drink water, and take paracetamol if needed.";
        }
    }

    let report = `*AI Triage Report (${flowName.toUpperCase()})*\n`;
    report += `Risk Level: ${risk}\n`;
    report += `Advice: ${tips}\n\n`;
    answers.forEach((ans, i) => report += `Q${i + 1}: ${ans}\n`);

    chatState.bookingData.report = report; // Keep for internal logic, but won't send in WA
    chatState.bookingData.service = `Assessment (${flowName})`;

    addMessage(`**Assessment Complete**<br>Risk: <span class="${risk === 'High' ? 'text-danger' : 'text-warning'}">${risk}</span><br>${tips}<br><br>Would you like to see a doctor?`);
    addQuickReplies(['Yes, Book Now', 'Back to Start', 'Back']);
}

// --- BOOKING FLOW ---
function startBookingFlow() {
    saveState();
    chatState.flow = 'booking';
    chatState.step = 0;
    askBookingQuestion();
}

function askBookingQuestion() {
    if (chatState.step === 0) {
        addMessage("That sounds good! To get started with your booking, could you please type your **Full Name**?");
        toggleInput(true);
    } else if (chatState.step === 1) {
        addMessage(`Thanks, ${chatState.bookingData.name}. What date works best for you to come in?`);
        addQuickReplies(['Today', 'Tomorrow', 'Custom Date', 'Back']);
    } else if (chatState.step === 2) {
        addMessage(`Got it. What time do you prefer, ${chatState.bookingData.name}?`);
        addQuickReplies(['Morning (9-12)', 'Afternoon (2-5)', 'Evening (6-9)', 'Custom Time', 'Back']);
    }
}

function handleBookingStep(choice) {
    if (choice === 'Back') { goBack(); return; }

    const step = chatState.step;

    if (step === 0) {
        // Name Validation (Alphabets only)
        if (!/^[a-zA-Z\s]+$/.test(choice)) {
            addMessage("Please enter a valid name (letters only).");
            toggleInput(true); // Re-show input so user can try again
            return;
        }

        chatState.bookingData.name = choice;
        saveState();
        chatState.step = 1;
        askBookingQuestion();
    } else if (step === 1) {
        if (choice === 'Custom Date') {
            addMessage("Please type your preferred date (e.g., 12 Oct):");
            toggleInput(true);
            return; // Wait for text input
        }
        chatState.bookingData.date = choice;
        saveState();
        chatState.step = 2;
        askBookingQuestion();
    } else if (step === 2) {
        if (choice === 'Custom Time') {
            addMessage("Please type your preferred time (e.g. 8:30 PM):");
            toggleInput(true);
            return;
        }
        chatState.bookingData.time = choice;
        finishBooking();
    }
}



function finishBooking() {
    const { name, date, time, service } = chatState.bookingData;

    showTyping();

    // Randomize Think Time (0.5s - 1.0s)
    const delay = Math.floor(Math.random() * 500) + 500;

    setTimeout(() => {
        removeTyping();

        // Final Message Construction
        let finalMsg = `All set, <b>${name}</b>! I've locked in your appointment for <br>📅 ${date} at ${time}.<br><br>Please click below to send this to our WhatsApp for final confirmation.`;

        const chatBody = document.getElementById('chatBody');
        const div = document.createElement('div');
        div.className = 'msg msg-bot'; // Use standard class
        div.innerHTML = finalMsg;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;

        // New Requested Format
        let waMsg = `👤 Name: ${name}\n`;
        waMsg += `📅 Date: ${date}\n`;
        waMsg += `🕒 Time: ${time}\n`;
        waMsg += `🏥 Service: ${service || 'General Booking'}\n`;
        waMsg += `--------------------------------\n`;
        waMsg += `Hi, I would like to confirm my appointment.`;

        // Create WhatsApp Button
        const btn = document.createElement('button');
        btn.className = 'btn btn-success btn-sm w-100 mt-2 rounded-pill';
        btn.innerHTML = '<i class="fab fa-whatsapp me-2"></i> Send to WhatsApp';
        btn.onclick = () => {
            const phone = "60172032048";
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, '_blank');
        };
        div.appendChild(btn);

        // Reset Chat Option
        setTimeout(() => {
            addMessage("Is there anything else I can help you with?");
            addQuickReplies(['Back to Start']);
        }, 1000);

    }, delay);
}

function addQuickReplies(options) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';
    div.id = 'quickReplies'; // Ensure ID is set for removal

    options.forEach(opt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        if (opt === 'Start Over' || opt === 'Back') {
            chip.style.backgroundColor = '#f1f5f9';
            chip.style.color = '#64748b';
            chip.style.fontSize = '0.8rem';
        }
        chip.innerText = opt;
        chip.onclick = () => handleUserChoice(opt);
        div.appendChild(chip);
    });

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}