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
            await this.loadData();
            this.setupEventListeners();
            this.populateAutosuggestCaches();
            this.updateStats();
            this.renderCharts();
            this.renderTable();
            this.initializeAnimations();
            this.initializeTheme();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            const response = await fetch('data/parsed_comps.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawOffers = await response.json();
            if (!Array.isArray(rawOffers)) {
                throw new Error('Invalid data format: Expected an array');
            }
            
            // Validate and clean data before deduplication
            const validOffers = rawOffers.filter(offer => {
                return offer && 
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
            });

            if (validOffers.length === 0) {
                throw new Error('No valid offers found in the data');
            }

            // Deduplicate based on unique combination of properties
            const uniqueKey = new Set();
            this.offers = validOffers.filter(offer => {
                const key = `${offer.company}_${offer.role}_${offer.location}_${offer.yoe}_${offer.total}_${offer.creation_date}`;
                if (uniqueKey.has(key)) return false;
                uniqueKey.add(key);
                return true;
            });
            
            // Sort by date (newest first)
            this.offers.sort((a, b) => {
                const dateA = new Date(a.creation_date);
                const dateB = new Date(b.creation_date);
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    return 0; // Invalid dates are treated equally
                }
                return dateB - dateA;
            });
            
            this.filteredOffers = [...this.offers];
            
            // Load and cache company logos
            await this.loadCompanyLogos();
            
            console.log(`Loaded ${this.offers.length} unique offers (${rawOffers.length - validOffers.length} invalid entries skipped)`);
            return true;
        } catch (error) {
            console.error('Data loading error:', error);
            this.showError(`Failed to load compensation data: ${error.message}`);
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

        // Reset form inputs
        document.getElementById('searchInput').value = '';
        ['companyInput','locationInput','roleInput','interviewCompanyInput','interviewRoleInput','interviewYoeInput','techStackInput'].forEach(id=>{
            const el = document.getElementById(id); if (el) el.value='';
        });
        document.getElementById('yoeMin').value = '0';
        document.getElementById('yoeMax').value = '30';
        document.getElementById('salaryMin').value = '1';
        document.getElementById('salaryMax').value = '200';

        this.applyFilters();
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

    updateComparisonUI() {
        const container = document.getElementById('comparisonContainer');
        if (!container) return;

        if (this.comparisonOffers.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-mouse-pointer fa-2x mb-2"></i>
                    <p>Click on offers in the table below to add them to comparison</p>
                </div>
            `;
            return;
        }

        const comparisonHTML = this.comparisonOffers.map(offer => {
            const logo = this.getCompanyLogoUrl(offer.company, 'medium');
            return `
                <div class="comparison-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-3">
                            ${logo.html}
                            <div>
                                <div class="company-name fw-bold">${offer.company}</div>
                                <div class="text-muted">${offer.mapped_role} • ${offer.yoe} years</div>
                                <div class="salary-amount">₹${this.formatSalary(offer.total)}</div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger comparison-remove-btn" onclick="app.removeFromComparison('${offer.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = comparisonHTML;
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

        const experiencesHTML = interviewOffers.slice(0, 20).map((offer, index) => {
            const logo = this.getCompanyLogoUrl(offer.company, 'large');
            return `
                <div class="card mb-3 fade-in interview-card" style="animation-delay: ${index * 0.1}s">
                    <div class="card-body">
                        <div class="d-flex gap-3 mb-3">
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
        }).join('');

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
        // Determine suggestions container id created in HTML next to inputs
        const suggestionsContainerId = inputId.endsWith('Input')
            ? inputId.replace('Input','Suggestions')
            : inputId === 'discussSearch' ? 'discussSearchSuggestions' : `${inputId}Suggestions`;
        const container = document.getElementById(suggestionsContainerId) || document.createElement('div');
        container.className = 'autosuggest-list';
        if (!container.id) container.id = suggestionsContainerId;
        if (!container.parentNode) input.parentNode.appendChild(container);

        const update = () => {
            const q = input.value.trim();
            if (q.length < 3) { container.innerHTML = ''; container.style.display = 'none'; return; }
            const items = optionsFn().filter(v => v && v.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
            if (items.length === 0) { container.innerHTML = ''; container.style.display = 'none'; return; }
            container.innerHTML = items.map(v=>`<div class="autosuggest-item" data-value="${v}">${v}</div>`).join('');
            container.style.display = 'block';
        };
        input.addEventListener('input', this.debounce(update, 150));
        input.addEventListener('focus', update);
        document.addEventListener('click', (e)=>{
            if (!container.contains(e.target) && e.target !== input) container.style.display='none';
        });
        container.addEventListener('click', (e)=>{
            const item = e.target.closest('.autosuggest-item');
            if (!item) return;
            input.value = item.getAttribute('data-value');
            container.style.display = 'none';
            // map input to filter key
            const map = { companyInput:'company', locationInput:'location', roleInput:'role', interviewCompanyInput:'company', interviewRoleInput:'role', interviewYoeInput:'yoe', techStackInput:'tech', discussSearch:'discuss'};
            const key = map[inputId];
            if (key === 'yoe') {
                // restrict by mapped_yoe using search filter
                this.filters.search = input.value;
            } else if (key && key !== 'discuss') {
                this.filters[key] = input.value;
            }
            if (inputId === 'discussSearch') {
                this.renderDiscussList();
            } else {
                this.applyFilters();
            }
        });
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
            title: `${o.company} • ${o.mapped_role} • ${o.location}`,
            meta: `${o.creation_date} • YOE ${o.yoe}`,
            score: Math.round(o.total * 10) // pseudo popularity
        }));
        if (q.length >= 3) items = items.filter(it => it.title.toLowerCase().includes(q));
        if (sort === 'popular' || sort === 'votes') items.sort((a,b)=>b.score-a.score);
        container.innerHTML = `
            <div class="row">
                ${items.slice(0, 30).map(it=>`
                    <div class="col-12 col-md-6 col-lg-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title mb-2">${it.title}</h6>
                                <p class="text-muted small">${it.meta}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    initializeTheme() {
        const stored = localStorage.getItem('leetcomp_theme') || 'light';
        const themeToggle = document.getElementById('themeToggle');
        
        if (stored === 'dark') {
            document.body.classList.add('dark');
            if (themeToggle) themeToggle.checked = true;
        }
        
        // Add event listener for toggle
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.toggleTheme(e.target.checked);
            });
        }
        
        this.updateChartTheme(stored === 'dark');
    }

    toggleTheme(isDark) {
        // Update body class
        document.body.classList.toggle('dark', isDark);
        
        // Store preference
        localStorage.setItem('leetcomp_theme', isDark ? 'dark' : 'light');
        
        // Update charts
        this.updateChartTheme(isDark);
        
        // Re-render charts after transition
        setTimeout(() => {
            this.renderCharts();
        }, 300);
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
        this.showNotification(message, 'error');
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
