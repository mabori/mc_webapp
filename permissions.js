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
            // iOS 13+ Safari benötigt explizite Berechtigung über DeviceOrientationEvent.requestPermission()
            // Android Chrome unterstützt dies nicht und benötigt keine explizite Berechtigung
            if (typeof DeviceOrientationEvent !== 'undefined') {
                // Prüfen ob requestPermission API vorhanden ist (iOS 13+)
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    // iOS 13+ - explizite Berechtigung anfordern
                    try {
                        console.log('Fordere Device Orientation Berechtigung an (iOS 13+)...');
                        const permission = await DeviceOrientationEvent.requestPermission();
                        console.log('Device Orientation Berechtigung Status:', permission);
                        
                        if (permission === 'granted') {
                            // Berechtigung erteilt - in localStorage speichern
                            localStorage.setItem('deviceOrientationPermission', 'granted');
                            console.log('✓ Device Orientation Berechtigung erteilt (iOS)');
                            
                            // Event Listener testweise hinzufügen um zu prüfen ob es funktioniert
                            window.addEventListener('deviceorientation', () => {
                                console.log('✓ Device Orientation Event funktioniert');
                            }, { once: true, passive: true });
                        } else if (permission === 'denied') {
                            console.warn('⚠ Device Orientation Berechtigung verweigert (iOS)');
                            localStorage.setItem('deviceOrientationPermission', 'denied');
                        } else {
                            console.warn('⚠ Device Orientation Berechtigung: unbekannter Status:', permission);
                            localStorage.setItem('deviceOrientationPermission', permission);
                        }
                    } catch (error) {
                        console.error('Fehler bei Device Orientation Berechtigung (iOS):', error);
                        localStorage.setItem('deviceOrientationPermission', 'error');
                    }
                } else {
                    // Android Chrome / ältere iOS - keine explizite Berechtigung benötigt
                    // Device Orientation Events funktionieren direkt
                    console.log('Device Orientation: Keine explizite Berechtigung benötigt (Android/ältere iOS)');
                    localStorage.setItem('deviceOrientationPermission', 'granted');
                    
                    // Testweise Event Listener hinzufügen um zu prüfen ob Sensor verfügbar ist
                    const testListener = () => {
                        console.log('✓ Device Orientation Sensor verfügbar');
                        window.removeEventListener('deviceorientation', testListener);
                    };
                    window.addEventListener('deviceorientation', testListener, { once: true, passive: true });
                }
            } else {
                // DeviceOrientationEvent nicht unterstützt
                console.warn('⚠ DeviceOrientationEvent wird nicht unterstützt');
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
