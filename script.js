AOS.init({ duration: 800, once: true });

// --- Navbar Scroll Effect & ScrollSpy ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section, footer'); // Include Footer

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
const ADMIN_PIN = "8888";

// Data: Registered Doctors
const DOCTORS = [
    "Dr. Alia Syamim (Fertility)",
    "Dr. Sarah Lee (Pediatric)",
    "Dr. Hanim (General)",
    "Dr. Wong (Locum)",
    "Dr. Amin (Specialist)"
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Admin Trigger
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

    // 2. Initialize Logic
    populateDoctorSelect();
    renderRosterRules();
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
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function verifyAdminPin() {
    if (document.getElementById('adminPinInput').value === ADMIN_PIN) {
        document.getElementById('adminPinScreen').style.display = 'none';
        document.getElementById('adminControlScreen').style.display = 'block';
        loadPromoForm(); // Pre-fill form
        renderRosterRules(); // Refresh list
    } else {
        document.getElementById('pinError').style.display = 'block';
    }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-pills .nav-link').forEach(el => el.classList.remove('active'));

    if (tab === 'roster') {
        document.getElementById('tabRoster').style.display = 'block';
        event.target.classList.add('active'); // Simplistic active toggle
    } else {
        document.getElementById('tabPromo').style.display = 'block';
        event.target.classList.add('active');
    }
}

function toggleRuleInputs() {
    const type = document.getElementById('rosterRuleType').value;
    if (type === 'weekly') {
        document.getElementById('inputWeekly').style.display = 'block';
        document.getElementById('inputDate').style.display = 'none';
    } else {
        document.getElementById('inputWeekly').style.display = 'none';
        document.getElementById('inputDate').style.display = 'block';
    }
}

// --- ROSTER ENGINE ---
function populateDoctorSelect() {
    const sel = document.getElementById('rosterDoctorSelect');
    if (!sel) return;
    sel.innerHTML = DOCTORS.map(d => `<option value="${d}">${d}</option>`).join('');
}

function getRosterRules() {
    return JSON.parse(localStorage.getItem('rosterRules') || '[]');
}

function addRosterRule() {
    const doc = document.getElementById('rosterDoctorSelect').value;
    const type = document.getElementById('rosterRuleType').value;
    const shift = document.getElementById('rosterShiftSelect').value;
    let rule = { id: Date.now(), doc, type, shift };

    if (type === 'weekly') {
        rule.day = parseInt(document.getElementById('rosterDaySelect').value);
        rule.dayName = document.getElementById('rosterDaySelect').options[document.getElementById('rosterDaySelect').selectedIndex].text;
    } else {
        const dateVal = document.getElementById('rosterDateInput').value;
        if (!dateVal) return alert("Please select a date");
        rule.date = dateVal;
    }

    const rules = getRosterRules();

    // VALIDATION: Check for duplicate rule (Same Doctor + Same Day/Date)
    const existing = rules.find(r =>
        r.doc === doc &&
        ((type === 'weekly' && r.type === 'weekly' && r.day === rule.day) ||
            (type === 'date' && r.type === 'date' && r.date === rule.date))
    );

    if (existing) {
        alert(`Creation Failed:\n${doc} already has a rule for this ${type === 'weekly' ? 'day' : 'date'}.`);
        return;
    }

    rules.push(rule);
    localStorage.setItem('rosterRules', JSON.stringify(rules));

    renderRosterRules();
    updateLiveStatus(); // Apply immediately
    alert("Rule Added Successfully!");
}

function deleteRule(id) {
    const rules = getRosterRules().filter(r => r.id !== id);
    localStorage.setItem('rosterRules', JSON.stringify(rules));
    renderRosterRules();
    updateLiveStatus();
}

function resetRosterRules() {
    if (confirm("Clear all custom roster rules?")) {
        localStorage.removeItem('rosterRules');
        renderRosterRules();
        updateLiveStatus();
    }
}

function renderRosterRules() {
    const list = document.getElementById('rosterRulesList');
    const rules = getRosterRules();
    if (rules.length === 0) {
        list.innerHTML = '<li class="list-group-item text-muted small">No custom rules. Using default schedule.</li>';
        return;
    }

    list.innerHTML = rules.map(r => `
        <li class="list-group-item">
            <div>
                <span class="badge bg-secondary me-2">${r.type === 'weekly' ? 'Rep' : 'Date'}</span>
                <strong>${r.doc}</strong> <small class="text-primary">(${r.shift})</small>
                <br>
                <small class="text-muted">${r.type === 'weekly' ? 'Every ' + r.dayName : r.date}</small>
            </div>
            <button onclick="deleteRule(${r.id})" class="btn btn-sm text-danger"><i class="fas fa-trash"></i></button>
        </li>
    `).join('');
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
    const todayDate = now.toISOString().split('T')[0];
    const day = now.getDay();

    // PRIORITY 1: Specific Date Rule
    const rules = getRosterRules();
    const dateRule = rules.find(r => r.type === 'date' && r.date === todayDate);

    // PRIORITY 2: Weekly Rule
    const weekRule = rules.find(r => r.type === 'weekly' && r.day === day);

    let doctorName = "";
    let shiftInfo = "";

    if (dateRule) {
        doctorName = dateRule.doc;
        shiftInfo = dateRule.shift;
    } else if (weekRule) {
        doctorName = weekRule.doc;
        shiftInfo = weekRule.shift;
    } else {
        // PRIORITY 3: Default Hardcoded Logic
        if (day === 0) doctorName = "Dr. Wong (Locum)";
        else if (day === 2 || day === 4 || day === 6) doctorName = "Dr. Amin (Specialist)";
        else doctorName = "Dr. Sara (General)";
    }

    const displayText = shiftInfo && shiftInfo !== 'Full Day'
        ? `${doctorName} <small class='text-white-50'>(${shiftInfo})</small>`
        : doctorName;

    if (docText) docText.innerHTML = `<span class="fw-bold">${displayText}</span>`;
    if (topDocText) topDocText.innerHTML = doctorName.split('(')[0]; // Keep top bar short
}


// --- PROMO ENGINE ---
function savePromo(e) {
    e.preventDefault();
    const promoData = {
        active: document.getElementById('promoActive').checked,
        title: document.getElementById('promoTitleInput').value,
        desc: document.getElementById('promoDescInput').value,
        img: document.getElementById('promoImgInput').value
    };
    localStorage.setItem('promoData', JSON.stringify(promoData));
    loadPromo();
    alert("Promo Updated!");
}

function loadPromoForm() {
    const data = JSON.parse(localStorage.getItem('promoData') || '{}');
    document.getElementById('promoActive').checked = data.active || false;
    document.getElementById('promoTitleInput').value = data.title || '';
    document.getElementById('promoDescInput').value = data.desc || '';
    document.getElementById('promoImgInput').value = data.img || '';

    // Initial Preview Load
    const preview = document.getElementById('promoImgPreview');
    if (data.img) {
        preview.src = data.img;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

function loadPromo() {
    const data = JSON.parse(localStorage.getItem('promoData') || '{}');
    const section = document.getElementById('promoSection');

    if (data.active) {
        section.classList.remove('d-none');
        document.getElementById('promoTitle').innerText = data.title || "Special Offer";
        document.getElementById('promoText').innerText = data.desc || "";

        const img = document.getElementById('promoImage');
        if (data.img) {
            img.src = data.img;
            document.getElementById('promoImgCol').style.display = 'block';
        } else {
            document.getElementById('promoImgCol').style.display = 'none';
        }
    } else {
        if (section) section.classList.add('d-none');
    }
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

    // Promo Image Live Preview & Error Handling
    const promoBgInput = document.getElementById('promoImgInput');
    const preview = document.getElementById('promoImgPreview');
    const fileInput = document.getElementById('promoImgUpload');

    if (promoBgInput && preview) {
        // Handle URL Input Change
        promoBgInput.addEventListener('input', function () {
            if (this.value) {
                preview.src = this.value;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });

        // Handle Image Load Error
        preview.addEventListener('error', function () {
            if (this.src && this.src !== window.location.href && !this.src.startsWith('data:image')) {
                alert("Cannot load this image. The website hosting it might be blocking access (Hotlinking protection) or the URL is invalid.\n\nTry a direct link from Unsplash or use the Upload feature.");
                this.style.display = 'none';
            }
        });
    }

    // Handle Local File Upload (Base64)
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB Check
                    alert("File is too large! Please upload an image smaller than 2MB.");
                    this.value = ''; // Reset
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const base64 = e.target.result;
                    document.getElementById('promoImgInput').value = base64; // Set to input
                    document.getElementById('promoImgPreview').src = base64; // Preview
                    document.getElementById('promoImgPreview').style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
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
            Hello! I'm AI Assistant (Reset). Re-calibrating... <br>How can I help you?
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
            addMessage("I can help assess your condition. What seems to be the main issue?");
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
                addMainMenu(); // Return to menu after action
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
            "Do you have a sudden high fever (>38.5°C)?",
            "Severe pain behind the eyes?",
            "Severe joint/muscle pain?",
            "Any skin rash or red spots?",
            "Bleeding from nose/gums?"
        ];
    } else if (flow === 'fever') {
        questions = [
            "Duration of fever?",
            "Temperature > 38°C?",
            "Cough / Sore Throat?",
            "Breathing Difficulty?",
            "Eating/Drinking okay?"
        ];
        options = [
            ['< 2 Days', '> 3 Days'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No'], ['Yes', 'No']
        ];
    } else if (flow === 'general') {
        questions = [
            "Pain Level (1-10)?",
            "Any Drug Allergies?",
            "Taking medication?",
            "Recurring Issue?",
            "Pregnant/Breastfeeding?"
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

// This function is assumed to be `handleUserChoice` or similar,
// which processes user input and then calls `processChatFlow`.
// The instruction implies this structure for randomizing typing delay.
function handleUserChoice(choice) {
    const qr = document.getElementById('quickReplies');
    if (qr) qr.remove();

    if (choice === 'Start Over' || choice === 'Back to Start') { resetChat(); return; }
    if (choice === 'Back') {
        addMessage("Back", true); // Log 'Back' action
        goBack();
        return;
    }

    addMessage(choice, true); // Display user's choice
    toggleInput(false); // Disable input while processing
    showTyping(); // Show typing indicator

    // Randomize Think Time (0.5s - 1.0s)
    const delay = Math.floor(Math.random() * 500) + 500;

    setTimeout(() => {
        removeTyping();
        processChatFlow(choice); // Process the choice after delay
    }, delay);
}

function processChatFlow(choice) {
    // 0. Global Intercepts
    if (choice === 'Yes, Book Now') {
        chatState.bookingData = {}; // Clear previous data
        chatState.bookingData.service = chatState.bookingData.service || 'General Booking';
        startBookingFlow();
        return;
    } else if (choice === 'Back to Start') {
        resetChat();
        return;
    } else if (choice === 'Back') {
        goBack();
        return;
    }

    // If input is from text field, handle it
    if (chatState.flow === 'booking' && chatState.step === 0 && chatState.bookingData.name === undefined) {
        handleBookingStep(choice);
        return;
    }
    if (chatState.flow === 'booking' && chatState.step === 1 && chatState.bookingData.date === undefined) {
        handleBookingStep(choice);
        return;
    }
    if (chatState.flow === 'booking' && chatState.step === 2 && chatState.bookingData.time === undefined) {
        handleBookingStep(choice);
        return;
    }

    // 1. Main Menu Selection
    if (chatState.flow === null) {
        if (choice === 'Check Symptoms') {
            chatState.answers = []; // Reset answers
            saveState();
            addMessage("I can help assess your condition. What seems to be the main issue?");
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
                addMainMenu(); // Return to menu after action
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

// 2. Updated WhatsApp Format
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
        waMsg += `⏰ Time: ${time}\n`;
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