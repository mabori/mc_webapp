let photos = [];
let currentIndex = 0;
let keptPhotos = [];
let deletedPhotos = [];
let isProcessing = false;

let imageContainer;
let currentImage;
let swipeFeedback;
let progressText;
let progressFill;

// Swipe-Gesten
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let swipeThreshold = 50; // Minimale Swipe-Distanz
let isDragging = false;
let currentDragX = 0;

// Device Orientation
let neutralTiltValue = null; // Neutraler Referenzwert für Neigung
let tiltThreshold = 18; // Grad für klare Neigung
let tiltCheckTimeout = null;
let lastDecisionTime = 0;
let decisionCooldown = 600; // Mindestzeit zwischen Entscheidungen (ms)
let deviceOrientationListener = null; // Referenz zum Event Listener

// Bilder aus localStorage laden
function loadPhotos() {
    // DOM-Elemente sicherstellen
    imageContainer = document.getElementById('imageContainer');
    currentImage = document.getElementById('currentImage');
    swipeFeedback = document.getElementById('swipeFeedback');
    progressText = document.getElementById('progressText');
    progressFill = document.getElementById('progressFill');
    
    if (!imageContainer || !currentImage || !swipeFeedback || !progressText || !progressFill) {
        return;
    }
    
    const savedPhotos = localStorage.getItem('capturedPhotos');
    if (savedPhotos) {
        try {
            photos = JSON.parse(savedPhotos);
            // Array umkehren, damit das erste gemachte Bild zuerst kommt
            photos = photos.reverse();
            
            if (photos.length === 0) {
                // Keine Bilder vorhanden, zurück zur Kamera
                window.location.href = 'camera.html';
                return;
            }
            
            // Erstes Bild anzeigen
            currentImage.src = photos[0];
            
            // Progress aktualisieren
            updateProgress();
        } catch (error) {
            window.location.href = 'camera.html';
        }
    } else {
        window.location.href = 'camera.html';
    }
}

// Progress aktualisieren
function updateProgress() {
    if (!progressText || !progressFill) return;
    
    const total = photos.length;
    const current = currentIndex + 1;
    progressText.textContent = `${current} / ${total}`;
    
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
}

