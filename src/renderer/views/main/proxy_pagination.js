/**
 * ProxyPagination Manager
 * Sửa lỗi hiển thị sai số thứ tự (1 to 0 of 0) và mất dữ liệu khi đổi itemsPerPage
 */
class ProxyPagination {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.allProxies = []; 
        this.filteredProxies = []; 
        this.eventsAttached = false;
        
        this.init();
    }

    init() {
        if (!this.eventsAttached) {
            const prevBtn = document.getElementById('proxyPrevPage');
            const nextBtn = document.getElementById('proxyNextPage');
            const itemsPerPageSelect = document.getElementById('proxyItemsPerPage');
            
            if (prevBtn || nextBtn || itemsPerPageSelect) {
                this.attachEvents();
                this.eventsAttached = true;
            } else {
                setTimeout(() => this.init(), 100);
            }
        }
    }

    /**
     * Tính toán các giá trị phân trang dựa trên totalItems và itemsPerPage
     */
    calculatePagination() {
        const count = Number(this.totalItems) || 0;
        this.totalItems = count;

        this.totalPages = count > 0 ? Math.ceil(count / this.itemsPerPage) : 0;
        
        if (this.totalPages === 0) {
            this.currentPage = 1;
        } else if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        } else if (this.currentPage < 1) {
            this.currentPage = 1;
        }
    }

    getStartIndex() {
        if (this.totalItems <= 0) return 0;
        return (this.currentPage - 1) * this.itemsPerPage + 1;
    }

    getEndIndex() {
        if (this.totalItems <= 0) return 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        return Math.min(endIndex, this.totalItems);
    }

    /**
     * Tạo HTML cho các nút số trang
     */
    generatePageNumbers() {
        // Nếu không có trang nào, không hiển thị gì
        if (this.totalPages <= 0) return '';
        
        // Nếu chỉ có 1 trang, hiển thị nút "1" active
        if (this.totalPages === 1) {
            return `<button class="pagination-page active" data-page="1">1</button>`;
        }
        
        let pages = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            pages += `<button class="pagination-page" data-page="1">1</button>`;
            if (startPage > 2) pages += `<span class="pagination-ellipsis">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages += `<button class="pagination-page ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) pages += `<span class="pagination-ellipsis">...</span>`;
            pages += `<button class="pagination-page" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        return pages;
    }

    /**
     * Cập nhật hiển thị giao diện phân trang
     */
    updatePagination() {
        this.calculatePagination();
        
        const startElement = document.getElementById('proxyShowingStart');
        const endElement = document.getElementById('proxyShowingEnd');
        const totalElement = document.getElementById('proxyTotalCount');
        
        if (startElement) startElement.textContent = this.getStartIndex();
        if (endElement) endElement.textContent = this.getEndIndex();
        if (totalElement) totalElement.textContent = this.totalItems;
        
        const pagesContainer = document.getElementById('proxyPaginationPages');
        if (pagesContainer) {
            pagesContainer.innerHTML = this.generatePageNumbers();
            this.attachPageEvents();
        }
        
        // Cập nhật trạng thái disable/enable cho nút Trước và Sau
        const prevBtn = document.getElementById('proxyPrevPage');
        const nextBtn = document.getElementById('proxyNextPage');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1 || this.totalPages <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages || this.totalPages <= 1;
        }
        
        // Đảm bảo event handlers luôn được attach
        this.attachEvents();
    }

    /**
     * Trả về mảng dữ liệu của trang hiện tại
     */
    getCurrentPageData() {
        if (!Array.isArray(this.filteredProxies)) {
            return [];
        }
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredProxies.slice(startIndex, endIndex);
    }

    /**
     * Thiết lập dữ liệu. 
     * @param {Array} proxies - Tất cả proxy
     * @param {Array} filteredProxies - Proxy sau khi lọc
     * @param {Boolean} resetPage - Có reset về trang 1 hay không (Mặc định: true)
     */
    setData(proxies, filteredProxies = null, resetPage = true) {
        this.allProxies = Array.isArray(proxies) ? proxies : [];
        
        if (filteredProxies === null) {
            this.filteredProxies = [...this.allProxies];
        } else {
            this.filteredProxies = Array.isArray(filteredProxies) ? filteredProxies : [];
        }
        
        this.totalItems = this.filteredProxies.length;
        
        if (resetPage) {
            this.currentPage = 1; 
        }
        
        this.updatePagination();
    }

    goToPage(page) {
        const newPage = parseInt(page);
        if (isNaN(newPage) || newPage < 1 || newPage > this.totalPages) {
            return;
        }
        
        // Chỉ cập nhật nếu trang thay đổi
        if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.updatePagination();
            // Gọi onPageChange để trigger render proxies của trang mới
            this.onPageChange();
        }
    }

    /**
     * Thay đổi số lượng item trên mỗi trang
     */
    changeItemsPerPage(newItemsPerPage) {
        const newItems = parseInt(newItemsPerPage);
        if (isNaN(newItems) || newItems < 1) return;
        
        this.itemsPerPage = newItems;
        this.currentPage = 1; 
        
        // FIX: Chỉ cập nhật totalItems từ mảng nếu mảng có dữ liệu.
        // Nếu mảng trống (do chưa kịp đồng bộ), giữ nguyên totalItems hiện tại.
        if (Array.isArray(this.filteredProxies) && this.filteredProxies.length > 0) {
            this.totalItems = this.filteredProxies.length;
        }
        
        this.updatePagination();
        this.onPageChange(); 
    }

    /**
     * Sự kiện khi trang thay đổi (sẽ được override bởi ProxyManager)
     */
    onPageChange() {
        const event = new CustomEvent('proxyPageChanged', {
            detail: {
                currentPage: this.currentPage,
                itemsPerPage: this.itemsPerPage,
                data: this.getCurrentPageData()
            }
        });
        document.dispatchEvent(event);
    }

    attachEvents() {
        const itemsPerPageSelect = document.getElementById('proxyItemsPerPage');
        if (itemsPerPageSelect && !itemsPerPageSelect.dataset.paginationAttached) {
            itemsPerPageSelect.addEventListener('change', (e) => this.changeItemsPerPage(e.target.value));
            itemsPerPageSelect.dataset.paginationAttached = 'true';
        }
        
        const prevBtn = document.getElementById('proxyPrevPage');
        if (prevBtn && !prevBtn.dataset.paginationAttached) {
            // Handler function để xử lý click
            const handlePrevClick = (e) => {
                // Tìm button cha nếu click vào phần tử con
                const button = e.target.closest('#proxyPrevPage') || e.currentTarget;
                
                if (button.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                // Chuyển tới trang trước nếu có thể
                if (this.currentPage > 1) {
                    const newPage = this.currentPage - 1;
                    this.goToPage(newPage);
                }
            };
            
            // Attach event listener lên button
            prevBtn.addEventListener('click', handlePrevClick);
            
            // Attach event listener trực tiếp lên các phần tử con (span, icon)
            const prevBtnChildren = prevBtn.querySelectorAll('span, i');
            prevBtnChildren.forEach(child => {
                child.addEventListener('click', handlePrevClick);
                // Đảm bảo pointer events hoạt động
                child.style.pointerEvents = 'auto';
                child.style.cursor = 'pointer';
            });
            
            // Bắt sự kiện hover cho button và các phần tử con
            prevBtn.addEventListener('mouseenter', (e) => {
                if (!prevBtn.disabled) {
                    prevBtn.style.cursor = 'pointer';
                    // Áp dụng cursor cho các phần tử con
                    prevBtnChildren.forEach(child => {
                        child.style.cursor = 'pointer';
                    });
                }
            });
            
            prevBtn.addEventListener('mouseleave', (e) => {
                prevBtn.style.cursor = '';
            });
            
            prevBtn.dataset.paginationAttached = 'true';
        }
        
        const nextBtn = document.getElementById('proxyNextPage');
        if (nextBtn && !nextBtn.dataset.paginationAttached) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    const newPage = this.currentPage + 1;
                    this.goToPage(newPage);
                }
            });
            nextBtn.dataset.paginationAttached = 'true';
        }
    }

    attachPageEvents() {
        // Page number buttons
        const pageButtons = document.querySelectorAll('#proxyPaginationPages .pagination-page');
        pageButtons.forEach(button => {
            if (button.dataset.paginationAttached) return;
            
            button.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page || button.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.goToPage(page);
                }
            });
            button.dataset.paginationAttached = 'true';
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProxyPagination;
} else {
    window.ProxyPagination = ProxyPagination;
}