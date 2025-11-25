// Earbud Tracker Application
class EarbudTracker {
    constructor() {
        this.earbuds = JSON.parse(localStorage.getItem('earbuds')) || [];
        this.initializeEventListeners();
        this.showTab('report-lost');
        this.updateRecentReports();
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
    }

    // Show a specific tab
    showTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === tabId);
        });

        // Update found earbuds list if on the found tab
        if (tabId === 'report-found') {
            this.updateFoundEarbudsList();
        }
    }

    // Handle lost earbuds form submission
    handleLostForm(e) {
        e.preventDefault();
        
        const brand = document.getElementById('brand').value.trim();
        const color = document.getElementById('color').value.trim();
        const location = document.getElementById('location').value.trim();

        if (!brand || !color || !location) {
            this.showToast('Please fill in all fields to report lost earbuds.', 'error');
            return;
        }

        const earbud = {
            id: 'eb-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            brand,
            color,
            location,
            dateReported: new Date().toISOString(),
            isFound: false
        };

        this.earbuds.unshift(earbud);
        this.saveToLocalStorage();
        this.updateRecentReports();
        this.showToast(`Successfully reported ${brand} (${color}) earbuds as lost at ${location}.`, 'success');
        
        // Reset form
        e.target.reset();
    }

    // Update the list of lost earbuds in the found tab
    updateFoundEarbudsList() {
        const lostList = document.getElementById('lost-list');
        const lostEarbuds = this.earbuds.filter(earbud => !earbud.isFound);

        if (lostEarbuds.length === 0) {
            lostList.innerHTML = '<p class="empty-message">No lost earbuds reported yet.</p>';
            return;
        }

        lostList.innerHTML = '';
        lostEarbuds.forEach(earbud => {
            const card = document.createElement('div');
            card.className = 'earbud-card';
            card.innerHTML = `
                <div class="earbud-header">
                    <h3>${earbud.brand} (${earbud.color})</h3>
                    <span class="earbud-id">ID: ${earbud.id}</span>
                </div>
                <p>Lost at: ${earbud.location}</p>
                <p class="meta">Reported: ${new Date(earbud.dateReported).toLocaleString()}</p>
                <button class="btn found-btn" data-id="${earbud.id}">
                    <i class="fas fa-check"></i> Mark as Found
                </button>
            `;
            lostList.appendChild(card);
        });

        // Add event listeners to found buttons
        document.querySelectorAll('.found-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.markAsFound(e.target.closest('.found-btn').dataset.id));
        });
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
            this.showToast('Earbuds marked as found!', 'success');
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
            resultsContainer.innerHTML = '<p class="empty-message">No matching earbuds found.</p>';
            return;
        }

        resultsContainer.innerHTML = results.map(earbud => `
            <div class="earbud-card">
                <h3>${earbud.brand} (${earbud.color})</h3>
                <p>Lost at: ${earbud.location}</p>
                <p>Reported: ${new Date(earbud.dateReported).toLocaleString()}</p>
                <p><span class="status-badge status-lost">Lost</span></p>
                <button class="btn found-btn" data-id="${earbud.id}">
                    <i class="fas fa-check"></i> Mark as Found
                </button>
            </div>
        `).join('');

        // Add event listeners to found buttons in search results
        document.querySelectorAll('#search-results .found-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.markAsFound(e.target.closest('.found-btn').dataset.id));
        });
    }

    // Update recent reports section
    updateRecentReports() {
        const recentContainer = document.getElementById('recent-reports');
        const recentEarbuds = [...this.earbuds]
            .sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported))
            .slice(0, 5);

        if (recentEarbuds.length === 0) {
            recentContainer.innerHTML = '<p class="empty-message">No recent reports.</p>';
            return;
        }

        recentContainer.innerHTML = recentEarbuds.map(earbud => `
            <div class="earbud-card">
                <h3>${earbud.brand} (${earbud.color})</h3>
                <p>${earbud.isFound ? 'Found' : 'Lost'} at: ${earbud.location}</p>
                <p class="meta">
                    <span class="status-badge ${earbud.isFound ? 'status-found' : 'status-lost'}">
                        ${earbud.isFound ? 'Found' : 'Lost'}
                    </span>
                    • Reported: ${new Date(earbud.dateReported).toLocaleString()}
                    ${earbud.isFound ? `• Found: ${new Date(earbud.dateFound).toLocaleString()}` : ''}
                </p>
            </div>
        `).join('');
    }

    // Save earbuds to localStorage
    saveToLocalStorage() {
        localStorage.setItem('earbuds', JSON.stringify(this.earbuds));
    }
    
    // Clear all earbud history
    clearHistory() {
        this.earbuds = [];
        this.saveToLocalStorage();
        this.updateRecentReports();
        this.updateFoundEarbudsList();
        document.getElementById('search-results').innerHTML = '';
        this.showToast('All history has been cleared successfully.', 'success');
    }
    
    // Show confirmation dialog before deleting history
    confirmDeleteHistory() {
        if (this.earbuds.length === 0) {
            this.showToast('There is no history to delete.', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
            this.clearHistory();
        }
    }

    // Show toast notification with icon and title
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastTitle = toast.querySelector('.toast-title');
        const toastMessage = toast.querySelector('.toast-message');
        const toastClose = toast.querySelector('.toast-close');
        
        // Set icon and colors based on type
        let iconClass = 'fa-check-circle';
        let titleText = 'Success';
        
        switch(type) {
            case 'error':
                iconClass = 'fa-exclamation-circle';
                titleText = 'Error';
                break;
            case 'warning':
                iconClass = 'fa-exclamation-triangle';
                titleText = 'Warning';
                break;
            case 'info':
                iconClass = 'fa-info-circle';
                titleText = 'Info';
                break;
            default:
                iconClass = 'fa-check-circle';
                titleText = 'Success';
        }
        
        // Update toast content
        toastIcon.className = `fas ${iconClass}`;
        toastTitle.textContent = titleText;
        toastMessage.textContent = message;
        
        // Set toast type class
        toast.className = `toast show ${type}`;
        
        // Auto-hide after delay
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.className = 'toast';
            }, 300);
        }, 5000);
        
        // Close button handler
        const closeHandler = () => {
            clearTimeout(this.toastTimeout);
            toast.classList.remove('show');
            setTimeout(() => {
                toast.className = 'toast';
            }, 300);
            toastClose.removeEventListener('click', closeHandler);
        };
        
        // Remove any existing listeners to prevent duplicates
        const newCloseBtn = toastClose.cloneNode(true);
        toastClose.parentNode.replaceChild(newCloseBtn, toastClose);
        newCloseBtn.addEventListener('click', closeHandler);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new EarbudTracker();
});
