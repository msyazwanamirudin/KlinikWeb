AOS.init({ duration: 800, once: true });

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
        if (pageYOffset >= (sectionTop - 150)) {
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

function typeWriter() {
    const element = document.getElementById("typewriter");
    // Simple rotation for demo purposes
    setInterval(() => {
        i = (i + 1) % words.length;
        element.style.opacity = 0;
        setTimeout(() => {
            element.innerHTML = words[i];
            element.style.opacity = 1;
        }, 500);
    }, 3000);
}
document.getElementById("typewriter").style.transition = "opacity 0.5s";
typeWriter();

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

// --- ADVANCED ADMIN SYSTEM (LocalStorage CMS) ---
let clickCount = 0;
let clickTimer = null;

// Security Constants
// SHA-256 for "8888"
const ADMIN_HASH_SHA = "2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731";
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 15 * 60 * 1000;

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
    if (resetTrigger) {
        resetTrigger.style.cursor = 'default';
        resetTrigger.addEventListener('click', handleEmergencyReset);
    }

    // Also add to Footer Status Text for easier access on mobile
    const footerStatus = document.getElementById('footerStatusText');
    if (footerStatus) {
        footerStatus.addEventListener('click', handleEmergencyReset);
    }

    // 3. Initialize Logic
    populateDoctorSelect();
    loadPromo(); // Ensure this runs on load
    updateLiveStatus(); // Initial Roster Check

    // Add Enter Key for PIN
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
        pinInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') verifyAdminPin();
        });
    }

    // Promo Image Live Preview & Error Handling
    const promoBgInput = document.getElementById('promoImgInput');
    const preview = document.getElementById('promoImgPreview');

    if (promoBgInput && preview) {
        // Handle Input Change
        promoBgInput.addEventListener('input', function () {
            if (this.value) {
                preview.src = this.value;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        // Handle Image Load Error (e.g. 403 Forbidden, 404 Not Found)
        preview.addEventListener('error', function () {
            if (this.src && this.src !== window.location.href) { // Avoid triggering on empty
                alert("Cannot load this image. The website hosting it might be blocking access (Hotlinking protection) or the URL is invalid.\n\nTry a direct link from Unsplash or upload the image to a hosting site like Imgur.");
                this.style.display = 'none'; // Hide broken image icon
            }
        });
    }
});

// --- UI MANAGERS ---
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminPinScreen').style.display = 'block';
    document.getElementById('adminControlScreen').style.display = 'none';
    document.getElementById('adminPinInput').value = '';
    document.getElementById('adminPinInput').focus();
    document.body.classList.add('modal-open'); // Lock Scroll
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.body.classList.remove('modal-open'); // Unlock Scroll
}

function verifyAdminPin() {
    const errorMsg = document.getElementById('pinError');
    const input = document.getElementById('adminPinInput').value;

    // Check Lockout
    const lockout = JSON.parse(localStorage.getItem('adminLockout') || '{}');
    if (lockout.active && Date.now() < lockout.until) {
        const remaining = Math.ceil((lockout.until - Date.now()) / 60000);
        errorMsg.style.display = 'block';
        errorMsg.innerText = `System Locked. Try again in ${remaining} mins.`;
        return;
    }

    // Verify PIN (SHA-256 Hash)
    sha256(input).then(hash => {
        if (hash === ADMIN_HASH_SHA) {
            // Success
            document.getElementById('adminPinScreen').style.display = 'none';
            document.getElementById('adminControlScreen').style.display = 'block';
            // NEW: No Roster Render needed here
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
                errorMsg.innerText = "Too many attempts. System Locked for 15 mins.";
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
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// --- NEW ADMIN TOOLS: INVENTORY MAGAGEMENT ---

function toggleInventoryForm() {
    const form = document.getElementById('inventoryForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function loadInventory() {
    const list = document.getElementById('inventoryList');
    const empty = document.getElementById('inventoryEmpty');
    let items = JSON.parse(localStorage.getItem('adminInventory') || '[]');

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
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    let html = '';

    // Sort by Expiry Date (Ascending)
    items.sort((a, b) => {
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return new Date(a.expiry) - new Date(b.expiry);
    });

    items.forEach((item) => {
        // Expiry Check
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

        // Category Badge Color
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
                <div class="fw-bold text-dark">${item.name}</div>
                <span class="badge ${badgeClass}" style="font-size:0.7rem">${item.category || 'Medicine'}</span>
                ${statusBadge}
            </td>
            <td>
                 <!-- Hidden for mobile space optimization if needed -->
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
    loadInventory();
}

function updateStock(index, change) {
    const items = JSON.parse(localStorage.getItem('adminInventory') || '[]');
    if (items[index]) {
        let newQty = parseInt(items[index].qty) + change;
        if (newQty < 0) newQty = 0;
        items[index].qty = newQty;
        localStorage.setItem('adminInventory', JSON.stringify(items));
        loadInventory();
    }
}

function addInventoryItem() {
    const name = document.getElementById('invName').value.trim();
    const qty = parseInt(document.getElementById('invQty').value);
    const expiry = document.getElementById('invExpiry').value;
    const category = document.getElementById('invCategory').value;

    if (!name || isNaN(qty)) return alert("Name and Quantity are required");

    const items = JSON.parse(localStorage.getItem('adminInventory') || '[]');

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

    localStorage.setItem('adminInventory', JSON.stringify(items));

    // Reset Form
    document.getElementById('invName').value = '';
    document.getElementById('invQty').value = '';
    toggleInventoryForm();
    loadInventory();
}

function deleteInventoryItem(index) {
    if (!confirm("Remove this item permanently?")) return;
    const items = JSON.parse(localStorage.getItem('adminInventory') || '[]');
    items.splice(index, 1);
    localStorage.setItem('adminInventory', JSON.stringify(items));
    loadInventory();
}

// --- PUBLIC ROSTER VIEW (PATIENT MODAL) ---
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
    const rules = getRosterRules();
    let html = '';

    const now = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);

        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const dateISO = d.toISOString().split('T')[0];
        const dayIdx = d.getDay();

        // Resolve Doctor + Shift
        // 1. Date Rule
        const dateRule = rules.find(r => r.type === 'date' && r.date === dateISO);
        // 2. Weekly Rule
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
            // Default
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
}

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

    // HARDCODED WEEKLY SCHEDULE (Static Logic)
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    let doctorName = "";

    if (day === 0) doctorName = "Dr. Wong (Locum)"; // Sunday
    else if (day === 2 || day === 4 || day === 6) doctorName = "Dr. Amin (Specialist)"; // Tue, Thu, Sat
    else doctorName = "Dr. Sara (General)"; // Mon, Wed, Fri

    if (docText) docText.innerHTML = `<span class="fw-bold">${doctorName}</span>`;
    if (topDocText) topDocText.innerHTML = doctorName;
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




updateLiveStatus();
setInterval(updateLiveStatus, 60000);

// --- HIDE STATUS BAR ON FOOTER SCROLL ---
document.addEventListener('DOMContentLoaded', () => {
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


});


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
    if (chatState.history.length === 0) {
        addMessage("Cannot go back further. Restarting...");
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
        addMessage("Back to Main Menu.");
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