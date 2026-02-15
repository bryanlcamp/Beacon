// beacon-info-dropdown.js
// Injects the info/about/contact dropdown into .beacon-nav-actions

function injectBeaconInfoDropdown() {
    const navActions = document.querySelector('.beacon-nav-actions');
    if (!navActions || document.getElementById('infoDropdown')) return;
    const container = document.createElement('div');
    container.className = 'info-dropdown-container';
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.verticalAlign = 'middle';
    container.innerHTML = `
        <button
            class="info-icon"
            id="infoIconBtn"
            aria-label="Info"
            tabindex="0"
            style="width:24px;height:24px;border-radius:50%;border:1.5px solid #fff;background:transparent;color:#ececec;display:flex;align-items:center;justify-content:center;font-size:0.95em;font-weight:900;cursor:pointer;transition:border 0.2s,background 0.2s;outline:none;padding:0;box-sizing:border-box;margin-top:-30px;">
            <span
                class="info-i"
                style="font-family:inherit;font-size:0.95em;font-weight:900;color:#ececec;user-select:none;line-height:1;letter-spacing:0.01em;text-shadow:0 0 2px #000,0 0 1px #ececec;">i</span>
        </button>
        <div
            class="info-dropdown"
            id="infoDropdown"
            style="display:none;position:absolute;right:0;top:110%;min-width:120px;background:#181828;border:1.5px solid #fff;border-radius:8px;box-shadow:0 4px 16px 0 rgba(0,0,0,0.13);z-index:100;padding:0.5em 0;text-align:left;">
            <a
                href="mailto:contact@beaconhft.com"
                style="display:block;color:#fff;text-decoration:none;padding:0.5em 1.2em;font-size:1em;transition:background 0.18s,color 0.18s;"
            >Contact</a>
            <a
                href="/about.html"
                style="display:block;color:#fff;text-decoration:none;padding:0.5em 1.2em;font-size:1em;transition:background 0.18s,color 0.18s;"
            >About</a>
        </div>
    `;
    navActions.appendChild(container);
    // Move info icon to the end for far-right alignment
    if (navActions.lastChild !== container) {
        navActions.appendChild(container);
    }

    // Dropdown logic
    const infoBtn = container.querySelector('#infoIconBtn');
    const dropdown = container.querySelector('#infoDropdown');
    if (!infoBtn || !dropdown) return;
    infoBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function (e) {
        if (!infoBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    infoBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') dropdown.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', injectBeaconInfoDropdown);