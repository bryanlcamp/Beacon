// Shared info dropdown logic for Beacon Command Center
(function() {
    var infoBtn, dropdown;
    function setupInfoDropdown() {
        infoBtn = document.getElementById('infoIconBtn');
        dropdown = document.getElementById('infoDropdown');
        if (!infoBtn || !dropdown) return;
        infoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', function(e) {
            if (!infoBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        infoBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') dropdown.classList.remove('show');
        });
    }
    window.showAboutModal = function() {
        alert('About: Add your bio or modal here.');
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInfoDropdown);
    } else {
        setupInfoDropdown();
    }
})();
