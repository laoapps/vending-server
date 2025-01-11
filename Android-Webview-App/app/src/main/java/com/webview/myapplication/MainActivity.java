package com.webview.myapplication;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private WebView mWebView;
    private ProgressBar progressBar;
    private static final String REMOTE_URL = "https://ttlock2-admin.laoapps.com/";
    private Handler handler = new Handler();
    private Runnable retryRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        setupWebView();
        loadUrlWithRetry();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        mWebView = findViewById(R.id.activity_main_webview);
        progressBar = findViewById(R.id.progressBar);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportMultipleWindows(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccess(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        WebView.setWebContentsDebuggingEnabled(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(mWebView, true);

        String defaultUserAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(defaultUserAgent + " AndroidWebView/Android10");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                Log.d(TAG, "Loading URL: " + url);
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                Log.d(TAG, "Page loaded: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                Log.e(TAG, "WebView Error: " + error.getDescription());
                if (!isNetworkAvailable()) {
                    view.loadUrl("file:///android_asset/offline.html");
                    startRetryMechanism();
                }
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        setupDownloadListener();
    }

    private void setupDownloadListener() {
        mWebView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimetype);
                request.addRequestHeader("cookie", CookieManager.getInstance().getCookie(url));
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading file...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype));
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimetype));

                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(this, "Starting download...", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.e(TAG, "Download error: " + e.getMessage());
                Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    private void loadUrlWithRetry() {
        if (isNetworkAvailable()) {
            Log.d(TAG, "Network is available, loading URL: " + REMOTE_URL);
            mWebView.loadUrl(REMOTE_URL);
        } else {
            Log.d(TAG, "Network is not available, loading offline page");
            mWebView.loadUrl("file:///android_asset/offline.html");
            startRetryMechanism();
        }
    }

    private void startRetryMechanism() {
        retryRunnable = new Runnable() {
            @Override
            public void run() {
                if (isNetworkAvailable()) {
                    Log.d(TAG, "Network is available, reloading URL: " + REMOTE_URL);
                    mWebView.loadUrl(REMOTE_URL);
                    handler.removeCallbacks(this); // Stop retrying once the network is available
                } else {
                    Log.d(TAG, "Network is still not available, retrying in 10 seconds");
                    handler.postDelayed(this, 10000); // Retry every 10 seconds
                }
            }
        };
        handler.post(retryRunnable);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(retryRunnable);
    }
}