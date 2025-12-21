// Status-Elemente
let cameraStatusEl, sensorStatusEl;

// Status aktualisieren
function updatePermissionStatus(element, status, text) {
    if (!element) return;
    element.className = `permission-status ${status}`;
    element.textContent = text;
}

// Weiter Button - Berechtigungen anfordern und zur Homepage weiterleiten
document.addEventListener('DOMContentLoaded', async () => {
    const continueBtn = document.getElementById('continueBtn');
    cameraStatusEl = document.getElementById('cameraStatus');
    sensorStatusEl = document.getElementById('sensorStatus');
    
    // Initiale Status-Anzeige
    updatePermissionStatus(cameraStatusEl, 'pending', '⏳ Wird geprüft...');
    updatePermissionStatus(sensorStatusEl, 'pending', '⏳ Wird geprüft...');
    
    continueBtn.addEventListener('click', async () => {
        try {
            // ===== 1. KAMERA-BERECHTIGUNG =====
            try {
                updatePermissionStatus(cameraStatusEl, 'pending', '⏳ Wird angefordert...');
                
                // Kamera-Berechtigung anfordern
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1920 }
                    }
                });
                
                // Stream sofort schließen, wir brauchen nur die Berechtigung
                stream.getTracks().forEach(track => track.stop());
                
                updatePermissionStatus(cameraStatusEl, 'granted', '✓ Erteilt');
            } catch (error) {
                updatePermissionStatus(cameraStatusEl, 'denied', '✗ Verweigert');
            }
            
            // ===== 2. SENSOR-BERECHTIGUNGEN (Device Orientation) =====
            updatePermissionStatus(sensorStatusEl, 'pending', '⏳ Wird angefordert...');
            
            // Prüfen ob DeviceOrientationEvent unterstützt wird
            if (typeof DeviceOrientationEvent !== 'undefined') {
                // iOS 13+ Safari benötigt explizite Berechtigung über DeviceOrientationEvent.requestPermission()
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ - explizite Berechtigung ANFORDERN
                    try {
                        // WICHTIG: requestPermission() muss aus einer Benutzerinteraktion heraus aufgerufen werden
                        // (Button-Click ist eine Benutzerinteraktion, daher funktioniert es hier)
                        const permission = await DeviceOrientationEvent.requestPermission();
                        
                        if (permission === 'granted') {
                            // Berechtigung erteilt - in localStorage speichern
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                            updatePermissionStatus(sensorStatusEl, 'granted', '✓ Erteilt');
                        } else if (permission === 'denied') {
                            localStorage.setItem('deviceOrientationPermission', 'denied');
                            updatePermissionStatus(sensorStatusEl, 'denied', '✗ Verweigert');
                        } else {
                            localStorage.setItem('deviceOrientationPermission', permission);
                            updatePermissionStatus(sensorStatusEl, 'denied', '✗ Unbekannt');
                        }
                    } catch (error) {
                        localStorage.setItem('deviceOrientationPermission', 'error');
                        updatePermissionStatus(sensorStatusEl, 'denied', '✗ Fehler');
                    }
                } else {
                    // Android Chrome / ältere iOS - keine explizite requestPermission API
                    // Device Orientation Events funktionieren meist direkt ohne explizite Berechtigung
                    // Setze Berechtigung als "granted" da keine explizite Anfrage möglich/erforderlich ist
                    localStorage.setItem('deviceOrientationPermission', 'granted');
                    updatePermissionStatus(sensorStatusEl, 'granted', '✓ Verfügbar');
                }
            } else {
                // DeviceOrientationEvent nicht unterstützt
                localStorage.setItem('deviceOrientationPermission', 'not_supported');
                updatePermissionStatus(sensorStatusEl, 'denied', '✗ Nicht unterstützt');
            }
            
            // ===== 3. ONBOARDING ABSCHLIESSEN =====
            localStorage.setItem('onboardingCompleted', 'true');
            
            // Kurze Verzögerung damit Status sichtbar bleibt
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // ===== 4. ZUR HOMEPAGE WEITERLEITEN =====
            window.location.href = 'index.html';
            
        } catch (error) {
            // Trotzdem weiterleiten - Benutzer kann später nochmal versuchen
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = 'index.html';
        }
    });
});
