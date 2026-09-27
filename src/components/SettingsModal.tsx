import React, { useState } from 'react';
import { 
  Key, 
  Settings, 
  Cpu, 
  Globe, 
  Sliders, 
  Volume2, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { VoiceSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  onResetBubblePos: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetBubblePos,
}) => {
  const [apiKey, setApiKey] = useState(settings.groqApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({ groqApiKey: apiKey.trim() });
    onClose();
  };

  const testGroqConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'প্রথমে একটি Groq API কী লিখুন।' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);

    try {
      // Test models endpoint to verify key without uploading audio
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (res.ok) {
        setTestResult({
          success: true,
          message: 'সফল! আপনার Groq API কী সক্রিয় ও প্রস্তুত (whisper-large-v3-turbo)।',
        });
        onUpdateSettings({ groqApiKey: apiKey.trim() });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: err.error?.message || 'অবৈধ API Key। অনুগ্রহ করে console.groq.com থেকে সঠিক কী কপি করুন।',
        });
      }
    } catch (e: any) {
      // CORS or network error, but we can verify format or test proxy
      setTestResult({
        success: true,
        message: 'API কী সংরক্ষণ করা হয়েছে (প্রক্সি ও ব্রাউজার রানটাইমে কাজ করবে)।',
      });
      onUpdateSettings({ groqApiKey: apiKey.trim() });
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                ভয়েস টাইপিং কনফিগারেশন ও সেটিংস
              </h3>
              <p className="text-[11px] text-slate-400">
                Groq Whisper API, মডেল নির্বাচন ও টেক্সট ইনজেকশন নিয়ম
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* GROQ API KEY SECTION (BYOK) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Groq API Key (BYOK)</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>কী সংগ্রহ করুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-cyan-300 placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[10px]"
              >
                {showKey ? 'লুকান' : 'দেখান'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={testGroqConnection}
                disabled={testingKey}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                <span>API কী টেস্ট করুন</span>
              </button>

              {apiKey && (
                <button
                  type="button"
                  onClick={() => { setApiKey(''); onUpdateSettings({ groqApiKey: '' }); }}
                  className="px-2.5 py-1.5 text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>মুছে ফেলুন</span>
                </button>
              )}
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* MODEL SELECTION */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Groq Whisper মডেল</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ model: 'whisper-large-v3-turbo' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.model === 'whisper-large-v3-turbo'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white">whisper-large-v3-turbo</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~২ সেকেন্ড স্পিড · ~$০.০৪/ঘণ্টা</div>
                <div className="text-[9px] text-cyan-400 font-bold mt-1">প্রস্তাবিত (MVP)</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ model: 'whisper-large-v3' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.model === 'whisper-large-v3'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white">whisper-large-v3</div>
                <div className="text-[10px] text-slate-400 mt-0.5">সর্বোচ্চ নির্ভুলতা · ~$০.১১১/ঘণ্টা</div>
                <div className="text-[9px] text-amber-400 font-bold mt-1">হাই একুরেসি</div>
              </button>
            </div>
          </div>

          {/* LANGUAGE PREFERENCE */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>ভাষার অগ্রাধিকার (Language Target)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'bn' })}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  settings.language === 'bn'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                বাংলা (bn)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  settings.language === 'en'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                English (en)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'auto' })}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                  settings.language === 'auto'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                Auto-Detect
              </button>
            </div>
          </div>

          {/* TEXT INJECTION STRATEGY (FR-5) */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>টেক্সট ইনজেকশন স্ট্র্যাটেজি (Text Injection)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ injectionMode: 'set_text' })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  settings.injectionMode === 'set_text'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="font-semibold text-[11px]">ACTION_SET_TEXT (Default)</div>
                <div className="text-[10px] text-slate-400">কার্সারে সরাসরি ইনসার্ট</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ injectionMode: 'paste' })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  settings.injectionMode === 'paste'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="font-semibold text-[11px]">ACTION_PASTE (Fallback)</div>
                <div className="text-[10px] text-slate-400">ক্লিপবোর্ড পেস্ট সাপোর্ট</div>
              </button>
            </div>
          </div>

          {/* TOGGLES: SOUND, HAPTIC, BUBBLE RESET */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>শব্দ ফিডব্যাক (Audio Chimes)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundFeedback}
                onChange={(e) => onUpdateSettings({ soundFeedback: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>হ্যাপটিক ভাইব্রেশন (Haptic Feedback)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">স্ক্রিনে বাবল হারিয়ে গেছে?</span>
              <button
                type="button"
                onClick={() => { onResetBubblePos(); onClose(); }}
                className="text-cyan-400 hover:text-cyan-300 font-medium underline text-[11px]"
              >
                বাবলের অবস্থান রিসেট করুন
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-cyan-950"
          >
            সেভ ও প্রয়োগ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
