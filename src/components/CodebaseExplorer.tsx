import React, { useState } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  FolderTree, 
  Sparkles, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Terminal
} from 'lucide-react';
import { KOTLIN_CODEBASE } from '../data/kotlinCodebase';
import { KotlinFile } from '../types';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(KOTLIN_CODEBASE[0].id);
  const [copied, setCopied] = useState(false);

  const activeFile = KOTLIN_CODEBASE.find((f) => f.id === selectedFileId) || KOTLIN_CODEBASE[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate combined bundle or single file download
    const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const categories = Array.from(new Set(KOTLIN_CODEBASE.map((f) => f.category)));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
      {/* Top Header */}
      <div className="p-4 px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Android Kotlin + Jetpack Compose আর্কিটেকচার কোডবেস
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            MVVM + Clean Architecture · minSdk 26 · targetSdk 36 (Android 16) · Hilt + Coroutines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'কপি হয়েছে!' : 'ফাইল কপি করুন'}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ডাউনলোড ({activeFile.filename})</span>
          </button>
        </div>
      </div>

      {/* Explorer Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Sidebar File Tree */}
        <div className="md:col-span-4 border-r border-slate-800/80 bg-slate-950/50 p-3 space-y-4 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 py-1">
                {cat}
              </div>
              <div className="space-y-0.5">
                {KOTLIN_CODEBASE.filter((f) => f.category === cat).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                      selectedFileId === file.id
                        ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${selectedFileId === file.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Architecture Insights Callout */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>গুরুত্বপূর্ণ গটচা (Gotcha):</span>
            </div>
            <p className="leading-relaxed">
              WindowManager-এ সরাসরি যুক্ত View-এর নিজস্ব লাইফসাইকেল থাকে না। তাই ComposeView-কে ম্যানুয়ালি <code>OverlayLifecycleOwner</code> বাইন্ড করা হয়েছে যাতে ক্র্যাশ না হয়।
            </p>
          </div>
        </div>

        {/* Code Content Panel */}
        <div className="md:col-span-8 flex flex-col bg-slate-950/90 overflow-hidden">
          {/* File Meta Header */}
          <div className="p-3 px-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
            <div className="font-mono text-cyan-300 font-medium truncate">
              {activeFile.path}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 ml-2">
              Kotlin / Jetpack Compose
            </span>
          </div>

          {/* Description banner */}
          <div className="px-5 py-2.5 bg-cyan-950/20 border-b border-cyan-900/20 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span>{activeFile.description}</span>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 p-4 overflow-x-auto overflow-y-auto max-h-[580px]">
            <pre className="font-mono text-xs text-slate-200 leading-relaxed">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
