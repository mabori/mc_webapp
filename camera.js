let stream = null;
let capturedPhotos = [];
let currentFacingMode = 'environment'; // 'environment' = Rückkamera, 'user' = Frontkamera

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const photoStack = document.getElementById('photoStack');
const photoCounter = document.getElementById('photoCounter');

// Initialize camera
// Permission was already requested during onboarding, so we can use it directly
// The browser remembers the permission, so getUserMedia will not ask again
async function initCamera(facingMode = 'environment') {
    try {
        // Stop old stream if present
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Permission was already requested during onboarding
        // Browser remembers the permission, so getUserMedia will not ask again here
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: facingMode,
                width: { ideal: 1920 },
                height: { ideal: 1920 }
            }
        });
        
        currentFacingMode = facingMode;
        video.srcObject = stream;
        // Sicherstellen, dass keine Controls angezeigt werden
        video.controls = false;
        
        // Video-Element auf quadratisches Format beschränken
        video.addEventListener('loadedmetadata', () => {
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;
        });
    } catch (error) {
        // If permission was denied, show user-friendly message
        // Note: Permission was already requested during onboarding, this should not happen normally
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('Camera permission was denied. Please allow access in your browser settings.');
        } else {
            alert('Camera could not be opened. Please check permissions.');
        }
    }
}

// Kamera wechseln
async function switchCamera() {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await initCamera(newFacingMode);
}

// Foto aufnehmen
function capturePhoto() {
    const ctx = canvas.getContext('2d');
    const size = Math.min(video.videoWidth, video.videoHeight);
    
    // Quadratisches Bild aus der Mitte extrahieren
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    
    ctx.drawImage(
        video,
        offsetX, offsetY, size, size,
        0, 0, size, size
    );
    
    // Bild als Data URL speichern
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    capturedPhotos.unshift(photoData); // Neues Bild am Anfang hinzufügen
    
    // Stack aktualisieren
    updatePhotoStack();
    
    // Visuelles Feedback
    captureBtn.classList.add('clicked');
    setTimeout(() => {
        captureBtn.classList.remove('clicked');
    }, 200);
}

// Photo Stack aktualisieren
function updatePhotoStack() {
    photoStack.innerHTML = '';
    
    // Counter aktualisieren
    photoCounter.textContent = capturedPhotos.length;
    
    if (capturedPhotos.length === 0) {
        photoStack.style.display = 'none';
        photoCounter.style.display = 'none';
        return;
    }
    
    photoStack.style.display = 'flex';
    photoCounter.style.display = 'flex';
    
    // Maximal 5 Bilder im Stack anzeigen
    const displayPhotos = capturedPhotos.slice(0, 5);
    
    displayPhotos.forEach((photoData, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'stack-photo';
        photoElement.style.zIndex = displayPhotos.length - index;
        photoElement.style.transform = `translate(${index * 4}px, ${index * 4}px) scale(${1 - index * 0.05})`;
        photoElement.style.opacity = 1 - index * 0.15;
        
        const img = document.createElement('img');
        img.src = photoData;
        img.alt = `Photo ${index + 1}`;
        
        photoElement.appendChild(img);
        photoStack.appendChild(photoElement);
    });
}

// Event Listeners
captureBtn.addEventListener('click', capturePhoto);

// Kamera-Wechsel Button
const switchCameraBtn = document.getElementById('switchCameraBtn');
if (switchCameraBtn) {
    switchCameraBtn.addEventListener('click', switchCamera);
}

// Initialisierung
photoCounter.textContent = '0';
photoCounter.style.display = 'none';

// Kamera beim Laden starten (Rückkamera als Standard)
initCamera('environment');

// Bestätigungs-Button Event Listener
const confirmBtn = document.getElementById('confirmBtn');
const noPhotosModal = document.getElementById('noPhotosModal');
const closeNoPhotosModal = document.getElementById('closeNoPhotosModal');

if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        if (capturedPhotos.length > 0) {
            // Bilder in localStorage speichern
            localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
            // Zur Review-Seite navigieren
            window.location.href = 'review.html';
        } else {
            // Zeige Modal statt Alert
            if (noPhotosModal) {
                noPhotosModal.style.display = 'flex';
            }
        }
    });
}

// Modal schließen
if (closeNoPhotosModal && noPhotosModal) {
    closeNoPhotosModal.addEventListener('click', () => {
        noPhotosModal.style.display = 'none';
    });
    
    // Modal auch beim Klick auf Overlay schließen
    noPhotosModal.addEventListener('click', (e) => {
        if (e.target === noPhotosModal) {
            noPhotosModal.style.display = 'none';
        }
    });
}

// Aufräumen beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

