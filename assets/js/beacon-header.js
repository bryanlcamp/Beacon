// beacon-header.js
// Injects the shared Beacon header/navbar into .beacon-page-header


function injectBeaconHeader(options = {}) {
    const header = document.querySelector('.beacon-page-header');
    if (!header) return;
    // Determine nav-back text and link
    let navBackText = 'Command Center';
    let navBackHref = '/command-center/index.html';
    if ((options.pageTitle || '').toLowerCase().includes('command center')) {
        navBackText = 'Home';
        navBackHref = '/';
    }
    header.innerHTML = `
        <nav class="beacon-page-nav">
            <div class="beacon-brand-header">
                <a href="/index.html" class="beacon-brand-main">Beacon.</a>
                <span class="beacon-brand-separator">|</span>
                <span class="beacon-page-title">${options.pageTitle || 'Page Title'}</span>
            </div>
            <div class="beacon-nav-actions">
                <div class="beacon-search">
                    <input type="text" class="beacon-search-field" placeholder="Search" onkeyup="performSearch(this.value)" onfocus="showSearchIfResults()" onblur="hideSearchDelayed()" />
                    <div class="beacon-search-results" id="searchResults"></div>
                </div>
                <a href="/" class="beacon-nav-back"><span class="nav-arrow">←</span><span>Home</span></a>
                <!-- Info dropdown injected by beacon-info-dropdown.js -->
            </div>
        </nav>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    let pageTitle = window.BEACON_PAGE_TITLE;
    if (!pageTitle) {
        // Use the <title> tag, stripping 'Beacon' prefix if present
        let docTitle = document.title || '';
        pageTitle = docTitle.replace(/^Beacon(\s*\|)?\s*/i, '').replace(/\s*\-\s*Professional HFT Platform/i, '').trim();
    }
    injectBeaconHeader({ pageTitle });
});