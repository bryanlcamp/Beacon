// assets/js/search.js
// Simple client-side search for Beacon site
document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.querySelector('.beacon-nav-search');
  const resultsContainer = document.getElementById('search-results');
  let searchIndex = [];

  // Load the search index and only enable search after loaded
  fetch('/assets/search-index.json')
    .then(response => response.json())
    .then(data => {
      searchIndex = data;
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          search(e.target.value);
        });
      }
    });

  function normalize(str) {
    return (str || '').toLowerCase();
  }

  function clearResults() {
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
  }

  function renderResults(results) {
    clearResults();
    if (!resultsContainer) return;
    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="search-no-results">No results found.</div>';
      return;
    }
    results.forEach(result => {
      const div = document.createElement('div');
      div.className = 'search-result';
      div.innerHTML = `<a href="/${result.url}"><strong>${result.title}</strong><br><span>${result.snippet || ''}</span></a>`;
      resultsContainer.appendChild(div);
    });
  }

  function search(query) {
    const normQuery = normalize(query);
    if (!normQuery) {
      clearResults();
      return;
    }
    const results = [];
    const seen = new Set();
    for (const entry of searchIndex) {
      // Check all fields for substring match
      if ([entry.title, entry.snippet, entry.content].some(field => normalize(field).includes(normQuery))) {
        if (!seen.has(entry.url)) {
          results.push(entry);
          seen.add(entry.url);
        }
      }
    }
    renderResults(results);
  }

  // (event listener now added only after index loads)
});
// ...existing code ends here. Remove all code after the main DOMContentLoaded handler.
