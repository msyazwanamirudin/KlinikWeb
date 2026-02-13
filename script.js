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
const sections = document.querySelectorAll('section, footer'); // Include Footer

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
    // Scrolled Effect
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    // ScrollSpy Logic
    let current = '';

    // Standard Spy
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 150)) {
            const id = section.getAttribute('id');
            if (id) current = id;
        }
    });

    // FORCE CONTACT ACTIVE AT BOTTOM OF PAGE
    // (Fixes issue where footer is too short to trigger standard spy)
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = 'mainFooter';
    }

    navLinks.forEach(link => {
        link.classList.remove('active-nav');
        // Robust null check for href
        const href = link.getAttribute('href');
        if (href && href.includes(current) && current !== '') {
            link.classList.add('active-nav');
        }
    });

    // Back To Top Visibility
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

// Ensure "Home" link in navbar also scrolls to absolute top
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
    div.textContent = str;
    return div.innerHTML;
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

    // Logic:
    // Open: 9AM - 10PM (except break)
    // Break: 12PM - 2PM
    // Closed: 10PM - 9AM

    const isBreak = hour >= 12 && hour < 14;
    const isOpen = hour >= 9 && hour < 22;

    let text = "";
    let color = "";
    let shadow = "";
    let anim = "";

    if (isOpen) {
        if (isBreak) {
            text = "Doctor on Break (Resume 2:00 PM)";
            color = "#eab308"; // Yellow
            shadow = "none";
            anim = "none";
        } else {
            text = "Clinic Open"; // Removed Queue Status
            color = "#22c55e"; // Green
            shadow = "0 0 10px #22c55e";
            anim = "pulse 2s infinite";
        }
    } else {
        text = "Clinic Closed (Opens 9:00 AM)";
        color = "#ef4444"; // Red
        shadow = "none";
        anim = "none";
    }

    // Update Top Bar
    if (statusText) statusText.innerHTML = text;
    if (statusDot) {
        statusDot.style.backgroundColor = color;
        statusDot.style.boxShadow = shadow;
        statusDot.style.animation = anim;
    }

    // Update Footer
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

    // Check Firebase rules first, then fall back to hardcoded
    firebaseLoad('roster/rules', []).then(rules => {
        let doctorName = "";

        // Priority 1: Date-specific rule
        const dateRule = rules.find(r => r.type === 'date' && r.date === dateISO);
        // Priority 2: Weekly rule
        const weekRule = rules.find(r => r.type === 'weekly' && r.day === day);

        if (dateRule) {
            doctorName = dateRule.doc;
        } else if (weekRule) {
            doctorName = weekRule.doc;
        } else {
            // Default hardcoded schedule
            if (day === 0) doctorName = "Dr. Wong (Locum)";
            else if (day === 2 || day === 4 || day === 6) doctorName = "Dr. Amin (Specialist)";
            else doctorName = "Dr. Sara (General)";
        }

        if (docText) docText.innerHTML = `<span class="fw-bold">${doctorName}</span>`;
        if (topDocText) topDocText.innerHTML = doctorName;
    });
}

function openRosterModal() {
    const modal = document.getElementById('rosterModal');
    if (modal) {
        modal.style.display = 'flex';
        generatePublicRoster();
    }
}

function closeRosterModal() {
    const modal = document.getElementById('rosterModal');
    if (modal) modal.style.display = 'none';
}

function generatePublicRoster() {
    const list = document.getElementById('publicRosterList');

    // Load rules from Firebase (async)
    firebaseLoad('roster/rules', []).then(rules => {
        let html = '';
        const now = new Date();

        for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() + i);

            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dateISO = d.toISOString().split('T')[0];
            const dayIdx = d.getDay();

            // Resolve Doctor + Shift (priority: date rule > weekly rule > default)
            const dateRule = rules.find(r => r.type === 'date' && r.date === dateISO);
            const weekRule = rules.find(r => r.type === 'weekly' && r.day === dayIdx);

            let docName = "";
            let shift = "Full Day";

            if (dateRule) {
                docName = dateRule.doc;
                shift = dateRule.shift;
            } else if (weekRule) {
                docName = weekRule.doc;
                shift = weekRule.shift;
            } else {
                // Default hardcoded schedule
                if (dayIdx === 0) docName = "Dr. Wong (Locum)";
                else if (dayIdx === 2 || dayIdx === 4 || dayIdx === 6) docName = "Dr. Amin (Specialist)";
                else docName = "Dr. Sara (General)";
            }

            html += `
            <li class="list-group-item">
                <div class="roster-date text-center lh-1">
                    <div class="small text-muted text-uppercase">${dayStr}</div>
                    <div class="h5 mb-0">${d.getDate()}</div>
                </div>
                <div class="roster-info">
                    <div class="fw-bold text-dark">${docName}</div>
                    <div class="small text-muted">${shift}</div>
                </div>
            </li>`;
        }

        if (list) list.innerHTML = html;
    });
}

