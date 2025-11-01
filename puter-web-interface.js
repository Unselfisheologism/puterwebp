/**
 * Puter Web Interface for Android Communication
 * This script provides a clean interface for Android apps to communicate with Puter.js
 */

class PuterWebInterface {
    constructor() {
        this.isInitialized = false;
        this.puter = window.puter;
        this.authInProgress = false;
        
        // Ensure puter is available
        if (!this.puter) {
            console.error('Puter SDK not found. Please ensure puter.js is loaded before this script.');
            return;
        }
        
        // Set up authentication callback
        this.puter.onAuth = (user) => {
            console.log('Puter auth callback received:', user);
            this.onAuthenticationSuccess(user);
        };
        
        // Add message listener for cross-origin communication
        this.setupMessageListener();
        
        this.isInitialized = true;
        console.log('PuterWebInterface initialized');
    }
    
    /**
     * Set up message listener for cross-origin communication
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Verify the origin to prevent unauthorized access
            // In a production app, you should verify the origin properly
            if (event.data && event.data.source === 'android-app') {
                this.handleAndroidMessage(event.data);
            }
        });
    }
    
    /**
     * Handle messages from Android app
     */
    handleAndroidMessage(data) {
        const { action, params } = data;
        
        switch(action) {
            case 'authenticate':
                this.authenticate();
                break;
            case 'executeOperation':
                this.executeOperation(params.operation, params.params);
                break;
            case 'checkAuthStatus':
                this.checkAuthStatus();
                break;
            case 'getUserInfo':
                this.getUserInfo();
                break;
            case 'signOut':
                this.signOut();
                break;
            default:
                console.error('Unknown action:', action);
                this.sendResponse('error', { message: `Unknown action: ${action}` });
        }
    }
    
    /**
     * Trigger Puter authentication
     */
    async authenticate() {
        try {
            if (!this.isInitialized) {
                throw new Error('PuterWebInterface not initialized');
            }
            
            console.log('Starting authentication process...');
            this.authInProgress = true;
            
            // Check if already authenticated
            const isAuthenticated = await this.puter.auth.isAuthenticated();
            if (isAuthenticated) {
                console.log('User already authenticated');
                const user = await this.puter.getUser();
                this.onAuthenticationSuccess(user);
                this.authInProgress = false;
                return;
            }
            
            // Start authentication process
            console.log('Calling puter.auth.signIn()');
            await this.puter.auth.signIn();
            console.log('puter.auth.signIn() completed');
        } catch (error) {
            console.error('Authentication error:', error);
            this.authInProgress = false;
            this.onAuthenticationError(error);
        }
    }
    
