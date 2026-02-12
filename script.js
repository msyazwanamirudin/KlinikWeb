AOS.init({ duration: 800, once: true });

// --- Navbar Scroll Effect & ScrollSpy ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', function () {
    const nav = document.querySelector('.navbar');
    // Scrolled Effect
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    // ScrollSpy Logic
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= (sectionTop - 150)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active-nav');
        if (link.getAttribute('href').includes(current)) {
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

// --- Back To Top Logic ---
document.getElementById('backToTop').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// --- LIVE STATUS LOGIC (Static Workaround) ---
function updateLiveStatus() {
    const now = new Date();
    const hour = now.getHours();
    const statusText = document.getElementById('liveStatusText');
    const statusDot = document.getElementById('liveStatusDot');

    // Clinic Hours: Mon-Sat 9AM - 10PM, Sun 9AM - 2PM (Example)
    const isOpen = hour >= 9 && hour < 22;

    if (isOpen) {
        statusText.innerHTML = "Clinic Open (Queue: <span class='text-success'>Normal</span>)";
        statusDot.style.backgroundColor = "#22c55e"; // Green
        statusDot.style.boxShadow = "0 0 10px #22c55e";
    } else {
        statusText.innerHTML = "Clinic Closed (Opens 9:00 AM)";
        statusDot.style.backgroundColor = "#ef4444"; // Red
        statusDot.style.boxShadow = "none";
        statusDot.style.animation = "none";
    }
}
updateLiveStatus();
setInterval(updateLiveStatus, 60000);


// --- WHATSAPP BOOKING LOGIC (With Confirmation) ---
function bookViaWhatsApp(serviceName, details = "") {
    // Confirmation
    const confirmAction = confirm("We are redirecting you to WhatsApp to complete your booking securely. Continue?");

    if (!confirmAction) return;

    const phone = "60172032048";
    let message = `Hi Klinik Haya, I would like to book an appointment.`;

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
    bookingData: {} // To store Name, Date, Time
};

function toggleChat() {
    const chat = document.getElementById('chatWindow');
    if (chat.style.display === 'flex') {
        chat.style.display = 'none';
        chatState.flow = null; // Reset on close? Optional.
    } else {
        chat.style.display = 'flex';
        // If empty, start fresh? No, keep history for now.
    }
}

function addMessage(text, isUser = false) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = isUser ? 'msg msg-user' : 'msg msg-bot';
    div.innerHTML = text; // Allow HTML primarily for line breaks
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

// Reset Function
function resetChat() {
    chatState = { step: 0, flow: null, answers: [], bookingData: {} };
    toggleInput(false);
    const chatBody = document.getElementById('chatBody');
    chatBody.innerHTML = `
        <div class="msg msg-bot">
            Hello! I'm Haya AI (Reset). <br>How can I help you?
        </div>
    `;
    addQuickReplies(['Check Symptoms', 'Book Appointment', 'Fertility Info']);
}

// Main Logic
function handleUserChoice(choice) {
    // Remove old options
    const qr = document.getElementById('quickReplies');
    if (qr) qr.remove();

    // Handle Reset
    if (choice === 'Start Over') {
        resetChat();
        return;
    }

    // User Message
    addMessage(choice, true);
    toggleInput(false); // Hide input after submission by default

    // Bot Thinking
    showTyping();

    setTimeout(() => {
        removeTyping();
        processChatFlow(choice);
    }, 600);
}

function processChatFlow(choice) {
    // 1. Initial Selection
    if (chatState.flow === null) {
        if (choice === 'Check Symptoms') {
            addMessage("I can help assess your condition. What seems to be the main issue?");
            addQuickReplies(['High Fever (Dengue?)', 'General Fever/Flu', 'Other / Pain']);
        } else if (choice === 'High Fever (Dengue?)') {
            startFlow('dengue');
        } else if (choice === 'General Fever/Flu') {
            startFlow('fever');
        } else if (choice === 'Other / Pain') {
            startFlow('general');
        } else if (choice === 'Book Appointment') {
            chatState.bookingData.service = 'General Booking';
            startBookingFlow();
        } else if (choice === 'Fertility Info') {
            addMessage("Dr. Alia is our fertility expert. Connect with us for a Follicle Scan (RM60).");
            addQuickReplies(['Book Scan', 'Chat with Specialist', 'Start Over']);
        } else if (choice === 'Book Scan') {
            chatState.bookingData.service = 'Follicle Scan';
            startBookingFlow();
        } else if (choice === 'Chat with Specialist') {
            bookViaWhatsApp('Fertility Inquiry');
        } else {
            addMessage("How can I help you today?");
            addQuickReplies(['Check Symptoms', 'Book Appointment', 'Start Over']);
        }
        return;
    }

    // 2. Booking Flow Logic
    if (chatState.flow === 'booking') {
        handleBookingStep(choice);
        return;
    }

    // 3. Symptom Checker Logic
    chatState.answers.push(choice);
    chatState.step++;
    nextQuestion();
}

function startFlow(flowType) {
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
            ['< 2 Days', '> 3 Days'],
            ['Yes', 'No'],
            ['Yes', 'No'],
            ['Yes', 'No'],
            ['Yes', 'No']
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
            ['Mild (1-3)', 'Severe (>7)'],
            ['Yes', 'No'],
            ['Yes', 'No'],
            ['Yes', 'No'],
            ['Yes', 'No']
        ];
    }

    if (step < questions.length) {
        addMessage(questions[step]);
        let currentOptions = ['Yes', 'No'];
        if (options.length > 0 && options[step]) {
            currentOptions = options[step];
        }
        currentOptions.push('Start Over');
        addQuickReplies(currentOptions);
    } else {
        finishFlow(flow);
    }
}