// --- ADVANCED ADMIN SYSTEM (LocalStorage CMS) ---
let clickCount = 0;
let clickTimer = null;

// Security Constants
// SHA-256 for "8888"
const ADMIN_HASH_SHA = "2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731";
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 100 * 365 * 24 * 60 * 60 * 1000; // 100 Years (Permanent)

// SHA-256 Helper (Async)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Data: Registered Doctors
const DOCTORS = [
    "Dr. Alia Syamim (Fertility)",
    "Dr. Sarah Lee (Pediatric)",
    "Dr. Hanim (General)",
    "Dr. Wong (Locum)",
    "Dr. Amin (Specialist)"
];

// 1. Security: Disable Right Click & Inspect Shortcuts
function blockContextMenu(event) { event.preventDefault(); }
function blockShortcuts(event) {
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
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
    alert("🔧 Debug Mode Enabled\n\n- Right-Click Unlocked\n- F12 / Inspect Element Unlocked");
}

// 2b. Emergency Reset Trigger (Hidden in Top Bar Doctor Name AND Footer Status)
let resetCount = 0;
let resetTimer = null;

function handleEmergencyReset() {
    resetCount++;
    if (resetCount === 1) resetTimer = setTimeout(() => { resetCount = 0; }, 3000);
    if (resetCount >= 10) {
        if (confirm("⚠️ Developer Reset: Clear Lockouts & Enable Debug Mode?")) {
            localStorage.removeItem('adminLockout');
            localStorage.removeItem('adminAttempts');
            enableDebugMode();
            alert("System Reset! Try logging in again.");
        }
        resetCount = 0;
        clearTimeout(resetTimer);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 2. Admin Trigger (Hidden in Copyright)
    const trigger = document.getElementById('adminTrigger');
    if (trigger) {
        // Prevent browser text-search on double-click
        trigger.addEventListener('dblclick', (e) => e.preventDefault());
        trigger.addEventListener('mousedown', (e) => {
            if (e.detail > 1) e.preventDefault(); // Prevent text selection on rapid clicks
        });
        trigger.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 1) clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
            if (clickCount >= 5) {
                openAdminModal();
                clickCount = 0;
                clearTimeout(clickTimer);
            }
        });
    }

    // Attach Emergency Reset to Top Bar + Footer
    const resetTrigger = document.getElementById('topDoctorDuty');
    const mobileResetTrigger = document.getElementById('liveStatusText'); // Mobile fallback

    if (resetTrigger) {
        resetTrigger.style.cursor = 'default';
        resetTrigger.addEventListener('click', handleEmergencyReset);
    }
    if (mobileResetTrigger) {
        mobileResetTrigger.style.cursor = 'default';
        mobileResetTrigger.addEventListener('click', handleEmergencyReset);
    }

    // Also add to Footer Status Text for easier access on mobile
    const footerStatus = document.getElementById('footerStatusText');
    if (footerStatus) {
        footerStatus.addEventListener('click', handleEmergencyReset);
    }

    // 3. Initialize Logic
    populateDoctorSelect();
    updateLiveStatus();

    // 4. Firebase Real-Time Listeners (auto-refresh when data changes)
    firebaseListen('inventory', (data) => {
        // Update local cache silently
        localStorage.setItem('fb_inventory', JSON.stringify(data || []));
    });
    firebaseListen('roster/rules', (data) => {
        localStorage.setItem('fb_roster_rules', JSON.stringify(data || []));
        // Refresh public roster if modal is open
        const rosterModal = document.getElementById('rosterModal');
        if (rosterModal && rosterModal.style.display === 'flex') {
            generatePublicRoster();
        }
        // Refresh today's doctor
        updateLiveStatus();
    });

    // Add Enter Key for PIN
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
        pinInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') verifyAdminPin();
        });
    }

    // --- END OF INITIALIZATION ---
});

// --- UI MANAGERS ---
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminPinScreen').style.display = 'block';
    document.getElementById('adminControlScreen').style.display = 'none';
    document.getElementById('adminPinInput').value = '';
    document.getElementById('adminPinInput').focus();
    document.body.classList.add('modal-open'); // Lock Scroll

    // Hide Public Elements
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
    document.body.classList.remove('modal-open'); // Unlock Scroll

    // Restore Public Elements
    const nav = document.getElementById('navbar-main');
    const topBtn = document.getElementById('backToTop');
    const chatBtn = document.querySelector('.chat-widget-btn');

    if (nav) nav.style.display = '';
    if (topBtn) topBtn.style.display = '';
    if (chatBtn) chatBtn.style.display = '';
}

