// Weiter Button - Berechtigungen anfordern und zur Homepage weiterleiten
document.addEventListener('DOMContentLoaded', async () => {
    const continueBtn = document.getElementById('continueBtn');
    
    continueBtn.addEventListener('click', async () => {
        try {
            // Kamera-Berechtigung anfordern
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment'
                    }
                });
                // Stream sofort schließen, wir brauchen nur die Berechtigung
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error('Kamera-Berechtigung:', error);
                // Weiterleiten auch wenn Berechtigung verweigert wurde
            }
            
            // Device Orientation Berechtigung anfordern (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        // Berechtigung erteilt - in localStorage speichern
                        localStorage.setItem('deviceOrientationPermission', 'granted');
                    } else {
                        console.warn('Device Orientation Berechtigung verweigert');
                        localStorage.setItem('deviceOrientationPermission', 'denied');
                    }
                } catch (error) {
                    console.error('Device Orientation Berechtigung:', error);
                    localStorage.setItem('deviceOrientationPermission', 'error');
                }
            } else {
                // Für Browser ohne requestPermission API (Android, ältere iOS)
                // Berechtigung wird automatisch erteilt
                localStorage.setItem('deviceOrientationPermission', 'granted');
            }
            
            // Onboarding als abgeschlossen markieren
            localStorage.setItem('onboardingCompleted', 'true');
            
            // Zur Homepage weiterleiten
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Fehler beim Anfordern der Berechtigungen:', error);
            // Trotzdem weiterleiten
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.href = 'index.html';
        }
    });
});
