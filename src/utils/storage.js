// Storage Management System
// Persistent state management with auto-save and error handling

class StorageManager {
    constructor() {
        this.storageKey = 'minusplus_canvas_data';
        this.backupKey = 'minusplus_canvas_backup';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.maxStorageSize = 5 * 1024 * 1024; // 5MB limit

        this.init();
    }

    init() {
        this.checkStorageSupport();
        this.startAutoSave();
        this.cleanupOldData();

        console.log('Storage manager initialized');
    }

    checkStorageSupport() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.isLocalStorageSupported = true;
        } catch (error) {
            console.warn('localStorage not supported:', error);
            this.isLocalStorageSupported = false;
        }
    }

    // Save complete canvas state
    saveCanvasState(canvasData) {
        if (!this.isLocalStorageSupported) {
            console.warn('Cannot save: localStorage not supported');
            return false;
        }

        try {
            const data = {
                timestamp: Date.now(),
                version: '1.0',
                viewport: canvasData.viewport || {},
                elements: this.serializeElements(canvasData.elements || []),
                metadata: {
                    elementCount: Array.isArray(canvasData.elements) ? canvasData.elements.length : 0,
                    lastModified: new Date().toISOString()
                }
            };

            const serialized = JSON.stringify(data);

            // Check size before saving
            if (serialized.length > this.maxStorageSize) {
                console.warn('Data too large for storage, compressing...');
                return this.saveCompressedState(data);
            }

            // Create backup of current data
            this.createBackup();

            // Save new data
            localStorage.setItem(this.storageKey, serialized);

            console.log(`Canvas state saved (${this.formatSize(serialized.length)})`);
            return true;

        } catch (error) {
            console.error('Failed to save canvas state:', error);

            if (error.name === 'QuotaExceededError') {
                return this.handleStorageQuotaExceeded();
            }

            return false;
        }
    }

    // Load canvas state from storage
    loadCanvasState() {
        if (!this.isLocalStorageSupported) {
            return null;
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) {
                console.log('No saved state found');
                return null;
            }

            const parsed = JSON.parse(data);

            // Validate data structure
            if (!this.validateSavedData(parsed)) {
                console.warn('Invalid saved data structure, trying backup...');
                return this.loadBackupState();
            }

            // Deserialize elements
            const elements = this.deserializeElements(parsed.elements || []);

            const state = {
                viewport: parsed.viewport,
                elements: elements
            };

            console.log(`Canvas state loaded: ${elements.length} elements`);
            return state;

        } catch (error) {
            console.error('Failed to load canvas state:', error);
            return this.loadBackupState();
        }
    }

    serializeElements(elements) {
        if (!Array.isArray(elements)) {
            return [];
        }

        return elements.map(element => ({
            id: element.id,
            worldX: element.worldX,
            worldY: element.worldY,
            text: element.text || '',
            calculation: element.calculation ? {
                type: element.calculation.type,
                result: element.calculation.result,
                formatted: element.calculation.formatted,
                numbers: element.calculation.numbers
            } : null,
            width: element.width || 120,
            height: element.height || 40,
            whiteSpace: element.whiteSpace || 'nowrap',
            overflowX: element.overflowX || 'auto',
            overflowY: element.overflowY || 'hidden',
            timestamp: Date.now()
        }));
    }

    deserializeElements(serializedElements) {
        if (!Array.isArray(serializedElements)) {
            return [];
        }

        return serializedElements
            .filter(element => this.validateElement(element))
            .map(element => ({
                id: element.id,
                worldX: element.worldX || 0,
                worldY: element.worldY || 0,
                text: element.text || '',
                calculation: element.calculation || null,
                width: element.width || 120,
                height: element.height || 40,
                whiteSpace: element.whiteSpace || 'nowrap',
                overflowX: element.overflowX || 'auto',
                overflowY: element.overflowY || 'hidden'
            }));
    }

    validateElement(element) {
        return element &&
            typeof element.id !== 'undefined' &&
            typeof element.worldX === 'number' &&
            typeof element.worldY === 'number';
    }

    validateSavedData(data) {
        return data &&
            typeof data.timestamp === 'number' &&
            typeof data.version === 'string' &&
            data.viewport &&
            Array.isArray(data.elements);
    }

    // Auto-save functionality
    startAutoSave() {
        if (!this.isLocalStorageSupported) {
            return;
        }

        this.autoSaveTimer = setInterval(() => {
            if (window.canvasApp && window.canvasApp.isDirty) {
                const state = window.canvasApp.getState();
                if (this.saveCanvasState(state)) {
                    window.canvasApp.isDirty = false;
                }
            }
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Backup management
    createBackup() {
        try {
            const currentData = localStorage.getItem(this.storageKey);
            if (currentData) {
                localStorage.setItem(this.backupKey, currentData);
            }
        } catch (error) {
            console.warn('Failed to create backup:', error);
        }
    }

    loadBackupState() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                const parsed = JSON.parse(backupData);
                if (this.validateSavedData(parsed)) {
                    console.log('Loaded from backup');
                    return {
                        viewport: parsed.viewport,
                        elements: this.deserializeElements(parsed.elements)
                    };
                }
            }
        } catch (error) {
            console.error('Failed to load backup:', error);
        }

        return null;
    }

    // Storage management
    handleStorageQuotaExceeded() {
        console.warn('Storage quota exceeded, attempting cleanup...');

        try {
            // Remove oldest elements to free space
            const data = this.loadCanvasState();
            if (data && data.elements.length > 100) {
                // Keep only the most recent 100 elements
                data.elements = data.elements.slice(-100);
                return this.saveCanvasState(data);
            }

            // If still failing, clear all data
            this.clearStorage();
            return false;
        } catch (error) {
            console.error('Failed to handle storage quota:', error);
            return false;
        }
    }

    saveCompressedState(data) {
        try {
            // Simple compression: remove unnecessary whitespace and round numbers
            const compressed = {
                ...data,
                elements: data.elements.map(el => ({
                    ...el,
                    worldX: Math.round(el.worldX * 100) / 100,
                    worldY: Math.round(el.worldY * 100) / 100,
                    text: el.text.trim()
                }))
            };

            const serialized = JSON.stringify(compressed);
            localStorage.setItem(this.storageKey, serialized);

            console.log('Compressed state saved');
            return true;
        } catch (error) {
            console.error('Failed to save compressed state:', error);
            return false;
        }
    }

    // Data management utilities
    getStorageInfo() {
        if (!this.isLocalStorageSupported) {
            return { supported: false };
        }

        try {
            const data = localStorage.getItem(this.storageKey);
            const backup = localStorage.getItem(this.backupKey);

            return {
                supported: true,
                hasData: !!data,
                hasBackup: !!backup,
                dataSize: data ? data.length : 0,
                backupSize: backup ? backup.length : 0,
                formattedDataSize: data ? this.formatSize(data.length) : '0 B',
                lastSaved: data ? new Date(JSON.parse(data).timestamp).toLocaleString() : null
            };
        } catch (error) {
            return { supported: true, error: error.message };
        }
    }

    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    cleanupOldData() {
        try {
            // Remove very old data format versions if they exist
            const oldKeys = ['calculator_data', 'canvas_state', 'minusplus_old'];
            oldKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Cleaned up old data: ${key}`);
                }
            });
        } catch (error) {
            console.warn('Failed to cleanup old data:', error);
        }
    }

    // Export/Import functionality
    exportState() {
        const data = this.loadCanvasState();
        if (!data) {
            return null;
        }

        return {
            ...data,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            app: 'MinusPlus Calculator'
        };
    }

    importState(importedData) {
        try {
            if (!importedData || !this.validateSavedData(importedData)) {
                throw new Error('Invalid import data');
            }

            // Create backup before importing
            this.createBackup();

            const success = this.saveCanvasState(importedData);
            if (success) {
                console.log('State imported successfully');
            }

            return success;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    // Clear all stored data
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);
            console.log('Storage cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    // Alias for clearing canvas state specifically
    clearCanvasState() {
        return this.clearStorage();
    }

    // Cleanup
    destroy() {
        this.stopAutoSave();
    }
}

export default StorageManager;
