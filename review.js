let photos = [];
let currentIndex = 0;
let keptPhotos = [];
let deletedPhotos = [];
let isProcessing = false;

const imageContainer = document.getElementById('imageContainer');
const currentImage = document.getElementById('currentImage');
const swipeFeedback = document.getElementById('swipeFeedback');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');

// Swipe-Gesten
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let swipeThreshold = 50; // Minimale Swipe-Distanz

// Device Orientation
let lastBeta = null;
let tiltThreshold = 25; // Grad für klare Neigung (höherer Wert = weniger empfindlich)
let tiltDeadzone = 8; // Totzone, um zu schnelle Reaktionen zu vermeiden
let tiltCheckTimeout = null;
let lastDecisionTime = 0;
let decisionCooldown = 500; // Mindestzeit zwischen Entscheidungen (ms)

// Bilder aus localStorage laden
function loadPhotos() {
    const savedPhotos = localStorage.getItem('capturedPhotos');
    if (savedPhotos) {
        photos = JSON.parse(savedPhotos);
        // Array umkehren, damit das erste gemachte Bild zuerst kommt
        photos = photos.reverse();
        if (photos.length === 0) {
            // Keine Bilder vorhanden, zurück zur Kamera
            window.location.href = 'camera.html';
            return;
        }
        currentImage.src = photos[0];
        updateProgress();
    } else {
        window.location.href = 'camera.html';
    }
}

// Progress aktualisieren
function updateProgress() {
    const total = photos.length;
    const current = currentIndex + 1;
    progressText.textContent = `${current} / ${total}`;
    
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
}

// Nächstes Bild anzeigen
function showNextImage() {
    currentIndex++;
    if (currentIndex < photos.length) {
        currentImage.src = photos[currentIndex];
        updateProgress();
        resetSwipeFeedback();
    } else {
        // Alle Bilder durchgegangen
        showCompleteScreen();
    }
}

// Entscheidung treffen (behalten = true, löschen = false)
function makeDecision(keep) {
    if (isProcessing) return;
    
    isProcessing = true;
    
    const currentPhoto = photos[currentIndex];
    
    if (keep) {
        keptPhotos.push(currentPhoto);
        showSwipeFeedback('keep');
    } else {
        deletedPhotos.push(currentPhoto);
        showSwipeFeedback('delete');
    }
    
    // Kurze Verzögerung für visuelles Feedback
    setTimeout(() => {
        showNextImage();
        isProcessing = false;
    }, 300);
}

// Swipe Feedback anzeigen
function showSwipeFeedback(action) {
    swipeFeedback.classList.remove('swipe-keep', 'swipe-delete');
    
    if (action === 'keep') {
        swipeFeedback.classList.add('swipe-keep');
        swipeFeedback.textContent = '✓ Behalten';
    } else {
        swipeFeedback.classList.add('swipe-delete');
        swipeFeedback.textContent = '✗ Löschen';
    }
    
    setTimeout(() => {
        resetSwipeFeedback();
    }, 300);
}

function resetSwipeFeedback() {
    swipeFeedback.classList.remove('swipe-keep', 'swipe-delete');
    swipeFeedback.textContent = '';
}

// Touch Events für Swipe
imageContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

imageContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Prüfe ob Swipe horizontal genug ist (mehr horizontal als vertikal)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
            // Nach rechts = behalten
            makeDecision(true);
        } else {
            // Nach links = löschen
            makeDecision(false);
        }
    }
}

// Keyboard Events für Pfeiltasten
document.addEventListener('keydown', (e) => {
    if (isProcessing) return;
    
    // Pfeil nach rechts = behalten
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        makeDecision(true);
    }
    // Pfeil nach links = löschen
    else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        makeDecision(false);
    }
});

// Device Orientation für Neigung
let tiltCheckInterval = null;

function handleDeviceOrientation(event) {
    // Beta: Neigung vor/zurück (-180 bis 180), ~0 = aufrecht
    // Gamma: Neigung links/rechts (-90 bis 90), ~0 = gerade
    const beta = event.beta;
    const gamma = event.gamma;
    
    // Für Handys im Portrait-Modus verwenden wir Gamma (links/rechts Neigung)
    // Beta wird für die Vor-/Zurück-Neigung verwendet
    // Wir verwenden Gamma, da es die seitliche Neigung besser erfasst
    const tiltValue = gamma !== null ? gamma : beta;
    
    if (lastBeta === null) {
        lastBeta = tiltValue;
        return;
    }
    
    // Cooldown-Check: Verhindert zu schnelle Entscheidungen
    const now = Date.now();
    if (now - lastDecisionTime < decisionCooldown) {
        lastBeta = tiltValue;
        return;
    }
    
    // Gamma: negative Werte = nach links geneigt, positive = nach rechts geneigt
    // Beta als Fallback: ähnliche Logik
    const tiltRight = tiltValue > tiltThreshold;
    const tiltLeft = tiltValue < -tiltThreshold;
    
    // Nur reagieren wenn wirklich klar geneigt
    if (tiltRight) {
        // Nach rechts = behalten
        clearTimeout(tiltCheckTimeout);
        tiltCheckTimeout = setTimeout(() => {
            // Prüfen ob immer noch in der richtigen Richtung geneigt
            if (!isProcessing && tiltValue > tiltThreshold) {
                makeDecision(true);
                lastDecisionTime = Date.now();
            }
        }, 300); // 300ms Verzögerung für stabilere Erkennung
    } else if (tiltLeft) {
        // Nach links = löschen
        clearTimeout(tiltCheckTimeout);
        tiltCheckTimeout = setTimeout(() => {
            // Prüfen ob immer noch in der richtigen Richtung geneigt
            if (!isProcessing && tiltValue < -tiltThreshold) {
                makeDecision(false);
                lastDecisionTime = Date.now();
            }
        }, 300);
    } else {
        // Zurück in neutrale Position - Timeout löschen
        clearTimeout(tiltCheckTimeout);
    }
    
    lastBeta = tiltValue;
}

