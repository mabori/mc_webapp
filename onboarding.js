// Typing-Effekt Funktion
function typeText(element, text, speed = 20, callback) {
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

// Fade-In-Effekt Funktion - langsam von komplett transparent zu sichtbar
function fadeInText(element, duration = 1800, callback, callbackDelay = null) {
    // Text sofort setzen, aber komplett transparent (opacity: 0)
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    // Kurze Verzögerung, damit Browser die Transition registriert
    setTimeout(() => {
        // Langsam von transparent (0) zu sichtbar (1) - wird immer weniger transparent
        element.style.opacity = '1';
        
        // Callback früher aufrufen (z.B. nach 60% der Animationsdauer), damit Text parallel erscheinen kann
        if (callback) {
            const delay = callbackDelay !== null ? callbackDelay : Math.floor(duration * 0.6);
            setTimeout(callback, delay);
        }
    }, 10);
}

// Verstanden Button - Weiterleitung zur Berechtigungsseite
document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('onboardingTitle');
    const textElement = document.getElementById('onboardingText');
    const understandBtn = document.getElementById('understandBtn');
    
    const titleText = 'Memories';
    const descriptionText = 'With Memories, you can save your special moments in personal albums and preserve them forever.';
    
    // Text sofort setzen (komplett transparent - opacity: 0)
    titleElement.textContent = titleText;
    titleElement.style.opacity = '0'; // Start: komplett transparent
    
    // Fade-In-Effekt: langsam von transparent zu sichtbar (opacity: 0 → 1)
    fadeInText(titleElement, 1800, () => {
        // Direkt nach Titel: Typing-Effekt für Text starten (ohne Wartezeit)
        typeText(textElement, descriptionText, 20, () => {
            // Nach Text: Button einblenden
            understandBtn.style.transition = 'opacity 0.5s ease';
            understandBtn.style.opacity = '1';
            understandBtn.style.pointerEvents = 'auto';
        });
    });
    
    understandBtn.addEventListener('click', () => {
        window.location.href = 'permissions.html';
    });
});
