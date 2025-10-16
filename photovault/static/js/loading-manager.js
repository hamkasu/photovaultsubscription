class LoadingManager {
    constructor() {
        this.activeOperations = new Map();
        this.operationCounter = 0;
        this.counterElement = null;
        this.init();
    }

    init() {
        const counter = document.createElement('div');
        counter.id = 'global-loading-counter';
        counter.className = 'loading-counter hidden';
        counter.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-count">0</span>
        `;
        document.body.appendChild(counter);
        this.counterElement = counter;
    }

    startLoading(operationName = 'operation') {
        const operationId = ++this.operationCounter;
        this.activeOperations.set(operationId, {
            name: operationName,
            startTime: Date.now()
        });
        this.updateCounter();
        return operationId;
    }

    stopLoading(operationId) {
        if (this.activeOperations.has(operationId)) {
            this.activeOperations.delete(operationId);
            this.updateCounter();
        }
    }

    updateCounter() {
        const count = this.activeOperations.size;
        const countElement = this.counterElement.querySelector('.loading-count');
        
        if (count > 0) {
            countElement.textContent = count;
            this.counterElement.classList.remove('hidden');
            this.counterElement.classList.add('visible');
        } else {
            this.counterElement.classList.remove('visible');
            setTimeout(() => {
                if (this.activeOperations.size === 0) {
                    this.counterElement.classList.add('hidden');
                }
            }, 300);
        }
    }

    getActiveOperations() {
        return Array.from(this.activeOperations.entries()).map(([id, data]) => ({
            id,
            ...data,
            duration: Date.now() - data.startTime
        }));
    }
}

const loadingManager = new LoadingManager();

window.startLoading = (name) => loadingManager.startLoading(name);
window.stopLoading = (id) => loadingManager.stopLoading(id);
window.getLoadingOperations = () => loadingManager.getActiveOperations();
