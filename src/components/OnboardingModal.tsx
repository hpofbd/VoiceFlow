import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mic, 
  Eye, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Smartphone, 
  BatteryCharging, 
  Key, 
  AlertTriangle,
  X
} from 'lucide-react';
import { VoiceSettings } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [apiKeyInput, setApiKeyInput] = useState<string>(settings.groqApiKey || '');

  if (!isOpen) return null;

  const handleAcceptDisclosure = () => {
    onUpdateSettings({
      disclosureAccepted: true,
      accessibilityServiceEnabled: true,
      overlayPermissionGranted: true,
    });
    setCurrentStep(4);
  };

  const handleGrantMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      onUpdateSettings({ micPermissionGranted: true });
      setCurrentStep(3); // Go to Prominent Disclosure
    } catch {
      // Still allow proceeding with demo
      onUpdateSettings({ micPermissionGranted: true });
      setCurrentStep(3);
    }
  };

  const handleSaveApiKey = () => {
    onUpdateSettings({ groqApiKey: apiKeyInput.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              §9.2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Play Store পারমিশন ও কমপ্লায়েন্স অনবোর্ডিং
              </h3>
              <p className="text-[11px] text-slate-400">
                ধাপ {currentStep} / ৫ — Google Play Accessibility Policy কমপ্লায়েন্ট
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm">
          {/* STEP 1: WELCOME & OVERVIEW */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-cyan-200">
                    সিস্টেম-ওয়াইড ভয়েস টাইপিং অ্যাসিস্ট্যান্টে স্বাগতম
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Messenger, WhatsApp, Gmail বা যেকোনো অ্যাপের টেক্সট ফিল্ডে কিবোর্ড পরিবর্তন বা কপি-পেস্ট ছাড়া সরাসরি কথা বলে লিখুন।
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>ফ্লোটিং বাবল:</strong> Messenger Chat Head-এর মতো স্ক্রিনের প্রান্তে ভেসে থাকবে।</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Groq Whisper API:</strong> বিদ্যুৎগতির (~২ সেকেন্ড) নির্ভুল বাংলা ও ইংরেজি ট্রান্সক্রিপশন।</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>BYOK মডেল:</strong> ব্যবহারকারীর নিজস্ব API কী, কোনো লুকানো সাবস্ক্রিপশন ফি নেই।</span>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full mt-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950/60"
              >
                <span>অনবোর্ডিং শুরু করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: MICROPHONE PERMISSION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    মাইক্রোফোন পারমিশন (RECORD_AUDIO)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    আপনার কথা রেকর্ড করে Groq Whisper API-তে পাঠানোর জন্য মাইক্রোফোন পারমিশন প্রয়োজন। অডিও শুধু সাময়িক মেমরিতে থাকে এবং টেক্সট তৈরির পর সাথে সাথে ডিলিট হয়।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>• রানটাইম পারমিশন: <code className="text-cyan-300">android.permission.RECORD_AUDIO</code></p>
                <p>• Android 14+ সার্ভিস টাইপ: <code className="text-cyan-300">FOREGROUND_SERVICE_MICROPHONE</code></p>
              </div>

              <button
                onClick={handleGrantMicPermission}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Mic className="w-4 h-4" />
                <span>মাইক্রোফোন পারমিশন মঞ্জুর করুন</span>
              </button>
            </div>
          )}

          {/* STEP 3: PROMINENT DISCLOSURE (MANDATORY PLAY STORE REQUIREMENT) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  <strong>Google Play Policy রিকোয়ারমেন্ট (§9.2):</strong> এই ডিসক্লোজারটি অ্যাপের ভেতরেই দেখানো বাধ্যতামূলক। Accessibility Service কী কাজে লাগবে তা ব্যবহারকারীকে স্পষ্টভাবে অবহিত করতে হবে।
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-cyan-300">
                  কেন Accessibility Service প্রয়োজন?
                </h4>
                <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                  <p>
                    ১. <strong>সক্রিয় টেক্সট ফিল্ড শনাক্তকরণ:</strong> আপনি যে অ্যাপ ব্যবহার করছেন (যেমন WhatsApp, Keep, Gmail) তার ফোকাসড ইনপুট নোড খুঁজে পেতে।
                  </p>
                  <p>
                    ২. <strong>সরাসরি টেক্সট ইনজেকশন:</strong> ভয়েস থেকে ট্রান্সক্রাইব হওয়া টেক্সট সরাসরি কার্সার পজিশনে বসাতে (ACTION_SET_TEXT বা PASTE ফলব্যাক)।
                  </p>
                  <p>
                    ৩. <strong>সিস্টেম-ওয়াইড ফ্লোটিং বাবল:</strong> সব অ্যাপের উপরে মাইক্রোফোন বাবল দৃশ্যমান রাখতে (TYPE_ACCESSIBILITY_OVERLAY)।
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>🔒 ডেটা গোপনীয়তা প্রতিশ্রুতি:</span>
                </div>
                <p className="text-slate-300">
                  • কোনো পাসওয়ার্ড বা ব্যক্তিগত চ্যাট স্ক্রিন থেকে লগ বা সংগ্রহ করা হয় না।
                </p>
                <p className="text-slate-300">
                  • কোনো ভয়েস অডিও স্থায়ী স্টোরেজে রাখা হয় না; ট্রান্সক্রিপশনের পরেই মুছে ফেলা হয়।
                </p>
                <p className="text-slate-300">
                  • Groq API কী আপনার ডিভাইসেই এনক্রিপ্টেড স্টোরেজে থাকে।
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleAcceptDisclosure}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>আমি সম্মত ও চালু করতে চাই (Affirmative Consent)</span>
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium"
                >
                  ফিরে যান (Back)
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BATTERY OPTIMIZATION EXEMPTION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                <BatteryCharging className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    OEM ব্যাটারি অপটিমাইজেশন ছাড় (Xiaomi, Samsung, Vivo)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    কিছু ফোনে অতিরিক্ত ব্যাটারি সেভারের কারণে ব্যাকগ্রাউন্ডে বাবল বা Accessibility সার্ভিস হঠাৎ বন্ধ হয়ে যেতে পারে। অ্যাপটি মসৃণভাবে চালাতে Battery Optimization Exemption দিন।
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="font-semibold text-slate-200">ম্যানুয়াল সেটিংস গাইড:</div>
                <div className="space-y-1 text-slate-400">
                  <p>• <strong>Xiaomi (MIUI/HyperOS):</strong> Settings &gt; Apps &gt; VoiceTyping &gt; Autostart অন করুন & Battery Saver "No restrictions" নির্বাচন করুন।</p>
                  <p>• <strong>Samsung (OneUI):</strong> Settings &gt; Battery &gt; Background usage limits &gt; Never sleeping apps-এ VoiceTyping যোগ করুন।</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>পরবর্তী: Groq API Key সেটআপ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 5: GROQ BYOK SETUP */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                <Key className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    Groq Whisper API কী (BYOK - Bring Your Own Key)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    সুপার-ফাস্ট <strong>whisper-large-v3-turbo</strong> দিয়ে ট্রান্সক্রিপশন করতে আপনার Groq API কী দিন। বিনামূল্যে Groq Console থেকে কী সংগ্রহ করা যায় (~২,০০০ রিকোয়েস্ট/দিন ফ্রি)।
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Groq API Key:</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-cyan-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>API Key ডিভাইসেই সুরক্ষিতভাবে জমা থাকে।</span>
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>ফ্রি কী তৈরি করুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/30 text-xs text-cyan-200">
                💡 <em>নোট:</em> কী না দিলেও ব্রাউজারের বিল্ট-ইন Web Speech API বা ডেমো মোডে সরাসরি এখনই টেস্ট করতে পারবেন!
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>অনবোর্ডিং সম্পন্ন করুন</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
                >
                  পরে দেব
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
