// Verstanden Button - Weiterleitung zur Berechtigungsseite
document.addEventListener('DOMContentLoaded', () => {
    const understandBtn = document.getElementById('understandBtn');
    
    understandBtn.addEventListener('click', () => {
        window.location.href = 'permissions.html';
    });
});