// Nächstes Bild anzeigen
function showNextImage() {
    if (!currentImage) return;
    
    // Bild zurücksetzen
    resetImagePosition();
    
    // Device Orientation zurücksetzen für neues Bild
    neutralTiltValue = null;
    tiltDirection = null;
    tiltStartTime = 0;
    tiltActive = false;
    currentTiltValue = 0;
    if (tiltCheckTimeout) {
        clearTimeout(tiltCheckTimeout);
        tiltCheckTimeout = null;
    }
    
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

// Bild-Position zurücksetzen
function resetImagePosition() {
    if (!currentImage) return;
    currentImage.style.transform = '';
    currentImage.style.opacity = '1';
    currentImage.classList.remove('swipe-keep-active', 'swipe-delete-active');
    isDragging = false;
    currentDragX = 0;
    // Feedback auch zurücksetzen
    resetSwipeFeedback();
}

// Entscheidung treffen (behalten = true, löschen = false)
function makeDecision(keep) {
    if (isProcessing || !currentImage || photos.length === 0 || currentIndex >= photos.length) {
        return;
    }
    
    isProcessing = true;
    
    const currentPhoto = photos[currentIndex];
    
    // Visuelles Feedback: Bild in entsprechende Richtung verschieben
    if (keep) {
        keptPhotos.push(currentPhoto);
        // Bild nach rechts verschieben
        currentImage.style.transform = `translateX(${window.innerWidth}px) rotate(15deg)`;
        currentImage.style.opacity = '0';
        currentImage.classList.add('swipe-keep-active');
        showSwipeFeedback('keep');
    } else {
        deletedPhotos.push(currentPhoto);
        // Bild nach links verschieben
        currentImage.style.transform = `translateX(-${window.innerWidth}px) rotate(-15deg)`;
        currentImage.style.opacity = '0';
        currentImage.classList.add('swipe-delete-active');
        showSwipeFeedback('delete');
    }
    
    // Nach Animation zum nächsten Bild wechseln
    setTimeout(() => {
        isProcessing = false;
        showNextImage();
    }, 300);
}

// Swipe Feedback anzeigen (nach Entscheidung)
function showSwipeFeedback(action) {
    if (!swipeFeedback) return;
    
    swipeFeedback.classList.remove('swipe-keep', 'swipe-delete');
    
    if (action === 'keep') {
        swipeFeedback.classList.add('swipe-keep');
        swipeFeedback.textContent = '✓ Behalten';
        swipeFeedback.style.opacity = '1';
    } else {
        swipeFeedback.classList.add('swipe-delete');
        swipeFeedback.textContent = '✗ Löschen';
        swipeFeedback.style.opacity = '1';
    }
    
    setTimeout(() => {
        resetSwipeFeedback();
    }, 300);
}

function resetSwipeFeedback() {
    if (!swipeFeedback) return;
    
    swipeFeedback.classList.remove('swipe-keep', 'swipe-delete');
    swipeFeedback.textContent = '';
    swipeFeedback.style.opacity = '0';
}

// Touch Events für Swipe initialisieren
function initSwipeGestures() {
    if (!imageContainer || !currentImage) {
        return;
    }
    
    imageContainer.addEventListener('touchstart', (e) => {
        if (isProcessing) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isDragging = true;
        currentImage.style.transition = 'none'; // Keine Transition während des Ziehens
        // Feedback beim Start ausblenden (wird beim Wischen wieder angezeigt)
        resetSwipeFeedback();
    }, { passive: true });

    imageContainer.addEventListener('touchmove', (e) => {
        if (!isDragging || isProcessing) return;
        
        const touchX = e.changedTouches[0].screenX;
        const touchY = e.changedTouches[0].screenY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        // Nur horizontal verschieben wenn Swipe hauptsächlich horizontal ist
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            currentDragX = deltaX;
            const maxDrag = window.innerWidth * 0.5; // Maximale Drag-Distanz
            const normalizedDrag = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
            
            // Bild verschieben
            currentImage.style.transform = `translateX(${normalizedDrag}px) rotate(${normalizedDrag * 0.1}deg)`;
            
            // Opacity basierend auf Drag-Distanz
            const opacity = 1 - Math.abs(normalizedDrag) / maxDrag * 0.5;
            currentImage.style.opacity = opacity;
            
            // Visuelles Feedback basierend auf Richtung - nur anzeigen wenn wirklich geschoben wird
            if (deltaX > 0) {
                // Nach rechts = behalten (grün)
                currentImage.classList.remove('swipe-delete-active');
                currentImage.classList.add('swipe-keep-active');
                updateSwipeFeedback('keep', Math.abs(normalizedDrag) / maxDrag);
            } else if (deltaX < 0) {
                // Nach links = löschen (rot)
                currentImage.classList.remove('swipe-keep-active');
                currentImage.classList.add('swipe-delete-active');
                updateSwipeFeedback('delete', Math.abs(normalizedDrag) / maxDrag);
            }
        } else {
            // Nicht horizontal genug - Feedback ausblenden, Bild in Default-Position
            currentImage.style.transform = '';
            currentImage.style.opacity = '1';
            currentImage.classList.remove('swipe-keep-active', 'swipe-delete-active');
            resetSwipeFeedback();
        }
    }, { passive: true });

    imageContainer.addEventListener('touchend', (e) => {
        if (!isDragging || isProcessing) {
            // Wenn nicht mehr gewischt wird, Feedback ausblenden
            resetSwipeFeedback();
            return;
        }
        
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        // Transition wieder aktivieren
        currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        
        handleSwipe();
        isDragging = false;
        currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    }, { passive: true });
}

