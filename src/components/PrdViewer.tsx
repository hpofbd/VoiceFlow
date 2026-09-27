import React, { useState } from 'react';
import { 
  FileText, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const PrdViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'architecture' | 'policy' | 'groq'>('summary');
  const [copiedCurl, setCopiedCurl] = useState(false);

  const curlCode = `curl https://api.groq.com/openai/v1/audio/transcriptions \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -F "file=@recording.m4a" \\
  -F "model=whisper-large-v3-turbo" \\
  -F "response_format=json"`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCode);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              PRD v1.0
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              সিস্টেম-ওয়াইড ভয়েস টাইピング অ্যাসিস্ট্যান্ট — Product Requirements Document
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            প্ল্যাটফর্ম: Android (Kotlin + Jetpack Compose) · স্ট্যাটাস: Development Ready · তারিখ: সেপ্টেম্বর ২০২৬
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'summary' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            সারসংক্ষেপ ও লক্ষ্য
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'architecture' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            টেকনিক্যাল আর্কিটেকচার
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'policy' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Play Store কমপ্লায়েন্স (§৯.২)
          </button>
          <button
            onClick={() => setActiveTab('groq')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'groq' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Groq Whisper API
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6 text-xs text-slate-300 space-y-6 max-h-[600px] overflow-y-auto">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-cyan-300">১. এক্সিকিউটিভ সামারি</h4>
              <p className="leading-relaxed text-slate-300">
                এই অ্যাপটি একটি সিস্টেম-ওয়াইড ভয়েস টাইピング টুল, যা Android-এর <strong>Accessibility Service</strong> এবং একটি <strong>Floating Overlay Bubble</strong> ব্যবহার করে যেকোনো অ্যাপের যেকোনো টেক্সট ফিল্ডে ভয়েস দিয়ে লেখার সুবিধা দেয়। Messenger-এর Chat Head-এর মতো একটি মাইক্রোফোন বাবল সবসময় স্ক্রিনের উপরে ভাসতে থাকে। ব্যবহারকারী বাবলে ট্যাপ করে কথা বললে, অডিও Groq-এর Whisper API-তে পাঠানো হয়, টেক্সটে রূপান্তরিত হয়ে সরাসরি সক্রিয় (focused) ইনপুট ফিল্ডে বসে যায় — কিবোর্ড পরিবর্তন বা কপি-পেস্টের প্রয়োজন ছাড়াই।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>কোর গোলস (Goals)</span>
                </h5>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>যেকোনো অ্যাপে এক ট্যাপে ভয়েস টাইপিং সক্রিয় করা</li>
                  <li>রেকর্ডিং শেষ হওয়ার পর টার্গেট ~২–৩ সেকেন্ডের মধ্যে টেক্সট ইনজেকশন</li>
                  <li>Messenger Chat Head-এর মতো হালকা, ড্র্যাগযোগ্য, edge-snapping বাবল</li>
                  <li>ইউজারের নিজস্ব Groq API কী ব্যবহার (BYOK মডেল)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>নন-গোলস (Non-Goals Phase 1)</span>
                </h5>
                <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                  <li>অফলাইন স্পিচ-টু-টেক্সট (Phase 3-এর জন্য সংরক্ষিত)</li>
                  <li>ভয়েস কমান্ডে অ্যাপ কন্ট্রোল/নেভিগেশন</li>
                  <li>মাল্টি-স্পিকার ডায়ারাইজেশন</li>
                  <li>iOS ভার্সন (Android exclusive)</li>
                </ul>
              </div>
            </div>

            {/* Scope Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200">ফাংশনাল রিকোয়ারমেন্টস ম্যাট্রিক্স (FR-1 থেকে FR-7)</h4>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-2.5 font-semibold">ID</th>
                      <th className="p-2.5 font-semibold">ফিচার</th>
                      <th className="p-2.5 font-semibold">বিবরণ</th>
                      <th className="p-2.5 font-semibold">Acceptance Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-1</td>
                      <td className="p-2.5 font-medium text-slate-100">Floating Overlay Bubble</td>
                      <td className="p-2.5">সব অ্যাপের উপরে ভাসমান, ড্র্যাগযোগ্য বাবল</td>
                      <td className="p-2.5">হোম থেকে ৩য় পক্ষের অ্যাপ পর্যন্ত সবসময় উপরে থাকে; ছাড়লে প্রান্তে snap করে</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-2</td>
                      <td className="p-2.5 font-medium text-slate-100">Focused Field Detection</td>
                      <td className="p-2.5">Accessibility Service সক্রিয় ফিল্ড চিনে নেয়</td>
                      <td className="p-2.5">কোনো এডিটেবল নোড না পেলে টোস্ট হিন্ট দেখায় ("টেক্সট ফিল্ড খুঁজে পাওয়া যায়নি")</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-3</td>
                      <td className="p-2.5 font-medium text-slate-100">ভয়েস রেকর্ডিং</td>
                      <td className="p-2.5">ট্যাপ-স্টার্ট / ট্যাপ-স্টপ, ৬০ সে. অটো-স্টপ</td>
                      <td className="p-2.5">রেকর্ডিং চলাকালীন লাইভ পালস ও টাইমার দেখায়; মাইক্রোফোন পারমিশন হ্যান্ডলিং</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-4</td>
                      <td className="p-2.5 font-medium text-slate-100">Groq Whisper API</td>
                      <td className="p-2.5">অডিও থেকে উচ্চগতির বাংলা ও ইংরেজি রূপান্তর</td>
                      <td className="p-2.5">whisper-large-v3-turbo দিয়ে ~২ সেকেন্ডে টেক্সট ফেরত পাওয়া; রিট্রাই হ্যান্ডলিং</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-5</td>
                      <td className="p-2.5 font-medium text-slate-100">টেক্সট ইনজেকশন</td>
                      <td className="p-2.5">কার্সারে টেক্সট বসানো</td>
                      <td className="p-2.5">ACTION_SET_TEXT না থাকলে ক্লিপবোর্ড + ACTION_PASTE ফলব্যাক</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-6</td>
                      <td className="p-2.5 font-medium text-slate-100">Settings ও BYOK</td>
                      <td className="p-2.5">ইউজারের নিজস্ব Groq API কী স্টোরেজ</td>
                      <td className="p-2.5">EncryptedSharedPreferences-এ সংরক্ষিত, মাস্কড ডিসপ্লে</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-cyan-400 font-bold">FR-7</td>
                      <td className="p-2.5 font-medium text-slate-100">পারমিশন অনবোর্ডিং</td>
                      <td className="p-2.5">Prominent Disclosure সহ অনবোর্ডিং ফ্লো</td>
                      <td className="p-2.5">Accessibility কী ডেটা দেখে তার affirmative-consent ডিসক্লোজার প্রথম ব্যবহারেই</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ARCHITECTURE TAB */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">সিস্টেম সার্ভিস</span>
                <div className="font-semibold text-slate-100 mt-1">VoiceTypingAccessibilityService</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  <code>TYPE_ACCESSIBILITY_OVERLAY</code> উইন্ডো ও <code>findFocus(FOCUS_INPUT)</code> হ্যান্ডলার।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">রেকর্ডিং সার্ভিস</span>
                <div className="font-semibold text-slate-100 mt-1">RecordingForegroundService</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Android 14+ <code>FOREGROUND_SERVICE_MICROPHONE</code> ও <code>MediaRecorder</code> .m4a এনকোডিং।
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">UI লেয়ার</span>
                <div className="font-semibold text-slate-100 mt-1">Compose Overlay Bubble</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  কাস্টম <code>OverlayLifecycleOwner</code> বাইন্ডিং সহ Jetpack Compose বাবল।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-100">টেক স্ট্যাক স্পেসিফিকেশন</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">ভাষা:</span>
                  <div className="font-semibold text-cyan-300">Kotlin 2.0+</div>
                </div>
                <div>
                  <span className="text-slate-400">UI ফ্রেমওয়ার্ক:</span>
                  <div className="font-semibold text-cyan-300">Jetpack Compose</div>
                </div>
                <div>
                  <span className="text-slate-400">মিনিমাম SDK:</span>
                  <div className="font-semibold text-cyan-300">API 26 (Android 8.0)</div>
                </div>
                <div>
                  <span className="text-slate-400">টার্গেট SDK:</span>
                  <div className="font-semibold text-cyan-300">API 36 (Android 16)</div>
                </div>
                <div>
                  <span className="text-slate-400">Dependency Injection:</span>
                  <div className="font-semibold text-cyan-300">Hilt</div>
                </div>
                <div>
                  <span className="text-slate-400">নেটওয়ার্ক ক্লায়েন্ট:</span>
                  <div className="font-semibold text-cyan-300">Retrofit + OkHttp</div>
                </div>
                <div>
                  <span className="text-slate-400">লোকাল স্টোরেজ:</span>
                  <div className="font-semibold text-cyan-300">DataStore + EncryptedPrefs</div>
                </div>
                <div>
                  <span className="text-slate-400">অ্যাসিঙ্ক ইঞ্জিন:</span>
                  <div className="font-semibold text-cyan-300">Coroutines + StateFlow</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POLICY TAB (§9.2) */}
        {activeTab === 'policy' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Google Play Accessibility API পলিসি — গুরুত্বপূর্ণ ঝুঁকি ও গাইডলাইন (§৯.২)</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Google Play-র নীতি অনুযায়ী, একটি সাধারণ ভয়েস অ্যাসিস্ট্যান্ট বা প্রোডাক্টিভিটি অ্যাপ <code>isAccessibilityTool=true</code> হিসেবে ছাড় পায় না। এই কারণে অ্যাপটিকে <strong>Prominent Disclosure & Consent</strong> রিকোয়ারমেন্ট ১০০% কঠোরভাবে মানতে হবে, অন্যথায় অ্যাপ সাসপেনশন হতে পারে।
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="font-semibold text-slate-100">বাধ্যতামূলক শর্তসমূহ:</h5>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>অ্যাপের ভেতরেই ডিসক্লোজার:</strong> শুধু Play Store ডেসক্রিপশন বা প্রাইভেসি পলিসিতে থাকলে চলবে না; প্রথম লঞ্চেই আলাদা ডিসক্লোজার স্ক্রিন প্রদর্শন করতে হবে।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>সুনির্দিষ্ট ডেটা ব্যবহারের ব্যাখ্যা:</strong> Accessibility Service কেবল ফোকাসড এডিটেবল নোড পড়ে টেক্সট ইনজেকশনের জন্য, কোনো পাসওয়ার্ড বা ব্যক্তিগত চ্যাট পড়ে না।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Affirmative Consent:</strong> ব্যবহারকারীকে "আমি সম্মত ও চালু করতে চাই" বাটনে ক্লিক করে স্পষ্ট সম্মতি দিতে হবে।</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>অডিও ফাইল ক্ষণস্থায়ী:</strong> কোনো অডিও লোকাল স্টোরেজে স্থায়ীভাবে সংরক্ষণ করা হয় না, ট্রান্সক্রিপশন শেষেই <code>temp_voice_clip.m4a</code> মুছে ফেলা হয়।</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GROQ WHISPER API TAB */}
        {activeTab === 'groq' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-cyan-300">Groq Whisper Transcription Endpoint</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  OpenAI-Compatible
                </span>
              </div>
              
              <div className="relative">
                <pre className="p-3 bg-black/60 rounded-xl border border-slate-800 font-mono text-cyan-200 text-xs overflow-x-auto">
                  <code>{curlCode}</code>
                </pre>
                <button
                  onClick={handleCopyCurl}
                  className="absolute right-2 top-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium rounded border border-slate-700 transition-colors"
                >
                  {copiedCurl ? 'কপি হয়েছে' : 'কপি curl'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">প্রস্তাবিত মডেল:</span>
                  <div className="font-bold text-cyan-300 mt-0.5">whisper-large-v3-turbo</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">স্পিড ফ্যাক্টর:</span>
                  <div className="font-bold text-emerald-300 mt-0.5">~২১৬-২২৮x রিয়েলটাইম</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">প্রাইসিং:</span>
                  <div className="font-bold text-amber-300 mt-0.5">~$০.০৪ / ঘণ্টা</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">ফ্রি টায়ার:</span>
                  <div className="font-bold text-purple-300 mt-0.5">~২,০০০ রিকোয়েস্ট/দিন</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