function verifyAdminPin() {
    const errorMsg = document.getElementById('pinError');
    const input = document.getElementById('adminPinInput').value;

    // Check Lockout
    const lockout = JSON.parse(localStorage.getItem('adminLockout') || '{}');
    if (lockout.active && Date.now() < lockout.until) {
        errorMsg.style.display = 'block';
        // If lockout is > 24 hours, show permanent message
        if (lockout.until > Date.now() + 24 * 60 * 60 * 1000) {
            errorMsg.innerText = "System Locked. Perform Emergency Reset.";
        } else {
            const remaining = Math.ceil((lockout.until - Date.now()) / 60000);
            errorMsg.innerText = `System Locked. Try again in ${remaining} mins.`;
        }
        return;
    }

    // Verify PIN (SHA-256 Hash)
    sha256(input).then(hash => {
        if (hash === ADMIN_HASH_SHA) {
            // Success
            document.getElementById('adminPinScreen').style.display = 'none';
            document.getElementById('adminControlScreen').style.display = 'block';
            loadInventory(); // Auto-load stock items
            enableDebugMode(); // UNLOCK INSPECT ELEMENT

            // Reset Attempts
            localStorage.removeItem('adminLockout');
            localStorage.removeItem('adminAttempts');
        } else {
            // Failure
            let attempts = parseInt(localStorage.getItem('adminAttempts') || 0) + 1;
            localStorage.setItem('adminAttempts', attempts);

            if (attempts >= MAX_ATTEMPTS) {
                const unlockTime = Date.now() + LOCKOUT_TIME;
                localStorage.setItem('adminLockout', JSON.stringify({ active: true, until: unlockTime }));
                errorMsg.innerText = "Too many attempts. System Locked.";
            } else {
                errorMsg.innerText = `Invalid PIN. ${MAX_ATTEMPTS - attempts} attempts remaining.`;
            }

            errorMsg.style.display = 'block';
            document.getElementById('adminPinInput').value = '';
        }
    });
}


function switchAdminTab(tab, event) {
    if (event) event.preventDefault();
    // Only one tab now, but keeping structure if we add more later
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
        populateDoctorSelect();
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}


// --- ROSTER ADMIN LOGIC ---

let latestRosterRules = []; // Store for access by index

function loadRosterAdmin() {
    firebaseLoad('roster/rules', []).then(rules => {
        latestRosterRules = rules; // Update global cache
        renderRosterList(rules);
    });
}