    /**
     * Execute a Puter operation
     */
    async executeOperation(operation, params) {
        try {
            if (!this.isInitialized) {
                throw new Error('PuterWebInterface not initialized');
            }
            
            let result;
            
            switch(operation) {
                case 'listFiles':
                    result = await this.puter.fs.ls(params.path || '/');
                    break;
                case 'writeFile':
                    result = await this.puter.fs.write(params.path, params.content);
                    break;
                case 'readFile':
                    result = await this.puter.fs.read(params.path);
                    break;
                case 'deleteFile':
                    result = await this.puter.fs.delete(params.path);
                    break;
                case 'createDir':
                    result = await this.puter.fs.mkdir(params.path);
                    break;
                case 'statFile':
                    result = await this.puter.fs.stat(params.path);
                    break;
                case 'uploadFile':
                    // params should include: path, fileData (base64 encoded), fileName
                    const fileData = this.base64ToArrayBuffer(params.fileData);
                    const fileBlob = new Blob([fileData], { type: params.mimeType || 'application/octet-stream' });
                    result = await this.puter.fs.upload(fileBlob, params.path, params.fileName);
                    break;
                case 'downloadFile':
                    result = await this.puter.fs.download(params.path);
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
            
            this.onOperationSuccess(operation, result);
            return result;
        } catch (error) {
            console.error(`Error in ${operation}:`, error);
            this.onOperationError(operation, error);
            throw error;
        }
    }
    
    /**
     * Check authentication status
     */
    async checkAuthStatus() {
        try {
            if (!this.isInitialized) {
                throw new Error('PuterWebInterface not initialized');
            }
            
            const isAuthenticated = await this.puter.auth.isAuthenticated();
            this.sendResponse('authStatus', { isAuthenticated });
            
            return isAuthenticated;
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.sendResponse('error', { message: error.message });
            throw error;
        }
    }
    
    /**
     * Get user information
     */
    async getUserInfo() {
        try {
            if (!this.isInitialized) {
                throw new Error('PuterWebInterface not initialized');
            }
            
            const isAuthenticated = await this.puter.auth.isAuthenticated();
            if (!isAuthenticated) {
                this.sendResponse('userInfo', null);
                return null;
            }
            
            const user = await this.puter.getUser();
            this.sendResponse('userInfo', user);
            
            return user;
        } catch (error) {
            console.error('Error getting user info:', error);
            this.sendResponse('error', { message: error.message });
            throw error;
        }
    }
    
    /**
     * Sign out from Puter
     */
    async signOut() {
        try {
            if (!this.isInitialized) {
                throw new Error('PuterWebInterface not initialized');
            }
            
            await this.puter.auth.signOut();
            this.sendResponse('signOut', { success: true });
        } catch (error) {
            console.error('Error signing out:', error);
            this.sendResponse('error', { message: error.message });
            throw error;
        }
    }
    
    /**
     * Handle successful authentication
     */
    onAuthenticationSuccess(user) {
        console.log('Authentication successful:', user);
        this.authInProgress = false;
        this.sendResponse('authSuccess', { user });
        
        // Also notify via Android interface if available
        if (window.Android && typeof window.Android.onPuterAuthSuccess === 'function') {
            try {
                console.log('Calling Android.onPuterAuthSuccess with user:', user);
                window.Android.onPuterAuthSuccess(JSON.stringify(user));
            } catch (error) {
                console.error('Error calling Android.onPuterAuthSuccess:', error);
            }
        } else {
            console.log('Android interface not available or onPuterAuthSuccess not a function');
            console.log('Available Android methods:', window.Android ? Object.getOwnPropertyNames(window.Android) : 'None');
        }
        
        // After a brief delay to ensure the Android app receives the callback,
        // redirect to the success page
        setTimeout(() => {
            // Check if we're in a WebView context (Android)
            if (window.Android) {
                // In Android WebView, we don't need to redirect the page
                // The Android app will handle the redirect
                console.log('Running in Android WebView - deferring redirect to Android app');
            } else {
                // For regular browsers, redirect to the success page
                window.location.href = 'success.html';
            }
        }, 1000); // 1 second delay to ensure callback is processed
    }
    
    /**
     * Handle authentication error
     */
    onAuthenticationError(error) {
        console.error('Authentication error:', error);
        this.authInProgress = false;
        this.sendResponse('authError', { error: error.message });
        
        // Also notify via Android interface if available
        if (window.Android && typeof window.Android.onPuterAuthError === 'function') {
            try {
                window.Android.onPuterAuthError(error.message);
            } catch (err) {
                console.error('Error calling Android.onPuterAuthError:', err);
            }
        }
    }
    
    /**
     * Handle successful operation
     */
    onOperationSuccess(operation, result) {
        console.log(`${operation} successful:`, result);
        this.sendResponse('operationSuccess', { operation, result: this.serializeResult(result) });
        
        // Also notify via Android interface if available
        if (window.Android && typeof window.Android.onPuterActionSuccess === 'function') {
            try {
                window.Android.onPuterActionSuccess(operation, JSON.stringify(this.serializeResult(result)));
            } catch (err) {
                console.error('Error calling Android.onPuterActionSuccess:', err);
            }
        }
    }
    
    /**
     * Handle operation error
     */
    onOperationError(operation, error) {
        console.error(`Error in ${operation}:`, error);
        this.sendResponse('operationError', { operation, error: error.message });
        
        // Also notify via Android interface if available
        if (window.Android && typeof window.Android.onPuterActionError === 'function') {
            try {
                window.Android.onPuterActionError(operation, error.message);
            } catch (err) {
                console.error('Error calling Android.onPuterActionError:', err);
            }
        }
    }
    
    /**
     * Send response back to Android
     */
    sendResponse(type, data) {
        // Send message to Android if available
        if (window.Android) {
            const response = { type, data, timestamp: Date.now() };
            // Using a generic method - Android side should handle different response types
            if (typeof window.Android.onPuterResponse === 'function') {
                try {
                    window.Android.onPuterResponse(JSON.stringify(response));
                } catch (err) {
                    console.error('Error calling Android.onPuterResponse:', err);
                }
            }
        }
        
        // Also send via postMessage for alternative communication
        window.postMessage({
            source: 'puter-web-interface',
            type,
            data,
            timestamp: Date.now()
        }, '*');
    }
    
    /**
     * Convert base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    /**
     * Serialize result for JSON transmission
     */
    serializeResult(result) {
        // Handle different types of results
        if (result instanceof Blob) {
            // For file content, we might want to convert to base64 or text depending on type
            return { type: 'blob', size: result.size, type: result.type };
        } else if (result && typeof result === 'object') {
            // Create a serializable version
            return JSON.parse(JSON.stringify(result, (key, value) => {
                // Skip functions and undefined values
                if (typeof value === 'function' || value === undefined) {
                    return undefined;
                }
                return value;
            }));
        }
        return result;
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.puterWebInterface = new PuterWebInterface();
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterWebInterface;
}
