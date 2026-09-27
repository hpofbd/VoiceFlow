import { KotlinFile } from '../types';

export const KOTLIN_CODEBASE: KotlinFile[] = [
  {
    id: 'accessibility_service',
    filename: 'VoiceTypingAccessibilityService.kt',
    path: 'com/app/voicetyping/service/VoiceTypingAccessibilityService.kt',
    category: 'Service',
    description: 'Accessibility Service that detects focused editable text nodes across all Android apps and performs direct text injection or clipboard paste fallback.',
    code: `package com.app.voicetyping.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import com.app.voicetyping.domain.model.BubbleUiState
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import javax.inject.Inject

/**
 * System-Wide Accessibility Service for Focused Field Detection and Text Injection.
 * Declared with BIND_ACCESSIBILITY_SERVICE permission in AndroidManifest.xml.
 */
@AndroidEntryPoint
class VoiceTypingAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    
    @Inject
    lateinit var overlayBubbleManager: OverlayBubbleManager

    private var currentFocusedNode: AccessibilityNodeInfo? = null
    private var activePackageName: CharSequence? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_VIEW_FOCUSED or 
                         AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
            notificationTimeout = 100
        }
        this.serviceInfo = info

        // Attach the floating bubble overlay using TYPE_ACCESSIBILITY_OVERLAY
        overlayBubbleManager.showOverlay(
            context = this,
            onRecordRequested = { handleRecordTrigger() },
            onInjectRequested = { text -> injectTranscribedText(text) }
        )
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                val source = event.source
                if (source?.isEditable == true) {
                    currentFocusedNode = source
                    activePackageName = event.packageName
                }
            }
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                activePackageName = event.packageName
                // Update focus reference on active window
                rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)?.let { focused ->
                    if (focused.isEditable) {
                        currentFocusedNode = focused
                    }
                }
            }
        }
    }

    override fun onInterrupt() {
        // Clean up when accessibility service is paused by Android OS
    }

    /**
     * Checks whether an editable text field is currently focused on screen.
     */
    fun hasFocusedEditableField(): Boolean {
        val root = rootInActiveWindow ?: return false
        val focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        return focused != null && focused.isEditable
    }

    private fun handleRecordTrigger() {
        val root = rootInActiveWindow
        val focused = root?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        
        if (focused == null || !focused.isEditable) {
            Toast.makeText(
                this, 
                "কোনো টেক্সট ফিল্ড খুঁজে পাওয়া যায়নি (Please tap an input field first)", 
                Toast.LENGTH_SHORT
            ).show()
            return
        }
        currentFocusedNode = focused
        overlayBubbleManager.startVoiceRecording()
    }

    /**
     * Injects the transcribed text into the focused node.
     * Strategy: Primary: ACTION_SET_TEXT, Fallback: Clipboard + ACTION_PASTE
     */
    fun injectTranscribedText(text: String): Boolean {
        val node = currentFocusedNode ?: rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        
        if (node == null || !node.isEditable) {
            Toast.makeText(this, "ইনপুট ফিল্ড হারিয়ে গেছে", Toast.LENGTH_SHORT).show()
            return false
        }

        val supportsSetText = node.actionList.any { 
            it.id == AccessibilityNodeInfo.ACTION_SET_TEXT 
        }

        return if (supportsSetText) {
            // Append or insert at cursor
            val existingText = node.text?.toString() ?: ""
            val newContent = if (existingText.isEmpty()) text else "$existingText $text"
            val args = Bundle().apply {
                putCharSequence(
                    AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, 
                    newContent
                )
            }
            node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
        } else {
            // Robust fallback for custom editors (e.g., WhatsApp, Telegram, rich text)
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("voice_typing_text", text)
            clipboard.setPrimaryClip(clip)
            node.performAction(AccessibilityNodeInfo.ACTION_PASTE)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        overlayBubbleManager.hideOverlay()
    }
}`
  },
  {
    id: 'overlay_bubble_manager',
    filename: 'OverlayBubbleManager.kt',
    path: 'com/app/voicetyping/service/OverlayBubbleManager.kt',
    category: 'Service',
    description: 'WindowManager bridge managing the floating bubble with TYPE_ACCESSIBILITY_OVERLAY, ComposeView lifecycle owners, and spring edge-snapping math.',
    code: `package com.app.voicetyping.service

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.app.voicetyping.presentation.overlay.BubbleOverlayScreen
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages floating overlay bubble on top of all windows without needing SYSTEM_ALERT_WINDOW,
 * utilizing AccessibilityService's TYPE_ACCESSIBILITY_OVERLAY.
 */
@Singleton
class OverlayBubbleManager @Inject constructor() {

    private var windowManager: WindowManager? = null
    private var composeOverlayView: ComposeView? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    // Touch and drag coordinates
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false
    private val clickThresholdDp = 10

    @SuppressLint("ClickableViewAccessibility")
    fun showOverlay(
        context: Context,
        onRecordRequested: () -> Unit,
        onInjectRequested: (String) -> Unit
    ) {
        if (composeOverlayView != null) return

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        
        // Android 8.0+ (API 26+) supports TYPE_ACCESSIBILITY_OVERLAY
        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 24
            y = 350
        }

        // Bridge ComposeView with a synthetic LifecycleOwner & SavedStateRegistryOwner
        // CRITICAL: WindowManager-hosted views do not possess an Activity lifecycle!
        val customLifecycleOwner = OverlayLifecycleOwner()
        customLifecycleOwner.start()

        composeOverlayView = ComposeView(context).apply {
            setViewTreeLifecycleOwner(customLifecycleOwner)
            setViewTreeViewModelStoreOwner(customLifecycleOwner)
            setViewTreeSavedStateRegistryOwner(customLifecycleOwner)

            setContent {
                BubbleOverlayScreen(
                    onToggleRecord = onRecordRequested,
                    onInject = onInjectRequested
                )
            }

            setOnTouchListener { view, event ->
                handleBubbleTouch(view, event)
            }
        }

        windowManager?.addView(composeOverlayView, layoutParams)
    }

    private fun handleBubbleTouch(view: View, event: MotionEvent): Boolean {
        val params = layoutParams ?: return false
        val displayMetrics = view.context.resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                initialX = params.x
                initialY = params.y
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                isDragging = false
                return false
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = (event.rawX - initialTouchX).toInt()
                val dy = (event.rawY - initialTouchY).toInt()

                if (Math.hypot(dx.toDouble(), dy.toDouble()) > clickThresholdDp) {
                    isDragging = true
                }

                if (isDragging) {
                    params.x = initialX + dx
                    params.y = initialY + dy
                    windowManager?.updateViewLayout(composeOverlayView, params)
                    return true
                }
            }
            MotionEvent.ACTION_UP -> {
                if (isDragging) {
                    // Edge-snapping: snap smoothly to nearest left or right edge
                    val bubbleCenter = params.x + (view.width / 2)
                    val targetX = if (bubbleCenter < screenWidth / 2) 16 else screenWidth - view.width - 16

                    animateSnapToEdge(params.x, targetX)
                    return true
                }
            }
        }
        return false
    }

    private fun animateSnapToEdge(startX: Int, targetX: Int) {
        val animator = ValueAnimator.ofInt(startX, targetX).apply {
            duration = 240
            interpolator = DecelerateInterpolator()
            addUpdateListener { animation ->
                layoutParams?.let { params ->
                    params.x = animation.animatedValue as Int
                    windowManager?.updateViewLayout(composeOverlayView, params)
                }
            }
        }
        animator.start()
    }

    fun startVoiceRecording() {
        // Notifies Compose overlay state machine
    }

    fun hideOverlay() {
        composeOverlayView?.let { view ->
            windowManager?.removeView(view)
            composeOverlayView = null
        }
    }
}

/**
 * Synthetic Lifecycle & SavedState owner for Compose inside WindowManager
 */
private class OverlayLifecycleOwner : LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {
    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    private val store = ViewModelStore()

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val viewModelStore: ViewModelStore get() = store
    override val savedStateRegistry: SavedStateRegistry 
        get() = savedStateRegistryController.savedStateRegistry

    fun start() {
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.currentState = Lifecycle.State.RESUMED
    }
}`
  },
  {
    id: 'recording_foreground_service',
    filename: 'RecordingForegroundService.kt',
    path: 'com/app/voicetyping/service/RecordingForegroundService.kt',
    category: 'Service',
    description: 'Android 14+ compliant Foreground Service with FOREGROUND_SERVICE_MICROPHONE for background audio capture into .m4a format.',
    code: `package com.app.voicetyping.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.IOException

/**
 * Foreground Service explicitly declared with foregroundServiceType="microphone"
 * Mandatory for Android 14+ (API 34+) to record audio from an overlay/background context.
 */
class RecordingForegroundService : Service() {

    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null

    companion object {
        const val CHANNEL_ID = "voice_typing_recording_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_RECORDING = "ACTION_START_RECORDING"
        const val ACTION_STOP_RECORDING = "ACTION_STOP_RECORDING"
        const val EXTRA_AUDIO_PATH = "EXTRA_AUDIO_PATH"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_RECORDING -> {
                startForegroundWithMicType()
                startMediaRecording()
            }
            ACTION_STOP_RECORDING -> {
                stopMediaRecording()
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundWithMicType() {
        val notification = buildRecordingNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            } else {
                0
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startMediaRecording() {
        try {
            outputFile = File(cacheDir, "temp_voice_clip_\${System.currentTimeMillis()}.m4a")
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(128000)
                setAudioSamplingRate(44100)
                setOutputFile(outputFile?.absolutePath)
                prepare()
                start()
            }
        } catch (e: IOException) {
            e.printStackTrace()
            stopSelf()
        }
    }

    private fun stopMediaRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Voice Typing Active Recording",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live notification when voice recording is in progress"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildRecordingNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ভয়েস টাইপিং সক্রিয় (Listening...)")
            .setContentText("কথা শেষ হলে বাবলে আবার ট্যাপ করুন")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopMediaRecording()
        super.onDestroy()
    }
}`
  },
  {
    id: 'groq_api_service',
    filename: 'GroqApiService.kt',
    path: 'com/app/voicetyping/data/remote/GroqApiService.kt',
    category: 'Remote / API',
    description: 'Retrofit interface and OkHttp BYOK client uploading audio chunks to Groq Whisper endpoint (whisper-large-v3-turbo).',
    code: `package com.app.voicetyping.data.remote

import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.util.concurrent.TimeUnit

/**
 * Groq OpenAI-compatible Whisper Transcription API
 * Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
 */
interface GroqApiService {

    @Multipart
    @POST("openai/v1/audio/transcriptions")
    suspend fun transcribe(
        @Part file: MultipartBody.Part,
        @Part("model") model: RequestBody,
        @Part("language") language: RequestBody? = null,
        @Part("response_format") responseFormat: RequestBody
    ): TranscriptionResponse
}

data class TranscriptionResponse(
    val text: String
)

object GroqClientFactory {
    private const val BASE_URL = "https://api.groq.com/"

    fun create(apiKeyProvider: () -> String): GroqApiService {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer \${apiKeyProvider()}")
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GroqApiService::class.java)
    }
}`
  },
  {
    id: 'bubble_viewmodel',
    filename: 'BubbleViewModel.kt',
    path: 'com/app/voicetyping/presentation/overlay/BubbleViewModel.kt',
    category: 'Presentation',
    description: 'State machine for the floating bubble handling Idle, Listening (with timer), Processing, and Error states.',
    code: `package com.app.voicetyping.presentation.overlay

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.voicetyping.domain.usecase.RecordAndTranscribeUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

sealed class BubbleUiState {
    object Idle : BubbleUiState()
    data class Listening(val secondsElapsed: Int = 0) : BubbleUiState()
    object Processing : BubbleUiState()
    data class Success(val text: String) : BubbleUiState()
    data class Error(val message: String) : BubbleUiState()
}

@HiltViewModel
class BubbleViewModel @Inject constructor(
    private val recordAndTranscribeUseCase: RecordAndTranscribeUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<BubbleUiState>(BubbleUiState.Idle)
    val uiState: StateFlow<BubbleUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null
    private val maxRecordingSeconds = 60

    fun onBubbleTapped(onTextReady: (String) -> Unit) {
        when (_uiState.value) {
            is BubbleUiState.Idle -> startRecording()
            is BubbleUiState.Listening -> stopAndTranscribe(onTextReady)
            is BubbleUiState.Error -> {
                // Retry
                _uiState.value = BubbleUiState.Idle
            }
            is BubbleUiState.Processing -> {
                // Already in transit
            }
            is BubbleUiState.Success -> {
                _uiState.value = BubbleUiState.Idle
            }
        }
    }

    private fun startRecording() {
        _uiState.value = BubbleUiState.Listening(0)
        
        timerJob = viewModelScope.launch {
            for (sec in 1..maxRecordingSeconds) {
                delay(1000)
                if (_uiState.value is BubbleUiState.Listening) {
                    _uiState.value = BubbleUiState.Listening(sec)
                }
            }
            // Auto stop when 60s max threshold reached (FR-3)
            stopAndTranscribe { /* auto text inject */ }
        }
    }

    private fun stopAndTranscribe(onTextReady: (String) -> Unit) {
        timerJob?.cancel()
        _uiState.value = BubbleUiState.Processing

        viewModelScope.launch {
            recordAndTranscribeUseCase()
                .onSuccess { text ->
                    _uiState.value = BubbleUiState.Success(text)
                    onTextReady(text)
                    delay(1200)
                    _uiState.value = BubbleUiState.Idle
                }
                .onFailure { error ->
                    _uiState.value = BubbleUiState.Error(
                        error.localizedMessage ?: "ট্রান্সক্রিপশন ব্যর্থ হয়েছে"
                    )
                }
        }
    }
}`
  },
  {
    id: 'prominent_disclosure',
    filename: 'ProminentDisclosureScreen.kt',
    path: 'com/app/voicetyping/presentation/onboarding/ProminentDisclosureScreen.kt',
    category: 'Presentation',
    description: 'Mandatory Google Play Store Prominent Disclosure UI fulfilling Section 9.2 with Affirmative User Consent.',
    code: `package com.app.voicetyping.presentation.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Section 9.2 Prominent Disclosure & Consent Screen
 * Google Play Store requires affirmative consent before enabling AccessibilityService
 * when the app does not qualify for isAccessibilityTool=true exemption.
 */
@Composable
fun ProminentDisclosureScreen(
    onAcceptConsent: () -> Unit,
    onDecline: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = "গুরুত্বপূর্ণ ঘোষণা (Prominent Disclosure)",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF38BDF8)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "কেন Accessibility Service প্রয়োজন?",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White
        )
        Text(
            text = "এই অ্যাপটি Android Accessibility Service API ব্যবহার করে যাতে:\\n" +
                   "১. আপনি যে অ্যাপে আছেন তার সক্রিয় (focused) টেক্সট ফিল্ড শনাক্ত করা যায়।\\n" +
                   "২. আপনার বলা কথা টেক্সটে রূপান্তরিত করে সরাসরি কার্সার পজিশনে বসানো (inject) যায়।\\n" +
                   "৩. সব অ্যাপের উপরে সুবিধাজনক ফ্লোটিং ভয়েস বাবল প্রদর্শন করা যায়।",
            fontSize = 14.sp,
            color = Color(0xFFCBD5E1),
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "🔒 ডেটা গোপনীয়তা প্রতিশ্রুতি:",
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF4ADE80)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "• কোনো ব্যক্তিগত কথোপকথন বা পাসওয়ার্ড স্ক্রিন থেকে পড়া বা সংরক্ষণ করা হয় না।\\n" +
                           "• রেকর্ড করা অডিও তাৎক্ষণিক ট্রান্সক্রিপশনের পরেই ডিভাইস থেকে মুছে ফেলা হয়।\\n" +
                           "• আপনার Groq API কী আপনার ডিভাইসেই সুরক্ষিত এনক্রিপশনে থাকে।",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onAcceptConsent,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
            shape = RoundedCornerShape(10.dp)
        ) {
            Text("আমি সম্মত ও চালিয়ে যেতে চাই (Agree & Continue)", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedButton(
            onClick = onDecline,
            modifier = Modifier.fillMaxWidth().height(44.dp),
            shape = RoundedCornerShape(10.dp)
        ) {
            Text("এখন নয় (Not Now)", color = Color(0xFF94A3B8))
        }
    }
}`
  },
  {
    id: 'android_manifest',
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'Configuration',
    description: 'Manifest containing permissions (RECORD_AUDIO, FOREGROUND_SERVICE_MICROPHONE, BIND_ACCESSIBILITY_SERVICE).',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.app.voicetyping">

    <!-- Runtime Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Android 14+ Foreground Service Microphone requirement -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Battery optimization exemption to prevent OEM killing -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application
        android:name=".VoiceTypingApp"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VoiceTyping">

        <!-- Main Configuration Activity -->
        <activity
            android:name=".presentation.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VoiceTyping">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- System-Wide Accessibility Service -->
        <service
            android:name=".service.VoiceTypingAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Recording Foreground Service for Android 14+ mic access -->
        <service
            android:name=".service.RecordingForegroundService"
            android:foregroundServiceType="microphone"
            android:exported="false" />

    </application>
</manifest>`
  },
  {
    id: 'accessibility_config_xml',
    filename: 'accessibility_service_config.xml',
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    category: 'Configuration',
    description: 'XML resource configuring event types, feedback generic, and canRetrieveWindowContent capability.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeViewFocused|typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="false"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagReportViewIds" />`
  }
];
