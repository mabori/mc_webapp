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
                console.log('📷 Fordere Kamera-Berechtigung an...');
                
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
                
                console.log('✓ Kamera-Berechtigung erteilt');
                updatePermissionStatus(cameraStatusEl, 'granted', '✓ Erteilt');
            } catch (error) {
                console.error('✗ Kamera-Berechtigung Fehler:', error);
                updatePermissionStatus(cameraStatusEl, 'denied', '✗ Verweigert');
                
                // Benutzerfreundliche Fehlermeldung
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    console.warn('Kamera-Berechtigung wurde verweigert');
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    console.warn('Keine Kamera gefunden');
                } else {
                    console.warn('Unbekannter Kamera-Fehler:', error.name);
                }
            }
            
            // ===== 2. SENSOR-BERECHTIGUNGEN (Device Orientation / Accelerometer / Gyroskop) =====
            updatePermissionStatus(sensorStatusEl, 'pending', '⏳ Wird angefordert...');
            
            let sensorPermissionGranted = false;
            
            // Prüfen ob DeviceOrientationEvent unterstützt wird
            if (typeof DeviceOrientationEvent !== 'undefined') {
                // iOS 13+ Safari benötigt explizite Berechtigung über DeviceOrientationEvent.requestPermission()
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ - explizite Berechtigung ANFORDERN
                    try {
                        console.log('📱 Fordere Device Orientation Berechtigung an (iOS 13+)...');
                        console.log('ℹ Ein Dialog wird erscheinen - bitte erlauben Sie den Zugriff');
                        
                        // WICHTIG: requestPermission() muss aus einer Benutzerinteraktion heraus aufgerufen werden
                        // (Button-Click ist eine Benutzerinteraktion, daher funktioniert es hier)
                        const permission = await DeviceOrientationEvent.requestPermission();
                        console.log('Device Orientation Berechtigung Status:', permission);
                        
                        if (permission === 'granted') {
                            // Berechtigung erteilt - in localStorage speichern
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                            sensorPermissionGranted = true;
                            updatePermissionStatus(sensorStatusEl, 'granted', '✓ Erteilt');
                            console.log('✓ Device Orientation Berechtigung erteilt (iOS)');
                            
                            // Event Listener testweise hinzufügen um zu prüfen ob es funktioniert
                            const testListener = (event) => {
                                if (event && (event.gamma !== null || event.beta !== null)) {
                                    console.log('✓ Device Orientation Sensor funktioniert! Gamma:', 
                                        event.gamma?.toFixed(1), 'Beta:', event.beta?.toFixed(1));
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
                        console.error('✗ Fehler bei Device Orientation Berechtigung (iOS):', error);
                        localStorage.setItem('deviceOrientationPermission', 'error');
                        updatePermissionStatus(sensorStatusEl, 'denied', '✗ Fehler');
                    }
                } else {
                    // Android Chrome / ältere iOS - keine explizite requestPermission API
                    // Versuche Permissions API für Accelerometer/Gyroskop (neuere Browser)
                    console.log('📱 Device Orientation: requestPermission API nicht verfügbar');
                    console.log('📱 Versuche Permissions API für Accelerometer/Gyroskop...');
                    
                    let permissionsGranted = false;
                    
                    // Prüfen ob Permissions API verfügbar ist
                    if (navigator.permissions && navigator.permissions.query) {
                        try {
                            // Versuche Accelerometer-Berechtigung
                            try {
                                const accelPermission = await navigator.permissions.query({ name: 'accelerometer' });
                                console.log('Accelerometer Permission Status:', accelPermission.state);
                                
                                if (accelPermission.state === 'granted') {
                                    permissionsGranted = true;
                                } else if (accelPermission.state === 'prompt') {
                                    // Berechtigung anfordern
                                    const accelRequest = await navigator.permissions.request({ name: 'accelerometer' });
                                    if (accelRequest.state === 'granted') {
                                        permissionsGranted = true;
                                    }
                                }
                            } catch (accelError) {
                                console.log('Accelerometer Permission API nicht verfügbar:', accelError);
                            }
                            
                            // Versuche Gyroskop-Berechtigung
                            try {
                                const gyroPermission = await navigator.permissions.query({ name: 'gyroscope' });
                                console.log('Gyroscope Permission Status:', gyroPermission.state);
                                
                                if (gyroPermission.state === 'granted') {
                                    permissionsGranted = true;
                                } else if (gyroPermission.state === 'prompt') {
                                    // Berechtigung anfordern
                                    const gyroRequest = await navigator.permissions.request({ name: 'gyroscope' });
                                    if (gyroRequest.state === 'granted') {
                                        permissionsGranted = true;
                                    }
                                }
                            } catch (gyroError) {
                                console.log('Gyroscope Permission API nicht verfügbar:', gyroError);
                            }
                        } catch (permError) {
                            console.log('Permissions API Fehler:', permError);
                        }
                    }
                    
                    // Für Android/ältere iOS: Device Orientation Events funktionieren meist direkt
                    // Setze Berechtigung als "granted" und teste ob Sensor funktioniert
                    localStorage.setItem('deviceOrientationPermission', 'granted');
                    sensorPermissionGranted = true;
                    updatePermissionStatus(sensorStatusEl, 'granted', '✓ Verfügbar');
                    
                    console.log('📱 Device Orientation: Keine explizite Berechtigung benötigt (Android/ältere iOS)');
                    
                    // Testweise Event Listener hinzufügen um zu prüfen ob Sensor verfügbar ist
                    let sensorTested = false;
                    const testListener = (event) => {
                        if (!sensorTested && event && (event.gamma !== null || event.beta !== null)) {
                            sensorTested = true;
                            console.log('✓ Device Orientation Sensor verfügbar (Android/ältere iOS)');
                            console.log('  Gamma:', event.gamma?.toFixed(1), 'Beta:', event.beta?.toFixed(1));
                            updatePermissionStatus(sensorStatusEl, 'granted', '✓ Verfügbar');
                        }
                    };
                    window.addEventListener('deviceorientation', testListener, { passive: true });
                    
                    // Listener nach 3 Sekunden entfernen
                    setTimeout(() => {
                        window.removeEventListener('deviceorientation', testListener);
                        if (!sensorTested) {
                            console.warn('⚠ Device Orientation Sensor konnte nicht getestet werden');
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
            
            // ===== 3. ONBOARDING ABSCHLIESSEN =====
            localStorage.setItem('onboardingCompleted', 'true');
            console.log('✓ Onboarding abgeschlossen');
            
            // Kurze Verzögerung damit Status sichtbar bleibt
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // ===== 4. ZUR HOMEPAGE WEITERLEITEN =====
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('✗ Fehler beim Anfordern der Berechtigungen:', error);
            // Trotzdem weiterleiten - Benutzer kann später nochmal versuchen
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = 'index.html';
        }
    });
});