function finishFlow(flowName) {
    // Generate Report
    let report = `*AI Triage Report: ${flowName.toUpperCase()}*\n`;
    const questionsDS = {
        'dengue': ['High Fever', 'Eye Pain', 'Joint Pain', 'Rash', 'Bleeding'],
        'fever': ['Duration', 'High Temp', 'Cough/Sore', 'Breathing', 'Eating'],
        'general': ['Pain Level', 'Allergies', 'Meds', 'Recurring', 'Pregnant']
    };

    chatState.answers.forEach((ans, i) => {
        const qLabel = questionsDS[flowName][i] || `Q${i + 1}`;
        report += `- ${qLabel}: ${ans}\n`;
    });

    chatState.bookingData.report = report;
    chatState.bookingData.service = `Assessment (${flowName})`;

    addMessage("Assessment Complete. Would you like to proceed with booking?");
    addQuickReplies(['Yes, Book Now', 'No, Just Asking', 'Start Over']);
}

// --- BOOKING FLOW ---
function startBookingFlow() {
    chatState.flow = 'booking';
    chatState.step = 0;
    // Step 0: Name
    addMessage("Great! To secure your slot, may I have your **Full Name**?");
    toggleInput(true); // Show input for Name
}

function handleBookingStep(choice) {
    const step = chatState.step;

    if (step === 0) {
        // Name Captured
        chatState.bookingData.name = choice;
        chatState.step++;
        addMessage(`Thanks, ${choice}. When would you like to come?`);
        addQuickReplies(['Today', 'Tomorrow', 'Other Date', 'Start Over']);
    } else if (step === 1) {
        // Date Captured
        if (choice === 'Other Date') {
            addMessage("Please type your preferred date (e.g., 15 Oct):");
            toggleInput(true);
            return; // Stay on step 1 effectively but waiting for text? No, handle logic.
            // Actually simplest is to just accept the text next time around.
            // Let's increment step and treat the next input as date.
            // But wait, 'processChatFlow' calls this function.
            // If user clicks 'Other Date', we ask for text input.
            // The next 'choice' will be the text input.
            // So we need a sub-step or just handle it here.
        }

        chatState.bookingData.date = choice;
        chatState.step++;
        addMessage("Preferred Time?");
        addQuickReplies(['Morning (9am-12pm)', 'Afternoon (1pm-5pm)', 'Evening (6pm-10pm)', 'Start Over']);
    } else if (step === 2) { // Logic fix: if coming from "Other date" text input
        // Wait, if user typed a date, step was 1. 
        // So if step is 1 and choice is a date text...
        // Let's simplify:
        // If choice was "Other Date", we didn't increment step yet? 
        // To avoid complexity, let's just assume valid date.
        chatState.bookingData.date = choice;
        chatState.step++;
        addMessage("Preferred Time?");
        addQuickReplies(['Morning (9am-12pm)', 'Afternoon (1pm-5pm)', 'Evening (6pm-10pm)', 'Start Over']);
    } else if (step === 3) { // Time Captured (Logic actually depends on previous flow)
        // Actually, let's realign step logic.
        // Step 0: Asked for Name. Input: Name. -> Go to Step 1.
        // Step 1: Asked for Date. Input: Date or Chip. -> Go to Step 2.
        // Step 2: Asked for Time. Input: Time. -> Finish.

        chatState.bookingData.time = choice;
        finishBooking();
    }
}
// Fix implementation of handleBookingStep to be robust
function handleBookingStep(choice) {
    // Current Step Index matches what we keep in chatState.step
    // 0 = Waiting for Name
    // 1 = Waiting for Date
    // 2 = Waiting for Time

    if (chatState.step === 0) {
        // Just received Name
        chatState.bookingData.name = choice;
        chatState.step = 1;
        addMessage(`Thanks, ${choice}. When would you like to visit?`);
        addQuickReplies(['Today', 'Tomorrow', 'Type a Date', 'Start Over']);
    } else if (chatState.step === 1) {
        // Just received Date (or 'Type a Date' request)
        if (choice === 'Type a Date') {
            addMessage("Please type your preferred date (e.g. 12th Oct):");
            toggleInput(true);
            return; // Wait for input, stay on step 1
        }

        chatState.bookingData.date = choice;
        chatState.step = 2;
        addMessage("Preferred Time Slot?");
        addQuickReplies(['Morning (9-12)', 'Afternoon (2-5)', 'Evening (6-9)', 'Start Over']);
    } else if (chatState.step === 2) {
        // Just received Time
        chatState.bookingData.time = choice;
        finishBooking();
    }
}

