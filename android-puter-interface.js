/**
 * Android Interface for Puter Web Communication
 * This file provides documentation and example implementation for the Android JavaScript interface
 * that would be used in the Android app to communicate with the web app.
 */

/*
 * In the Android app, you would add a JavaScript interface like this:
 * 
 * public class PuterJavaScriptInterface {
 *     Context mContext;
 *     
 *     public PuterJavaScriptInterface(Context c) {
 *         mContext = c;
 *     }
 *     
 *     @JavascriptInterface
 *     public void onPuterAuthSuccess(String userJson) {
 *         // Handle successful authentication
 *         Log.d("PuterAuth", "Authentication successful: " + userJson);
 *         // You can parse the userJson and store user information
 *     }
 *     
 *     @JavascriptInterface
 *     public void onPuterAuthError(String error) {
 *         // Handle authentication error
 *         Log.e("PuterAuth", "Authentication error: " + error);
 *     }
 *     
 *     @JavascriptInterface
 *     public void onPuterActionSuccess(String operation, String result) {
 *         // Handle successful Puter operation
 *         Log.d("PuterAction", operation + " successful: " + result);
 *     }
 *     
 *     @JavascriptInterface
 *     public void onPuterActionError(String operation, String error) {
 *         // Handle Puter operation error
 *         Log.e("PuterAction", operation + " error: " + error);
 *     }
 *     
 *     @JavascriptInterface
 *     public void onPuterResponse(String responseJson) {
 *         // Generic response handler for all Puter operations
 *         Log.d("PuterResponse", "Response: " + responseJson);
 *     }
 * }
 * 
 * Then add it to your WebView:
 * 
 * WebView webView = findViewById(R.id.webview);
 * WebSettings webSettings = webView.getSettings();
 * webSettings.setJavaScriptEnabled(true);
 * 
 * // Add the JavaScript interface
 * webView.addJavascriptInterface(new PuterJavaScriptInterface(this), "Android");
 * 
 * // Load your web app
 * webView.loadUrl("https://your-deployed-app.vercel.app");
 */


/*
 * From the Android side, you can call JavaScript functions in the web app:
 * 
 * // Example of calling JavaScript from Android
 * webView.evaluateJavascript(
 *     "(function() { " +
 *     "  if (window.puterWebInterface) {" +
 *     "    return window.puterWebInterface.executeOperation('listFiles', { path: '/' });" +
 *     "  } else {" +
 *     "    return 'Interface not available';" +
 *     "  }" +
 *     "})()", 
 *     new ValueCallback<String>() {
 *         @Override
 *         public void onReceiveValue(String value) {
 *             Log.d("WebView", "Result: " + value);
 *         }
 *     }
 * );
 */


/*
 * The web app provides these methods that Android can call:
 * 
 * 1. puterWebInterface.authenticate() - Initiates Puter authentication
 * 2. puterWebInterface.executeOperation(operation, params) - Executes Puter operations
 *    - Operations: 'listFiles', 'writeFile', 'readFile', 'deleteFile', 'createDir', 'statFile', 'uploadFile', 'downloadFile'
 * 3. puterWebInterface.checkAuthStatus() - Checks authentication status
 * 4. puterWebInterface.getUserInfo() - Gets user information
 * 5. puterWebInterface.signOut() - Signs out the user
 */


// Example Android code to communicate with the web app
const androidExampleCode = `
public class PuterWebViewActivity extends AppCompatActivity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_puter_webview);
        
        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        
        // Enable popup windows for authentication
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // Handle popup windows for authentication
                WebView newWebView = new WebView(view.getContext());
                newWebView.getSettings().setJavaScriptEnabled(true);
                
                // Set up the new WebView
                view.addView(newWebView);
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(newWebView);
                resultMsg.sendToTarget();
                
                return true;
            }
            
            @Override
            public void onCloseWindow(WebView window) {
                // Remove the popup WebView
                ViewGroup parent = (ViewGroup) window.getParent();
                if (parent != null) {
                    parent.removeView(window);
                }
            }
        });
        
        // Add JavaScript interface
        webView.addJavascriptInterface(new PuterJavaScriptInterface(this), "Android");
        
        // Load the web app
        webView.loadUrl("https://your-puter-app.vercel.app");
    }
    
    // Method to call JavaScript from Android
    public void callJavaScriptFunction(String jsCode) {
        webView.evaluateJavascript(jsCode, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                Log.d("JSInterface", "JavaScript result: " + value);
            }
        });
    }
}
`;

// Export the example code for reference
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { androidExampleCode };
}