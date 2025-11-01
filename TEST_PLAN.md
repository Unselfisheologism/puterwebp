# Testing Plan for Puter Authentication Flow

This document outlines how to test the authentication flow between the Android app and the Puter web app.

## Prerequisites

1. The web app is deployed to `https://puter-auth-demo-blurr.vercel.app`
2. Android app with updated WebView activities
3. Device or emulator with internet connectivity

## Test Steps

### 1. Initial Setup Test
1. Launch the Android app
2. Navigate to the Puter WebView activity
3. Verify that the login button is visible
4. Click the login button
5. Verify that the web app loads in the WebView

### 2. Authentication Flow Test
1. Once the web app loads, locate and click the "Authenticate with Puter" button
2. Verify that a popup window opens for authentication
3. Complete the Puter authentication process in the popup
4. Verify that the popup closes after successful authentication
5. Verify that the user is now authenticated in the main WebView

### 3. Communication Test
1. After authentication, try using some Puter functions (List Files, Write File, Read File)
2. Verify that the Android app receives callbacks through the JavaScript interface
3. Check the logs for successful communication between web app and Android app
4. Verify that `onPuterAuthSuccess`, `onPuterActionSuccess`, and other callback methods are triggered

### 4. Error Handling Test
1. Try to authenticate with invalid credentials
2. Verify that error callbacks are properly handled
3. Check that `onPuterAuthError` and `onPuterActionError` methods are triggered

### 5. Session Persistence Test
1. Close and reopen the app
2. Verify that the authentication session persists
3. If session doesn't persist, verify that the user can re-authenticate successfully

## Expected Results

- The web app should load successfully in the Android WebView
- Popup authentication should work properly
- Communication between web app and Android app should be seamless
- All Puter SDK functions should work as expected
- Error handling should be robust

## Troubleshooting

### Popup Windows Don't Open
- Verify that `setSupportMultipleWindows(true)` and `javaScriptCanOpenWindowsAutomatically(true)` are set in WebView settings
- Check that the `WebChromeClient` is properly configured

### JavaScript Interface Not Working
- Verify that the interface is added with `webView.addJavascriptInterface()`
- Check that the method names match between web app and Android app
- Ensure `@JavascriptInterface` annotation is present

### Authentication Fails
- Verify the deployed URL is correct
- Check network connectivity
- Ensure CORS policies allow the communication