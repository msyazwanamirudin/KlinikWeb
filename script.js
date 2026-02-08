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
    // 2. SMOOTH SCROLL (Updated for ALL links)
    // ==========================================
    // OLD CODE: const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    // NEW CODE: Select ALL links that start with # (Nav + Hero Buttons)
    const allSmoothLinks = document.querySelectorAll('a[href^="#"]');
    
    allSmoothLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            // Only add 'active' class if this is a Navigation Link
            if (this.closest('.nav-links')) {
                // Remove active from other nav links
                document.querySelectorAll('.nav-links a').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }

            const targetId = this.getAttribute('href');
            smoothScrollTo(targetId);
        });
    });

    // ==========================================
    // 3. SCROLL SPY (Highlight Nav Links Only)
    // ==========================================
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section, header');
        const navLinks = document.querySelectorAll('.nav-links a'); // Only highlight menu items
        const headerOffset = 150; 
        
        // Check which section is on screen
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= (sectionTop - headerOffset)) {
                current = section.getAttribute('id');
            }
        });

        // Special Check: Are we at the bottom of the page? (For Contact)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            current = 'contact';
        }

        // Apply active class to Nav Links only
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
    const navMenu = document.querySelector('.nav-links');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================
function smoothScrollTo