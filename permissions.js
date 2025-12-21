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
        // Prüfen ob DeviceOrientationEvent unterstützt wird
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent !== null) {
            // iOS 13+ Safari benötigt explizite Berechtigung
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    
                    if (permission === 'granted') {
                        localStorage.setItem('deviceOrientationPermission', 'granted');
                    } else {
                        localStorage.setItem('deviceOrientationPermission', 'denied');
                    }
                } catch (error) {
                    // Fehler bei der Anfrage
                    localStorage.setItem('deviceOrientationPermission', 'denied');
                }
            } else {
                // Android Chrome / ältere iOS - keine explizite Berechtigung benötigt
                localStorage.setItem('deviceOrientationPermission', 'granted');
            }
        } else {
            // DeviceOrientationEvent nicht unterstützt
            localStorage.setItem('deviceOrientationPermission', 'not_supported');
        }
        
        // ===== 3. ONBOARDING ABSCHLIESSEN =====
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Zur Homepage weiterleiten
        window.location.href = 'index.html';
        
    } catch (error) {
        // Bei Fehler trotzdem weiterleiten
        localStorage.setItem('onboardingCompleted', 'true');
        window.location.href = 'index.html';
    }
}