function handleSwipe() {
    // Prüfen ob gerade verarbeitet wird oder kein Bild vorhanden
    if (isProcessing || !currentImage || photos.length === 0 || currentIndex >= photos.length) {
        resetImagePosition();
        return;
    }
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Prüfe ob Swipe horizontal genug ist (mehr horizontal als vertikal)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
            // Nach rechts = behalten
            // Bild komplett nach rechts verschieben und ausblenden
            if (currentImage) {
                currentImage.style.transform = `translateX(${window.innerWidth}px) rotate(15deg)`;
                currentImage.style.opacity = '0';
            }
            setTimeout(() => {
                makeDecision(true);
            }, 100);
        } else {
            // Nach links = löschen
            // Bild komplett nach links verschieben und ausblenden
            if (currentImage) {
                currentImage.style.transform = `translateX(-${window.innerWidth}px) rotate(-15deg)`;
                currentImage.style.opacity = '0';
            }
            setTimeout(() => {
                makeDecision(false);
            }, 100);
        }
    } else {
        // Swipe nicht weit genug - Bild zurücksetzen
        resetImagePosition();
        if (currentImage) {
            currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        }
    }
}

// Swipe Feedback während des Ziehens aktualisieren
function updateSwipeFeedback(action, intensity) {
    if (!swipeFeedback) return;
    
    swipeFeedback.classList.remove('swipe-keep', 'swipe-delete');
    
    // Nur anzeigen wenn wirklich geschoben wird (intensity > 0)
    if (intensity > 0) {
        if (action === 'keep') {
            swipeFeedback.classList.add('swipe-keep');
            swipeFeedback.textContent = '✓ Behalten';
            swipeFeedback.style.opacity = Math.min(1, intensity * 2);
        } else if (action === 'delete') {
            swipeFeedback.classList.add('swipe-delete');
            swipeFeedback.textContent = '✗ Löschen';
            swipeFeedback.style.opacity = Math.min(1, intensity * 2);
        }
    } else {
        // Nicht geschoben - Feedback ausblenden
        resetSwipeFeedback();
    }
}

// Keyboard Events für Pfeiltasten initialisieren
function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // Prüfen ob gerade verarbeitet wird oder kein Bild vorhanden
        if (isProcessing || !currentImage || photos.length === 0 || currentIndex >= photos.length) {
            return;
        }
        
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
}

// Device Orientation für Neigung
let currentTiltValue = 0;
let tiltStartTime = 0;
let tiltDirection = null; // 'left' oder 'right'
let tiltActive = false; // Ob gerade eine Neigung aktiv ist

