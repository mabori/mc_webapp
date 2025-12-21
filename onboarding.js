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

// Verstanden Button - Weiterleitung zur Berechtigungsseite
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('onboardingTitle');
    const textElement = document.getElementById('onboardingText');
    const understandBtn = document.getElementById('understandBtn');
    
    const titleText = 'Memories';
    const descriptionText = 'Mit Memories können Sie Ihre besonderen Momente in persönlichen Alben speichern und für immer bewahren.';
    
    // Typing-Effekt für Titel starten
    typeText(titleElement, titleText, 100, () => {
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