function renderRosterList(rules) {
    const list = document.getElementById('rosterList');
    const empty = document.getElementById('rosterEmpty');
    const btnDelete = document.getElementById('btnDeleteSelected');
    if (!list) return;

    // Reset Batch Button
    if (btnDelete) btnDelete.disabled = true;
    const selectAll = document.getElementById('selectAllRules');
    if (selectAll) selectAll.checked = false;

    if (rules.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    // 1. Map to preserve original index (Fixes sorting bug)
    let displayRules = rules.map((r, i) => ({ ...r, _origIdx: i }));

    // 2. Sort: Dates first (descending), then Weekly (Mon-Sun)
    displayRules.sort((a, b) => {
        if (a.type === 'date' && b.type === 'weekly') return -1;
        if (a.type === 'weekly' && b.type === 'date') return 1;
        if (a.type === 'date' && b.type === 'date') return new Date(a.date) - new Date(b.date);
        return a.day - b.day; // Weekly
    });

    let html = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    displayRules.forEach((rule) => {
        let when = '';
        let badge = '';

        if (rule.type === 'weekly') {
            when = `Every <b>${days[rule.day]}</b>`;
            badge = `<span class="badge bg-info text-dark">Weekly</span>`;
        } else {
            const d = new Date(rule.date);
            when = `<b>${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b> (${days[d.getDay()]})`;
            badge = `<span class="badge bg-primary">Date</span>`;
        }

        html += `
        <tr>
            <td class="text-center">
                <input type="checkbox" class="form-check-input rule-checkbox" 
                    value="${rule._origIdx}" onchange="updateBatchButtons()">
            </td>
            <td>
                <div>${when}</div>
                <div class="small text-muted">${badge} &bull; ${rule.shift}</div>
            </td>
            <td>${rule.doc}</td>
            <td class="text-end">
                <button onclick="editRosterRule(${rule._origIdx})" class="btn btn-outline-primary btn-sm border-0 me-1" title="Edit/Copy"><i class="fas fa-pen"></i></button>
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

    if (!confirm(`Are you sure you want to delete ${checked.length} selected rules?`)) return;

    const indices = Array.from(checked).map(cb => parseInt(cb.value));
    // Sort descending to splice correctly
    indices.sort((a, b) => b - a);

    firebaseLoad('roster/rules', []).then(rules => {
        indices.forEach(idx => {
            if (idx >= 0 && idx < rules.length) rules.splice(idx, 1);
        });
        firebaseSave('roster/rules', rules);
        loadRosterAdmin();
        alert("Selected rules deleted.");
    });
}

function clearAllRules() {
    if (!confirm("⚠️ DANGER: Are you sure you want to delete ALL roster rules?")) return;
    if (!confirm("🔴 DOUBLE CHECK: This actions cannot be undone. Confirm clear all?")) return;

    firebaseSave('roster/rules', []); // Save empty array
    loadRosterAdmin();
    alert("All rules cleared.");
}

function editRosterRule(index) {
    const rule = latestRosterRules[index];
    if (!rule) return;

    // Open Form
    const form = document.getElementById('rosterForm');
    form.style.display = 'block';

    // Populate Data
    if (rule.type === 'weekly') {
        document.getElementById('ruleWeekly').checked = true;
        document.getElementById('rosterDay').value = rule.day;
    } else {
        document.getElementById('ruleDate').checked = true;
        document.getElementById('rosterDateStart').value = rule.date;
        document.getElementById('rosterDateEnd').value = ''; // Reset range end for single edit
    }
    toggleRuleInputs();

    document.getElementById('rosterDocSelect').value = rule.doc;
    document.getElementById('rosterShift').value = rule.shift;

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

function toggleRosterForm() {
    const form = document.getElementById('rosterForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById('ruleDate').checked = true;
        toggleRuleInputs();
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
            // Range Logic
            let curr = new Date(startDateVal);
            const end = new Date(endDateVal);
            // Safety Limit: Max 30 days range
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
            // Single Date
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

        // Check conflicts for ALL new rules
        newRulesToAdd.forEach(newRule => {
            let existingIndex = -1;
            if (newRule.type === 'weekly') {
                existingIndex = rules.findIndex(r => r.type === 'weekly' && r.day === newRule.day);
            } else {
                existingIndex = rules.findIndex(r => r.type === 'date' && r.date === newRule.date);
            }

            if (existingIndex !== -1) {
                const existing = rules[existingIndex];
                if (existing.doc === newRule.doc) {
                    duplicates.push(`${newRule.date || 'Day ' + newRule.day} (${existing.shift})`);
                } else {
                    conflicts.push(`${newRule.date || 'Day ' + newRule.day}: ${existing.doc} -> ${newRule.doc}`);
                }
            }
        });

        if (duplicates.length > 0) {
            alert(`Error: Duplicate assignments found for ${doc}:\n` + duplicates.slice(0, 3).join('\n') + (duplicates.length > 3 ? '\n...' : ''));
            return;
        }

        if (conflicts.length > 0) {
            const confirmOverwrite = confirm(`Found ${conflicts.length} conflicts:\n` + conflicts.slice(0, 3).join('\n') + (conflicts.length > 3 ? '\n...' : '') + `\n\nOverwrite multiple?`);
            if (!confirmOverwrite) return;
        }

        // Apply Changes:
        // 1. Filter out old conflicting rules
        rules = rules.filter(existing => {
            const isConflict = newRulesToAdd.some(newRule => {
                if (newRule.type === 'weekly' && existing.type === 'weekly' && newRule.day === existing.day) return true;
                if (newRule.type === 'date' && existing.type === 'date' && newRule.date === existing.date) return true;
                return false;
            });
            return !isConflict; // Keep if NO conflict
        });

        // 2. Add all new rules
        rules.push(...newRulesToAdd);

        firebaseSave('roster/rules', rules).then(() => {
            // Close form if it was open
            document.getElementById('rosterForm').style.display = 'none';
            loadRosterAdmin();
        });
    });
}

function deleteRosterRule(index) {
    if (!confirm("Delete this rule?")) return;
    firebaseLoad('roster/rules', []).then(rules => {
        if (index >= 0 && index < rules.length) {
            rules.splice(index, 1);
            firebaseSave('roster/rules', rules).then(() => loadRosterAdmin());
        }
    });
}

function populateDoctorSelect() {
    const sel = document.getElementById('rosterDocSelect');
    if (!sel) return;
    sel.innerHTML = '';
    DOCTORS.forEach(doc => {
        sel.innerHTML += `<option value="${doc}">${doc}</option>`;
    });
}

// --- INVENTORY MANAGEMENT ---
let latestInventory = [];

function toggleInventoryForm() {
    const form = document.getElementById('inventoryForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function loadInventory() {
    const list = document.getElementById('inventoryList');
    const empty = document.getElementById('inventoryEmpty');

    // Load from Firebase (async) with LocalStorage fallback
    firebaseLoad('inventory', []).then(items => {
        latestInventory = items; // Cache for local filtering
        renderInventory(items, list, empty);
    });
}

function renderInventory(items, list, empty) {
    if (!list) return;

    // 1. Filter Logic
    const searchTerm = document.getElementById('invSearch') ? document.getElementById('invSearch').value.toLowerCase() : '';
    const filterCat = document.getElementById('invFilterCategory') ? document.getElementById('invFilterCategory').value : 'All';

    // Add original index to allow updates on filtered list
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

    // Sort by Expiry Date (Ascending)
    items.sort((a, b) => {
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return new Date(a.expiry) - new Date(b.expiry);
    });

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
        // Consolidation Logic: Check for same Name + Expiry
        const existingIndex = items.findIndex(item =>
            item.name.toLowerCase() === name.toLowerCase() &&
            item.expiry === expiry
        );

        if (existingIndex !== -1) {
            items[existingIndex].qty = parseInt(items[existingIndex].qty) + qty;
            alert(`Updated stock for ${items[existingIndex].name}. New Qty: ${items[existingIndex].qty}`);
        } else {
            items.push({ name, qty, expiry, category });
        }

        firebaseSave('inventory', items).then(() => {
            // Reset Form
            document.getElementById('invName').value = '';
            document.getElementById('invQty').value = '';
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



// --- PUBLIC HEALTH TOOLS ---
function calculateBMI() {
    const hInput = document.getElementById('bmiHeight');
    const wInput = document.getElementById('bmiWeight');
    const resultDiv = document.getElementById('bmiResult');

    if (!hInput.value || !wInput.value) return alert("Enter valid height & weight");

    const h = parseFloat(hInput.value) / 100;
    const w = parseFloat(wInput.value);

    // Loading State
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
            <div>BMI: <span class="display-6 fw-bold ${color}">${bmi}</span></div>
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

    // Loading State
    resultDiv.innerHTML = '<span class="text-primary"><i class="fas fa-spinner fa-spin me-2"></i>Calculating...</span>';

    setTimeout(() => {
        const due = new Date(lmp);
        due.setDate(lmp.getDate() + 280); // +40 Weeks

        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateStr = due.toLocaleDateString('en-US', options);

        resultDiv.innerHTML = `
            <div class="small text-muted mb-1">Estimated Due Date:</div>
            <div class="h5 fw-bold text-primary mb-0">${dateStr}</div>
            <div class="small text-muted mt-1">based on 40-week gestation</div>
        `;
    }, 800);
}




setInterval(updateLiveStatus, 60000);

// --- HIDE STATUS BAR ON FOOTER SCROLL (runs on load) ---
(function () {
    const footer = document.getElementById('mainFooter');
    const statusBar = document.querySelector('.status-bar');
    const navbar = document.querySelector('.navbar');
    const contactLink = document.querySelector('a[href="#mainFooter"]'); // Select Contact Link

    if (footer && statusBar) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statusBar.classList.add('hidden-bar');
                    if (navbar) navbar.classList.add('move-up');

                    // Manually Activate Contact Link
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    if (contactLink) {
                        contactLink.classList.add('active');
                        contactLink.classList.add('active-nav'); // Just to be safe with styles
                    }

                } else {
                    statusBar.classList.remove('hidden-bar');
                    if (navbar) navbar.classList.remove('move-up');

                    // Remove Manual Active (Bootstrap Spy takes over for others)
                    if (contactLink) {
                        contactLink.classList.remove('active');
                        contactLink.classList.remove('active-nav');
                    }
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of footer is visible

        observer.observe(footer);
    }
})();


// --- WHATSAPP BOOKING LOGIC (With Confirmation) ---
function bookViaWhatsApp(serviceName, details = "") {
    // Confirmation
    const confirmAction = confirm("We are redirecting you to WhatsApp to complete your booking securely. Continue?");

    if (!confirmAction) return;

    const phone = "60172032048";
    let message = `Hi Klinik, I would like to book an appointment.`;

    if (serviceName) {
        message += `\nService: ${serviceName}`;
    }
    if (details) {
        message += `\nDetails: ${details}`;
    }

    message += `\n\nCould you please let me know the available slots?`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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