function handleDeviceOrientation(event) {
    // Prüfen ob gerade verarbeitet wird oder kein Bild vorhanden
    if (isProcessing || !currentImage || photos.length === 0 || currentIndex >= photos.length) {
        return;
    }
    
    // Prüfen ob Event-Daten vorhanden sind
    if (event.gamma === null && event.gamma === undefined && event.beta === null && event.beta === undefined) {
        return;
    }
    
    // Gamma: Neigung links/rechts (-90 bis 90), ~0 = gerade (Portrait-Modus)
    // Gamma: negative Werte = nach links geneigt, positive = nach rechts geneigt
    const gamma = event.gamma !== null && event.gamma !== undefined ? event.gamma : 0;
    const tiltValue = gamma;
    currentTiltValue = tiltValue;
    
    const now = Date.now();
    
    // Initialisierung - erste Messung als neutraler Referenzwert
    if (neutralTiltValue === null || neutralTiltValue === undefined) {
        neutralTiltValue = tiltValue;
        tiltStartTime = 0;
        tiltDirection = null;
        tiltActive = false;
        return;
    }
    
    // Cooldown-Check: Verhindert zu schnelle Entscheidungen
    if (now - lastDecisionTime < decisionCooldown) {
        return;
    }
    
    // Berechne relative Neigung vom neutralen Wert
    const relativeTilt = tiltValue - neutralTiltValue;
    
    // Prüfen ob wirklich klar geneigt (über dem Threshold)
    const tiltRight = relativeTilt > tiltThreshold;
    const tiltLeft = relativeTilt < -tiltThreshold;
    
    // Visuelles Feedback während der Neigung
    if (tiltRight) {
        // Nach rechts = behalten (grün)
        if (tiltDirection !== 'right') {
            // Richtung geändert - neuen Timer starten
            if (tiltCheckTimeout) {
                clearTimeout(tiltCheckTimeout);
                tiltCheckTimeout = null;
            }
            tiltDirection = 'right';
            tiltStartTime = now;
            tiltActive = true;
            // Visuelles Feedback zeigen
            if (currentImage) {
                currentImage.classList.remove('swipe-delete-active');
                currentImage.classList.add('swipe-keep-active');
            }
            updateSwipeFeedback('keep', Math.min(1, Math.abs(relativeTilt) / 30));
        }
        
        // Entscheidung treffen nach 800ms stabiler Neigung
        if (!tiltCheckTimeout && now - tiltStartTime >= 800) {
            tiltCheckTimeout = setTimeout(() => {
                // Nochmal prüfen ob immer noch geneigt
                if (!isProcessing && (currentTiltValue - neutralTiltValue) > tiltThreshold && currentImage && currentIndex < photos.length) {
                    makeDecision(true);
                    lastDecisionTime = Date.now();
                    neutralTiltValue = null; // Reset für nächstes Bild
                    tiltDirection = null;
                    tiltStartTime = 0;
                    tiltActive = false;
                    tiltCheckTimeout = null;
                } else {
                    tiltCheckTimeout = null;
                }
            }, 50);
        }
    } else if (tiltLeft) {
        // Nach links = löschen (rot)
        if (tiltDirection !== 'left') {
            // Richtung geändert - neuen Timer starten
            if (tiltCheckTimeout) {
                clearTimeout(tiltCheckTimeout);
                tiltCheckTimeout = null;
            }
            tiltDirection = 'left';
            tiltStartTime = now;
            tiltActive = true;
            // Visuelles Feedback zeigen
            if (currentImage) {
                currentImage.classList.remove('swipe-keep-active');
                currentImage.classList.add('swipe-delete-active');
            }
            updateSwipeFeedback('delete', Math.min(1, Math.abs(relativeTilt) / 30));
        }
        
        // Entscheidung treffen nach 800ms stabiler Neigung
        if (!tiltCheckTimeout && now - tiltStartTime >= 800) {
            tiltCheckTimeout = setTimeout(() => {
                // Nochmal prüfen ob immer noch geneigt
                if (!isProcessing && (currentTiltValue - neutralTiltValue) < -tiltThreshold && currentImage && currentIndex < photos.length) {
                    makeDecision(false);
                    lastDecisionTime = Date.now();
                    neutralTiltValue = null; // Reset für nächstes Bild
                    tiltDirection = null;
                    tiltStartTime = 0;
                    tiltActive = false;
                    tiltCheckTimeout = null;
                } else {
                    tiltCheckTimeout = null;
                }
            }, 50);
        }
    } else {
        // Zurück in neutrale Position
        if (tiltActive) {
            // Timeout löschen wenn noch aktiv
            if (tiltCheckTimeout) {
                clearTimeout(tiltCheckTimeout);
                tiltCheckTimeout = null;
            }
            tiltDirection = null;
            tiltStartTime = 0;
            tiltActive = false;
            // Visuelles Feedback zurücksetzen
            if (currentImage) {
                currentImage.classList.remove('swipe-keep-active', 'swipe-delete-active');
            }
            resetSwipeFeedback();
        }
        // Neutralen Wert aktualisieren (gleitender Durchschnitt für Stabilität)
        neutralTiltValue = (neutralTiltValue * 0.9 + tiltValue * 0.1);
    }
}

// Device Orientation Event Listener initialisieren
async function initDeviceOrientation() {
    // Prüfen ob DeviceOrientationEvent unterstützt wird
    if (typeof DeviceOrientationEvent === 'undefined' || DeviceOrientationEvent === null) {
        return;
    }
    
    const permissionStatus = localStorage.getItem('deviceOrientationPermission');
    
    // Für iOS 13+ Safari benötigt explizite Berechtigung
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ Safari
        if (permissionStatus === 'granted') {
            // Berechtigung wurde bereits erteilt - Event Listener hinzufügen
            try {
                deviceOrientationListener = handleDeviceOrientation.bind(this);
                window.addEventListener('deviceorientation', deviceOrientationListener, { passive: true });
                neutralTiltValue = null;
            } catch (error) {
                // Fehler beim Hinzufügen des Listeners
            }
        } else {
            // Berechtigung wurde nicht erteilt oder nicht gesetzt
            // Versuche Berechtigung nochmal anzufordern (falls möglich)
            // Auf iOS muss requestPermission aus einer Benutzerinteraktion heraus aufgerufen werden
            // Daher kann hier nur geprüft werden, ob bereits erteilt
        }
    } else {
        // Für andere Browser/Systeme (Android Chrome, ältere iOS) direkt verwenden
        // Berechtigung wird automatisch erteilt oder nicht benötigt
        try {
            deviceOrientationListener = handleDeviceOrientation.bind(this);
            window.addEventListener('deviceorientation', deviceOrientationListener, { passive: true });
            neutralTiltValue = null;
            
            // Status auf 'granted' setzen falls noch nicht gesetzt
            if (permissionStatus !== 'granted') {
                localStorage.setItem('deviceOrientationPermission', 'granted');
            }
        } catch (error) {
            // Fehler beim Hinzufügen des Listeners
        }
    }
}

