// Premium LeetCode Compensation Tracker - Advanced JavaScript
// Modern ES6+ implementation with premium features

class LeetCodeCompensationTracker {
    constructor() {
        this.offers = [];
        this.filteredOffers = [];
        this.comparisonOffers = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSort = { column: null, order: 'asc' };
        this.filters = {
            search: '',
            company: '',
            location: '',
            role: '',
            yoeMin: 0,
            yoeMax: 30,
            salaryMin: 1,
            salaryMax: 200,
    includeInterviewExp: false
};

        this.companyLogos = new Map();
        this.techStackKeywords = {
            'DSA': ['algorithm', 'data structure', 'leetcode', 'coding', 'array', 'tree', 'graph'],
            'System Design': ['system design', 'architecture', 'scalability', 'distributed', 'microservice'],
            'Java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
            'Python': ['python', 'django', 'flask', 'pandas', 'numpy'],
            'JavaScript': ['javascript', 'js', 'node', 'react', 'angular', 'vue'],
            'React': ['react', 'jsx', 'redux', 'hooks'],
            'Node.js': ['node', 'express', 'npm', 'yarn']
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing application...');
            
            // Load data first
            const dataLoaded = await this.loadData();
            if (!dataLoaded) {
                throw new Error('Data loading failed');
            }
            
            // Setup UI components
            console.log('Setting up UI components...');
            this.setupEventListeners();
            this.populateAutosuggestCaches();
            
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
            console.error('Initialization error:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Show user-friendly error message
            this.showError(`Failed to initialize: ${error.message}. Please try refreshing the page.`);
            
            // Reset loading states
            document.querySelectorAll('.loading').forEach(el => el.style.display = 'none');
        }
    }

    async loadData() {
        try {
            console.log('Starting data load...');
            console.log('Fetching data from data/parsed_comps.json...');

            // Build an ordered list of candidate URLs for the data file.
            // This helps when the page is served from different base paths.
            const candidates = [];

            if (typeof window !== 'undefined' && window.__leetcomp_data_path__) {
                candidates.push(window.__leetcomp_data_path__);
            }

            // Candidate paths (relative to current page)
            candidates.push(new URL('data/parsed_comps.json', location.href).href);
            candidates.push(new URL('../data/parsed_comps.json', location.href).href);
            // Absolute path from server root (useful when deploying to a server
            // that serves the repo root at site root)
            candidates.push(new URL('/data/parsed_comps.json', location.origin).href);

            // Try each candidate URL until one succeeds.
            let response = null;
            let lastError = null;
            for (const url of candidates) {
                try {
                    console.log('Attempting to fetch data from', url);
                    const res = await fetch(url);
                    if (res.ok) {
                        response = res;
                        console.log('Successfully fetched data from', url);
                        break;
                    } else {
                        console.warn('Fetch failed for', url, { status: res.status, statusText: res.statusText });
                        lastError = new Error(`HTTP error! status: ${res.status}, statusText: ${res.statusText}`);
                    }
                } catch (err) {
                    console.warn('Network error when fetching', url, err.message);
                    lastError = err;
                }
            }

            if (!response) {
                // If none of the fetch attempts succeeded, throw the last error
                // (or a generic error if none present) so the outer catch handles it.
                throw lastError || new Error('Failed to locate data file at any known path');
            }
            console.log('Fetch response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers]),
                type: response.type,
                url: response.url
            });
            
            if (!response.ok) {
                console.error('HTTP Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    type: response.type,
                    redirected: response.redirected,
                    url: response.url
                });
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            
            console.log('Parsing JSON response...');
            let rawOffers;
            try {
                rawOffers = await response.json();
            } catch (parseError) {
                console.error('JSON Parse Error:', {
                    message: parseError.message,
                    position: parseError.position,
                    stack: parseError.stack
                });
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
            
            console.log('Data loaded:', {
                type: typeof rawOffers,
                isArray: Array.isArray(rawOffers),
                length: Array.isArray(rawOffers) ? rawOffers.length : 'not an array',
                sample: Array.isArray(rawOffers) && rawOffers.length > 0 ? 
                    JSON.stringify(rawOffers[0]).substring(0, 100) + '...' : 'no data'
            });
            
            if (!Array.isArray(rawOffers)) {
                console.error('Invalid data format:', {
                    type: typeof rawOffers,
                    preview: JSON.stringify(rawOffers).substring(0, 100) + '...'
                });
                throw new Error(`Invalid data format: Expected an array, got ${typeof rawOffers}`);
            }
            
            if (rawOffers.length === 0) {
                throw new Error('Empty data array received from server');
            }
            
            // Validate and clean data before deduplication
            console.log('Starting data validation...');
            const validOffers = [];
            const invalidOffers = [];

            for (const offer of rawOffers) {
                const isValid = offer && 
                       typeof offer === 'object' &&
                       typeof offer.total === 'number' &&
                       !isNaN(offer.total) &&
                       offer.company &&
                       typeof offer.company === 'string' &&
                       offer.role &&
                       typeof offer.role === 'string' &&
                       offer.location &&
                       typeof offer.location === 'string' &&
                       offer.yoe &&
                       typeof offer.yoe === 'number' &&
                       !isNaN(offer.yoe) &&
                       offer.creation_date &&
                       typeof offer.creation_date === 'string';

                if (isValid) {
                    validOffers.push(offer);
                } else {
                    // collect invalid offers for a summarized log later
                    invalidOffers.push(offer);
                }
            }

            if (invalidOffers.length > 0) {
                // Log a compact summary rather than a per-offer error to reduce noise
                console.warn(`Data validation: ${invalidOffers.length} invalid offers skipped out of ${rawOffers.length}. Showing a sample:`);
                try {
                    console.warn(JSON.stringify(invalidOffers.slice(0, 3).map(o => ({
                        id: o && o.id,
                        company: o && o.company,
                        role: o && o.role,
                        total: o && o.total,
                        yoe: o && o.yoe,
                        creation_date: o && o.creation_date
                    })), null, 2));
                } catch (e) {
                    // fall back to a simpler log if JSON stringify fails
                    console.warn(invalidOffers.slice(0, 3));
                }
            }

            if (validOffers.length === 0) {
                console.error('No valid offers in data:', {
                    totalOffers: rawOffers.length,
                    validOffers: validOffers.length,
                    sampleInvalid: rawOffers.length > 0 ? 
                        JSON.stringify(rawOffers[0]).substring(0, 100) + '...' : 'no data'
                });
                throw new Error('No valid offers found in the data');
            }

            console.log('Data validation complete:', {
                totalOffers: rawOffers.length,
                validOffers: validOffers.length,
                invalidOffers: rawOffers.length - validOffers.length
            });

            // Deduplicate based on unique combination of properties
            console.log('Starting deduplication...');
            const uniqueKey = new Set();
            this.offers = validOffers.filter(offer => {
                const key = `${offer.company}_${offer.role}_${offer.location}_${offer.yoe}_${offer.total}_${offer.creation_date}`;
                if (uniqueKey.has(key)) {
                    console.log('Duplicate offer found:', {
                        key,
                        company: offer.company,
                        role: offer.role,
                        date: offer.creation_date
                    });
                    return false;
                }
                uniqueKey.add(key);
                return true;
            });
            
            console.log('Deduplication complete:', {
                beforeCount: validOffers.length,
                afterCount: this.offers.length,
                duplicatesRemoved: validOffers.length - this.offers.length
            });
            
            // Sort by date (newest first)
            console.log('Sorting offers by date...');
            this.offers.sort((a, b) => {
                const dateA = new Date(a.creation_date);
                const dateB = new Date(b.creation_date);
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    console.warn('Invalid date found:', {
                        dateA: a.creation_date,
                        dateB: b.creation_date
                    });
                    return 0; // Invalid dates are treated equally
                }
                return dateB - dateA;
            });
            
            this.filteredOffers = [...this.offers];
            
            // Load and cache company logos
            console.log('Loading company logos...');
            await this.loadCompanyLogos();

            // Populate datalists used for autosuggests (if helper available)
            if (typeof window !== 'undefined' && window.updateDatalistsFromApp) {
                try { window.updateDatalistsFromApp(); } catch (e) { /* ignore */ }
            }
            
            console.log('Data load complete:', {
                uniqueOffers: this.offers.length,
                invalidEntriesSkipped: rawOffers.length - validOffers.length,
                duplicatesRemoved: validOffers.length - this.offers.length,
                dateRange: this.offers.length > 0 ? {
                    oldest: this.offers[this.offers.length - 1].creation_date,
                    newest: this.offers[0].creation_date
                } : 'no data'
            });
            
            return true;
        } catch (error) {
            // Detailed error logging
            console.error('Data loading error:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
                type: error instanceof TypeError ? 'TypeError' :
                    error instanceof SyntaxError ? 'SyntaxError' :
                    error instanceof Error ? 'Error' : 'Unknown'
            });

            // User-friendly error message
            let errorMessage = 'Failed to load compensation data. ';
            
            if (!navigator.onLine) {
                errorMessage += 'Please check your internet connection.';
            } else if (error instanceof SyntaxError) {
                errorMessage += 'The data file appears to be corrupted.';
            } else if (error.message.includes('404')) {
                errorMessage += 'The data file could not be found.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Network request failed. Please check your connection.';
            } else {
                errorMessage += 'An unexpected error occurred.';
            }

            errorMessage += '\n\nTechnical details: ' + error.message;
            this.showError(errorMessage);
            throw error;
        }
    }

    async loadCompanyLogos() {
        // This would typically load from a company logos API or local assets
        // For now, we'll use placeholder logic
        const companies = [...new Set(this.offers.map(offer => offer.company))];
        companies.forEach(company => {
            this.companyLogos.set(company, this.getCompanyLogoUrl(company));
        });
    }

    getCompanyLogoUrl(company, size = 'regular') {
        // Size configurations for different logo sizes
        const sizes = {
            'small': 'company-logo-sm',
            'regular': 'company-logo',
            'medium': 'company-logo-md',
            'large': 'company-logo-lg'
        };
        
        // Clean company name for better logo matching
        const cleanName = (company || '').trim().toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
        
        // Additional company-specific mappings for better logo matching
        const companyMappings = {
            'meta': 'facebook',
            'alphabet': 'google',
            'bytedance': 'tiktok',
            'metaplatforms': 'facebook',
            'alphabetinc': 'google',
            'googlelimited': 'google',
            'microsoftcorporation': 'microsoft',
            'amazoncom': 'amazon',
            'facebookinc': 'facebook',
            'appleinc': 'apple',
            'walmartglobaltech': 'walmart',
            'linkedincorporation': 'linkedin',
            'one97communications': 'paytm',
            'bundltechnologies': 'swiggy',
            'anitechnologies': 'ola',
            'innovativeretail': 'bigbasket',
            'dreamplug': 'cred'
        };

        const mappedName = companyMappings[cleanName] || cleanName;
        
        // Try to get logo from Clearbit first
        const clearbitUrl = `https://logo.clearbit.com/${mappedName}.com`;
        
        // Enhanced UI Avatar configuration for better fallback logos
        const uiAvatarConfig = {
            name: encodeURIComponent(company || 'Unknown'),
            background: this.getCompanyColor(company),
            size: size === 'large' ? 128 : size === 'medium' ? 96 : size === 'small' ? 48 : 64,
            bold: true,
            format: 'svg'
        };
        
        const uiAvatarUrl = `https://ui-avatars.com/api/?${Object.entries(uiAvatarConfig)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')}`;
        
        // Create the logo HTML with proper classes and fallback
        const logoClass = sizes[size] || sizes.regular;
        const logoHtml = `
            <div class="company-logo-wrapper">
                <img 
                    class="${logoClass}"
                    src="${clearbitUrl}"
                    onerror="this.onerror=null; this.src='${uiAvatarUrl}'"
                    alt="${company} logo"
                    title="${company}"
                    loading="lazy"
                >
            </div>`;
        
        return {
            html: logoHtml,
            primary: clearbitUrl,
            fallback: uiAvatarUrl
        };
    }

    getCompanyColor(company) {
        // Enhanced color mapping for consistent brand colors
        const colors = {
            'google': '4285f4',
            'meta': '1877f2',
            'facebook': '1877f2',
            'amazon': 'ff9900',
            'microsoft': '00a4ef',
            'apple': '999999',
            'netflix': 'e50914',
            'uber': '000000',
            'airbnb': 'ff5a5f',
            'twitter': '1da1f2',
            'linkedin': '0a66c2',
            'paypal': '003087',
            'adobe': 'ff0000',
            'salesforce': '00a1e0',
            'oracle': 'f80000',
            'ibm': '052fad',
            'intel': '0071c5',
            'visa': '1a1f71',
            'mastercard': 'eb001b',
            // Indian companies
            'flipkart': '2874f0',
            'paytm': '00b9f5',
            'swiggy': 'fc8019',
            'zomato': 'e23744',
            'phonepe': '5f259f',
            'razorpay': '02042b',
            'cred': '0f3057',
            'meesho': 'f43397'
        };

        // Get company key by removing spaces and converting to lowercase
        const key = (company || '').toLowerCase().replace(/\s+/g, '');
        return colors[key] || this.getRandomBrandColor(company);
    }

    getRandomBrandColor(company) {
        // Generate consistent color based on company name
        const colors = [
            '6366f1', '8b5cf6', 'a855f7', 'd946ef',
            'ec4899', 'f43f5e', 'ef4444', 'f97316',
            'f59e0b', 'eab308', '84cc16', '22c55e',
            '10b981', '14b8a6', '06b6d4', '0ea5e9'
        ];
        
        const hash = (company || 'unknown')
            .toLowerCase()
            .split('')
            .reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
        
        return colors[Math.abs(hash) % colors.length];
    }

    getDefaultLogo(company, size = 32) {
        // Enhanced default logo generation
        const colors = {
            'A': '6366f1', 'B': '8b5cf6', 'C': 'a855f7', 'D': 'd946ef',
            'E': 'ec4899', 'F': 'f43f5e', 'G': 'ef4444', 'H': 'f97316',
            'I': 'f59e0b', 'J': 'eab308', 'K': '84cc16', 'L': '22c55e',
            'M': '10b981', 'N': '14b8a6', 'O': '06b6d4', 'P': '0ea5e9',
            'Q': '3b82f6', 'R': '6366f1', 'S': '8b5cf6', 'T': 'a855f7',
            'U': 'd946ef', 'V': 'ec4899', 'W': 'f43f5e', 'X': 'ef4444',
            'Y': 'f97316', 'Z': 'f59e0b'
        };
        
        const firstLetter = (company || 'A').charAt(0).toUpperCase();
        const background = colors[firstLetter] || '6366f1';
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(company || 'Unknown')}&background=${background}&color=fff&size=${size}&bold=true&format=svg`;
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters')?.addEventListener('click', () => this.clearFilters());
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.debounce(() => this.applyFilters(), 300)();
        });

        // Autosuggest inputs
        this.bindAutosuggest('companyInput', () => [...new Set(this.offers.map(o => o.company))]);
        this.bindAutosuggest('locationInput', () => [...new Set(this.offers.map(o => o.location))]);
        this.bindAutosuggest('roleInput', () => [...new Set(this.offers.map(o => o.mapped_role))]);
        this.bindAutosuggest('interviewCompanyInput', () => [...new Set(this.offers.filter(o=>o.interview_exp!=='N/A').map(o => o.company))]);
        this.bindAutosuggest('interviewRoleInput', () => [...new Set(this.offers.filter(o=>o.interview_exp!=='N/A').map(o => o.mapped_role))]);
        this.bindAutosuggest('interviewYoeInput', () => ['Entry (0-1)', 'Mid (2-6)', 'Senior (7-10)', 'Senior + (11+)']);
        this.bindAutosuggest('techStackInput', () => Object.keys(this.techStackKeywords));
        this.bindAutosuggest('discussSearch', () => this.buildDiscussSearchCorpus());
        // Default discuss content
        this.renderDiscussList();

        // Range filters
        ['yoeMin', 'yoeMax', 'salaryMin', 'salaryMax'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                this.filters[id] = parseFloat(e.target.value) || 0;
                this.applyFilters();
            });
        });

        // Toggle advanced filters
        document.getElementById('toggleAdvancedFilters')?.addEventListener('click', () => {
            const row = document.getElementById('advancedFiltersRow');
            if (!row) return;
            const hidden = row.classList.contains('d-none');
            row.classList.toggle('d-none', !hidden);
        });

        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
        document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                this.handleTabSwitch(target);
            });
        });

        // Comparison functionality
        document.getElementById('clearComparison')?.addEventListener('click', () => this.clearComparison());

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());

        // Discuss filter buttons
        document.getElementById('searchDiscuss')?.addEventListener('click', () => this.renderDiscussList());
        document.getElementById('clearDiscuss')?.addEventListener('click', () => { const i=document.getElementById('discussSearch'); if(i){ i.value=''; } this.renderDiscussList(); });
    }

    populateAutosuggestCaches() {
        // noop for now; generators used on demand
    }

    applyFilters() {
        this.filteredOffers = this.offers.filter(offer => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableFields = [offer.company, offer.location, offer.role, offer.mapped_role];
                if (!searchableFields.some(field => field.toLowerCase().includes(searchTerm))) {
                    return false;
                }
            }

            // Company filter
            if (this.filters.company && !offer.company.toLowerCase().includes(this.filters.company.toLowerCase())) {
                return false;
            }

            // Location filter
            if (this.filters.location && !offer.location.toLowerCase().includes(this.filters.location.toLowerCase())) {
                return false;
            }

            // Role filter
            if (this.filters.role && !offer.mapped_role.toLowerCase().includes(this.filters.role.toLowerCase())) {
                return false;
            }

            // Experience range
            if (offer.yoe < this.filters.yoeMin || offer.yoe > this.filters.yoeMax) {
                return false;
            }

            // Salary range
            if (offer.total < this.filters.salaryMin || offer.total > this.filters.salaryMax) {
                return false;
            }

            // Interview experience filter
            if (this.filters.includeInterviewExp && offer.interview_exp === 'N/A') {
                return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.updateStats();
        this.renderCharts();
        this.renderTable();
    }

    clearFilters() {
        console.log('Clearing all filters...');
        
        // Reset all filters to default values
        this.filters = {
            search: '',
            company: '',
            location: '',
            role: '',
            yoeMin: 0,
            yoeMax: 30,
            salaryMin: 1,
            salaryMax: 200,
            includeInterviewExp: false
        };
        
        // Clear all autosuggest inputs
        ['searchInput', 'companyInput', 'locationInput', 'roleInput'].forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                // Clear value
                input.value = '';
                
                // Reset UI elements
                const wrapper = input.parentElement;
                if (wrapper) {
                    // Hide clear button
                    const clearBtn = wrapper.querySelector('.input-group-addon');
                    if (clearBtn) {
                        clearBtn.style.display = 'none';
                    }
                    
                    // Hide icon
                    const icon = wrapper.querySelector('.input-icon');
                    if (icon) {
                        icon.style.opacity = '0';
                    }
                    
                    // Hide suggestions

                    
                    // Remove suggestions class
                    wrapper.classList.remove('has-suggestions');
                }
                
                // Trigger events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Reset all form inputs and trigger events
        const inputs = [
            'searchInput',
            'companyInput',
            'locationInput',
            'roleInput',
            'interviewCompanyInput',
            'interviewRoleInput',
            'interviewYoeInput',
            'techStackInput'
        ];
        
        // Reset all input fields
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Clear value
                el.value = '';
                
                // Hide clear button
                const clearBtn = el.parentElement?.querySelector('.input-group-addon');
                if (clearBtn) {
                    clearBtn.style.display = 'none';
                }
                
                // Hide icon
                const icon = el.parentElement?.querySelector('.input-icon');
                if (icon) {
                    icon.style.opacity = '0';
                }
                
                // Hide suggestions
                // Trigger events to update UI
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Reset range inputs to defaults
        const ranges = {
            'yoeMin': '0',
            'yoeMax': '30',
            'salaryMin': '1',
            'salaryMax': '200'
        };
        
        Object.entries(ranges).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // Reset interview experience checkbox if it exists
        const interviewExpCheckbox = document.getElementById('includeInterviewExp');
        if (interviewExpCheckbox) {
            interviewExpCheckbox.checked = false;
        }

        // Reset all filter groups
        document.querySelectorAll('.filter-group').forEach(group => {
            group.classList.remove('has-suggestions');
        });

        // Refresh data and UI
        this.filteredOffers = [...this.offers];
        this.currentPage = 1;
        
        // Update UI
        this.applyFilters();
        this.updateStats();
        this.renderTable();
    }

    updateStats() {
        try {
            const totalOffers = this.filteredOffers.length;
            
            // Calculate average salary with validation
            const validSalaries = this.filteredOffers.filter(offer => typeof offer.total === 'number' && !isNaN(offer.total));
            const avgSalary = validSalaries.length > 0 ? 
                (validSalaries.reduce((sum, offer) => sum + offer.total, 0) / validSalaries.length).toFixed(1) : 0;
            
            // Get unique companies
            const totalCompanies = new Set(
                this.filteredOffers
                    .filter(offer => offer.company && typeof offer.company === 'string')
                    .map(offer => offer.company)
            ).size;
            
            // Update DOM safely
            const elements = {
                totalOffers: document.getElementById('totalOffers'),
                avgSalary: document.getElementById('avgSalary'),
                totalCompanies: document.getElementById('totalCompanies')
            };
            
            if (elements.totalOffers) elements.totalOffers.textContent = totalOffers.toLocaleString();
            if (elements.avgSalary) elements.avgSalary.textContent = avgSalary;
            if (elements.totalCompanies) elements.totalCompanies.textContent = totalCompanies.toLocaleString();
            
            // Update trends if data available
            if (totalOffers > 0) {
                const previousPeriodOffers = this.offers
                    .filter(o => new Date(o.creation_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                    .length;
                const trend = totalOffers > previousPeriodOffers ? 'up' : 'down';
                this.updateTrendIndicators(trend);
            }
            
            // Update last updated time
            this.updateLastUpdatedTime();
            
        } catch (error) {
            console.error('Error updating stats:', error);
            this.showError('Failed to update statistics. Some values may be incorrect.');
        }
    }

    updateTrendIndicators(trend) {
        const trendElements = document.querySelectorAll('.stat-trend');
        trendElements.forEach(el => {
            el.innerHTML = trend === 'up' ? 
                '<i class="fas fa-arrow-up text-success"></i> Trending Up' :
                '<i class="fas fa-arrow-down text-danger"></i> Trending Down';
        });
    }

    async updateLastUpdatedTime() {
        try {
            const response = await fetch('https://api.github.com/repos/kuutsav/leetcode-compensation/commits?sha=master&path=data&per_page=1');
            if (response.ok) {
                const commits = await response.json();
                const lastCommit = commits[0];
                const date = new Date(lastCommit.commit.committer.date);
                const timeAgo = this.getTimeAgo(date);
                document.getElementById('lastUpdated').textContent = timeAgo;
                const footer = document.getElementById('footerUpdated');
                if (footer) footer.textContent = `updated ${timeAgo} ↺`;
            }
        } catch (error) {
            document.getElementById('lastUpdated').textContent = 'Recently';
            const footer = document.getElementById('footerUpdated');
            if (footer) footer.textContent = 'updated recently ↺';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    renderCharts() {
        // Debounce chart rendering to prevent performance issues
        if (this.chartRenderTimeout) clearTimeout(this.chartRenderTimeout);
        
        this.chartRenderTimeout = setTimeout(() => {
            try {
                if (this.filteredOffers.length === 0) {
                    this.showNoDataMessage();
                    return;
                }
                
                // Render charts in parallel for better performance
                Promise.all([
                    this.renderSalaryDistributionChart(),
                    this.renderExperienceChart(),
                    this.renderCompanyComparisonChart(),
                    this.renderTopCompaniesChart()
                ]).catch(error => {
                    console.error('Chart rendering error:', error);
                    this.showError('Failed to render some charts. Please try refreshing the page.');
                });
            } catch (error) {
                console.error('Chart initialization error:', error);
                this.showError('Failed to initialize charts. Please check your browser console for details.');
            }
        }, 250); // Debounce time for chart rendering
    }

    showNoDataMessage() {
        ['salaryDistributionChart', 'experienceChart', 'companyComparisonChart', 'topCompaniesChart'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-chart-bar text-muted fa-3x mb-3"></i>
                        <h5 class="text-muted">No data available</h5>
                        <p class="text-muted">Try adjusting your filters to see the charts</p>
                    </div>
                `;
            }
        });
    }

    renderSalaryDistributionChart() {
        const salaryRanges = this.createSalaryRanges();
        const chartData = salaryRanges.map(range => ({
            name: `${range.min}-${range.max}`,
            y: range.count
        }));

        Highcharts.chart('salaryDistributionChart', {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
        title: { text: '' },
        xAxis: {
                categories: chartData.map(d => d.name),
                title: { text: 'Salary Range (LPA)' }
            },
            yAxis: {
                title: { text: 'Number of Offers' },
                gridLineColor: '#e2e8f0'
            },
            series: [{
                name: 'Offers',
                data: chartData.map(d => d.y),
                color: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#6366f1'],
                        [1, '#4f46e5']
                    ]
                },
                borderRadius: 8,
                borderWidth: 0
            }],
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true,
                        style: {
                            fontSize: '12px',
                            fontWeight: '600'
                        }
                    }
                }
            },
        legend: { enabled: false },
            credits: { enabled: false }
        });
    }

    renderExperienceChart() {
        const experienceData = this.getExperienceDistribution();
        const chartData = Object.entries(experienceData).map(([level, count]) => ({
            name: level,
            y: count
        }));

        Highcharts.chart('experienceChart', {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent'
            },
            title: { text: '' },
            series: [{
                name: 'Experience Level',
                data: chartData,
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc']
            }],
        plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.y}',
                        style: {
                            fontSize: '12px',
                            fontWeight: '600'
                        }
                    },
                    showInLegend: true
                }
            },
            credits: { enabled: false }
        });
    }

    renderCompanyComparisonChart() {
        const companyData = this.getCompanySalaryData();
        const chartData = companyData.map(company => ({
            name: company.name,
            data: [company.min, company.q1, company.median, company.q3, company.max]
        }));

        Highcharts.chart('companyComparisonChart', {
            chart: {
                type: 'boxplot',
                backgroundColor: 'transparent'
            },
        title: { text: '' },
        xAxis: {
                categories: chartData.map(d => d.name),
                labels: { rotation: -45 }
        },
        yAxis: {
                title: { text: 'Salary (LPA)' },
                gridLineColor: '#e2e8f0'
            },
            series: [{
                name: 'Salary Distribution',
                data: chartData.map(d => d.data),
                color: '#6366f1'
            }],
            credits: { enabled: false }
        });
    }

    renderTopCompaniesChart() {
        const topCompanies = this.getTopCompanies();
        const chartData = topCompanies.map(company => ({
            name: company.name,
            y: company.count
        }));

        Highcharts.chart('topCompaniesChart', {
            chart: {
                type: 'bar',
                backgroundColor: 'transparent'
            },
            title: { text: '' },
            xAxis: {
                categories: chartData.map(d => d.name)
        },
        yAxis: {
                title: { text: 'Number of Offers' },
                gridLineColor: '#e2e8f0'
        },
        series: [{
                name: 'Offers',
                data: chartData.map(d => d.y),
                color: {
                    linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
                    stops: [
                        [0, '#10b981'],
                        [1, '#059669']
                    ]
                }
            }],
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        style: {
                            fontSize: '12px',
                            fontWeight: '600'
                        }
                    }
                }
            },
            credits: { enabled: false }
        });
    }

    createSalaryRanges() {
        const ranges = [];
        for (let i = 0; i < 20; i++) {
            const min = i * 10;
            const max = min + 9;
            const count = this.filteredOffers.filter(offer => 
                offer.total >= min && offer.total <= max
            ).length;
            ranges.push({ min, max, count });
        }
        return ranges;
    }

    getExperienceDistribution() {
        const distribution = {};
        this.filteredOffers.forEach(offer => {
            const level = offer.mapped_yoe || 'Unknown';
            distribution[level] = (distribution[level] || 0) + 1;
        });
        return distribution;
    }

    getCompanySalaryData() {
        const companySalaries = {};
        this.filteredOffers.forEach(offer => {
            if (!companySalaries[offer.company]) {
                companySalaries[offer.company] = [];
            }
            companySalaries[offer.company].push(offer.total);
        });

        return Object.entries(companySalaries)
            .filter(([_, salaries]) => salaries.length >= 3)
            .map(([company, salaries]) => {
                const sorted = salaries.sort((a, b) => a - b);
        return {
                    name: company,
                    min: sorted[0],
                    q1: this.percentile(sorted, 25),
                    median: this.percentile(sorted, 50),
                    q3: this.percentile(sorted, 75),
                    max: sorted[sorted.length - 1]
                };
            })
            .sort((a, b) => b.median - a.median)
            .slice(0, 10);
    }

    getTopCompanies() {
        const companyCounts = {};
        this.filteredOffers.forEach(offer => {
            companyCounts[offer.company] = (companyCounts[offer.company] || 0) + 1;
        });

        return Object.entries(companyCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }

    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (upper >= sorted.length) return sorted[sorted.length - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }

    renderTable() {
        const container = document.getElementById('dataTableContainer');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredOffers.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No offers found</h5>
                    <p class="text-muted">Try adjusting your filters to see more results.</p>
                </div>
            `;
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th><i class="fas fa-building me-2"></i>Company</th>
                <th><i class="fas fa-briefcase me-2"></i>Role</th>
                <th><i class="fas fa-clock me-2"></i>Experience</th>
                <th><i class="fas fa-map-marker-alt me-2"></i>Location</th>
                <th><i class="fas fa-rupee-sign me-2"></i>Salary</th>
                <th><i class="fas fa-calendar me-2"></i>Date</th>
                <th><i class="fas fa-star me-2"></i>Interview</th>
                <th><i class="fas fa-balance-scale me-2"></i>Compare</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        pageData.forEach((offer, index) => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.style.animationDelay = `${index * 0.1}s`;
            
            const logo = this.getCompanyLogoUrl(offer.company, 'regular');
            
            row.innerHTML = `
                <td>
                    <div class="company-info">
                        ${logo.html}
                        <div>
                            <div class="company-name">${offer.company}</div>
                            <div class="company-location">${offer.location}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${offer.mapped_role}</div>
                    <small class="text-muted">${offer.role}</small>
                </td>
                <td>
                    <span class="badge bg-primary">${offer.yoe} years</span>
                    <div class="small text-muted">${offer.mapped_yoe}</div>
                </td>
                <td>${offer.location}</td>
                <td>
                    <div class="salary-amount">₹${this.formatSalary(offer.total)}</div>
                    <div class="salary-base">Base: ₹${this.formatSalary(offer.base)}</div>
                </td>
                <td>
                    <div class="small">${offer.creation_date}</div>
                </td>
                <td>
                    ${offer.interview_exp !== 'N/A' ? 
                        `<a href="${offer.interview_exp}" target="_blank" class="interview-badge">
                            <i class="fas fa-star"></i> Experience
                        </a>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary compare-btn" 
                            data-offer-id="${offer.id}"
                            onclick="app.toggleComparison('${offer.id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        container.innerHTML = '';
        container.appendChild(table);

        this.updatePaginationInfo();
    }

    toggleComparison(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (!offer) return;

        const existingIndex = this.comparisonOffers.findIndex(o => o.id === offerId);
        
        if (existingIndex >= 0) {
            this.comparisonOffers.splice(existingIndex, 1);
        } else if (this.comparisonOffers.length < 5) {
            this.comparisonOffers.push(offer);
        } else {
            this.showNotification('Maximum 5 offers can be compared', 'warning');
            return;
        }

        this.updateComparisonUI();
        this.renderTable(); // Re-render to update button states
    }

    calculateComparisonMetrics() {
        const salaries = this.comparisonOffers.map(o => o.total);
        const yoes = this.comparisonOffers.map(o => o.yoe);
        
        return {
            avgSalary: salaries.reduce((a, b) => a + b, 0) / salaries.length,
            salaryDiff: Math.max(...salaries) - Math.min(...salaries),
            avgYoe: (yoes.reduce((a, b) => a + b, 0) / yoes.length).toFixed(1),
            maxSalary: Math.max(...salaries),
            minSalary: Math.min(...salaries)
        };
    }

    renderComparisonChart() {
        const chartContainer = document.getElementById('comparisonChart');
        if (!chartContainer || this.comparisonOffers.length < 2) return;

        const chartData = this.comparisonOffers.map(offer => ({
            name: offer.company,
            y: offer.total,
            base: offer.base,
            bonus: offer.total - offer.base,
            color: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#6366f1'],
                    [1, '#4f46e5']
                ]
            }
        }));

        Highcharts.chart('comparisonChart', {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: 'Compensation Breakdown',
                style: {
                    fontSize: '16px',
                    fontWeight: '600'
                }
            },
            xAxis: {
                categories: chartData.map(d => d.name),
                crosshair: true
            },
            yAxis: {
                title: {
                    text: 'Total Compensation (LPA)'
                }
            },
            tooltip: {
                headerFormat: '<b>{point.x}</b><br/>',
                pointFormat: 'Base: ₹{point.base:,.1f} LPA<br/>Bonus & Others: ₹{point.bonus:,.1f} LPA<br/>Total: ₹{point.y:,.1f} LPA'
            },
            plotOptions: {
                column: {
                    borderRadius: 8,
                    dataLabels: {
                        enabled: true,
                        format: '₹{y:,.0f}',
                        style: {
                            fontWeight: '600'
                        }
                    }
                }
            },
            series: [{
                name: 'Total Compensation',
                data: chartData,
                colorByPoint: true
            }],
            credits: {
                enabled: false
            }
        });
    }

    exportComparison() {
        if (this.comparisonOffers.length === 0) {
            this.showNotification('No offers to export', 'warning');
            return;
        }

        const metrics = this.calculateComparisonMetrics();
        
        // Create export data
        const exportData = {
            timestamp: new Date().toISOString(),
            metrics: {
                averageSalary: metrics.avgSalary,
                salaryDifference: metrics.salaryDiff,
                averageExperience: metrics.avgYoe
            },
            offers: this.comparisonOffers.map(o => ({
                company: o.company,
                role: o.mapped_role,
                location: o.location,
                experience: o.yoe,
                totalCompensation: o.total,
                baseCompensation: o.base,
                date: o.creation_date
            }))
        };

        // Create download link
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "salary-comparison.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        this.showNotification('Comparison data exported successfully', 'success');
    }

    updateComparisonUI() {
        const container = document.getElementById('comparisonContainer');
        if (!container) return;

        if (this.comparisonOffers.length === 0) {
            container.innerHTML = `
                <div class="comparison-empty">
                    <i class="fas fa-chart-line"></i>
                    <h5>No Offers Selected for Comparison</h5>
                    <p class="text-muted">Select up to 5 offers from the table below to compare compensation packages</p>
                </div>
            `;
            return;
        }

        // Calculate comparison metrics
        const metrics = this.calculateComparisonMetrics();

        // Generate comparison HTML
        let comparisonHTML = `
            <div class="comparison-header">
                <div class="comparison-title">
                    <i class="fas fa-balance-scale"></i>
                    Comparing ${this.comparisonOffers.length} Offers
                </div>
                <div class="comparison-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="app.exportComparison()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.clearComparison()">
                        <i class="fas fa-trash"></i> Clear All
                    </button>
                </div>
            </div>
            <div class="comparison-grid">
        `;

        // Add comparison items
        comparisonHTML += this.comparisonOffers.map(offer => {
            const logo = this.getCompanyLogoUrl(offer.company, 'medium');
            return `
                <div class="comparison-item">
                    <div class="comparison-company">
                        ${logo.html}
                        <div class="comparison-company-info">
                            <div class="comparison-company-name">${offer.company}</div>
                            <div class="comparison-role">${offer.mapped_role}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.removeFromComparison('${offer.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="comparison-details">
                        <div class="comparison-detail">
                            <span class="comparison-detail-label">Experience</span>
                            <span class="comparison-detail-value">${offer.yoe} years</span>
                        </div>
                        <div class="comparison-detail">
                            <span class="comparison-detail-label">Location</span>
                            <span class="comparison-detail-value">${offer.location}</span>
                        </div>
                    </div>
                    
                    <div class="comparison-salary">
                        <div class="comparison-salary-total">₹${this.formatSalary(offer.total)} LPA</div>
                        <div class="comparison-salary-base">Base: ₹${this.formatSalary(offer.base)} LPA</div>
                    </div>
                </div>
            `;
        }).join('');

        comparisonHTML += `</div>`;

        // Add comparison metrics
        if (this.comparisonOffers.length >= 2) {
            comparisonHTML += `
                <div class="comparison-metrics">
                    <div class="comparison-metric">
                        <div class="h4 mb-0">₹${this.formatSalary(metrics.avgSalary)} LPA</div>
                        <div class="text-muted">Average Package</div>
                    </div>
                    <div class="comparison-metric">
                        <div class="h4 mb-0">₹${this.formatSalary(metrics.salaryDiff)} LPA</div>
                        <div class="text-muted">Package Difference</div>
                    </div>
                    <div class="comparison-metric">
                        <div class="h4 mb-0">${metrics.avgYoe} years</div>
                        <div class="text-muted">Average Experience</div>
                    </div>
                </div>
                <div class="comparison-chart" id="comparisonChart"></div>
            `;
        }

        container.innerHTML = comparisonHTML;

        // Render comparison chart if we have multiple offers
        if (this.comparisonOffers.length >= 2) {
            this.renderComparisonChart();
        }
    }

    removeFromComparison(offerId) {
        this.comparisonOffers = this.comparisonOffers.filter(o => o.id !== offerId);
        this.updateComparisonUI();
        this.renderTable();
    }

    clearComparison() {
        this.comparisonOffers = [];
        this.updateComparisonUI();
        this.renderTable();
    }

    updatePaginationInfo() {
        const totalPages = Math.ceil(this.filteredOffers.length / this.pageSize);
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, this.filteredOffers.length);

        document.getElementById('paginationInfo').textContent = 
            `Showing ${startItem}-${endItem} of ${this.filteredOffers.length} offers`;
        
        document.getElementById('currentPageInfo').textContent = 
            `${this.currentPage} of ${totalPages}`;

        // Update button states
        document.getElementById('prevPage').disabled = this.currentPage <= 1;
        document.getElementById('nextPage').disabled = this.currentPage >= totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredOffers.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    }

    handleTabSwitch(target) {
        switch (target) {
            case '#comparison-pane':
                this.renderComparisonTable();
                break;
            case '#interviews-pane':
                this.renderInterviewExperiences();
                break;
            case '#discuss-pane':
                this.renderLeetCodeDiscuss();
                break;
        }
    }

    renderComparisonTable() {
        const container = document.getElementById('comparisonTableContainer');
        if (!container) return;
        // Render comparison view
        if (this.filteredOffers.length === 0) {
            container.innerHTML = '<div class="text-muted p-3">No offers available.</div>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'table table-hover';
        table.innerHTML = '<thead><tr><th>Company</th><th>Role</th><th>YOE</th><th>Salary</th><th></th></tr></thead>';
        const tbody = document.createElement('tbody');
        this.filteredOffers.slice(0, this.pageSize).forEach(o=>{
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${o.company}</td><td>${o.mapped_role}</td><td>${o.yoe}</td><td>₹${this.formatSalary(o.total)}</td>
                <td><button class="btn btn-sm btn-outline-primary" onclick="app.toggleComparison('${o.id}')">Add</button></td>`;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    }

    renderInterviewExperiences() {
        const container = document.getElementById('interviewExperiencesContainer');
        if (!container) return;

        const interviewOffers = this.offers.filter(offer => offer.interview_exp !== 'N/A');
        
        if (interviewOffers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No interview experiences found</h5>
                    <p class="text-muted">Check back later for interview experiences.</p>
                </div>
            `;
            return;
        }

        // Render as a responsive 2-column grid for better visual density
        const experiences = interviewOffers.slice(0, 20).map((offer, index) => {
            const logo = this.getCompanyLogoUrl(offer.company, 'large');
            return `
                <div class="col-12 col-md-6 mb-3 fade-in interview-card" style="animation-delay: ${index * 0.06}s">
                    <div class="card h-100">
                        <div class="card-body d-flex gap-3">
                            ${logo.html}
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="card-title mb-1">
                                            <span class="company-name">${offer.company}</span> - 
                                            <span class="role-name">${offer.mapped_role}</span>
                                        </h6>
                                        <div class="text-muted small">
                                            <i class="fas fa-map-marker-alt me-1"></i>${offer.location}
                                            <i class="fas fa-clock me-1 ms-3"></i>${offer.yoe} years
                                            <i class="fas fa-calendar me-1 ms-3"></i>${offer.creation_date}
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <div class="salary-amount">₹${this.formatSalary(offer.total)}</div>
                                        <div class="salary-base">Base: ₹${this.formatSalary(offer.base)}</div>
                                    </div>
                                </div>
                                <div class="tech-stack-tags mt-3">
                                    ${this.generateTechStackTags(offer)}
                                </div>
                                <a href="${offer.interview_exp}" target="_blank" class="btn btn-primary btn-sm mt-3">
                                    <i class="fas fa-external-link-alt me-1"></i>Read Interview Experience
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        const experiencesHTML = `<div class="row">${experiences.join('')}</div>`;

        container.innerHTML = experiencesHTML;
    }

    generateTechStackTags(offer) {
        const tags = [];
        const text = `${offer.role} ${offer.mapped_role}`.toLowerCase();
        
        Object.entries(this.techStackKeywords).forEach(([tech, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(`<span class="tech-tag">${tech}</span>`);
            }
        });

        return tags.join('');
    }

    renderLeetCodeDiscuss() {
        const container = document.getElementById('discussContainer');
        if (!container) return;
        this.renderDiscussList();
    }

    async loadLeetCodeDiscuss() {
        // This would integrate with LeetCode's API
        // For now, we'll show a placeholder
        this.showNotification('LeetCode Discuss integration coming soon!', 'info');
    }

    bindAutosuggest(inputId, optionsFn) {
        const input = document.getElementById(inputId);
        if (!input) return;

        // For company fields, skip Typeahead for now and use a simple input
        // handler so the behavior matches the main search box.
        if (inputId === 'companyInput' || inputId === 'interviewCompanyInput') {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'input-group-addon';
            clearBtn.innerHTML = '<i class="fas fa-times clear-input"></i>';
            clearBtn.style.display = 'none';
            input.parentElement.appendChild(clearBtn);
            // Mark parent so CSS can show the addon only when intended
            input.parentElement.classList.add('has-addon');

            input.addEventListener('input', (e) => {
                const v = e.target.value.trim();
                // Toggle visibility via class so CSS controls layout
                if (v) {
                    input.parentElement.classList.add('has-addon');
                } else {
                    input.parentElement.classList.remove('has-addon');
                }
                // Apply company filter (do NOT mirror value into main search input)
                this.filters.company = v;
                this.debounce(() => this.applyFilters(), 200)();
            });

            clearBtn.addEventListener('click', () => {
                input.value = '';
                input.parentElement.classList.remove('has-addon');
                this.filters.company = '';
                this.applyFilters();
                input.focus();
            });

            return;
        }

        // Use native datalist suggestions instead of Bloodhound/typeahead

        // Initialize icon and clear button
        const inputWrapper = input.parentElement;
        const iconMap = {
            'companyInput': 'building',
            'locationInput': 'map-marker-alt',
            'roleInput': 'briefcase',
            'interviewCompanyInput': 'building',
            'interviewRoleInput': 'briefcase',
            'interviewYoeInput': 'clock',
            'techStackInput': 'code',
            'discussSearch': 'search'
        };

        // Add clear button only for discussSearch (company inputs are handled above)
        let clearBtn = null;
        if (inputId === 'discussSearch') {
            clearBtn = document.createElement('button');
            clearBtn.className = 'input-group-addon';
            clearBtn.innerHTML = '<i class="fas fa-times clear-input"></i>';
            clearBtn.style.display = 'none';
            inputWrapper.appendChild(clearBtn);
            // Mark parent so CSS displays addon only when we want it
            inputWrapper.classList.add('has-addon');
            // Initially hide until there's content
            inputWrapper.classList.remove('has-addon');
        }

        // Use native datalist suggestions when available, fallback to simple input behavior.
        // Populate a datalist element for this input to aid suggestions in browsers.
        const listId = `${inputId}-datalist`;
        let dataList = document.getElementById(listId);
        if (!dataList) {
            dataList = document.createElement('datalist');
            dataList.id = listId;
            document.body.appendChild(dataList);
            input.setAttribute('list', listId);
        }
        // Fill datalist options
        try {
            const options = optionsFn() || [];
            dataList.innerHTML = options.slice(0, 200).map(opt => `<option value="${opt}"></option>`).join('');
        } catch (e) {
            // ignore datalist failures
        }

        // Handle input changes
        input.addEventListener('input', () => {
            const value = input.value.trim();
            if (clearBtn) {
                if (value) inputWrapper.classList.add('has-addon');
                else inputWrapper.classList.remove('has-addon');
            }
        });

        // Clear button functionality (only if created)
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                inputWrapper.classList.remove('has-addon');
                input.focus();

                // Reset filters and trigger update
                if (inputId === 'discussSearch') {
                    this.renderDiscussList();
                } else {
                    const map = { 
                        companyInput: 'company', 
                        locationInput: 'location', 
                        roleInput: 'role',
                        interviewCompanyInput: 'company',
                        interviewRoleInput: 'role',
                        interviewYoeInput: 'yoe',
                        techStackInput: 'tech'
                    };
                    const key = map[inputId];
                    if (key) {
                        this.filters[key] = '';
                        if (['company', 'location', 'role'].includes(key)) {
                            this.filters.search = '';
                            if (document.getElementById('searchInput')) {
                                document.getElementById('searchInput').value = '';
                            }
                        }
                        this.applyFilters();
                    }
                }

                input.dispatchEvent(new Event('input'));
            });
        }

        // Handle Enter key to accept datalist suggestion / input value
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const map = { 
                    companyInput: 'company', 
                    locationInput: 'location', 
                    roleInput: 'role',
                    interviewCompanyInput: 'company',
                    interviewRoleInput: 'role',
                    interviewYoeInput: 'yoe',
                    techStackInput: 'tech',
                    discussSearch: 'discuss'
                };
                const key = map[inputId];
                if (key) {
                    const value = input.value.trim();
                    if (key === 'discuss') {
                        this.renderDiscussList();
                    } else {
                        this.filters[key] = value;
                        // Do not mirror or clear the main search input when using field-specific filters.
                        // The main search is independent; we only set the specific filter here.
                        this.applyFilters();
                    }
                }
            }
        });
    }

    getSuggestionIcon(inputId, value) {
        const iconMap = {
            companyInput: 'building',
            locationInput: 'map-marker-alt',
            roleInput: 'briefcase',
            interviewCompanyInput: 'building',
            interviewRoleInput: 'briefcase',
            interviewYoeInput: 'clock',
            techStackInput: 'code',
            discussSearch: 'search'
        };
        return iconMap[inputId] || 'tag';
    }

    getSuggestionMeta(inputId, value) {
        if (inputId.includes('company')) {
            const count = this.offers.filter(o => o.company === value).length;
            return `${count} offers`;
        }
        if (inputId.includes('role')) {
            const avg = this.getAverageSalary(value);
            return avg ? `Avg: ₹${this.formatSalary(avg)} LPA` : '';
        }
        if (inputId === 'locationInput') {
            const count = this.offers.filter(o => o.location === value).length;
            return `${count} positions`;
        }
        return '';
    }

    getAverageSalary(role) {
        const salaries = this.offers
            .filter(o => o.mapped_role === role)
            .map(o => o.total);
        if (salaries.length === 0) return null;
        return salaries.reduce((a, b) => a + b, 0) / salaries.length;
    }

    buildDiscussSearchCorpus() {
        // Use company names, roles, locations and tech keywords as proxy corpus
        const corpus = new Set();
        this.offers.forEach(o=>{ corpus.add(o.company); corpus.add(o.location); corpus.add(o.mapped_role); });
        Object.keys(this.techStackKeywords).forEach(t=>corpus.add(t));
        return [...corpus];
    }

    renderDiscussList() {
        const container = document.getElementById('discussContainer');
        if (!container) return;
        const q = (document.getElementById('discussSearch')?.value || '').trim().toLowerCase();
        const sort = document.getElementById('discussSort')?.value || 'recent';
        // Pretend data: derive from offers as pseudo posts
        let items = this.offers.slice(0, 200).map(o => ({
            id: o.id,
            company: o.company,
            logo: this.getCompanyLogoUrl(o.company, 'small').primary,
            title: `${o.company} • ${o.mapped_role} • ${o.location}`,
            meta: `${o.creation_date} • YOE ${o.yoe}`,
            score: Math.round(o.total * 10) // pseudo popularity
        }));
        if (q.length >= 3) items = items.filter(it => it.title.toLowerCase().includes(q));
        if (sort === 'popular' || sort === 'votes') items.sort((a,b)=>b.score-a.score);
        // Render discuss cards with logo and two-per-row on medium screens
        container.innerHTML = `
            <div class="row">
                ${items.slice(0, 30).map(it=>`
                    <div class="col-12 col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-body d-flex gap-3 align-items-start">
                                <img src="${it.logo}" alt="${it.company} logo" class="company-logo-sm rounded me-2" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(it.company)}&background=6366f1&color=fff&size=64'">
                                <div class="flex-grow-1">
                                    <h6 class="card-title mb-1">${it.title}</h6>
                                    <p class="text-muted small mb-0">${it.meta}</p>
                                </div>
                                <div class="ms-2">
                                    ${(() => {
                                        // find matching offer to get original url if present
                                        const o = this.offers.find(x => x.id === it.id && x.company === it.company);
                                        if (o && o.interview_exp && o.interview_exp !== 'N/A') {
                                            return `<a href="${o.interview_exp}" target="_blank" class="btn btn-sm btn-outline-primary">Read</a>`;
                                        }
                                        // Fallback: create a canonical discuss URL using the offer id if available
                                        if (it.id) {
                                            const fallbackUrl = `https://leetcode.com/discuss/compensation/${encodeURIComponent(it.id)}`;
                                            return `<a href="${fallbackUrl}" target="_blank" class="btn btn-sm btn-outline-secondary">Read</a>`;
                                        }
                                        return '';
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    initializeTheme() {
        const stored = localStorage.getItem('leetcomp_theme') || 'light';
        const themeToggle = document.getElementById('themeToggle');
        
        // Set initial theme
        this.setTheme(stored === 'dark');
        
        // Set toggle state
        if (themeToggle) {
            themeToggle.checked = stored === 'dark';
            themeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }
    }

    toggleTheme(isDark) {
        this.setTheme(isDark);
        localStorage.setItem('leetcomp_theme', isDark ? 'dark' : 'light');
    }

    setTheme(isDark) {
        // Update body class
        document.body.classList.toggle('dark', isDark);
        
        // Update chart theme
        const theme = {
            chart: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                style: {
                    color: isDark ? '#e2e8f0' : '#1e293b'
                }
            },
            title: {
                style: { color: isDark ? '#e2e8f0' : '#1e293b' }
            },
            subtitle: {
                style: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            xAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: { style: { color: isDark ? '#94a3b8' : '#64748b' } },
                lineColor: isDark ? '#2d3748' : '#e2e8f0',
                tickColor: isDark ? '#2d3748' : '#e2e8f0'
            },
            yAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: { style: { color: isDark ? '#94a3b8' : '#64748b' } }
            },
            legend: {
                itemStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
                itemHoverStyle: { color: isDark ? '#ffffff' : '#000000' }
            },
            plotOptions: {
                series: {
                    borderRadius: 8,
                    opacity: isDark ? 0.8 : 1
                }
            },
            colors: isDark ? 
                ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#22c55e'] :
                ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#10b981']
        };
        
        Highcharts.setOptions(theme);
        
        // Re-render all charts with new theme
        requestAnimationFrame(() => {
            this.renderCharts();
            if (this.comparisonOffers.length >= 2) {
                this.renderComparisonChart();
            }
        });
    }

    updateChartTheme(isDark) {
        const theme = {
            colors: isDark ? 
                ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#22c55e'] :
                ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#10b981'],
            chart: {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                style: {
                    color: isDark ? '#e2e8f0' : '#1e293b'
                }
            },
            title: {
                style: { color: isDark ? '#e2e8f0' : '#1e293b' }
            },
            subtitle: {
                style: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            xAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: { style: { color: isDark ? '#94a3b8' : '#64748b' } },
                lineColor: isDark ? '#2d3748' : '#e2e8f0',
                tickColor: isDark ? '#2d3748' : '#e2e8f0'
            },
            yAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: { style: { color: isDark ? '#94a3b8' : '#64748b' } }
            },
            legend: {
                itemStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
                itemHoverStyle: { color: isDark ? '#ffffff' : '#000000' }
            },
            plotOptions: {
                series: {
                    borderRadius: 8,
                    opacity: isDark ? 0.8 : 1
                }
            }
        };
        
        Highcharts.setOptions(theme);
    }

    updateChartTheme() {
        const isDark = document.body.classList.contains('dark');
        
        // Update Highcharts theme
        Highcharts.theme = {
            colors: ['#6366f1', '#818cf8', '#c084fc', '#f472b6', '#10b981'],
            chart: {
                backgroundColor: isDark ? '#1a1c2c' : '#ffffff',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                style: {
                    color: isDark ? '#e2e8f0' : '#1e293b'
                }
            },
            subtitle: {
                style: {
                    color: isDark ? '#94a3b8' : '#64748b'
                }
            },
            xAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: {
                    style: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                },
                lineColor: isDark ? '#2d3748' : '#e2e8f0',
                tickColor: isDark ? '#2d3748' : '#e2e8f0'
            },
            yAxis: {
                gridLineColor: isDark ? '#2d3748' : '#e2e8f0',
                labels: {
                    style: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                }
            },
            legend: {
                itemStyle: {
                    color: isDark ? '#e2e8f0' : '#1e293b'
                },
                itemHoverStyle: {
                    color: isDark ? '#ffffff' : '#000000'
                }
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    borderRadius: 8
                }
            }
        };
        
        // Apply the theme
        Highcharts.setOptions(Highcharts.theme);
    }

    formatSalary(amount) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }).format(amount);
    }

    showNotification(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    showError(message) {
        // Show error notification
        this.showNotification(message, 'error');
        
        // Also show error in the main container
        const container = document.querySelector('.main-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <div class="alert alert-danger m-3" role="alert">
                    <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error</h4>
                    <p class="mb-0">${message}</p>
                    <hr>
                    <p class="mb-0">
                        <button class="btn btn-outline-danger btn-sm" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt me-1"></i>Refresh Page
                        </button>
                    </p>
                </div>
            `;
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    initializeAnimations() {
        // Initialize AOS animations for elements
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LeetCodeCompensationTracker();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeetCodeCompensationTracker;
}