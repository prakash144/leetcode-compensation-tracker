document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bloodhound engines for each input
    const companyEngine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: [] // Will be populated when data loads
    });

    const locationEngine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: [] // Will be populated when data loads
    });

    const roleEngine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: [] // Will be populated when data loads
    });

    // Initialize Typeahead for each input
    $('#companyInput').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'companies',
        source: companyEngine,
        templates: {
            suggestion: function(data) {
                return `
                    <div class="suggestion-item">
                        <i class="fas fa-building"></i>
                        <span class="suggestion-text">${data}</span>
                        <span class="suggestion-meta">offers</span>
                    </div>
                `;
            },
            empty: '<div class="empty-message"><i class="fas fa-info-circle"></i> No companies found</div>'
        }
    });

    $('#locationInput').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'locations',
        source: locationEngine,
        templates: {
            suggestion: function(data) {
                return `
                    <div class="suggestion-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="suggestion-text">${data}</span>
                        <span class="suggestion-meta">positions</span>
                    </div>
                `;
            },
            empty: '<div class="empty-message"><i class="fas fa-info-circle"></i> No locations found</div>'
        }
    });

    $('#roleInput').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'roles',
        source: roleEngine,
        templates: {
            suggestion: function(data) {
                return `
                    <div class="suggestion-item">
                        <i class="fas fa-briefcase"></i>
                        <span class="suggestion-text">${data}</span>
                        <span class="suggestion-meta">avg salary</span>
                    </div>
                `;
            },
            empty: '<div class="empty-message"><i class="fas fa-info-circle"></i> No roles found</div>'
        }
    });

    // Function to update Bloodhound engines with new data
    window.updateTypeaheadData = function(companies, locations, roles) {
        companyEngine.clear();
        companyEngine.add(companies);

        locationEngine.clear();
        locationEngine.add(locations);

        roleEngine.clear();
        roleEngine.add(roles);
    };

    // Add clear buttons for each input
    ['companyInput', 'locationInput', 'roleInput'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const clearButton = document.createElement('button');
        clearButton.className = 'typeahead-clear-btn';
        clearButton.innerHTML = '<i class="fas fa-times"></i>';
        clearButton.style.display = 'none';
        input.parentElement.appendChild(clearButton);

        clearButton.addEventListener('click', () => {
            $(input).typeahead('val', '');
            clearButton.style.display = 'none';
            // Trigger the app's filter update
            if (window.app) {
                window.app.clearFilter(inputId);
            }
        });

        // Show/hide clear button based on input value
        input.addEventListener('input', () => {
            clearButton.style.display = input.value ? 'block' : 'none';
        });
    });
});
