// Weiter Button - Berechtigungen anfordern und zur Homepage weiterleiten
document.addEventListener('DOMContentLoaded', async () => {
    const continueBtn = document.getElementById('continueBtn');
    
    continueBtn.addEventListener('click', async () => {
        try {
            // 1. Kamera-Berechtigung anfordern
            try {
                console.log('Fordere Kamera-Berechtigung an...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment'
                    }
                });
                // Stream sofort schließen, wir brauchen nur die Berechtigung
                stream.getTracks().forEach(track => track.stop());
                console.log('✓ Kamera-Berechtigung erteilt');
            } catch (error) {
                console.error('Kamera-Berechtigung:', error);
                // Weiterleiten auch wenn Berechtigung verweigert wurde
            }
            
            // 2. Device Orientation Berechtigung anfordern
            // WICHTIG: Diese Berechtigung muss explizit angefordert werden!
            // iOS 13+ Safari benötigt explizite Berechtigung über DeviceOrientationEvent.requestPermission()
            // Android Chrome benötigt keine explizite Berechtigung, aber wir versuchen es trotzdem
            
            let orientationPermissionGranted = false;
            
            // Prüfen ob DeviceOrientationEvent unterstützt wird
            if (typeof DeviceOrientationEvent !== 'undefined') {
                // Prüfen ob requestPermission API vorhanden ist (iOS 13+)
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ - explizite Berechtigung ANFORDERN (wichtig: muss aus Benutzerinteraktion kommen!)
                    try {
                        console.log('Fordere Device Orientation Berechtigung an (iOS 13+)...');
                        console.log('Bitte erlauben Sie den Zugriff auf den Neigungssensor im erscheinenden Dialog');
                        
                        // WICHTIG: requestPermission() muss aus einer Benutzerinteraktion heraus aufgerufen werden
                        // (Button-Click ist eine Benutzerinteraktion, daher funktioniert es hier)
                        const permission = await DeviceOrientationEvent.requestPermission();
                        console.log('Device Orientation Berechtigung Status:', permission);
                        
                        if (permission === 'granted') {
                            // Berechtigung erteilt - in localStorage speichern
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                            orientationPermissionGranted = true;
                            console.log('✓ Device Orientation Berechtigung erteilt (iOS)');
                            
                            // Event Listener testweise hinzufügen um zu prüfen ob es funktioniert
                            const testListener = (event) => {
                                if (event && (event.gamma !== null || event.beta !== null)) {
                                    console.log('✓ Device Orientation Sensor funktioniert! Gamma:', event.gamma?.toFixed(1), 'Beta:', event.beta?.toFixed(1));
                                }
                            };
                            window.addEventListener('deviceorientation', testListener, { once: true, passive: true });
                            
                            // Listener nach 2 Sekunden entfernen falls kein Event kommt
                            setTimeout(() => {
                                window.removeEventListener('deviceorientation', testListener);
                            }, 2000);
                        } else if (permission === 'denied') {
                            console.warn('⚠ Device Orientation Berechtigung wurde vom Nutzer verweigert (iOS)');
                            localStorage.setItem('deviceOrientationPermission', 'denied');
                            alert('Die Berechtigung für den Neigungssensor wurde verweigert. Sie können diese später in den Safari-Einstellungen ändern.');
                        } else {
                            console.warn('⚠ Device Orientation Berechtigung: unbekannter Status:', permission);
                            localStorage.setItem('deviceOrientationPermission', permission);
                        }
                    } catch (error) {
                        console.error('Fehler bei Device Orientation Berechtigung (iOS):', error);
                        localStorage.setItem('deviceOrientationPermission', 'error');
                        alert('Fehler beim Anfordern der Neigungssensor-Berechtigung. Bitte versuchen Sie es erneut.');
                    }
                } else {
                    // Android Chrome / ältere iOS - keine explizite Berechtigung API vorhanden
                    // Device Orientation Events sollten direkt funktionieren (aber können durch Browser-Einstellungen blockiert sein)
                    console.log('Device Orientation: requestPermission API nicht verfügbar (Android/ältere iOS)');
                    console.log('Versuche Sensor-Zugriff - Browser erlaubt oder blockiert automatisch');
                    localStorage.setItem('deviceOrientationPermission', 'granted');
                    orientationPermissionGranted = true;
                    
                    // Testweise Event Listener hinzufügen um zu prüfen ob Sensor verfügbar ist
                    const testListener = (event) => {
                        if (event && (event.gamma !== null || event.beta !== null)) {
                            console.log('✓ Device Orientation Sensor verfügbar (Android/ältere iOS)');
                        }
                    };
                    window.addEventListener('deviceorientation', testListener, { once: true, passive: true });
                    
                    // Listener nach 3 Sekunden entfernen
                    setTimeout(() => {
                        window.removeEventListener('deviceorientation', testListener);
                    }, 3000);
                }
            } else {
                // DeviceOrientationEvent nicht unterstützt
                console.warn('⚠ DeviceOrientationEvent wird von diesem Browser nicht unterstützt');
                localStorage.setItem('deviceOrientationPermission', 'not_supported');
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
