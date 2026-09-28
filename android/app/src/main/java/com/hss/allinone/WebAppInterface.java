package com.hss.allinone;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

/**
 * JavaScript interface exposed to the WebView under the name "AndroidApp".
 * Allows the website to trigger native Android actions safely.
 */
public class WebAppInterface {

    private final Activity activity;
    private final DownloadHandler downloadHandler;

    public WebAppInterface(Activity activity, DownloadHandler downloadHandler) {
        this.activity = activity;
        this.downloadHandler = downloadHandler;
    }

    /**
     * Shows a native Android Toast.
     */
    @JavascriptInterface
    public void showToast(String message) {
        if (activity == null || message == null) return;
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_SHORT).show());
    }

    /**
     * Shares a URL or text via native Android share sheet.
     */
    @JavascriptInterface
    public void shareUrl(String url, String title) {
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            try {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title != null ? title : AppConfig.APP_NAME);
                shareIntent.putExtra(Intent.EXTRA_TEXT, url);
                activity.startActivity(Intent.createChooser(shareIntent, "Share with"));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    /**
     * Triggers file download from JavaScript.
     */
    @JavascriptInterface
    public void downloadFile(String url, String filename) {
        if (activity == null || downloadHandler == null) return;
        activity.runOnUiThread(() -> {
            downloadHandler.downloadFile(url, null, "attachment; filename=\"" + filename + "\"", null);
        });
    }

    /**
     * Opens a PDF in the dedicated PDF Viewer.
     */
    @JavascriptInterface
    public void openPdf(String url, String title) {
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(activity, PdfViewerActivity.class);
            intent.putExtra(PdfViewerActivity.EXTRA_PDF_URL, url);
            intent.putExtra(PdfViewerActivity.EXTRA_PDF_TITLE, title);
            activity.startActivity(intent);
        });
    }

    /**
     * Provides light haptic feedback.
     */
    @JavascriptInterface
    public void vibrate(long milliseconds) {
        if (activity == null) return;
        try {
            Vibrator vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(milliseconds);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Returns true indicating this is running inside the Android APK.
     */
    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    /**
     * Returns app version code/name.
     */
    @JavascriptInterface
    public String getAppVersion() {
        try {
            return activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }
}