function finishBooking() {
    const { name, date, time, service, report } = chatState.bookingData;

    let finalMsg = `Booking Confirmed for *${name}*.\n📅 ${date}, ${time}`;
    addMessage(finalMsg);

    // Construct WhatsApp Message
    let waMsg = `Hello, I'd like to confirm a booking.\n\n`;
    waMsg += `👤 Name: ${name}\n`;
    waMsg += `📅 Date: ${date}\n`;
    waMsg += `🕒 Time: ${time}\n`;
    waMsg += `🏥 Service: ${service || 'General'}\n`;

    if (report) {
        waMsg += `\n${report}`;
    }

    const waUrl = `https://wa.me/60172032048?text=${encodeURIComponent(waMsg)}`;

    // Final Button
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';
    div.id = 'quickReplies';

    const btn = document.createElement('div');
    btn.className = 'chip';
    btn.style.background = '#22c55e'; // Green
    btn.style.color = 'white';
    btn.innerText = "✅ Send to WhatsApp";
    btn.onclick = () => window.open(waUrl, '_blank');

    const resetBtn = document.createElement('div');
    resetBtn.className = 'chip';
    resetBtn.innerText = "Start Over";
    resetBtn.onclick = () => resetChat();

    div.appendChild(btn);
    div.appendChild(resetBtn);
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addQuickReplies(options) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';
    div.id = 'quickReplies';

    options.forEach(opt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        // Style 'Start Over' differently
        if (opt === 'Start Over') {
            chip.style.backgroundColor = '#f1f5f9';
            chip.style.color = '#64748b';
            chip.style.border = '1px solid #cbd5e1';
        }
        chip.innerText = opt;
        chip.onclick = () => handleUserChoice(opt);
        div.appendChild(chip);
    });

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}