// Device Orientation wird in der gemeinsamen Initialisierung aufgerufen

// Complete Screen anzeigen - Modal direkt öffnen
function showCompleteScreen() {
    // Gespeicherte Fotos aktualisieren (nur behaltene)
    localStorage.setItem('keptPhotos', JSON.stringify(keptPhotos));
    localStorage.setItem('capturedPhotos', JSON.stringify(keptPhotos));
    
    // Progress und Instructions ausblenden, Bild bleibt sichtbar
    const instructions = document.querySelector('.review-instructions');
    const progress = document.querySelector('.review-progress');
    if (instructions) instructions.style.display = 'none';
    if (progress) progress.style.display = 'none';
    
    // Bild-Container für Overlay vorbereiten (abgedunkelt durch Modal-Overlay)
    if (imageContainer) {
        imageContainer.classList.add('image-dimmed');
    }
    
    // Device Orientation Listener entfernen (nicht mehr benötigt)
    if (deviceOrientationListener) {
        window.removeEventListener('deviceorientation', deviceOrientationListener);
        deviceOrientationListener = null;
    }
    
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
        return;
    }
    
    // Modal schließen bei Klick außerhalb
    albumModal.addEventListener('click', (e) => {
        if (e.target === albumModal) {
            closeAlbumModal();
        }
    });
    
    // Abbrechen Button - Album verwerfen
    cancelBtn.addEventListener('click', () => {
        // Alle temporären Daten löschen
        localStorage.removeItem('capturedPhotos');
        localStorage.removeItem('keptPhotos');
        // Zur Homepage zurückkehren
        window.location.href = 'index.html';
    });
    
    // Form Submit - Album erstellen
    albumForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const albumName = albumNameInput.value.trim();
        const albumLocation = albumLocationInput.value.trim();
        
        if (!albumName) {
            alert('Bitte geben Sie einen Namen für das Album ein.');
            return;
        }
        
        // Album erstellen und speichern
        const albums = JSON.parse(localStorage.getItem('albums') || '[]');
        const newAlbum = {
            id: Date.now().toString(),
            name: albumName,
            ort: albumLocation || 'Kein Ort angegeben',
            photos: keptPhotos,
            createdAt: new Date().toISOString()
        };
        
        albums.push(newAlbum);
        localStorage.setItem('albums', JSON.stringify(albums));
        
        // Temporäre Daten löschen
        localStorage.removeItem('capturedPhotos');
        localStorage.removeItem('keptPhotos');
        
        // Zur Homepage zurückkehren
        window.location.href = 'index.html';
    });
}

function closeAlbumModal() {
    // Wird hier nicht verwendet, da das Modal nur durch Submit oder Cancel geschlossen wird
}

// Initialisierung
function initReviewPage() {
    // 1. Bilder laden (initialisiert auch DOM-Elemente)
    loadPhotos();
    
    // 2. Event Listener für Swipe-Gesten initialisieren
    initSwipeGestures();
    
    // 3. Keyboard Controls initialisieren
    initKeyboardControls();
    
    // 4. Device Orientation initialisieren (wird beim Laden der Seite aktiviert)
    // Wichtig: Muss nach loadPhotos() aufgerufen werden, damit currentImage verfügbar ist
    initDeviceOrientation();
    
    // 5. Album Modal initialisieren
    initAlbumModal();
}

// Initialisierung nach DOM laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewPage);
} else {
    initReviewPage();
}
