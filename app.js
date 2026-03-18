// Earbud Tracker Application
class EarbudTracker {
    constructor() {
        this.earbuds = JSON.parse(localStorage.getItem('earbuds')) || [];
        this.images = JSON.parse(localStorage.getItem('earbudImages')) || {};
        this.initializeEventListeners();
        this.showTab('report-lost');
        this.updateRecentReports();
        this.updateStats();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showTab(btn.dataset.tab));
        });

        // Form submission
        document.getElementById('lost-form').addEventListener('submit', (e) => this.handleLostForm(e));
        
        // Search button
        document.getElementById('search-btn').addEventListener('click', () => this.searchEarbuds());
        document.getElementById('search-term').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchEarbuds();
        });
        
        // Delete history button
        document.getElementById('delete-history').addEventListener('click', () => this.confirmDeleteHistory());
        
        // Filter input
        document.getElementById('filterLost')?.addEventListener('input', (e) => this.filterLostEarbuds(e.target.value));
        document.getElementById('clearFilter')?.addEventListener('click', () => {
            document.getElementById('filterLost').value = '';
            this.updateFoundEarbudsList();
        });
    }

    // Show a specific tab
    showTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === tabId);
        });

        if (tabId === 'report-found') {
            this.updateFoundEarbudsList();
        }
        
        if (tabId === 'gallery') {
            this.animateGallery();
        }
    }

    // Handle lost earbuds form submission
    handleLostForm(e) {
        e.preventDefault();
        
        const brand = document.getElementById('brand').value.trim();
        const color = document.getElementById('color').value.trim();
        const location = document.getElementById('location').value.trim();
        const imageFile = document.getElementById('earbudImage').files[0];

        if (!brand || !color || !location) {
            this.showToast('Please fill in all fields to report lost earbuds.', 'error');
            return;
        }

        const id = 'eb-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        
        const earbud = {
            id,
            brand,
            color,
            location,
            dateReported: new Date().toISOString(),
            isFound: false,
            hasImage: !!imageFile
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.images[id] = e.target.result;
                localStorage.setItem('earbudImages', JSON.stringify(this.images));
                this.completeReport(earbud);
            };
            reader.readAsDataURL(imageFile);
        } else {
            this.completeReport(earbud);
        }
    }
    
    completeReport(earbud) {
        this.earbuds.unshift(earbud);
        this.saveToLocalStorage();
        this.updateRecentReports();
        this.updateStats();
        this.showToast(`✅ Successfully reported ${earbud.brand} (${earbud.color}) earbuds as lost at ${earbud.location}.`, 'success');
        
        document.getElementById('lost-form').reset();
    }

    // Update found earbuds list
    updateFoundEarbudsList(filter = '') {
        const lostList = document.getElementById('lost-list');
        const lostEarbuds = this.earbuds.filter(earbud => !earbud.isFound);
        
        const filteredEarbuds = filter
            ? lostEarbuds.filter(earbud => 
                earbud.brand.toLowerCase().includes(filter.toLowerCase()) ||
                earbud.color.toLowerCase().includes(filter.toLowerCase())
              )
            : lostEarbuds;

        if (filteredEarbuds.length === 0) {
            lostList.innerHTML = '<p class="empty-message">🔍 No lost earbuds found matching your criteria.</p>';
            return;
        }

        lostList.innerHTML = filteredEarbuds.map(earbud => this.createEarbudCard(earbud)).join('');

        document.querySelectorAll('.found-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.markAsFound(e.target.closest('.found-btn').dataset.id));
        });
    }

    // Filter lost earbuds
    filterLostEarbuds(filter) {
        this.updateFoundEarbudsList(filter);
    }

    // Create earbud card HTML
    createEarbudCard(earbud) {
        const imageHtml = earbud.hasImage && this.images[earbud.id]
            ? `<div class="card-image"><img src="${this.images[earbud.id]}" alt="${earbud.brand}"></div>`
            : `<div class="card-image"><i class="fas fa-headphones"></i></div>`;
            
        return `
            <div class="earbud-card">
                ${imageHtml}
                <div class="card-content">
                    <div class="earbud-header">
                        <h3>${earbud.brand} (${earbud.color})</h3>
                        <span class="earbud-id">${earbud.id}</span>
                    </div>
                    <div class="earbud-details">
                        <p><i class="fas fa-map-marker-alt"></i> Lost at: ${earbud.location}</p>
                        <p><i class="fas fa-clock"></i> ${new Date(earbud.dateReported).toLocaleString()}</p>
                    </div>
                    <button class="btn btn-primary found-btn" data-id="${earbud.id}">
                        <i class="fas fa-check"></i> Mark as Found
                    </button>
                </div>
            </div>
        `;
    }

    // Mark earbuds as found
    markAsFound(id) {
        const earbud = this.earbuds.find(e => e.id === id);
        if (earbud) {
            earbud.isFound = true;
            earbud.dateFound = new Date().toISOString();
            this.saveToLocalStorage();
            this.updateFoundEarbudsList();
            this.updateRecentReports();
            this.updateStats();
            this.showToast(`🎉 Great news! ${earbud.brand} earbuds have been found!`, 'success');
        }
    }

    // Search for earbuds
    searchEarbuds() {
        const searchTerm = document.getElementById('search-term').value.trim().toLowerCase();
        const resultsContainer = document.getElementById('search-results');
        
        if (!searchTerm) {
            this.showToast('Please enter a search term to find lost earbuds.', 'warning');
            return;
        }

        const results = this.earbuds.filter(earbud => 
            !earbud.isFound && (
                earbud.brand.toLowerCase().includes(searchTerm) ||
                earbud.color.toLowerCase().includes(searchTerm) ||
                earbud.location.toLowerCase().includes(searchTerm)
            )
        );

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-message">🔍 No matching earbuds found.</p>';
            return;
        }

        resultsContainer.innerHTML = results.map(earbud => this.createEarbudCard(earbud)).join('');

        document.querySelectorAll('#search-results .found-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.markAsFound(e.target.closest('.found-btn').dataset.id));
        });
    }

    // Update recent reports
    updateRecentReports() {
        const recentContainer = document.getElementById('recent-reports');
        const recentEarbuds = [...this.earbuds]
            .sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported))
            .slice(0, 5);

        if (recentEarbuds.length === 0) {
            recentContainer.innerHTML = '<p class="empty-message">No recent reports.</p>';
            return;
        }

        recentContainer.innerHTML = recentEarbuds.map(earbud => {
            const imageHtml = earbud.hasImage && this.images[earbud.id]
                ? `<div class="card-image"><img src="${this.images[earbud.id]}" alt="${earbud.brand}" style="height: 80px;"></div>`
                : `<div class="card-image"><i class="fas fa-headphones" style="font-size: 2rem;"></i></div>`;
                
            return `
                <div class="earbud-card">
                    ${imageHtml}
                    <div class="card-content">
                        <div class="earbud-header">
                            <h3>${earbud.brand} (${earbud.color})</h3>
                        </div>
                        <div class="earbud-details">
                            <p><i class="fas fa-map-marker-alt"></i> ${earbud.location}</p>
                            <p><span class="status-badge ${earbud.isFound ? 'status-found' : 'status-lost'}">
                                ${earbud.isFound ? '✅ Found' : '🔴 Lost'}
                            </span></p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update stats
    updateStats() {
        const activeCount = this.earbuds.filter(e => !e.isFound).length;
        const foundCount = this.earbuds.filter(e => e.isFound).length;
        
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('foundCount').textContent = foundCount;
    }

    // Save to localStorage
    saveToLocalStorage() {
        localStorage.setItem('earbuds', JSON.stringify(this.earbuds));
    }

    // Clear history
    clearHistory() {
        this.earbuds = [];
        this.images = {};
        localStorage.removeItem('earbuds');
        localStorage.removeItem('earbudImages');
        this.updateRecentReports();
        this.updateFoundEarbudsList();
        this.updateStats();
        document.getElementById('search-results').innerHTML = '';
        this.showToast('All history has been cleared successfully.', 'success');
    }

    // Confirm delete history
    confirmDeleteHistory() {
        if (this.earbuds.length === 0) {
            this.showToast('There is no history to delete.', 'info');
            return;
        }
        
        if (confirm('⚠️ Are you sure you want to delete all history? This action cannot be undone.')) {
            this.clearHistory();
        }
    }

    // Animate gallery items
    animateGallery() {
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            item.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
            item.style.opacity = '0';
        });
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastTitle = toast.querySelector('.toast-title');
        const toastMessage = toast.querySelector('.toast-message');
        
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toastIcon.className = `fas ${icons[type]}`;
        toastTitle.textContent = titles[type];
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
        
        toast.querySelector('.toast-close').onclick = () => {
            toast.classList.remove('show');
            clearTimeout(this.toastTimeout);
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new EarbudTracker();
});
