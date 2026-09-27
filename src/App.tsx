import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Smartphone, 
  FileCode2, 
  FileText, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ExternalLink,
  History,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { VoiceSettings, TranscriptionRecord } from './types';
import { PhoneSimulator } from './components/PhoneSimulator';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { PrdViewer } from './components/PrdViewer';
import { TranscriptionHistory } from './components/TranscriptionHistory';
import appIconPath from './assets/images/voiceflow_app_icon_1790512117313.jpg';

const DEFAULT_SETTINGS: VoiceSettings = {
  groqApiKey: '',
  model: 'whisper-large-v3-turbo',
  language: 'bn',
  maxRecordingDuration: 60,
  injectionMode: 'set_text',
  soundFeedback: true,
  hapticFeedback: true,
  interactionMode: 'tap_toggle',
  accessibilityServiceEnabled: true,
  overlayPermissionGranted: true,
  micPermissionGranted: true,
  disclosureAccepted: true,
};

export default function App() {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('voiceflow_settings');
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<'simulator' | 'codebase' | 'prd' | 'history'>('simulator');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<TranscriptionRecord[]>([
    {
      id: 'demo_1',
      timestamp: Date.now() - 1000 * 60 * 12,
      text: 'আমি এখন মিটিংয়ে আছি, ১০ মিনিট পর জানাচ্ছি।',
      durationSeconds: 3.2,
      modelUsed: 'whisper-large-v3-turbo',
      targetApp: 'messenger',
      source: 'simulation',
    },
    {
      id: 'demo_2',
      timestamp: Date.now() - 1000 * 60 * 35,
      text: 'চাল ৫ কেজি এবং খাঁটি সরিষার তেল আনতে হবে',
      durationSeconds: 4.1,
      modelUsed: 'whisper-large-v3-turbo',
      targetApp: 'notes',
      source: 'simulation',
    },
  ]);

  // Persist settings changes
  useEffect(() => {
    try {
      localStorage.setItem('voiceflow_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const handleUpdateSettings = (updated: Partial<VoiceSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleNewTranscription = (record: TranscriptionRecord) => {
    setHistoryRecords((prev) => [record, ...prev]);
  };

  const handleClearHistory = () => {
    setHistoryRecords([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Universal Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav links) — Zone 3 (Actions) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-500/30 shadow-sm shrink-0">
            <img 
              src={appIconPath} 
              alt="VoiceFlow Logo" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            VoiceFlow Android
          </span>
        </div>

        {/* Zone 2: 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors flex items-center gap-1.5 hover:text-slate-100 ${
              activeTab === 'simulator' ? 'text-cyan-400' : ''
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>সিমুলেটর ও বাবল</span>
          </button>

          <button
            onClick={() => setActiveTab('codebase')}
            className={`transition-colors flex items-center gap-1.5 hover:text-slate-100 ${
              activeTab === 'codebase' ? 'text-cyan-400' : ''
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Kotlin কোডবেস</span>
          </button>

          <button
            onClick={() => setActiveTab('prd')}
            className={`transition-colors flex items-center gap-1.5 hover:text-slate-100 ${
              activeTab === 'prd' ? 'text-cyan-400' : ''
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PRD ডকুমেন্টেশন</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`transition-colors flex items-center gap-1.5 hover:text-slate-100 ${
              activeTab === 'history' ? 'text-cyan-400' : ''
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>হিস্টোরি ({historyRecords.length})</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="transition-colors flex items-center gap-1 text-slate-400 hover:text-emerald-400"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Play Store অনবোর্ডিং (§৯.২)</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors shadow-sm"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">সেটিংস ও Groq কী</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-cyan-950/60 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
            <span>কমপ্লায়েন্স চেক</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
        {/* Mobile Navigation bar for small screens */}
        <div className="flex md:hidden items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center ${
              activeTab === 'simulator' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            সিমুলেটর
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center ${
              activeTab === 'codebase' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            কোডবেস
          </button>
          <button
            onClick={() => setActiveTab('prd')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center ${
              activeTab === 'prd' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            PRD
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg font-medium text-center ${
              activeTab === 'history' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            }`}
          >
            হিস্টোরি
          </button>
        </div>

        {/* Hero Section & Context Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-cyan-400">সিস্টেম-ওয়াইড ভয়েস টাইপিং</span>
              <span>·</span>
              <span>Android (Kotlin + Jetpack Compose)</span>
              <span>·</span>
              <span>Groq Whisper API (~২ সেকেন্ড লেটেন্সি)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              সব অ্যাপের যেকোনো টেক্সট ফিল্ডে এক-ট্যাপে সরাসরি ভয়েস ইনপুট
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Messenger Chat Head-এর মতো ভাসমান মাইক্রোফোন বাবল। ফোকাসড ফিল্ড শনাক্ত করে Groq Whisper দিয়ে সাথে সাথে কার্সারে লেখা বসিয়ে দেয়।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block">বর্তমান স্ট্যাটাস</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Accessibility Active
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block">Whisper স্পিড</span>
              <span className="text-xs font-mono font-bold text-cyan-300">~216x Realtime</span>
            </div>
          </div>
        </div>

        {/* TAB 1: SIMULATOR & WORKBENCH */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Center Phone Simulator Frame */}
            <div className="lg:col-span-6 flex justify-center">
              <PhoneSimulator
                settings={settings}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onNewTranscription={handleNewTranscription}
              />
            </div>

            {/* Right Guide & Live Diagnostics Panel */}
            <div className="lg:col-span-6 space-y-5">
              {/* How it Works Step Guide */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>লাইভ টেস্ট গাইড (Live Interaction Steps)</span>
                </h3>
                
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      ১
                    </div>
                    <div>
                      <strong className="text-slate-100">টেক্সট ফিল্ডে ট্যাপ করুন:</strong> ফোনের স্ক্রিনের যেকোনো অ্যাপ (Messenger, Notes, Gmail, Search) বেছে নিয়ে ইনপুট বক্সে ক্লিক করুন।
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      ২
                    </div>
                    <div>
                      <strong className="text-slate-100">ভাসমান বাবলে ট্যাপ করে কথা বলুন:</strong> স্ক্রিনে ভাসমান মাইক্রোফোন বাবলে ক্লিক করুন (বা ড্র্যাগ করে সুবিধাজনক প্রান্তে নিন)। পালসিং রিং চালু হলে কথা বলুন।
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      ৩
                    </div>
                    <div>
                      <strong className="text-slate-100">আবার ট্যাপে রেকর্ড থামান:</strong> ট্যাপ করার সাথে সাথে অডিও Groq Whisper API (বা ব্রাউজার ফলব্যাক)-এ ট্রান্সক্রাইব হয়ে সরাসরি ফিল্ডে বসে যাবে!
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Quick Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">উইন্ডো টাইপ:</span>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5 truncate">
                    TYPE_ACCESSIBILITY_OVERLAY
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    SYSTEM_ALERT_WINDOW পারমিশন ছাড়াই কাজ করে
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">অডিও ফরম্যাট:</span>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                    .m4a (AAC / MPEG-4)
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    MediaRecorder দিয়ে সরাসরি Groq সমর্থিত
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">টেক্সট ইনজেকশন:</span>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                    ACTION_SET_TEXT
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    কাস্টম ফিল্ডে ACTION_PASTE ফলব্যাক
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400">অটো-টাইমআউট:</span>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                    {settings.maxRecordingDuration}s Max Stop
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    অতিরিক্ত API খরচ প্রতিরোধ করে (FR-3)
                  </p>
                </div>
              </div>

              {/* Quick History Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>সর্বশেষ ভয়েস ইনপুট</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>সব দেখুন</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {historyRecords[0] ? (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    <p className="font-medium text-slate-100">"{historyRecords[0].text}"</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{historyRecords[0].modelUsed}</span>
                      <span>{historyRecords[0].durationSeconds}s অডিও</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">কোনো ইনপুট এখনও রেকর্ড হয়নি।</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CODEBASE EXPLORER */}
        {activeTab === 'codebase' && <CodebaseExplorer />}

        {/* TAB 3: PRD SPECIFICATION */}
        {activeTab === 'prd' && <PrdViewer />}

        {/* TAB 4: TRANSCRIPTION HISTORY */}
        {activeTab === 'history' && (
          <TranscriptionHistory
            records={historyRecords}
            onClearHistory={handleClearHistory}
            onReInject={(text) => {
              setActiveTab('simulator');
              // Let simulator inject or show
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-center text-xs text-slate-400 space-y-1">
        <p>
          ভয়েস টাইপিং অ্যাসিস্ট্যান্ট · Android Kotlin + Jetpack Compose Architecture · Powered by Groq Whisper API
        </p>
        <p className="text-[11px] text-slate-400">
          Google Play Store Accessibility Service Policy & Prominent Disclosure Compliant (§9.2)
        </p>
      </footer>

      {/* MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetBubblePos={() => {
          // Trigger bubble reset
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
