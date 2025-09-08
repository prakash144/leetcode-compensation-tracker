// Add this method to the LeetCodeCompensationTracker class
updateTypeaheadData() {
    if (window.updateTypeaheadData) {
        const companies = [...new Set(this.offers.map(o => o.company))];
        const locations = [...new Set(this.offers.map(o => o.location))];
        const roles = [...new Set(this.offers.map(o => o.mapped_role))];
        
        window.updateTypeaheadData(companies, locations, roles);
    }
}

// Add this method to handle clearing individual filters
clearFilter(inputId) {
    const filterMap = {
        companyInput: 'company',
        locationInput: 'location',
        roleInput: 'role'
    };

    const key = filterMap[inputId];
    if (key) {
        this.filters[key] = '';
        this.applyFilters();
    }
}

// Modify the init method to include Typeahead data update
async init() {
    try {
        console.log('Initializing application...');
        
        // Load data first
        const dataLoaded = await this.loadData();
        if (!dataLoaded) {
            throw new Error('Data loading failed');
        }
        
        // Update Typeahead data
        this.updateTypeaheadData();
        
        // Setup UI components
        console.log('Setting up UI components...');
        this.setupEventListeners();
        
        // Initialize theme before rendering
        console.log('Initializing theme...');
        this.initializeTheme();
        
        // Render data
        console.log('Rendering data...');
        this.updateStats();
        this.renderCharts();
        this.renderTable();
        
        // Initialize animations last
        console.log('Initializing animations...');
        this.initializeAnimations();
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        this.showError(`Failed to initialize: ${error.message}. Please try refreshing the page.`);
    }
}
