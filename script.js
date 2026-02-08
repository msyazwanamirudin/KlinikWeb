document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. LANGUAGE TOGGLE
    // ==========================================
    const languageToggle = document.getElementById('languageToggle');
    const savedLang = localStorage.getItem('clinicLanguage') || 'en';
    
    if (languageToggle) {
        languageToggle.value = savedLang;
        changeLanguage(savedLang);
        
        languageToggle.addEventListener('change', function() {
            const selectedLang = this.value;
            localStorage.setItem('clinicLanguage', selectedLang);
            changeLanguage(selectedLang);
        });
    }

    function changeLanguage(lang) {
        const elementsToTranslate = document.querySelectorAll('[data-en]');
        elementsToTranslate.forEach(element => {
            const translation = element.getAttribute(`data-${lang}`);
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    // ==========================================
    // 2. MODERN SMOOTH SCROLL (For Nav Links)
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const headerOffset = 100; 

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            const targetId = this.getAttribute('href');
            smoothScrollTo(targetId); // Use the helper function
        });
    });

    // ==========================================
    // SCROLL SPY (Highlight Active Nav Link)
    // ==========================================
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-list a');
        const headerOffset = 150; // Adjusts when the highlight triggers

        // 1. Figure out which section is currently on screen
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (pageYOffset >= (sectionTop - headerOffset)) {
                current = section.getAttribute('id');
            }
        });

        // 2. Add the 'active-link' class to the matching nav button
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active-link');
            }
        });
    });

    // ==========================================
    // 4. MOBILE MENU TOGGLE
    // ==========================================
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-links');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});

// ==========================================
// 5. HELPER FUNCTIONS (For Hero Buttons)
// ==========================================
// These must be outside the EventListener so HTML onclick="" works

function smoothScrollTo(targetId) {
    const targetElement = document.querySelector(targetId);
    const headerOffset = 100;

    if (targetElement) {
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
        
        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-links');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
}

// Function called by "Contact Us" button
function scrollToContact() {
    smoothScrollTo('#contact');
}

// Function called by "Book Appointment" button
function scrollToBooking() {
    // If you have a booking section, use #booking. 
    // If not, use #contact or the WhatsApp link.
    // Based on your previous code, it seems you want to scroll to #contact or open WhatsApp.
    
    // Option A: Scroll to Contact Section
    smoothScrollTo('#contact'); 
    
    // Option B: If you prefer it to open WhatsApp directly:
    // window.open('https://wa.me/60123499793', '_blank');
}
// ==========================================
// CLICK TO STICK (Highlight Active Link)
// ==========================================

// 1. Select all navigation links
const stickyNavLinks = document.querySelectorAll('.nav-list a');

stickyNavLinks.forEach(link => {
    link.addEventListener('click', function() {
        // 2. Remove 'active' class from ALL links first
        stickyNavLinks.forEach(nav => nav.classList.remove('active'));

        // 3. Add 'active' class to the one we just clicked
        this.classList.add('active');
    });
});

// Optional: Auto-highlight sections while scrolling (ScrollSpy)
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    const headerOffset = 150; 

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= (sectionTop - headerOffset)) {
            current = section.getAttribute('id');
        }
    });

    stickyNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});