let currentAlbum = null;
let currentPhotoIndex = 0;
let photos = [];
let slideshowInterval = null;
const SLIDESHOW_INTERVAL_MS = 4000; // 4 Sekunden pro Bild für smooth transition

// DOM Elements
const albumTitle = document.getElementById('albumTitle');
const albumLocation = document.getElementById('albumLocation');
const currentPhoto = document.getElementById('currentPhoto');
const photoCounter = document.getElementById('photoCounter');

// Album-ID aus URL-Parameter holen
function getAlbumIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Album laden
function loadAlbum() {
    const albumId = getAlbumIdFromURL();
    
    if (!albumId) {
        // Keine Album-ID gefunden, zurück zur Homepage
        window.location.href = 'index.html';
        return;
    }
    
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    currentAlbum = albums.find(album => album.id === albumId);
    
    if (!currentAlbum) {
        // Album nicht gefunden, zurück zur Homepage
        window.location.href = 'index.html';
        return;
    }
    
    // Album-Informationen anzeigen
    albumTitle.textContent = currentAlbum.name;
    albumLocation.innerHTML = '<span class="location-icon">📍</span>' + (currentAlbum.ort || 'No location specified');
    
    // Fotos laden
    photos = currentAlbum.photos || [];
    
    if (photos.length === 0) {
        // Keine Fotos im Album
        currentPhoto.style.display = 'none';
        photoCounter.textContent = '0 / 0';
        return;
    }
    
    // Erstes Foto anzeigen
    currentPhotoIndex = 0;
    currentPhoto.src = photos[0];
    currentPhoto.alt = `Photo 1`;
    updateCounter();
    
    // Automatische Slideshow starten
    startSlideshow();
}

// Foto anzeigen mit Übergangseffekt
function showPhoto(index) {
    if (index < 0 || index >= photos.length) return;
    
    // Aktuelles Bild ausblenden und zurück rotieren
    currentPhoto.classList.add('fade-out-rotate');
    
    // Nach der Ausblend-Animation das neue Bild einblenden
    setTimeout(() => {
        currentPhoto.src = photos[index];
        currentPhoto.alt = `Photo ${index + 1}`;
        currentPhotoIndex = index;
        currentPhoto.classList.remove('fade-out-rotate');
        currentPhoto.classList.add('fade-in-rotate');
        updateCounter();
        
        // Nach der Einblend-Animation die Klasse entfernen, damit es für den nächsten Übergang bereit ist
        setTimeout(() => {
            currentPhoto.classList.remove('fade-in-rotate');
        }, 1000);
    }, 1000);
}

// Counter aktualisieren
function updateCounter() {
    photoCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
}

// Nächstes Foto (automatisch)
function showNextPhoto() {
    if (photos.length === 0) return;
    
    // Zurück zum Anfang wenn am Ende
    const nextIndex = (currentPhotoIndex + 1) % photos.length;
    showPhoto(nextIndex);
}

// Automatische Slideshow starten
function startSlideshow() {
    if (photos.length <= 1) return; // Nur starten wenn mehr als ein Bild
    
    stopSlideshow(); // Sicherstellen, dass kein doppeltes Intervall läuft
    
    slideshowInterval = setInterval(() => {
        showNextPhoto();
    }, SLIDESHOW_INTERVAL_MS);
}

// Automatische Slideshow stoppen
function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

// Album beim Laden der Seite laden
loadAlbum();

// Slideshow beim Verlassen der Seite stoppen
window.addEventListener('beforeunload', () => {
    stopSlideshow();
});

// Album Options Modal Funktionen
function openAlbumOptionsModal() {
    if (!currentAlbum) return;
    
    const modal = document.getElementById('albumOptionsModal');
    const nameInput = document.getElementById('editAlbumName');
    
    if (modal && nameInput) {
        nameInput.value = currentAlbum.name;
        modal.style.display = 'flex';
        nameInput.focus();
    }
}

function closeAlbumOptionsModal() {
    const modal = document.getElementById('albumOptionsModal');
    const form = document.getElementById('albumOptionsForm');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset();
    }
}

function saveAlbumChanges(newName) {
    if (!currentAlbum) return false;
    
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    const album = albums.find(a => a.id === currentAlbum.id);
    
    if (!album) return false;
    
    if (newName && newName.trim() !== '' && newName.trim() !== album.name) {
        album.name = newName.trim();
        localStorage.setItem('albums', JSON.stringify(albums));
        
        // Aktuelles Album aktualisieren und Titel neu anzeigen
        currentAlbum.name = album.name;
        albumTitle.textContent = currentAlbum.name;
        
        return true;
    }
    return false;
}

function deleteAlbum() {
    if (!currentAlbum) return;
    
    if (!confirm('Do you really want to delete this album?')) {
        return;
    }
    
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    const filteredAlbums = albums.filter(a => a.id !== currentAlbum.id);
    localStorage.setItem('albums', JSON.stringify(filteredAlbums));
    
    // Zurück zur Startseite nach dem Löschen
    window.location.href = 'index.html';
}

// Event Listeners für Album Options Modal
document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('backButton');
    const modal = document.getElementById('albumOptionsModal');
    const form = document.getElementById('albumOptionsForm');
    const closeBtn = document.getElementById('closeOptionsBtn');
    const deleteBtn = document.getElementById('deleteAlbumBtn');
    const nameInput = document.getElementById('editAlbumName');
    const optionsBtn = document.getElementById('albumOptionsBtn');
    
    if (!modal || !form || !closeBtn || !deleteBtn || !nameInput || !optionsBtn) {
        return;
    }
    
    // Zurück-Button Event Listener
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Options Button öffnet Modal
    optionsBtn.addEventListener('click', () => {
        openAlbumOptionsModal();
    });
    
    // Modal schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAlbumOptionsModal();
        }
    });
    
    // X Button zum Schließen
    closeBtn.addEventListener('click', () => {
        closeAlbumOptionsModal();
    });
    
    // Löschen Button
    deleteBtn.addEventListener('click', () => {
        deleteAlbum();
    });
    
    // Form Submit (Speichern)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = nameInput.value.trim();
        if (!newName) {
            alert('Please enter a name.');
            return;
        }
        
        if (saveAlbumChanges(newName)) {
            closeAlbumOptionsModal();
        }
    });
});
