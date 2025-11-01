# Android Integration Guide

This document explains how to integrate the Puter Authentication Web App with an Android application.

## Overview

The Puter Authentication Web App serves as a bridge between the Android app and the Puter.js SDK. It handles authentication popups and other Puter operations that cannot be directly handled in a WebView.

## Architecture

1. Android app loads the web app in a WebView
2. User interacts with the web app UI to authenticate with Puter
3. Web app opens authentication popup and handles the authentication flow
4. After successful authentication, web app calls Android interface methods
5. Android app receives callbacks and navigates to the main app flow

## WebView Configuration

The Android app must configure the WebView properly to support the web app:

```java
WebView webView = findViewById(R.id.puterWebView);
webView.getSettings().setJavaScriptEnabled(true);
webView.getSettings().setDomStorageEnabled(true);
webView.getSettings().setSupportMultipleWindows(true);
webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
webView.setWebChromeClient(new PuterWebChromeClient()); // Handles popup windows
webView.addJavascriptInterface(new AndroidInterface(), "Android"); // Communication interface
webView.loadUrl("https://puterwebp.vercel.app"); // Load the deployed web app
```

## Android Interface

The Android app must implement a JavaScript interface with these methods:

```java
public class AndroidInterface {
    @JavascriptInterface
    public void onPuterAuthSuccess(String userJson) {
        // Handle successful authentication
        // Parse userJson and store user information
        // Navigate to main app flow
    }
    
    @JavascriptInterface
    public void onPuterAuthError(String error) {
        // Handle authentication error
    }
    
    @JavascriptInterface
    public void onPuterActionSuccess(String operation, String result) {
        // Handle successful Puter operation
    }
    
    @JavascriptInterface
    public void onPuterActionError(String operation, String error) {
        // Handle Puter operation error
    }
    
    @JavascriptInterface
    public void onPuterResponse(String responseJson) {
        // Handle generic response
    }
}
```

## Authentication Flow

1. User opens the Android app and sees the authentication screen
2. Android loads the Puter Authentication Web App in a WebView
3. User clicks the "Authenticate with Puter" button in the web app
4. Web app opens authentication popup
5. User completes authentication in the popup
6. Popup closes automatically after successful authentication
7. Web app calls `window.Android.onPuterAuthSuccess(userJson)`
8. Android receives the callback and navigates to the main app flow

## Communication Methods

The web app provides several ways to communicate with the Android app:

### Direct Method Calls

The web app directly calls Android interface methods:
- `window.Android.onPuterAuthSuccess(userJson)`
- `window.Android.onPuterAuthError(error)`
- `window.Android.onPuterActionSuccess(operation, result)`
- `window.Android.onPuterActionError(operation, error)`
- `window.Android.onPuterResponse(responseJson)`

### PostMessage Communication

The web app also sends messages via `window.postMessage`:
```javascript
window.postMessage({
    source: 'puter-web-interface',
    type: 'authSuccess',
    data: { user }
}, '*');
```

## Web App API

The web app exposes these methods that Android can call:

### Authentication
```javascript
// Trigger authentication
window.puterWebInterface.authenticate();

// Check authentication status
window.puterWebInterface.checkAuthStatus();

// Get user information
window.puterWebInterface.getUserInfo();

// Sign out
window.puterWebInterface.signOut();
```

### File Operations
```javascript
// List files
window.puterWebInterface.executeOperation('listFiles', { path: '/' });

// Write file
window.puterWebInterface.executeOperation('writeFile', { 
    path: '/hello.txt', 
    content: 'Hello World' 
});

// Read file
window.puterWebInterface.executeOperation('readFile', { path: '/hello.txt' });

// Delete file
window.puterWebInterface.executeOperation('deleteFile', { path: '/hello.txt' });

// Create directory
window.puterWebInterface.executeOperation('createDir', { path: '/mydir' });

// Get file stats
window.puterWebInterface.executeOperation('statFile', { path: '/hello.txt' });
```

## Error Handling

The web app handles errors gracefully and reports them to the Android app:

1. Authentication errors are reported via `onPuterAuthError`
2. Operation errors are reported via `onPuterActionError`
3. Generic errors are reported via `onPuterResponse`

## Troubleshooting

### Common Issues

1. **Popups not opening**: Ensure `setSupportMultipleWindows(true)` and `setJavaScriptCanOpenWindowsAutomatically(true)` are set
2. **JavaScript interface not working**: Verify `@JavascriptInterface` annotation and method names match
3. **Authentication not completing**: Check that the web app properly calls Android interface methods after authentication

### Debugging Tips

1. Enable WebView debugging in Android:
```java
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```

2. Check logs for JavaScript errors:
```java
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        Log.d("WebView", consoleMessage.message() + " -- From line "
                + consoleMessage.lineNumber() + " of "
                + consoleMessage.sourceId());
        return super.onConsoleMessage(consoleMessage);
    }
});
```

## Security Considerations

1. Validate message origins to prevent unauthorized access
2. Sanitize all data passed between web app and Android app
3. Use HTTPS for all communications
4. Store sensitive information securely in Android app

## Updates and Maintenance

To update the web app:
1. Make changes to the web app files
2. Deploy to Vercel using `vercel` command
3. No changes needed in Android app (unless new features are added)

The web app can be updated independently of the Android app, allowing for easier maintenance and feature additions.