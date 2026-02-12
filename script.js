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

// --- LIVE STATUS LOGIC (Refined) ---
function updateLiveStatus() {
    const now = new Date();
    const hour = now.getHours();
    const statusText = document.getElementById('liveStatusText');
    const statusDot = document.getElementById('liveStatusDot');

    // Logic:
    // Open: 9AM - 10PM (except break)
    // Break: 12PM - 2PM
    // Closed: 10PM - 9AM

    const isBreak = hour >= 12 && hour < 14;
    const isOpen = hour >= 9 && hour < 22;

    if (isOpen) {
        if (isBreak) {
            statusText.innerHTML = "Doctor on Break (Resume 2:00 PM)";
            statusDot.style.backgroundColor = "#eab308"; // Yellow/Gold
            statusDot.style.boxShadow = "none";
            statusDot.style.animation = "none";
        } else {
            statusText.innerHTML = "Clinic Open (Queue: <span class='text-success'>Normal</span>)";
            statusDot.style.backgroundColor = "#22c55e"; // Green
            statusDot.style.boxShadow = "0 0 10px #22c55e";
            statusDot.style.animation = "pulse 2s infinite";
        }
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
        addMessage("Back", true); // Show 'Back' in chat log for clarity
        // Small delay to make it feel natural
        setTimeout(() => goBack(), 300);
        return;
    }

    addMessage(choice, true);
    toggleInput(false);
    showTyping();

    setTimeout(() => {
        removeTyping();
        processChatFlow(choice);
    }, 600);
}

function processChatFlow(choice) {
    // 0. Global Intercepts
    if (choice === 'Yes, Book Now') {
        // Preserve context if coming from a flow
        if (chatState.flow && chatState.flow !== 'booking') {
            chatState.bookingData.service = `Assessment (${chatState.flow})`;
        } else {
            chatState.bookingData.service = 'General Booking';
        }
        startBookingFlow();
        return;
    }

    // 1. Main Menu Selection
    if (chatState.flow === null) {
        if (choice === 'Check Symptoms') {
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
            chatState.bookingData.service = 'General Booking';
            startBookingFlow();
        } else if (choice === 'Fertility Info') {
            saveState();
            addMessage("Dr. Alia is our fertility expert. Connect with us for a Follicle Scan (RM60).");
            addQuickReplies(['Book Scan', 'Chat with Specialist', 'Back']);
        } else if (choice === 'Book Scan') {
            chatState.bookingData.service = 'Follicle Scan';
            startBookingFlow();
        } else if (choice === 'Chat with Specialist') {
            bookViaWhatsApp('Fertility Inquiry');
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

    chatState.bookingData.report = report;
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

// ... (in handleUserChoice)

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

    setTimeout(() => {
        removeTyping();
        processChatFlow(choice);
    }, 600);
}

function askBookingQuestion() {
    if (chatState.step === 0) {
        addMessage("Great! To secure your slot, please type your **Full Name**.");
        toggleInput(true);
    } else if (chatState.step === 1) {
        addMessage(`Thanks, ${chatState.bookingData.name}. When would you like to visit?`);
        addQuickReplies(['Today', 'Tomorrow', 'Custom Date', 'Back']);
    } else if (chatState.step === 2) {
        addMessage("Preferred Time Slot?");
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

function finishBooking() {
    const { name, date, time, service, report } = chatState.bookingData;

    let finalMsg = `Booking Confirmed for *${name}*.<br>📅 ${date} at ${time}<br><br>Please click below to send this to our WhatsApp for final confirmation.`;
    addMessage(finalMsg);

    // Formatted WhatsApp Message
    let waMsg = `*BOOKING REQUEST*\n\n`;
    waMsg += `👤 *Name:* ${name}\n`;
    waMsg += `📅 *Date:* ${date}\n`;
    waMsg += `🕒 *Time:* ${time}\n`;
    waMsg += `🏥 *Service:* ${service || 'General Appointment'}\n\n`;

    if (report) {
        waMsg += `----------------\n${report}`;
    }

    const waUrl = `https://wa.me/60172032048?text=${encodeURIComponent(waMsg)}`;

    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';

    // WhatsApp Button
    const btn = document.createElement('div');
    btn.className = 'chip';
    btn.style.background = '#22c55e';
    btn.style.color = 'white';
    btn.innerHTML = '<i class="fab fa-whatsapp"></i> Send to WhatsApp';
    btn.onclick = () => window.open(waUrl, '_blank');

    // Menu Button (Infinite Loop)
    const menuBtn = document.createElement('div');
    menuBtn.className = 'chip';
    menuBtn.innerText = "Main Menu";
    menuBtn.onclick = () => {
        chatState.flow = null;
        addMessage("What else can I do for you?");
        addMainMenu();
    };

    div.appendChild(btn);
    div.appendChild(menuBtn);
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
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