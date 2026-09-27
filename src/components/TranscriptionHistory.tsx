import React, { useState } from 'react';
import { 
  History, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Cpu, 
  MessageSquare, 
  FileText, 
  Mail, 
  Search, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { TranscriptionRecord, AppTarget } from '../types';

interface TranscriptionHistoryProps {
  records: TranscriptionRecord[];
  onClearHistory: () => void;
  onReInject: (text: string) => void;
}

export const TranscriptionHistory: React.FC<TranscriptionHistoryProps> = ({
  records,
  onClearHistory,
  onReInject,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getAppBadge = (app: AppTarget) => {
    switch (app) {
      case 'messenger':
        return <span className="text-[10px] text-cyan-400 font-medium">মেসেঞ্জার চ্যাট</span>;
      case 'notes':
        return <span className="text-[10px] text-amber-400 font-medium">Keep নোটবুক</span>;
      case 'email':
        return <span className="text-[10px] text-red-400 font-medium">Gmail ড্রাফট</span>;
      case 'search':
        return <span className="text-[10px] text-blue-400 font-medium">Google সার্চ</span>;
      default:
        return <span className="text-[10px] text-slate-400 font-medium">অন্যান্য অ্যাপ</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">
            ভয়েস ট্রান্সক্রিপশন হিস্টোরি (Session Log)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {records.length} টি রেকর্ড
          </span>
        </div>

        {records.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>লগ খালি করুন</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-4 overflow-y-auto max-h-[380px] space-y-2.5">
        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">এখনও কোনো ভয়েস টাইপিং রেকর্ড হয়নি।</p>
            <p className="text-[11px] text-slate-400">
              ফোনের স্ক্রিনে যেকোনো টেক্সট ফিল্ডে ক্লিক করে ভাসমান মাইক্রোফোন বাবলে ট্যাপ করুন।
            </p>
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  {getAppBadge(rec.targetApp)}
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rec.durationSeconds}s অডিও
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                    rec.source === 'groq' 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' 
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                  }`}>
                    {rec.modelUsed}
                  </span>
                </div>
              </div>

              <p className="text-slate-100 font-medium text-[13px] leading-relaxed select-text">
                "{rec.text}"
              </p>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                <button
                  onClick={() => handleCopy(rec.id, rec.text)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] transition-colors border border-slate-800"
                >
                  {copiedId === rec.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === rec.id ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>

                <button
                  onClick={() => onReInject(rec.text)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-[11px] transition-colors border border-cyan-800/60 font-medium"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>পুনরায় ইনপুট দিন</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
