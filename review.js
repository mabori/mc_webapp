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
let tiltThreshold = 12; // Grad für klare Neigung (reduziert für schnellere Reaktion)
let tiltCheckTimeout = null;
let lastDecisionTime = 0;
let decisionCooldown = 600; // Mindestzeit zwischen Entscheidungen (ms)
let tiltStableTime = 600; // Zeit für stabile Neigung bevor Entscheidung getroffen wird (ms)
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
    progressText.textContent = `${current} von ${total}`;
    
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
        
        // Skalierung nach Bildwechsel aktualisieren
        setTimeout(() => {
            scaleReviewContent();
        }, 100);
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
        swipeFeedback.textContent = '✓ Keep';
        swipeFeedback.style.opacity = '1';
    } else {
        swipeFeedback.classList.add('swipe-delete');
        swipeFeedback.textContent = '✗ Delete';
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
            swipeFeedback.textContent = '✓ Keep';
            swipeFeedback.style.opacity = Math.min(1, intensity * 2);
        } else if (action === 'delete') {
            swipeFeedback.classList.add('swipe-delete');
            swipeFeedback.textContent = '✗ Delete';
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
    
    // Initialisierung - warte bis Handy in neutraler Position ist
    // WICHTIG: Setze neutralen Wert nur wenn Handy wirklich neutral ist (innerhalb von ±5 Grad)
    if (neutralTiltValue === null || neutralTiltValue === undefined) {
        // Prüfe ob Handy nahe genug an neutraler Position ist (±5 Grad)
        const neutralThreshold = 5;
        if (Math.abs(tiltValue) <= neutralThreshold) {
            // Handy ist in neutraler Position - setze als Referenzwert
            neutralTiltValue = tiltValue;
            tiltStartTime = 0;
            tiltDirection = null;
            tiltActive = false;
            // Bild in neutraler Position setzen
            if (currentImage) {
                currentImage.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
                currentImage.style.transform = '';
                currentImage.style.opacity = '1';
            }
        }
        // Wenn Handy noch nicht neutral ist, warten wir weiter
        return;
    }
    
    // Cooldown-Check: Verhindert zu schnelle Entscheidungen
    if (now - lastDecisionTime < decisionCooldown) {
        return;
    }
    
    // Berechne relative Neigung vom neutralen Wert
    const relativeTilt = tiltValue - neutralTiltValue;
    
    // Maximale Neigung für die Visualisierung (entspricht etwa 45 Grad)
    const maxTiltForVisualization = 45;
    
    // Prüfen ob wirklich klar geneigt (über dem Threshold für Entscheidung)
    const tiltRight = relativeTilt > tiltThreshold;
    const tiltLeft = relativeTilt < -tiltThreshold;
    
    // Visuelles Feedback: Bild mit der Neigung verschieben (wie beim Touch)
    if (Math.abs(relativeTilt) > 3) { // Minimale Neigung für sichtbare Bewegung
        // Transition deaktivieren während der Neigung für flüssige Bewegung
        if (currentImage) {
            currentImage.style.transition = 'none';
        }
        
        // Berechne Verschiebung basierend auf relativer Neigung
        // Maximal 50% der Bildschirmbreite
        const maxDrag = window.innerWidth * 0.5;
        // Normalisiere die Neigung (relativeTilt / maxTiltForVisualization) auf maxDrag
        const normalizedTilt = Math.max(-maxTiltForVisualization, Math.min(maxTiltForVisualization, relativeTilt));
        const dragDistance = (normalizedTilt / maxTiltForVisualization) * maxDrag;
        
        // Bild verschieben (wie beim Touch-Swipe)
        if (currentImage) {
            currentImage.style.transform = `translateX(${dragDistance}px) rotate(${dragDistance * 0.1}deg)`;
            
            // Opacity basierend auf Neigung reduzieren
            const opacity = 1 - Math.abs(normalizedTilt) / maxTiltForVisualization * 0.5;
            currentImage.style.opacity = opacity;
        }
        
        // Visuelles Feedback (grün/rot) und Text-Feedback
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
            }
            
            // CSS-Klassen für visuelles Feedback
            if (currentImage) {
                currentImage.classList.remove('swipe-delete-active');
                currentImage.classList.add('swipe-keep-active');
            }
            updateSwipeFeedback('keep', Math.min(1, Math.abs(relativeTilt) / maxTiltForVisualization));
            
            // Entscheidung treffen nach stabiler Neigung über Threshold
            if (!tiltCheckTimeout && now - tiltStartTime >= tiltStableTime && relativeTilt > tiltThreshold) {
                tiltCheckTimeout = setTimeout(() => {
                    // Nochmal prüfen ob immer noch eindeutig geneigt
                    const currentRelativeTilt = currentTiltValue - neutralTiltValue;
                    if (!isProcessing && currentRelativeTilt > tiltThreshold && currentImage && currentIndex < photos.length) {
                        // Transition wieder aktivieren für flüssige Animation
                        if (currentImage) {
                            currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        }
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
            }
            
            // CSS-Klassen für visuelles Feedback
            if (currentImage) {
                currentImage.classList.remove('swipe-keep-active');
                currentImage.classList.add('swipe-delete-active');
            }
            updateSwipeFeedback('delete', Math.min(1, Math.abs(relativeTilt) / maxTiltForVisualization));
            
            // Entscheidung treffen nach stabiler Neigung über Threshold
            if (!tiltCheckTimeout && now - tiltStartTime >= tiltStableTime && relativeTilt < -tiltThreshold) {
                tiltCheckTimeout = setTimeout(() => {
                    // Nochmal prüfen ob immer noch eindeutig geneigt
                    const currentRelativeTilt = currentTiltValue - neutralTiltValue;
                    if (!isProcessing && currentRelativeTilt < -tiltThreshold && currentImage && currentIndex < photos.length) {
                        // Transition wieder aktivieren für flüssige Animation
                        if (currentImage) {
                            currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        }
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
        }
    } else {
        // Zurück in neutrale Position (Neigung zu gering)
        if (tiltActive) {
            // Timeout löschen wenn noch aktiv
            if (tiltCheckTimeout) {
                clearTimeout(tiltCheckTimeout);
                tiltCheckTimeout = null;
            }
            tiltDirection = null;
            tiltStartTime = 0;
            tiltActive = false;
            
            // Bild zurücksetzen mit Transition
            if (currentImage) {
                currentImage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                currentImage.style.transform = '';
                currentImage.style.opacity = '1';
                currentImage.classList.remove('swipe-keep-active', 'swipe-delete-active');
            }
            resetSwipeFeedback();
        }
        
        // Neutralen Wert aktualisieren (gleitender Durchschnitt für Stabilität)
        neutralTiltValue = (neutralTiltValue * 0.9 + tiltValue * 0.1);
    }
}

// Device Orientation Event Listener initialisieren
// Funktion zum Erkennen mobiler Geräte
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.matchMedia("(pointer: coarse)").matches);
}

async function initDeviceOrientation() {
    // Nur bei mobilen Geräten initialisieren
    if (!isMobileDevice()) {
        return;
    }
    
    // Prüfen ob DeviceOrientationEvent unterstützt wird
    if (typeof DeviceOrientationEvent === 'undefined' || DeviceOrientationEvent === null) {
        return;
    }
    
    const permissionStatus = localStorage.getItem('deviceOrientationPermission');
    
    // Wenn nicht benötigt (Desktop), nichts tun
    if (permissionStatus === 'not_needed') {
        return;
    }
    
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
    
    // Prüfen ob alle Bilder gelöscht wurden
    if (keptPhotos.length === 0) {
        // Alle Bilder wurden gelöscht - zeige entsprechendes Modal
        const allDeletedModal = document.getElementById('allDeletedModal');
        if (allDeletedModal) {
            allDeletedModal.style.display = 'flex';
        }
    } else {
        // Es wurden Bilder behalten - zeige Album-Erstellungs-Modal
        localStorage.setItem('keptPhotos', JSON.stringify(keptPhotos));
        localStorage.setItem('capturedPhotos', JSON.stringify(keptPhotos));
        
        const albumModal = document.getElementById('albumModal');
        const albumNameInput = document.getElementById('albumName');
        const albumLocationInput = document.getElementById('albumLocation');
        
        if (albumModal) {
            albumModal.style.display = 'flex';
            
            // Stelle sicher, dass das Ort-Feld editierbar ist
            if (albumLocationInput) {
                albumLocationInput.disabled = false;
                albumLocationInput.readOnly = false;
            }
            
            // Ort-Feld automatisch mit aktueller Stadt ausfüllen
            getCurrentCity().then(city => {
                if (city && albumLocationInput) {
                    albumLocationInput.value = city;
                    // Stelle sicher, dass das Feld weiterhin editierbar bleibt
                    albumLocationInput.disabled = false;
                    albumLocationInput.readOnly = false;
                }
            }).catch(() => {
                // Fehler ignorieren - Feld bleibt leer und editierbar
            });
            
            // Kurze Verzögerung für besseres UX
            setTimeout(() => {
                if (albumNameInput) {
                    albumNameInput.focus();
                }
            }, 100);
        }
    }
}

// Aktuelle Stadt basierend auf Standort abrufen
async function getCurrentCity() {
    if (!navigator.geolocation) {
        return null;
    }
    
    // Prüfe ob Location-Permission bereits erteilt wurde
    const locationPermission = localStorage.getItem('locationPermission');
    if (locationPermission === 'denied' || locationPermission === 'not_supported') {
        // Permission wurde verweigert oder nicht unterstützt - keine erneute Anfrage
        return null;
    }
    
    try {
        // Aktuelle Position abrufen (keine erneute Anfrage, da Permission bereits erteilt wurde)
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    timeout: 5000,
                    enableHighAccuracy: false,
                    maximumAge: 60000 // Cache für 1 Minute
                }
            );
        });
        
        const { latitude, longitude } = position.coords;
        
        // Reverse Geocoding mit OpenStreetMap Nominatim API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'Memories Web App'
                }
            }
        );
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        // Stadt aus verschiedenen möglichen Feldern extrahieren
        const address = data.address || {};
        const city = address.city || 
                     address.town || 
                     address.village || 
                     address.municipality || 
                     address.county ||
                     address.state_district ||
                     null;
        
        return city;
    } catch (error) {
        // Fehler beim Abrufen der Position oder Geocoding
        return null;
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
            alert('Please enter a name for the album.');
            return;
        }
        
        // Album erstellen und speichern
        const albums = JSON.parse(localStorage.getItem('albums') || '[]');
        const newAlbum = {
            id: Date.now().toString(),
            name: albumName,
            ort: albumLocation || 'No location specified',
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
// Skaliere Review-Content, damit alles sichtbar ist
function scaleReviewContent() {
    const container = document.querySelector('.review-container');
    const wrapper = document.querySelector('.review-content-wrapper');
    
    if (!container || !wrapper) return;
    
    // Warte kurz, damit DOM gerendert ist
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Temporär Skalierung zurücksetzen, um natürliche Größe zu messen
            wrapper.style.transform = 'scale(1)';
            
            // Hole tatsächliche Padding-Werte aus den berechneten Styles
            const containerStyle = getComputedStyle(container);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
            
            const containerRect = container.getBoundingClientRect();
            
            // Verfügbare Fläche im Container (berücksichtigt tatsächliches Padding)
            const availableWidth = containerRect.width - paddingLeft - paddingRight;
            const availableHeight = containerRect.height - paddingTop - paddingBottom;
            
            // Warte kurz, damit Browser die natürliche Größe berechnet hat
            setTimeout(() => {
                const wrapperRect = wrapper.getBoundingClientRect();
                const naturalWidth = wrapperRect.width;
                const naturalHeight = wrapperRect.height;
                
                if (naturalWidth === 0 || naturalHeight === 0) {
                    // Falls noch nicht gerendert, erneut versuchen
                    setTimeout(scaleReviewContent, 50);
                    return;
                }
                
                // Kleiner Sicherheitspuffer (4px auf jeder Seite) um sicherzustellen,
                // dass nichts abgeschnitten wird
                const safetyPadding = 8;
                const safeAvailableWidth = Math.max(0, availableWidth - safetyPadding);
                const safeAvailableHeight = Math.max(0, availableHeight - safetyPadding);
                
                // Berechne Skalierungsfaktoren
                const scaleX = safeAvailableWidth / naturalWidth;
                const scaleY = safeAvailableHeight / naturalHeight;
                
                // Verwende den kleineren Skalierungsfaktor, um sicherzustellen, dass alles passt
                // Maximal 1 (keine Vergrößerung über natürliche Größe hinaus)
                const scale = Math.min(scaleX, scaleY, 1);
                
                // Wende Skalierung an
                wrapper.style.transform = `scale(${scale})`;
                wrapper.style.transformOrigin = 'center center';
            }, 10);
        });
    });
}

