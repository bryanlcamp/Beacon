// beacon-search.js
// Shared search bar logic for Beacon platform

function showSearchIfResults() {
    if (document.querySelector('.beacon-search-field').value.trim()) performSearch();
}

function hideSearchDelayed() {
    setTimeout(() => {
        document.querySelector('.beacon-search-results').style.display = 'none';
    }, 300);
}

function performSearch(query = document.querySelector('.beacon-search-field').value) {
    const results = document.getElementById('searchResults');
    if (!query.trim()) return results.style.display = 'none';
    const mockResults = [
        { title: "Market Data Generation", section: "Infrastructure", snippet: "Generate datasets with 4.5μs latency...", url: "cpp/market-data-generation.html" },
        { title: "CME Protocol Support", section: "Protocols", snippet: "Native binary CME, Nasdaq, NYSE protocols...", url: "protocols/support-cme-nasdaq-nyse.html" },
        { title: "Strategy Container", section: "Applications", snippet: "Plug in your strategy and start testing immediately...", url: "../apps/algorithm-plugin/" }
    ].filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.snippet.toLowerCase().includes(query.toLowerCase())
    );
    if (mockResults.length) {
        results.innerHTML = mockResults
            .map(
                item => `
                <div class="search-result" onclick="window.location.href='${item.url}'">
                    <div class="result-title">${item.title}</div>
                    <div class="result-section">${item.section}</div>
                    <div class="result-snippet">${item.snippet}</div>
                </div>
            `
            )
            .join('');
        results.style.display = 'block';
    } else {
        results.style.display = 'none';
    }
}
