// Funktion zum Erkennen mobiler Geräte
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
}

// Weiter Button - Berechtigungen anfordern
document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continueBtn');
    const skipLink = document.getElementById('skipLink');
    const tiltSensorItem = document.getElementById('tiltSensorItem');
    
    // Tilt Sensor Item nur auf mobilen Geräten anzeigen
    if (tiltSensorItem) {
        if (!isMobileDevice()) {
            tiltSensorItem.style.display = 'none';
        }
    }
    
    // Weiter Button - Berechtigungen anfordern
    continueBtn.addEventListener('click', async (e) => {
        // Verhindern, dass der Button mehrfach geklickt wird
        continueBtn.disabled = true;
        
        try {
            // ===== 1. DEVICE ORIENTATION SENSOR BERECHTIGUNG (ZUERST) =====
            // Nur bei mobilen Geräten anfordern
            if (isMobileDevice()) {
                // WICHTIG: Sensor-Berechtigung ZUERST anfordern, bevor Kamera
                // Damit der Dialog definitiv erscheint
                if (typeof DeviceOrientationEvent !== 'undefined' && 
                    DeviceOrientationEvent !== null && 
                    typeof DeviceOrientationEvent.requestPermission === 'function') {
                    
                    try {
                        // Direkt im Event-Handler aufrufen - KEINE Verzögerung!
                        const permission = await DeviceOrientationEvent.requestPermission();
                        
                        if (permission === 'granted') {
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                        } else {
                            localStorage.setItem('deviceOrientationPermission', 'denied');
                        }
                    } catch (error) {
                        localStorage.setItem('deviceOrientationPermission', 'denied');
                    }
                } else {
                    // Android Chrome / ältere iOS / nicht unterstützt
                    if (typeof DeviceOrientationEvent === 'undefined' || DeviceOrientationEvent === null) {
                        localStorage.setItem('deviceOrientationPermission', 'not_supported');
                    } else {
                        localStorage.setItem('deviceOrientationPermission', 'granted');
                    }
                }
            } else {
                // Desktop-Gerät - keine Sensor-Berechtigung benötigt
                localStorage.setItem('deviceOrientationPermission', 'not_needed');
            }
            
            // ===== 2. KAMERA-BERECHTIGUNG =====
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
            
            // ===== 3. ONBOARDING ABSCHLIESSEN =====
            localStorage.setItem('onboardingCompleted', 'true');
            
            // Kurze Verzögerung bevor weitergeleitet wird
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Zur Homepage weiterleiten
            window.location.href = 'index.html';
            
        } catch (error) {
            // Bei Fehler trotzdem weiterleiten
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = 'index.html';
        }
    });
    
    // Skip Link - Onboarding abschließen ohne Berechtigungen
    skipLink.addEventListener('click', () => {
        localStorage.setItem('onboardingCompleted', 'true');
        window.location.href = 'index.html';
    });
});

// Device Orientation Berechtigung anfordern (für review.js wiederverwendbar)
async function requestDeviceOrientationPermission() {
    // Nur bei mobilen Geräten anfordern
    if (!isMobileDevice()) {
        localStorage.setItem('deviceOrientationPermission', 'not_needed');
        return false;
    }
    
    // Prüfen ob DeviceOrientationEvent unterstützt wird
    if (typeof DeviceOrientationEvent === 'undefined' || DeviceOrientationEvent === null) {
        localStorage.setItem('deviceOrientationPermission', 'not_supported');
        return false;
    }
    
    // iOS 13+ Safari benötigt explizite Berechtigung
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            // ACHTUNG: Diese Funktion sollte nur verwendet werden, wenn sie direkt von einem Event-Handler aufgerufen wird
            const permission = await DeviceOrientationEvent.requestPermission();
            
            if (permission === 'granted') {
                localStorage.setItem('deviceOrientationPermission', 'granted');
                return true;
            } else {
                localStorage.setItem('deviceOrientationPermission', 'denied');
                return false;
            }
        } catch (error) {
            localStorage.setItem('deviceOrientationPermission', 'denied');
            return false;
        }
    } else {
        // Android Chrome / ältere iOS - keine explizite Berechtigung benötigt
        localStorage.setItem('deviceOrientationPermission', 'granted');
        return true;
    }
}
