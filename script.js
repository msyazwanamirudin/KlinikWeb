AOS.init({ duration: 800, once: true });

// --- Navbar Scroll Effect ---
window.addEventListener('scroll', function () {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// --- Typing Effect (Simple) ---
const words = ["Your Family", "Your Future", "Your Baby", "Your Health"];
let i = 0;
let timer;

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
    const day = now.getDay(); // 0 = Sunday
    const statusText = document.getElementById('liveStatusText');
    const statusDot = document.getElementById('liveStatusDot');

    // Clinic Hours: Mon-Sat 9AM - 10PM, Sun 9AM - 2PM (Example)
    // Simple Logic: Open from 9AM to 10PM everyday for demo
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
// Run on load
updateLiveStatus();
// Update every minute
setInterval(updateLiveStatus, 60000);


// --- WHATSAPP BOOKING LOGIC (No Backend Required) ---
function bookViaWhatsApp(serviceName, details = "") {
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
    // Auto scroll
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

function handleUserChoice(choice) {
    // Remove quick replies
    document.getElementById('quickReplies').style.display = 'none';

    // User Message
    addMessage(choice, true);

    // Bot Logic
    showTyping();

    setTimeout(() => {
        removeTyping();

        if (choice === 'Check Symptoms') {
            addMessage("I can help with that. Are you experiencing any urgent pain or breathing difficulties?");
            addQuickReplies(['Yes, Severe', 'No, Mild Symptoms']);
        } else if (choice === 'Fertility Info') {
            addMessage("Dr. Alia is a specialist in TTC journeys. Would you like to schedule a Follicle Scan or general consultation?");
            addQuickReplies(['Follicle Scan', 'General Consult']);
        } else if (choice === 'Book Appointment') {
            addMessage("Great! I can fast-track that. Are you a Haya Care+ member?");
            addQuickReplies(['Yes', 'No, Sign me up', 'Just Book']);
        } else if (choice === 'Yes, Severe') {
            addMessage("<b class='text-danger'>Please go to the nearest Emergency Room immediately.</b> <br>Or call 999.");
            addQuickReplies(['Call Emergency']);
        } else if (choice === 'Follicle Scan' || choice === 'General Consult') {
            addMessage(`Understood. I'm opening WhatsApp to book your ${choice} slot now.`);
            setTimeout(() => bookViaWhatsApp(choice), 2000);
        } else {
            addMessage("Thanks! Connecting you to our admin via WhatsApp for priority booking...");
            setTimeout(() => bookViaWhatsApp('General Booking', 'Referred by Haya AI'), 1500);
        }
    }, 1000);
}

function addQuickReplies(options) {
    const chatBody = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'quick-replies';
    div.id = 'quickReplies'; // Re-assign ID to manage state

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