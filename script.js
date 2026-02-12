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

    const phone = "60135253503";
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

// --- Chat Bot Logic ---
function toggleChat() {
    const chat = document.getElementById('chatWindow');
    if (chat.style.display === 'flex') {
        chat.style.display = 'none';
    } else {
        chat.style.display = 'flex';
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

// Expanded Chat Logic
function handleUserChoice(choice) {
    // Remove quick replies
    const qr = document.getElementById('quickReplies');
    if (qr) qr.remove();
    // Note: In a real app we might just hide them or disable them

    // User Message
    addMessage(choice, true);

    // Bot Logic
    showTyping();

    setTimeout(() => {
        removeTyping();

        if (choice === 'Check Symptoms') {
            addMessage("I can help with that. Are you experiencing any urgent pain, bleeding, or breathing difficulties?");
            addQuickReplies(['Yes, Severe Pain/Bleeding', 'No, Just Mild Discomfort', 'Fever/Cough']);
        }
        else if (choice === 'Yes, Severe Pain/Bleeding') {
            addMessage("<b class='text-danger'>Please go to the nearest Emergency Room or Hospital immediately.</b> Our clinic is a GP setting and may not be equipped for critical emergencies.");
            addQuickReplies(['Call 999', 'Call Clinic for Advice']);
        }
        else if (choice === 'No, Just Mild Discomfort' || choice === 'Fever/Cough') {
            addMessage("It sounds like you should see a doctor soon. Our wait time is currently under 15 minutes. Would you like to book a slot?");
            addQuickReplies(['Book Slot', 'Just Walk-In']);
        }
        else if (choice === 'Book Slot') {
            bookViaWhatsApp('General Sickness');
        }

        else if (choice === 'Fertility Info') {
            addMessage("Dr. Alia is a specialist in TTC journeys. We offer:");
            addMessage("1. <b>Follicle Tracking</b> (RM60/scan)<br>2. <b>Full Fertility Screen</b> (RM250)<br>3. <b>IUI Counseling</b>");
            addMessage("Which one are you interested in?");
            addQuickReplies(['Follicle Scan', 'Full Screening', 'Just asking']);
        }
        else if (choice === 'Follicle Scan' || choice === 'Full Screening') {
            addMessage("Excellent choice. I'm opening WhatsApp for you to choose your preferred date.");
            setTimeout(() => bookViaWhatsApp(choice), 2000);
        }

        else if (choice === 'Book Appointment') {
            addMessage("What type of appointment involves?");
            addQuickReplies(['General Health', 'Antenatal Checkup', 'Vaccination', 'Others']);
        }
        else if (['General Health', 'Antenatal Checkup', 'Vaccination', 'Others'].includes(choice)) {
            addMessage(`Noted on ${choice}. Connecting you to our admin...`);
            setTimeout(() => bookViaWhatsApp(choice), 1500);
        }

        else {
            addMessage("Is there anything else I can help you with?");
            addQuickReplies(['Check Symptoms', 'Book Appointment']);
        }

    }, 1000);
}

function addQuickReplies(options) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';
    div.id = 'quickReplies';

    options.forEach(opt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerText = opt;
        chip.onclick = () => handleUserChoice(opt);
        div.appendChild(chip);
    });

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}