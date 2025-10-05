// Helper to update datalists used for autosuggest (no Typeahead)
function updateDatalistsFromApp() {
    if (!window.app || !window.app.offers) return;
    const companies = [...new Set(window.app.offers.map(o => o.company))];
    const locations = [...new Set(window.app.offers.map(o => o.location))];
    const roles = [...new Set(window.app.offers.map(o => o.mapped_role))];

    const fillList = (id, items) => {
        const list = document.getElementById(id);
        if (!list) return;
        list.innerHTML = items.slice(0, 500).map(i => `<option value="${i}"></option>`).join('');
    };

    fillList('companyInput-datalist', companies);
    fillList('locationInput-datalist', locations);
    fillList('roleInput-datalist', roles);
}

// Expose for use after data load
window.updateDatalistsFromApp = updateDatalistsFromApp;

// Provide a clearFilter helper that the UI can call
window.clearFilter = function(inputId) {
    if (!window.app) return;
    const map = { companyInput: 'company', locationInput: 'location', roleInput: 'role' };
    const key = map[inputId];
    if (key) {
        window.app.filters[key] = '';
        window.app.applyFilters();
    }
};