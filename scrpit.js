document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Get the language dropdown
    const languageToggle = document.getElementById('languageToggle');
    
    // 2. Check if the user already chose a language before (saved in memory)
    const savedLang = localStorage.getItem('clinicLanguage') || 'en';
    
    // 3. Set the dropdown to the saved language and update text immediately
    if (languageToggle) {
        languageToggle.value = savedLang;
        changeLanguage(savedLang);
        
        // 4. Listen for when the user changes the dropdown
        languageToggle.addEventListener('change', function() {
            const selectedLang = this.value;
            localStorage.setItem('clinicLanguage', selectedLang); // Save for next time
            changeLanguage(selectedLang);
        });
    }

    // --- The Function that Swaps the Text ---
    function changeLanguage(lang) {
        // Find ALL elements in the HTML that have a "data-en" tag
        const elementsToTranslate = document.querySelectorAll('[data-en]');
        
        elementsToTranslate.forEach(element => {
            // Get the translation from the data attribute (data-en or data-bm)
            const translation = element.getAttribute(`data-${lang}`);
            
            // If a translation exists, update the text
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    // --- Mobile Menu Toggle (Bonus Fix) ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});