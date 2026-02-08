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
    // 2. SMOOTH SCROLL & CLICK-TO-STICK
    // ==========================================
    // We target .nav-links because that is what is in your HTML
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            // 1. Remove 'active' from all links immediately
            navLinks.forEach(nav => nav.classList.remove('active'));
            // 2. Add 'active' to the clicked link
            this.classList.add('active');

            const targetId = this.getAttribute('href');
            smoothScrollTo(targetId);
        });
    });

    // ==========================================
    // 3. SCROLL SPY (Auto-Highlight while scrolling)
    // ==========================================
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section, header');
        const headerOffset = 150; 

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= (sectionTop - headerOffset)) {
                current = section.getAttribute('id');
            }
        });

        // Only run this if we found a current section
        if (current) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        }
    });

    // ==========================================
    // 4. MOBILE MENU TOGGLE
    // ==========================================
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-links'); // Fixed class name here too
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================
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
        const navMenu = document.querySelector('.nav-links'); // Fixed class name
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    }
}

function scrollToContact() {
    smoothScrollTo('#contact');
}

function scrollToBooking() {
    smoothScrollTo('#contact');
}