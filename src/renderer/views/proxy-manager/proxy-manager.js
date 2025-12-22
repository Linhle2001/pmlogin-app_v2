// Proxy Manager JavaScript
class ProxyManager {
    constructor() {
        this.proxies = [];
        this.filteredProxies = [];
        this.selectedProxies = new Set();
        this.cu