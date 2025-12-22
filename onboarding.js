// Typing-Effekt Funktion
function typeText(element, text, speed = 50, callback) {
    let index = 0;
    element.textContent = '';
    
    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, speed);
        } else {
            if (callback) callback();
        }
    }
    
    type();
}

// Fade-In-Effekt Funktion
function fadeInText(element, duration = 1200, callback) {
    // Text sofort setzen, aber unsichtbar
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    // Fade-In starten nach kurzer Verzögerung
    setTimeout(() => {
        element.style.opacity = '1';
        
        // Callback nach Animation
        if (callback) {
            setTimeout(callback, duration);
        }
    }, 50);
}

// Verstanden Button - Weiterleitung zur Berechtigungsseite
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('onboardingTitle');
    const textElement = document.getElementById('onboardingText');
    const understandBtn = document.getElementById('understandBtn');
    
    const titleText = 'Memories';
    const descriptionText = 'Mit Memories können Sie Ihre besonderen Momente in persönlichen Alben speichern und für immer bewahren.';
    
    // Text sofort setzen (unsichtbar)
    titleElement.textContent = titleText;
    
    // Fade-In-Effekt für Titel starten
    fadeInText(titleElement, 1200, () => {
        // Nach Titel: Typing-Effekt für Text starten
        setTimeout(() => {
            typeText(textElement, descriptionText, 30, () => {
                // Nach Text: Button einblenden
                understandBtn.style.transition = 'opacity 0.5s ease';
                understandBtn.style.opacity = '1';
                understandBtn.style.pointerEvents = 'auto';
            });
        }, 300);
    });
    
    understandBtn.addEventListener('click', () => {
        window.location.href = 'permissions.html';
    });
});
