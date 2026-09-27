import React, { useState } from 'react';
import { Download, Database, Server, CheckCircle2, Copy, Check, ExternalLink, HardDrive, ShieldCheck } from 'lucide-react';
import { HOSTINGER_SQL_SCHEMA } from '../../lib/hostingerSql';

interface HostingerDatabaseCardProps {
  showToast: (msg: string) => void;
}

export const HostingerDatabaseCard: React.FC<HostingerDatabaseCardProps> = ({ showToast }) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [dbHost, setDbHost] = useState('localhost');
  const [dbUser, setDbUser] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleDownloadSql = () => {
    try {
      const blob = new Blob([HOSTINGER_SQL_SCHEMA], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'indianlalaji_hostinger_database.sql');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('✅ Hostinger SQL Database Schema Downloaded! Import this into Hostinger phpMyAdmin.');
    } catch {
      showToast('❌ Failed to trigger file download.');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedStep(null), 2500);
  };

  const handleSaveHostingerConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('hostinger_db_config', JSON.stringify({
        dbHost,
        dbUser,
        dbName,
        savedAt: new Date().toISOString()
      }));
      setIsSaved(true);
      showToast('✅ Hostinger Database Configuration Saved!');
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      showToast('Error saving settings');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600">
            <Server className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Hostinger MySQL Database & phpMyAdmin Migration
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                Direct Hostinger DB
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hostinger cPanel / hPanel MySQL Database setup • Firebase से पूरी तरह स्वतंत्र
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSql}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Download Hostinger SQL Dump (.sql)</span>
        </button>
      </div>

      {/* 4 Step Setup Guide in Hindi */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <HardDrive className="w-4 h-4 text-amber-600" />
          <span>Hostinger Database Setup Steps (Hostinger में डेटाबेस कैसे सेटअप करें):</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#123B6D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#123B6D] font-black flex items-center justify-center text-[10px]">1</span>
              <span>Hostinger hPanel खोलें</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Hostinger में लॉगिन करके <strong>Databases &gt; MySQL Databases</strong> सेक्शन में जाएँ।
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#123B6D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#123B6D] font-black flex items-center justify-center text-[10px]">2</span>
              <span>नया Database और User बनाएँ</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Database Name (उदा. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">u123_labshop</code>), Username और मजबूत Password डालें और <strong>Create</strong> पर क्लिक करें।
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#123B6D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#123B6D] font-black flex items-center justify-center text-[10px]">3</span>
              <span>phpMyAdmin खोलें और Import करें</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              बने हुए डेटाबेस के सामने <strong>Enter phpMyAdmin</strong> पर क्लिक करें। ऊपर <strong>Import</strong> टैब दबाएँ और ऊपर दिए गए बटन से डाउनलोड की हुई <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">indianlalaji_hostinger_database.sql</code> फाइल सेलेक्ट करें।
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#123B6D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#123B6D] font-black flex items-center justify-center text-[10px]">4</span>
              <span>100% Hostinger Ready</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Import होते ही सभी 10 टेबल्स (मरीज़, टेस्ट्स, बिलिंग, रिपोर्ट्स, स्टाफ, सेटिंग्स) सीधे Hostinger MySQL पर लाइव तैयार हो जाएँगे।
            </p>
          </div>
        </div>
      </div>

      {/* Hostinger Database Credentials Input Form */}
      <form onSubmit={handleSaveHostingerConfig} className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800">
            Hostinger Database Connection Settings (hostinger_db_config)
          </h4>
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">MySQL Host</label>
            <input
              type="text"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              placeholder="localhost or mysql.hostinger.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Database Name</label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="u123456789_indianlalaji"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">MySQL Username</label>
            <input
              type="text"
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              placeholder="u123456789_admin"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">MySQL Password</label>
            <input
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Super Admin: <strong className="text-slate-800">rkmehra331996@gmail.com</strong> is pre-seeded in the Hostinger schema.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#123B6D] hover:bg-[#0e2c52] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs active:scale-95"
            >
              Save Hostinger Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
