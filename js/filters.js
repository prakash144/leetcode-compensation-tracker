// Initialize the filter data
const companies = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: [] // Will be populated from your data
});

const locations = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: [] // Will be populated from your data
});

const roles = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: [] // Will be populated from your data
});

// Initialize typeahead
function initializeTypeahead() {
    // Company filter
    $('#company-filter').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'companies',
        source: companies
    });

    // Location filter
    $('#location-filter').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'locations',
        source: locations
    });

    // Role filter
    $('#role-filter').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'roles',
        source: roles
    });
}

// Update filter data based on compensation entries
function updateFilterData(compensationData) {
    const uniqueCompanies = [...new Set(compensationData.map(entry => entry.company))];
    const uniqueLocations = [...new Set(compensationData.map(entry => entry.location))];
    const uniqueRoles = [...new Set(compensationData.map(entry => entry.role))];

    companies.clear();
    companies.add(uniqueCompanies);

    locations.clear();
    locations.add(uniqueLocations);

    roles.clear();
    roles.add(uniqueRoles);
}

// Handle selection events
$('.typeahead').on('typeahead:select', function(ev, suggestion) {
    // Trigger filter update
    updateFilters();
});

// Initialize when document is ready
$(document).ready(function() {
    initializeTypeahead();
    // Initial data load
    if (window.compensationData) {
        updateFilterData(window.compensationData);
    }
});
