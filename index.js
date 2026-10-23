package com.nostelgic.ngl

import android.Manifest
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.webkit.*
import android.widget.Button
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var internetDialog: AlertDialog? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // Permission launcher for Android 13+ notifications
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (!isGranted) {
            Toast.makeText(this, "Notification permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
            filePathCallback?.onReceiveValue(results)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        createNotificationChannel()
        checkNotificationPermission()

        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
        }

        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (!isNetworkAvailable()) {
                    showNoInternetDialog()
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()

                when {
                    url.startsWith("tel:") || url.startsWith("mailto:") -> {
                        val intent = Intent(Intent.ACTION_VIEW, url.toUri())
                        startActivity(intent)
                        return true
                    }

                    url.contains("instagram.com") || !url.contains("nostelgic-ngl.github.io") -> {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, url.toUri())
                            startActivity(intent)
                        } catch (ex: Exception) {
                            ex.printStackTrace()
                        }
                        return true
                    }

                    else -> {
                        return false
                    }
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                try {
                    val intent = params?.createIntent()
                    if (intent != null) {
                        fileChooserLauncher.launch(intent)
                    }
                } catch (ex: Exception) {
                    filePathCallback = null
                    return false
                }
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        checkAndLoadUrl()
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Nostelgic NGL Messages"
            val descriptionText = "Notifications for new anonymous messages"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel("ngl_channel_id", name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    class WebAppInterface(private val context: Context) {

        @JavascriptInterface
        fun showNotification(title: String, message: String) {
            val builder = NotificationCompat.Builder(context, "ngl_channel_id")
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
        }

        @JavascriptInterface
        fun shareText(text: String) {
            try {
                val sendIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, text)
                    type = "text/plain"
                }
                val shareIntent = Intent.createChooser(sendIntent, "Share via").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(shareIntent)
            } catch (ex: Exception) {
                ex.printStackTrace()
            }
        }

        @JavascriptInterface
        fun shareStory(base64Data: String) {
            try {
                val base64Image = base64Data.substringAfter("base64,")
                val imageBytes = Base64.decode(base64Image, Base64.DEFAULT)

                val cachePath = File(context.cacheDir, "images")
                cachePath.mkdirs()
                val imageFile = File(cachePath, "ReplyImage.png")
                val stream = FileOutputStream(imageFile)
                stream.write(imageBytes)
                stream.close()

                val imageUri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    imageFile
                )

                val storyIntent = Intent("com.instagram.share.ADD_STORY").apply {
                    setDataAndType(imageUri, "image/png")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    putExtra("source_application", context.packageName)
                    clipData = ClipData.newUri(context.contentResolver, "Instagram Story", imageUri)
                    setPackage("com.instagram.android")
                }

                try {
                    storyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(storyIntent)
                } catch (ex: Exception) {
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "image/png"
                        putExtra(Intent.EXTRA_STREAM, imageUri)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        clipData = ClipData.newUri(context.contentResolver, "Share", imageUri)
                    }
                    val chooser = Intent.createChooser(shareIntent, "Share Story to")
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(chooser)
                }

            } catch (ex: Exception) {
                ex.printStackTrace()
            }
        }
    }

    private fun checkAndLoadUrl() {
        if (isNetworkAvailable()) {
            internetDialog?.dismiss()
            webView.loadUrl("https://nostelgic-ngl.github.io/Nostelgic-NGL/")
        } else {
            showNoInternetDialog()
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showNoInternetDialog() {
        if (isFinishing) return
        if (internetDialog != null && internetDialog?.isShowing == true) return

        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_no_internet, null)
        val btnRetry = dialogView.findViewById<Button>(R.id.btnRetry)

        val builder = AlertDialog.Builder(this)
        builder.setView(dialogView)
        builder.setCancelable(false)

        internetDialog = builder.create()
        internetDialog?.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))

        btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                internetDialog?.dismiss()
                checkAndLoadUrl()
            } else {
                Toast.makeText(this, "Still offline! Check your Wi-Fi or Mobile Data.", Toast.LENGTH_SHORT).show()
            }
        }

        internetDialog?.show()
    }
}
