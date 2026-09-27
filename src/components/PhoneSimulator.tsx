import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Loader2, 
  Check, 
  AlertCircle, 
  Send, 
  Sparkles, 
  Smartphone, 
  MessageSquare, 
  FileText, 
  Mail, 
  Search, 
  Share2, 
  Wifi, 
  Battery, 
  Volume2, 
  RotateCcw,
  Key
} from 'lucide-react';
import { BubbleState, AppTarget, VoiceSettings, TranscriptionRecord } from '../types';
import { soundManager } from '../utils/soundEffects';
import { AudioRecordingService, transcribeAudio } from '../utils/transcriptionService';

interface PhoneSimulatorProps {
  settings: VoiceSettings;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onNewTranscription: (record: TranscriptionRecord) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  settings,
  onOpenSettings,
  onOpenOnboarding,
  onNewTranscription,
}) => {
  // Active App
  const [activeApp, setActiveApp] = useState<AppTarget>('messenger');

  // Input fields state for each app
  const [appInputs, setAppInputs] = useState<Record<string, string>>({
    messenger: '',
    notes_title: 'বাজারের ফর্দ (Grocery List)',
    notes_body: '- চাল ৫ কেজি\n- ডাল ২ কেজি\n- খাঁটি সরিষার তেল',
    email_to: 'rafiq.chowdhury@example.com',
    email_subject: 'প্রজেক্ট আপডেট ও ফিডব্যাক',
    email_body: 'শ্রদ্ধেয় ভাই,\nগতকালকের মিটিংয়ের সারসংক্ষেপ তৈরি করেছি।',
    search: '',
    social: '',
  });

  // Active focused field
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>('messenger');
  const [cursorPos, setCursorPos] = useState<number>(0);

  // Floating Bubble State
  const [bubbleState, setBubbleState] = useState<BubbleState>('idle');
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number }>({ x: 280, y: 320 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedFar, setHasMovedFar] = useState(false);

  // Audio Recording State
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Messenger message thread
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'other'; text: string; time: string }>>([
    { sender: 'other', text: 'কিরে দোস্ত, তুই কি অফিসে পৌঁছেছিস?', time: '05:22 PM' },
    { sender: 'other', text: 'প্রজেক্টের রিপোর্টটা তাড়াতাড়ি পাঠানো দরকার।', time: '05:24 PM' },
  ]);

  const phoneContainerRef = useRef<HTMLDivElement>(null);
  const recordingServiceRef = useRef<AudioRecordingService | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Toast auto-hide
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Reset bubble position when settings change or requested
  useEffect(() => {
    // default position inside phone width (340px)
    setBubblePos({ x: 280, y: 320 });
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const phoneRect = phoneContainerRef.current?.getBoundingClientRect();
    if (!phoneRect) return;

    setIsDragging(true);
    setHasMovedFar(false);
    setDragStartOffset({
      x: e.clientX - phoneRect.left - bubblePos.x,
      y: e.clientY - phoneRect.top - bubblePos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const phoneRect = phoneContainerRef.current?.getBoundingClientRect();
    if (!phoneRect) return;

    const newX = e.clientX - phoneRect.left - dragStartOffset.x;
    const newY = e.clientY - phoneRect.top - dragStartOffset.y;

    if (Math.abs(newX - bubblePos.x) > 5 || Math.abs(newY - bubblePos.y) > 5) {
      setHasMovedFar(true);
    }

    // Bound inside phone dimensions
    const clampedX = Math.max(10, Math.min(phoneRect.width - 66, newX));
    const clampedY = Math.max(70, Math.min(phoneRect.height - 90, newY));

    setBubblePos({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Edge snapping animation
    const phoneRect = phoneContainerRef.current?.getBoundingClientRect();
    if (phoneRect) {
      const phoneWidth = phoneRect.width;
      const targetX = bubblePos.x + 28 < phoneWidth / 2 ? 14 : phoneWidth - 70;
      setBubblePos((prev) => ({ ...prev, x: targetX }));
    }
  };

  // Auto-stop at max recording duration (FR-3)
  useEffect(() => {
    if (bubbleState === 'listening' && recordingSeconds >= settings.maxRecordingDuration) {
      stopVoiceRecording();
    }
  }, [recordingSeconds, bubbleState, settings.maxRecordingDuration]);

  // Start Voice Recording
  const startVoiceRecording = async () => {
    // 1. Accessibility Check
    if (!settings.accessibilityServiceEnabled) {
      showToast('⚠️ Accessibility Service বন্ধ! প্রথমে অনবোর্ডিং থেকে চালু করুন।');
      onOpenOnboarding();
      return;
    }

    // 2. Focused Field Check (FR-2)
    if (!focusedFieldId) {
      showToast('কোনো টেক্সট ফিল্ড খুঁজে পাওয়া যায়নি (ইনপুটে ট্যাপ করুন)');
      soundManager.playErrorCue();
      return;
    }

    try {
      if (settings.soundFeedback) soundManager.playStartCue();
      if (settings.hapticFeedback) soundManager.triggerHaptic([40]);

      setBubbleState('listening');
      setRecordingSeconds(0);
      setInterimText('');
      setLastError(null);

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const recorder = new AudioRecordingService();
      recordingServiceRef.current = recorder;

      await recorder.startRecording(
        (level) => setAudioLevel(level),
        (text) => setInterimText(text),
        settings.language === 'auto' ? 'bn' : settings.language
      );
    } catch (err: any) {
      console.warn('Microphone permission or start error:', err);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setBubbleState('error');
      setLastError('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজারে Mic Permission দিন।');
      showToast('Mic Permission দিন অথবা অনবোর্ডিং দেখুন');
      if (settings.soundFeedback) soundManager.playErrorCue();
    }
  };

  // Stop Voice Recording and Transcribe
  const stopVoiceRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (settings.soundFeedback) soundManager.playStopCue();
    if (settings.hapticFeedback) soundManager.triggerHaptic([30, 30]);

    setBubbleState('processing');

    try {
      let audioBlob: Blob = new Blob();
      let durationSec = recordingSeconds || 1;
      let finalInterim = interimText;

      if (recordingServiceRef.current) {
        const result = await recordingServiceRef.current.stopRecording();
        audioBlob = result.blob;
        durationSec = Math.round(result.durationSeconds);
        if (result.interimText) finalInterim = result.interimText;
        recordingServiceRef.current = null;
      }

      // Transcribe via Groq Whisper API (or Fallback)
      const transcription = await transcribeAudio(audioBlob, durationSec, finalInterim, {
        apiKey: settings.groqApiKey,
        model: settings.model,
        language: settings.language,
      });

      // Inject text into active focused field (FR-5)
      injectTextIntoField(transcription.text);

      setBubbleState('success');
      if (settings.soundFeedback) soundManager.playSuccessCue();
      if (settings.hapticFeedback) soundManager.triggerHaptic([50]);

      // Record in history
      onNewTranscription({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        text: transcription.text,
        durationSeconds: transcription.durationSeconds,
        modelUsed: transcription.modelUsed,
        targetApp: activeApp,
        source: transcription.source,
      });

      showToast(`ইনজেক্ট করা হয়েছে (${transcription.latencyMs}ms)`);

      setTimeout(() => {
        setBubbleState('idle');
        setRecordingSeconds(0);
        setInterimText('');
      }, 1400);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setBubbleState('error');
      setLastError(err.message || 'Groq API এরর। API Key বা ইন্টারনেট সংযোগ চেক করুন।');
      showToast(err.message || 'ট্রান্সক্রিপশন ব্যর্থ হয়েছে');
      if (settings.soundFeedback) soundManager.playErrorCue();
    }
  };

  // Handle Bubble Click
  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedFar) return; // was dragging

    if (bubbleState === 'idle') {
      startVoiceRecording();
    } else if (bubbleState === 'listening') {
      stopVoiceRecording();
    } else if (bubbleState === 'error') {
      setBubbleState('idle');
      setLastError(null);
    }
  };

  // Text Injection Strategy (FR-5)
  const injectTextIntoField = (textToInject: string) => {
    if (!focusedFieldId) return;

    setAppInputs((prev) => {
      const current = prev[focusedFieldId] || '';
      let updated: string;

      if (settings.injectionMode === 'set_text') {
        // Direct insertion at cursor or append
        const before = current.slice(0, cursorPos);
        const after = current.slice(cursorPos);
        const spacer = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
        updated = before + spacer + textToInject + after;
      } else {
        // Clipboard paste fallback simulation
        const spacer = current.length > 0 && !current.endsWith(' ') ? ' ' : '';
        updated = current + spacer + textToInject;
      }
      return {
        ...prev,
        [focusedFieldId]: updated,
      };
    });
  };

  // Send message in chat
  const handleSendMessage = () => {
    const text = appInputs.messenger.trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text, time: 'এখনই' },
    ]);
    setAppInputs((prev) => ({ ...prev, messenger: '' }));
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top App Switcher */}
      <div className="w-full max-w-[390px] mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs no-scrollbar">
          <button
            onClick={() => { setActiveApp('messenger'); setFocusedFieldId('messenger'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeApp === 'messenger' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>মেসেঞ্জার</span>
          </button>

          <button
            onClick={() => { setActiveApp('notes'); setFocusedFieldId('notes_body'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeApp === 'notes' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>নোটবুক</span>
          </button>

          <button
            onClick={() => { setActiveApp('email'); setFocusedFieldId('email_body'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeApp === 'email' 
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span>ইমেইল</span>
          </button>

          <button
            onClick={() => { setActiveApp('search'); setFocusedFieldId('search'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeApp === 'search' 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>সার্চ</span>
          </button>
        </div>
      </div>

      {/* Simulated Smartphone Frame */}
      <div 
        ref={phoneContainerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-[360px] h-[720px] bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col"
      >
        {/* Dynamic Island / Front Camera Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60"></div>
        </div>

        {/* Android Status Bar */}
        <div className="h-10 px-6 pt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-30 tracking-tight">
          <span>05:28</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px]">5G</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Floating Bubble Overlay - TYPE_ACCESSIBILITY_OVERLAY */}
        <div
          onMouseDown={handleMouseDown}
          onClick={handleBubbleClick}
          style={{
            transform: `translate3d(${bubblePos.x}px, ${bubblePos.y}px, 0)`,
            transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`absolute top-0 left-0 z-50 cursor-grab active:cursor-grabbing touch-none select-none group`}
        >
          {/* Pulsing visual halo when listening */}
          {bubbleState === 'listening' && (
            <div className="absolute -inset-3 rounded-full bg-cyan-500/25 animate-ping pointer-events-none" />
          )}

          {/* Floating Bubble Circle */}
          <div
            className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-200 ${
              bubbleState === 'idle'
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 hover:border-cyan-400 hover:scale-105'
                : bubbleState === 'listening'
                ? 'bg-gradient-to-br from-cyan-600 to-indigo-700 border-2 border-white scale-110 shadow-cyan-500/50 shadow-lg'
                : bubbleState === 'processing'
                ? 'bg-gradient-to-br from-indigo-700 to-purple-800 border-2 border-indigo-300'
                : bubbleState === 'success'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-300'
                : 'bg-gradient-to-br from-rose-700 to-red-800 border-2 border-rose-300'
            }`}
          >
            {/* Inner Content based on state */}
            {bubbleState === 'idle' && (
              <div className="flex flex-col items-center">
                <Mic className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-bold text-cyan-300 tracking-tighter uppercase -mt-0.5">TAP</span>
              </div>
            )}

            {bubbleState === 'listening' && (
              <div className="flex flex-col items-center">
                {/* Audio visualizer bar heights responding to mic input */}
                <div className="flex items-center gap-0.5 h-4 mb-0.5">
                  <span 
                    className="w-1 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, audioLevel * 16)}px` }}
                  />
                  <span 
                    className="w-1 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(6, audioLevel * 20)}px` }}
                  />
                  <span 
                    className="w-1 bg-white rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, audioLevel * 14)}px` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                  0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
              </div>
            )}

            {bubbleState === 'processing' && (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            )}

            {bubbleState === 'success' && (
              <Check className="w-7 h-7 text-white stroke-[3] animate-in zoom-in-75" />
            )}

            {bubbleState === 'error' && (
              <RotateCcw className="w-6 h-6 text-white" />
            )}

            {/* Edge Snap Grip Cue */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/40 rounded-full" />
          </div>

          {/* Quick tooltip or status bubble pill */}
          {bubbleState === 'listening' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 border border-cyan-500/40 text-cyan-200 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg">
              {interimText ? `"${interimText.slice(-20)}"` : 'কথা বলুন... আবার ট্যাপে থামান'}
            </div>
          )}

          {bubbleState === 'processing' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 border border-indigo-500/40 text-indigo-200 text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <span>Groq Whisper দিয়ে রূপান্তর হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* Active App Screen Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1 flex flex-col bg-slate-900/80">
          {/* MESSENGER APP */}
          {activeApp === 'messenger' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
                    র
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">রাফিক ভাই (Rafiq)</h4>
                  <p className="text-[10px] text-emerald-400">অনলাইনে আছেন</p>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-cyan-600 text-white rounded-tr-xs' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}

                {/* Show interim transcription in real time right inside the chat draft if active */}
                {bubbleState === 'listening' && interimText && focusedFieldId === 'messenger' && (
                  <div className="flex items-center gap-1 text-[11px] text-cyan-400 italic bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/40">
                    <Sparkles className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>লাইভ স্পিচ: {interimText}</span>
                  </div>
                )}
              </div>

              {/* Input Bar (The target of Voice Injection) */}
              <div className="pt-2">
                <div 
                  className={`flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-800/90 border transition-all ${
                    focusedFieldId === 'messenger' 
                      ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-950/40' 
                      : 'border-slate-700/60'
                  }`}
                >
                  <input
                    ref={activeInputRef as any}
                    type="text"
                    value={appInputs.messenger}
                    onChange={(e) => {
                      setAppInputs((prev) => ({ ...prev, messenger: e.target.value }));
                      setCursorPos(e.target.selectionStart || e.target.value.length);
                    }}
                    onFocus={(e) => {
                      setFocusedFieldId('messenger');
                      setCursorPos(e.target.selectionStart || e.target.value.length);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="মেসেজ লিখুন... বা বাবলে ট্যাপ করুন"
                    className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!appInputs.messenger.trim()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      appInputs.messenger.trim()
                        ? 'bg-cyan-500 text-white shadow-sm hover:bg-cyan-400'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    {focusedFieldId === 'messenger' ? 'কার্সার সক্রিয় (Focused)' : 'ফিল্ডে ট্যাপ করুন'}
                  </span>
                  <span>{appInputs.messenger.length} অক্ষর</span>
                </div>
              </div>
            </div>
          )}

          {/* NOTES APP */}
          {activeApp === 'notes' && (
            <div className="flex-1 flex flex-col pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Keep Notes
                </span>
                <span className="text-[10px] text-slate-400">আজ, ০৫:২৮</span>
              </div>

              <div className="flex-1 flex flex-col gap-2 pt-3">
                <input
                  type="text"
                  value={appInputs.notes_title}
                  onChange={(e) => setAppInputs((prev) => ({ ...prev, notes_title: e.target.value }))}
                  onFocus={() => setFocusedFieldId('notes_title')}
                  placeholder="শিরোনাম (Title)..."
                  className={`bg-transparent text-sm font-bold text-slate-100 placeholder:text-slate-400 p-2 rounded-lg border transition-all focus:outline-none ${
                    focusedFieldId === 'notes_title' ? 'border-amber-400/80 bg-amber-500/5' : 'border-transparent'
                  }`}
                />

                <textarea
                  value={appInputs.notes_body}
                  onChange={(e) => {
                    setAppInputs((prev) => ({ ...prev, notes_body: e.target.value }));
                    setCursorPos(e.target.selectionStart || e.target.value.length);
                  }}
                  onFocus={(e) => {
                    setFocusedFieldId('notes_body');
                    setCursorPos(e.target.selectionStart || e.target.value.length);
                  }}
                  placeholder="নোটের বিবরণ লিখুন বা কথা বলুন..."
                  rows={12}
                  className={`flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-400 p-2 rounded-lg border resize-none transition-all focus:outline-none leading-relaxed ${
                    focusedFieldId === 'notes_body' ? 'border-amber-400/80 bg-amber-500/5' : 'border-transparent'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-400 pt-2 flex justify-between">
                <span>সক্রিয় ফিল্ড: {focusedFieldId === 'notes_body' ? 'নোটের মূল অংশ' : 'নোটের শিরোনাম'}</span>
                <span>স্বয়ংক্রিয় সেভ হচ্ছে</span>
              </div>
            </div>
          )}

          {/* EMAIL APP */}
          {activeApp === 'email' && (
            <div className="flex-1 flex flex-col pt-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Gmail Compose
                </span>
                <button className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-medium rounded-lg">
                  পাঠান
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-2 pt-3">
                <div className="flex items-center gap-2 border-b border-slate-800/80 py-1.5">
                  <span className="text-[11px] text-slate-400 w-12">প্রতি:</span>
                  <input
                    type="text"
                    value={appInputs.email_to}
                    onChange={(e) => setAppInputs((prev) => ({ ...prev, email_to: e.target.value }))}
                    onFocus={() => setFocusedFieldId('email_to')}
                    className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 border-b border-slate-800/80 py-1.5">
                  <span className="text-[11px] text-slate-400 w-12">বিষয়:</span>
                  <input
                    type="text"
                    value={appInputs.email_subject}
                    onChange={(e) => setAppInputs((prev) => ({ ...prev, email_subject: e.target.value }))}
                    onFocus={() => setFocusedFieldId('email_subject')}
                    className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <textarea
                  value={appInputs.email_body}
                  onChange={(e) => {
                    setAppInputs((prev) => ({ ...prev, email_body: e.target.value }));
                    setCursorPos(e.target.selectionStart || e.target.value.length);
                  }}
                  onFocus={(e) => {
                    setFocusedFieldId('email_body');
                    setCursorPos(e.target.selectionStart || e.target.value.length);
                  }}
                  placeholder="ইমেইল বডি লিখুন..."
                  rows={9}
                  className={`flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-400 p-2 rounded-lg border resize-none transition-all focus:outline-none ${
                    focusedFieldId === 'email_body' ? 'border-red-400/80 bg-red-500/5' : 'border-transparent'
                  }`}
                />
              </div>
            </div>
          )}

          {/* SEARCH APP */}
          {activeApp === 'search' && (
            <div className="flex-1 flex flex-col pt-3 items-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center my-6 border border-slate-700">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-6">Google Search</h3>

              <div 
                className={`w-full flex items-center gap-2 p-2.5 rounded-full bg-slate-800/90 border transition-all ${
                  focusedFieldId === 'search' ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-700'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 ml-1.5" />
                <input
                  type="text"
                  value={appInputs.search}
                  onChange={(e) => setAppInputs((prev) => ({ ...prev, search: e.target.value }))}
                  onFocus={() => setFocusedFieldId('search')}
                  placeholder="ভয়েসে সার্চ করুন..."
                  className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {appInputs.search && (
                <div className="w-full mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <p className="font-semibold text-blue-300 mb-1">সার্চ রেজাল্ট প্রিভিউ:</p>
                  <p>"{appInputs.search}" সম্পর্কিত তথ্য খোঁজা হচ্ছে...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Android Navigation Bar */}
        <div className="h-9 bg-slate-950 flex items-center justify-center z-30">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Toast / Snackbar Overlay */}
        {toastMessage && (
          <div className="absolute bottom-12 left-6 right-6 z-50 bg-slate-900/95 border border-slate-700/80 text-white text-[11px] px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="flex-1 font-medium">{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Simulator Helper Controls */}
      <div className="w-full max-w-[360px] mt-3.5 flex items-center justify-between text-xs text-slate-400 px-2">
        <button
          onClick={() => setBubblePos({ x: 280, y: 320 })}
          className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>বাবল রিসেট</span>
        </button>

        <span className="text-[11px] text-slate-400">
          মডেল: <strong className="text-cyan-400">{settings.model === 'whisper-large-v3-turbo' ? 'Turbo (~2s)' : 'v3'}</strong>
        </span>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{settings.groqApiKey ? 'API কী সেট আছে' : 'BYOK কী দিন'}</span>
        </button>
      </div>
    </div>
  );
};
