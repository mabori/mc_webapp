// Weiter Button - Berechtigungen anfordern
document.addEventListener('DOMContentLoaded', async () => {
    const continueBtn = document.getElementById('continueBtn');
    const skipLink = document.getElementById('skipLink');
    
    // Weiter Button - Berechtigungen anfordern
    continueBtn.addEventListener('click', async () => {
        await requestAllPermissions();
    });
    
    // Skip Link - Onboarding abschließen ohne Berechtigungen
    skipLink.addEventListener('click', () => {
        localStorage.setItem('onboardingCompleted', 'true');
        window.location.href = 'index.html';
    });
});

// Alle notwendigen Berechtigungen anfordern
async function requestAllPermissions() {
    try {
        // ===== 1. KAMERA-BERECHTIGUNG =====
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1920 }
                }
            });
            
            // Stream sofort schließen, wir brauchen nur die Berechtigung
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            // Kamera-Berechtigung wurde verweigert - trotzdem weitermachen
        }
        
        // ===== 2. DEVICE ORIENTATION SENSOR BERECHTIGUNG =====
        // Kurze Verzögerung zwischen den Berechtigungsanfragen für iOS
        // Damit iOS Zeit hat, den ersten Dialog zu schließen
        await new Promise(resolve => setTimeout(resolve, 300));
        await requestDeviceOrientationPermission();
        
        // ===== 3. ONBOARDING ABSCHLIESSEN =====
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Kurze Verzögerung bevor weitergeleitet wird
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Zur Homepage weiterleiten
        window.location.href = 'index.html';
        
    } catch (error) {
        // Bei Fehler trotzdem weiterleiten
        localStorage.setItem('onboardingCompleted', 'true');
        window.location.href = 'index.html';
    }
}

// Device Orientation Berechtigung anfordern (kann auch von review.js verwendet werden)
async function requestDeviceOrientationPermission() {
    // Prüfen ob DeviceOrientationEvent unterstützt wird
    if (typeof DeviceOrientationEvent === 'undefined' || DeviceOrientationEvent === null) {
        localStorage.setItem('deviceOrientationPermission', 'not_supported');
        return false;
    }
    
    // iOS 13+ Safari benötigt explizite Berechtigung
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            // WICHTIG: requestPermission() muss aus einer Benutzerinteraktion heraus aufgerufen werden
            // Da diese Funktion von einem Button-Click Event Handler aufgerufen wird, ist das erfüllt
            const permission = await DeviceOrientationEvent.requestPermission();
            
            if (permission === 'granted') {
                localStorage.setItem('deviceOrientationPermission', 'granted');
                return true;
            } else if (permission === 'denied') {
                localStorage.setItem('deviceOrientationPermission', 'denied');
                return false;
            } else {
                // Unbekannter Status (z.B. 'prompt')
                localStorage.setItem('deviceOrientationPermission', permission);
                return false;
            }
        } catch (error) {
            // Fehler bei der Anfrage - möglicherweise wurde die Berechtigung bereits verweigert
            // oder die API funktioniert nicht wie erwartet
            localStorage.setItem('deviceOrientationPermission', 'denied');
            return false;
        }
    } else {
        // Android Chrome / ältere iOS - keine explizite Berechtigung benötigt
        localStorage.setItem('deviceOrientationPermission', 'granted');
        return true;
    }
}
