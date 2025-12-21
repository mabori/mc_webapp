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
            // 1. Kamera-Berechtigung anfordern
            try {
                updatePermissionStatus(cameraStatusEl, 'pending', '⏳ Wird angefordert...');
                console.log('Fordere Kamera-Berechtigung an...');
                
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment'
                    }
                });
                // Stream sofort schließen, wir brauchen nur die Berechtigung
                stream.getTracks().forEach(track => track.stop());
                console.log('✓ Kamera-Berechtigung erteilt');
                updatePermissionStatus(cameraStatusEl, 'granted', '✓ Erteilt');
            } catch (error) {
                console.error('Kamera-Berechtigung:', error);
                updatePermissionStatus(cameraStatusEl, 'denied', '✗ Verweigert');
                // Weiterleiten auch wenn Berechtigung verweigert wurde
            }
            
            // 2. Device Orientation Berechtigung anfordern
            // WICHTIG: Diese Berechtigung muss explizit angefordert werden!
            updatePermissionStatus(sensorStatusEl, 'pending', '⏳ Wird angefordert...');
            
            // Prüfen ob DeviceOrientationEvent unterstützt wird
            if (typeof DeviceOrientationEvent !== 'undefined') {
                // Prüfen ob requestPermission API vorhanden ist (iOS 13+)
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ - explizite Berechtigung ANFORDERN
                    try {
                        console.log('Fordere Device Orientation Berechtigung an (iOS 13+)...');
                        
                        // WICHTIG: requestPermission() muss aus einer Benutzerinteraktion heraus aufgerufen werden
                        const permission = await DeviceOrientationEvent.requestPermission();
                        console.log('Device Orientation Berechtigung Status:', permission);
                        
                        if (permission === 'granted') {
                            // Berechtigung erteilt - in localStorage speichern
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                            updatePermissionStatus(sensorStatusEl, 'granted', '✓ Erteilt');
                            console.log('✓ Device Orientation Berechtigung erteilt (iOS)');
                            
                            // Event Listener testweise hinzufügen um zu prüfen ob es funktioniert
                            const testListener = (event) => {
                                if (event && (event.gamma !== null || event.beta !== null)) {
                                    console.log('✓ Device Orientation Sensor funktioniert! Gamma:', event.gamma?.toFixed(1), 'Beta:', event.beta?.toFixed(1));
                                }
                            };
                            window.addEventListener('deviceorientation', testListener, { once: true, passive: true });
                            
                            // Listener nach 2 Sekunden entfernen
                            setTimeout(() => {
                                window.removeEventListener('deviceorientation', testListener);
                            }, 2000);
                        } else if (permission === 'denied') {
                            console.warn('⚠ Device Orientation Berechtigung wurde vom Nutzer verweigert (iOS)');
                            localStorage.setItem('deviceOrientationPermission', 'denied');
                            updatePermissionStatus(sensorStatusEl, 'denied', '✗ Verweigert');
                        } else {
                            console.warn('⚠ Device Orientation Berechtigung: unbekannter Status:', permission);
                            localStorage.setItem('deviceOrientationPermission', permission);
                            updatePermissionStatus(sensorStatusEl, 'denied', '✗ Unbekannt');
                        }
                    } catch (error) {
                        console.error('Fehler bei Device Orientation Berechtigung (iOS):', error);
                        localStorage.setItem('deviceOrientationPermission', 'error');
                        updatePermissionStatus(sensorStatusEl, 'denied', '✗ Fehler');
                    }
                } else {
                    // Android Chrome / ältere iOS - keine explizite Berechtigung API vorhanden
                    // Device Orientation Events sollten direkt funktionieren
                    console.log('Device Orientation: requestPermission API nicht verfügbar (Android/ältere iOS)');
                    localStorage.setItem('deviceOrientationPermission', 'granted');
                    updatePermissionStatus(sensorStatusEl, 'granted', '✓ Verfügbar');
                    
                    // Testweise Event Listener hinzufügen um zu prüfen ob Sensor verfügbar ist
                    let sensorTested = false;
                    const testListener = (event) => {
                        if (!sensorTested && event && (event.gamma !== null || event.beta !== null)) {
                            sensorTested = true;
                            console.log('✓ Device Orientation Sensor verfügbar (Android/ältere iOS)');
                            updatePermissionStatus(sensorStatusEl, 'granted', '✓ Verfügbar');
                        }
                    };
                    window.addEventListener('deviceorientation', testListener, { passive: true });
                    
                    // Listener nach 3 Sekunden entfernen
                    setTimeout(() => {
                        window.removeEventListener('deviceorientation', testListener);
                        if (!sensorTested) {
                            updatePermissionStatus(sensorStatusEl, 'pending', '⚠ Nicht getestet');
                        }
                    }, 3000);
                }
            } else {
                // DeviceOrientationEvent nicht unterstützt
                console.warn('⚠ DeviceOrientationEvent wird von diesem Browser nicht unterstützt');
                localStorage.setItem('deviceOrientationPermission', 'not_supported');
                updatePermissionStatus(sensorStatusEl, 'denied', '✗ Nicht unterstützt');
            }
            
            // 3. Onboarding als abgeschlossen markieren
            localStorage.setItem('onboardingCompleted', 'true');
            console.log('✓ Onboarding abgeschlossen');
            
            // 4. Zur Homepage weiterleiten
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Fehler beim Anfordern der Berechtigungen:', error);
            // Trotzdem weiterleiten - Benutzer kann später nochmal versuchen
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = 'index.html';
        }
    });
});
