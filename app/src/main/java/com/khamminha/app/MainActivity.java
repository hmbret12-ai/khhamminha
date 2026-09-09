package com.khamminha.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.graphics.Color;
import android.net.Uri;

public class MainActivity extends Activity {

    private static final String HOME_URL =
            "https://khhamminha.onrender.com";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request) {

                Uri uri = request.getUrl();
                String host = uri.getHost();

                if (host != null &&
                        host.equals("khhamminha.onrender.com")) {
                    return false;
                }

                try {
                    startActivity(
                            new android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    uri));
                } catch (Exception ignored) {
                }

                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    String url) {

                Uri uri = Uri.parse(url);
                String host = uri.getHost();

                if (host != null &&
                        host.equals("khhamminha.onrender.com")) {
                    return false;
                }

                try {
                    startActivity(
                            new android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    uri));
                } catch (Exception ignored) {
                }

                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl(HOME_URL);
    }

    @Override
    public void onBackPressed() {

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
          }
