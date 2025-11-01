# Android Integration Guide

This document explains how to integrate the Puter authentication web app with your Android application.

## WebView Setup

To integrate the web app into your Android app, you'll need to set up a WebView with proper configuration:

```kotlin
class PuterWebViewActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_puter_webview)

        webView = findViewById(R.id.webview)
        
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.databaseEnabled = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        
        // Enable popup windows for authentication
        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
                // Create a new WebView to handle popup windows
                val popupWebView = WebView(this@PuterWebViewActivity).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                }
                
                // Set up the new WebView
                (view.parent as? ViewGroup)?.addView(popupWebView)
                val transport = resultMsg.obj as WebView.WebViewTransport
                transport.webView = popupWebView
                resultMsg.sendToTarget()
                
                return true
            }
            
            override fun onCloseWindow(window: WebView) {
                // Remove the popup WebView when closed
                (window.parent as? ViewGroup)?.removeView(window)
            }
        }
        
        // Add JavaScript interface for communication
        webView.addJavascriptInterface(PuterJavaScriptInterface(this), "Android")
        
        // Load the deployed web app
        webView.loadUrl("YOUR_DEPLOYED_URL_HERE")
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

## JavaScript Interface

Create a JavaScript interface class to handle callbacks from the web app:

```kotlin
class PuterJavaScriptInterface(private val context: Context) {
    private val TAG = "PuterJSInterface"
    
    @JavascriptInterface
    fun onPuterAuthSuccess(userJson: String) {
        Log.d(TAG, "Authentication successful: $userJson")
        // Handle successful authentication
        // You can parse the userJson and store user information
        val user = JSONObject(userJson)
        val username = user.getString("username")
        val email = user.getString("email")
        
        // Store authentication info in your app
        val prefs = context.getSharedPreferences("puter_auth", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("username", username)
            .putString("email", email)
            .putBoolean("is_authenticated", true)
            .apply()
        
        // Notify your app about successful authentication
        val intent = Intent("PUTER_AUTH_SUCCESS")
        intent.putExtra("user", userJson)
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
    
    @JavascriptInterface
    fun onPuterAuthError(error: String) {
        Log.e(TAG, "Authentication error: $error")
        // Handle authentication error
        val intent = Intent("PUTER_AUTH_ERROR")
        intent.putExtra("error", error)
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
    
    @JavascriptInterface
    fun onPuterActionSuccess(operation: String, result: String) {
        Log.d(TAG, "$operation successful: $result")
        // Handle successful Puter operation
        val intent = Intent("PUTER_ACTION_SUCCESS")
        intent.putExtra("operation", operation)
        intent.putExtra("result", result)
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
    
    @JavascriptInterface
    fun onPuterActionError(operation: String, error: String) {
        Log.e(TAG, "$operation error: $error")
        // Handle Puter operation error
        val intent = Intent("PUTER_ACTION_ERROR")
        intent.putExtra("operation", operation)
        intent.putExtra("error", error)
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
    
    @JavascriptInterface
    fun onPuterResponse(responseJson: String) {
        Log.d(TAG, "Generic response: $responseJson")
        // Handle generic response
        val intent = Intent("PUTER_RESPONSE")
        intent.putExtra("response", responseJson)
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
    
    @JavascriptInterface
    fun onPuterSignOut() {
        Log.d(TAG, "User signed out")
        // Handle sign out
        val prefs = context.getSharedPreferences("puter_auth", Context.MODE_PRIVATE)
        prefs.edit()
            .clear()
            .apply()
        
        val intent = Intent("PUTER_SIGN_OUT")
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent)
    }
}
```

## Layout File

Create the layout file `activity_puter_webview.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

## Permissions

Add necessary permissions to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Calling JavaScript from Android

You can call JavaScript functions from your Android code:

```kotlin
// Example: Calling a function from Android to the web app
fun callWebAppFunction() {
    val jsCode = """
        (function() {
            if (window.puterWebInterface) {
                return window.puterWebInterface.executeOperation('listFiles', { path: '/' });
            } else {
                return 'Interface not available';
            }
        })()
    """.trimIndent()
    
    webView.evaluateJavascript(jsCode) { result ->
        Log.d("WebView", "JavaScript result: $result")
    }
}

// Example: Authenticate from Android side
fun authenticateWithPuter() {
    val jsCode = """
        (function() {
            if (window.puterWebInterface) {
                return window.puterWebInterface.authenticate();
            } else {
                return 'Interface not available';
            }
        })()
    """.trimIndent()
    
    webView.evaluateJavascript(jsCode) { result ->
        Log.d("WebView", "Authentication initiated: $result")
    }
}
```

## Handling Authentication Results

To handle authentication results in your main activity:

```kotlin
private val puterAuthReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "PUTER_AUTH_SUCCESS" -> {
                val userJson = intent.getStringExtra("user")
                // Handle successful authentication
                Log.d("MainActivity", "Puter authentication successful: $userJson")
            }
            "PUTER_AUTH_ERROR" -> {
                val error = intent.getStringExtra("error")
                // Handle authentication error
                Log.e("MainActivity", "Puter authentication error: $error")
            }
        }
    }
}

// Register the receiver in onCreate
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // ... other code ...
    
    val filter = IntentFilter().apply {
        addAction("PUTER_AUTH_SUCCESS")
        addAction("PUTER_AUTH_ERROR")
    }
    LocalBroadcastManager.getInstance(this).registerReceiver(puterAuthReceiver, filter)
}

// Unregister the receiver in onDestroy
override fun onDestroy() {
    super.onDestroy()
    LocalBroadcastManager.getInstance(this).unregisterReceiver(puterAuthReceiver)
}
```

## Security Considerations

1. **Validate Origins**: In production, ensure you validate message origins to prevent unauthorized access
2. **Secure Storage**: Store authentication tokens securely using Android's encrypted preferences
3. **HTTPS**: Always load the web app over HTTPS in production
4. **WebView Security**: Disable file access and content access in WebView settings

## Testing

1. Run the web app locally using `npm run dev`
2. Update the URL in your Android app to point to your local server (e.g., `http://10.0.2.2:3000` for Android emulator)
3. Test the authentication flow and file operations
4. Verify that callbacks are properly received in the Android app