// Abbrechen-Funktion
function cancelReview() {
    // Device Orientation Listener entfernen falls vorhanden
    if (deviceOrientationListener) {
        window.removeEventListener('deviceorientation', deviceOrientationListener);
        deviceOrientationListener = null;
    }
    
    // Temporäre Daten löschen
    localStorage.removeItem('capturedPhotos');
    localStorage.removeItem('keptPhotos');
    
    // Zur Homepage zurückkehren
    window.location.href = 'index.html';
}

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
    
    // 5b. All Deleted Modal Event Listener hinzufügen
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            // Alle temporären Daten löschen
            localStorage.removeItem('capturedPhotos');
            localStorage.removeItem('keptPhotos');
            // Zur Homepage zurückkehren
            window.location.href = 'index.html';
        });
    }
    
    // 6. Cancel Button Event Listener hinzufügen
    const cancelBtn = document.getElementById('cancelReviewBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelReview);
    }
    
    // 7. Content skalieren (nach kurzer Verzögerung, damit Bilder geladen sind)
    setTimeout(() => {
        scaleReviewContent();
    }, 300);
    
    // Skalierung bei Resize aktualisieren
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(scaleReviewContent, 150);
    });
    
    // Skalierung auch nach Bildladung aktualisieren
    if (currentImage) {
        currentImage.addEventListener('load', () => {
            setTimeout(scaleReviewContent, 50);
        });
    }
}

// Initialisierung nach DOM laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewPage);
} else {
    initReviewPage();
}
