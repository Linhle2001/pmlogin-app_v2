// Proxy Pagination Manager
class ProxyPagination {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.allProxies = []; // Store all proxies data
        this.filteredProxies = []; // Store filtered proxies
        
        this.init();
    }

    init() {
        this.attachEvents();
        console.log('✅ ProxyPagination initialized');
    }

    // Calculate pagination values
    calculatePagination() {
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
    }

    // Get start index for current page
    getStartIndex() {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    // Get end index for current page
    getEndIndex() {
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.totalItems);
    }

    // Generate page numbers HTML
    generatePageNumbers() {
        let pages = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            pages += `<button class="pagination-page" data-page="1">1</button>`;
            if (startPage > 2) {
                pages += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages += `<button class="pagination-page ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Last page and ellipsis
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pages += `<span class="pagination-ellipsis">...</span>`;
            }
            pages += `<button class="pagination-page" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        return pages;
    }

    // Update pagination display
    updatePagination() {
        this.calculatePagination();
        
        // Update stats
        const startElement = document.getElementById('proxyShowingStart');
        const endElement = document.getElementById('proxyShowingEnd');
        const totalElement = document.getElementById('proxyTotalCount');
        
        if (startElement) startElement.textContent = this.getStartIndex();
        if (endElement) endElement.textContent = this.getEndIndex();
        if (totalElement) totalElement.textContent = this.totalItems;
        
        // Update page numbers
        const pagesContainer = document.getElementById('proxyPaginationPages');
        if (pagesContainer) {
            pagesContainer.innerHTML = this.generatePageNumbers();
            this.attachPageEvents();
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('proxyPrevPage');
        const nextBtn = document.getElementById('proxyNextPage');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    // Get current page data
    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredProxies.slice(startIndex, endIndex);
    }

    // Set data and update pagination
    setData(proxies, filteredProxies = null) {
        this.allProxies = proxies || [];
        this.filteredProxies = filteredProxies || this.allProxies;
        this.totalItems = this.filteredProxies.length;
        this.updatePagination();
    }

    // Go to specific page
    goToPage(page) {
        const newPage = parseInt(page);
        if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.updatePagination();
            this.onPageChange();
        }
    }

    // Go to previous page
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
            this.onPageChange();
        }
    }

    // Go to next page
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
            this.onPageChange();
        }
    }

    // Change items per page
    changeItemsPerPage(newItemsPerPage) {
        this.itemsPerPage = parseInt(newItemsPerPage);
        this.currentPage = 1; // Reset to first page
        this.updatePagination();
        this.onPageChange();
    }

    // Callback for page change (to be overridden)
    onPageChange() {
        // This method should be overridden to handle page changes
        console.log(`Page changed to ${this.currentPage}`);
        
        // Trigger custom event
        const event = new CustomEvent('proxyPageChanged', {
            detail: {
                currentPage: this.currentPage,
                itemsPerPage: this.itemsPerPage,
                data: this.getCurrentPageData()
            }
        });
        document.dispatchEvent(event);
    }

    // Attach event listeners
    attachEvents() {
        // Items per page selector
        const itemsPerPageSelect = document.getElementById('proxyItemsPerPage');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.changeItemsPerPage(e.target.value);
            });
        }
        
        // Previous button
        const prevBtn = document.getElementById('proxyPrevPage');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previousPage();
            });
        }
        
        // Next button
        const nextBtn = document.getElementById('proxyNextPage');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextPage();
            });
        }
    }

    // Attach events to page number buttons
    attachPageEvents() {
        const pageButtons = document.querySelectorAll('#proxyPaginationPages .pagination-page');
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });
    }

    // Reset pagination
    reset() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        this.allProxies = [];
        this.filteredProxies = [];
        this.updatePagination();
    }

    // Get pagination info
    getInfo() {
        return {
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            totalPages: this.totalPages,
            startIndex: this.getStartIndex(),
            endIndex: this.getEndIndex()
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProxyPagination;
} else {
    window.ProxyPagination = ProxyPagination;
}