// Device Orientation Event Listener
// Berechtigung wurde bereits beim Onboarding angefordert, daher direkt verwenden
if (window.DeviceOrientationEvent) {
    const permissionStatus = localStorage.getItem('deviceOrientationPermission');
    
    // Prüfen ob Berechtigung bereits erteilt wurde (iOS 13+)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Bei iOS 13+ wurde die Berechtigung bereits beim Onboarding angefordert
        // Wenn sie erteilt wurde, können wir den Event Listener direkt verwenden
        if (permissionStatus === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
        } else {
            // Berechtigung wurde verweigert oder nicht erteilt - Feature nicht verfügbar
            console.warn('Device Orientation Berechtigung nicht erteilt');
        }
    } else {
        // Für andere Browser/Systeme (Android, ältere iOS) direkt verwenden
        // Berechtigung wird automatisch erteilt
        window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }
}

// Complete Screen anzeigen - Modal direkt öffnen
function showCompleteScreen() {
    // Gespeicherte Fotos aktualisieren (nur behaltene)
    localStorage.setItem('keptPhotos', JSON.stringify(keptPhotos));
    localStorage.setItem('capturedPhotos', JSON.stringify(keptPhotos));
    
    // Progress und Instructions ausblenden, Bild bleibt sichtbar
    document.querySelector('.review-instructions').style.display = 'none';
    document.querySelector('.review-progress').style.display = 'none';
    
    // Bild-Container für Overlay vorbereiten (abgedunkelt durch Modal-Overlay)
    imageContainer.classList.add('image-dimmed');
    
    // Modal direkt öffnen (Overlay mit abgedunkeltem Hintergrund)
    const albumModal = document.getElementById('albumModal');
    const albumNameInput = document.getElementById('albumName');
    if (albumModal) {
        albumModal.style.display = 'flex';
        // Kurze Verzögerung für besseres UX
        setTimeout(() => {
            if (albumNameInput) {
                albumNameInput.focus();
            }
        }, 100);
    }
}

// Album Modal - Initialisierung
function initAlbumModal() {
    const albumModal = document.getElementById('albumModal');
    const albumForm = document.getElementById('albumForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const albumNameInput = document.getElementById('albumName');
    const albumLocationInput = document.getElementById('albumLocation');
    
    if (!albumModal || !albumForm || !cancelBtn || !albumNameInput || !albumLocationInput) {
        console.error('Modal-Elemente nicht gefunden');
        return;
    }
    
    // Verwerfen Button - Zur Startseite zurückkehren ohne zu speichern
    cancelBtn.addEventListener('click', () => {
        // Captured Photos zurücksetzen
        localStorage.removeItem('capturedPhotos');
        localStorage.removeItem('keptPhotos');
        
        // Zur Startseite zurückkehren
        window.location.href = 'index.html';
    });
    
    // Modal schließen bei Klick außerhalb
    albumModal.addEventListener('click', (e) => {
        if (e.target === albumModal) {
            albumModal.style.display = 'none';
            albumForm.reset();
        }
    });
    
    // Album speichern
    albumForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const albumName = albumNameInput.value.trim();
        const albumLocation = albumLocationInput.value.trim();
        
        if (!albumName || !albumLocation) {
            alert('Bitte Name und Ort eingeben.');
            return;
        }
        
        // Bestehende Alben laden
        let albums = JSON.parse(localStorage.getItem('albums') || '[]');
        
        // Neues Album erstellen
        const newAlbum = {
            id: Date.now().toString(),
            name: albumName,
            ort: albumLocation,
            photos: keptPhotos,
            createdAt: new Date().toISOString()
        };
        
        // Album hinzufügen
        albums.push(newAlbum);
        
        // In localStorage speichern
        localStorage.setItem('albums', JSON.stringify(albums));
        
        // Captured Photos zurücksetzen
        localStorage.removeItem('capturedPhotos');
        localStorage.removeItem('keptPhotos');
        
        // Zur Startseite zurückkehren
        window.location.href = 'index.html';
    });
}

// Initialisierung nach DOM laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlbumModal);
} else {
    initAlbumModal();
}

// Initialisierung
loadPhotos();

