import React, { useState } from 'react';
import { 
  Info, 
  ShieldCheck, 
  FileText, 
  Volume2, 
  VolumeX, 
  Languages, 
  Sliders, 
  Cpu, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Lock,
  Zap,
  HardDrive
} from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface AboutScreenProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isUrdu: boolean;
  onToggleLang: () => void;
  onGoToDownloader: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  isMuted,
  onToggleMute,
  isUrdu,
  onToggleLang,
  onGoToDownloader
}) => {
  const [activeSection, setActiveSection] = useState<'about' | 'settings' | 'privacy' | 'terms'>('about');
  const [defaultQuality, setDefaultQuality] = useState<string>('1080p');
  const [autoClearInput, setAutoClearInput] = useState<boolean>(false);
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);

  const handleClearCache = () => {
    cyberAudio.playSuccess();
    try {
      localStorage.removeItem('rapid_download_history');
    } catch {}
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#06242c] via-[#04151b] to-[#020b0e] border border-[#00ffd5]/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00ffd5]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1.5 text-xs font-mono-cyber text-[#00ffd5]">
          <Info size={16} />
          <span>{isUrdu ? 'متعلقہ معلومات اور سیٹنگز' : 'ABOUT & SYSTEM SETTINGS'}</span>
        </div>
        <h2 className="text-lg md:text-xl font-display font-bold text-white leading-tight">
          Rapid Video Downloader
        </h2>
        <p className="text-xs text-[#a3e5dc] mt-1 leading-relaxed">
          {isUrdu 
            ? 'اعلیٰ کارکردگی، تیز رفتار، اور مکمل طور پر مفت ویڈیو ڈاؤنلوڈ پلیٹ فارم۔'
            : 'Next-generation high-speed video extractor with zero watermarks and encrypted stream processing.'}
        </p>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#00ffd5]/15 text-[11px] font-mono-cyber text-[#00ffd5]/70">
          <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-ping" />
          <span>VERSION 4.8.2 // HIGH PERF KERNEL</span>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#051821] border border-[#00ffd5]/20 rounded-xl text-center">
        {[
          { id: 'about', label: isUrdu ? 'تعارف' : 'Overview' },
          { id: 'settings', label: isUrdu ? 'سیٹنگز' : 'Settings' },
          { id: 'privacy', label: isUrdu ? 'پرائیویسی' : 'Privacy' },
          { id: 'terms', label: isUrdu ? 'شرائط' : 'Terms' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              cyberAudio.playClick();
              setActiveSection(tab.id as any);
            }}
            className={`py-2 px-1 rounded-lg text-xs font-medium font-mono-cyber transition-all ${
              activeSection === tab.id
                ? 'bg-[#00ffd5] text-[#021318] font-bold shadow'
                : 'text-[#00ffd5]/70 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW SECTION */}
      {activeSection === 'about' && (
        <div className="space-y-3.5">
          <div className="p-4 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 space-y-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-[#00ffd5]" />
              <span>{isUrdu ? 'ریپڈ ڈاؤنلوڈر کا تعارف' : 'About Rapid Downloader'}</span>
            </h3>
            <p className="text-xs text-[#98ded4] leading-relaxed">
              {isUrdu 
                ? 'ریپڈ ویڈیو ڈاؤنلوڈر ایک جدید اور طاقتور ویب ٹول ہے جو سوشل میڈیا لنکس (ٹک ٹاک، یوٹیوب، انسٹاگرام، فیس بک وغیرہ) سے فوری طور پر اصل ویڈیو اسٹریم حاصل کرتا ہے۔ یہ ویڈیو کے اندرونی واٹر مارکس کو ختم کر کے ہائی ڈیفینیشن (1080p اور 4K) میں ڈاؤنلوڈ فراہم کرتا ہے۔'
                : 'Rapid Video Downloader is an ultra-fast web utility engineered to decode and extract pure media streams directly from CDN servers across TikTok, YouTube, Instagram, Facebook, and Twitter. It removes branded watermarks and provides direct file delivery in MP4 and MP3 formats.'}
            </p>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                title: isUrdu ? 'بغیر واٹر مارک' : 'No Watermarks',
                desc: isUrdu ? 'ٹک ٹاک و انسٹاگرام لوگو مکمل غائب' : 'Clean original video without badges'
              },
              {
                title: isUrdu ? 'تیز رفتار اسٹریمنگ' : 'Multi-Threaded',
                desc: isUrdu ? 'تیز ترین سپیڈ سے ڈاؤنلوڈ' : 'Maximized throughput with zero throttling'
              },
              {
                title: isUrdu ? 'براہِ راست فائل سیو' : 'Direct Save',
                desc: isUrdu ? 'فون اور پی سی ڈاؤنلوڈز میں محفوظ' : 'Files dispatched straight to device disk'
              },
              {
                title: isUrdu ? 'مفت اور محفوظ' : '100% Free & Safe',
                desc: isUrdu ? 'کوئی لاگ ان یا اکاؤنٹ نہیں' : 'No registration, no tracking, no ads'
              }
            ].map((adv, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#031117] border border-[#00ffd5]/15 space-y-1">
                <span className="text-xs font-bold text-[#00ffd5] flex items-center gap-1.5">
                  <Check size={13} className="text-[#00ffd5] stroke-[3]" />
                  <span>{adv.title}</span>
                </span>
                <p className="text-[11px] text-[#86d4c8] leading-tight">{adv.desc}</p>
              </div>
            ))}
          </div>

          {/* Server Node Status */}
          <div className="p-3.5 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-cyber">
              <span className="text-white flex items-center gap-1.5">
                <Cpu size={14} className="text-[#00ffd5]" />
                <span>CDN Node Cluster</span>
              </span>
              <span className="text-[#00e599] font-bold">● 100% OPERATIONAL</span>
            </div>
            <div className="h-1.5 w-full bg-[#07242c] rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-[#00ffd5] to-[#00e599]" />
            </div>
            <p className="text-[10px] text-[#00ffd5]/60 font-mono-cyber">
              Ping: 18ms • Nodes: Tokyo, Frankfurt, Oregon • Bandwidth: Unlimited
            </p>
          </div>
        </div>
      )}

      {/* 2. SETTINGS SECTION */}
      {activeSection === 'settings' && (
        <div className="space-y-3">
          {/* Futuristic Cyber Audio Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#04151b] rounded-xl border border-[#00ffd5]/20">
            <div className="flex items-center gap-2.5">
              {isMuted ? <VolumeX size={18} className="text-gray-400" /> : <Volume2 size={18} className="text-[#00ffd5]" />}
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUrdu ? 'سائبر آوازیں اور بیپس' : 'Cyber Audio SFX'}
                </span>
                <span className="text-[10px] text-[#00ffd5]/60">
                  {isUrdu ? 'ٹرمینل اور کلک ساؤنڈ ایفیکٹس' : 'Futuristic sound effects & synthesized clicks'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onToggleMute();
                cyberAudio.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-cyber font-bold transition-all cursor-pointer ${
                !isMuted 
                  ? 'bg-[#00ffd5] text-[#021318]' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {isMuted ? (isUrdu ? 'بند (Muted)' : 'MUTED') : (isUrdu ? 'آن (Active)' : 'ENABLED')}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between p-3.5 bg-[#04151b] rounded-xl border border-[#00ffd5]/20">
            <div className="flex items-center gap-2.5">
              <Languages size={18} className="text-[#00ffd5]" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUrdu ? 'زبان / Language' : 'Interface Language'}
                </span>
                <span className="text-[10px] text-[#00ffd5]/60">
                  {isUrdu ? 'اردو اور انگریزی کے درمیان تبدیلی' : 'Switch between English and Urdu modes'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                cyberAudio.playClick();
                onToggleLang();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-mono-cyber font-bold bg-[#072d38] hover:bg-[#00ffd5] hover:text-[#021318] text-[#00ffd5] border border-[#00ffd5]/30 transition-all cursor-pointer"
            >
              {isUrdu ? 'English منتخب کریں' : 'اردو منتخب کریں'}
            </button>
          </div>

          {/* Default Quality Preference */}
          <div className="p-3.5 bg-[#04151b] rounded-xl border border-[#00ffd5]/20 space-y-2">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#00ffd5]" />
              <span className="text-xs font-bold text-white">
                {isUrdu ? 'پسندیدہ ڈیفالٹ کوالٹی' : 'Default Preferred Quality'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {['1080p', '720p', '480p', 'MP3'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    cyberAudio.playClick();
                    setDefaultQuality(q);
                  }}
                  className={`py-1.5 text-xs font-mono-cyber rounded-lg border transition-all cursor-pointer ${
                    defaultQuality === q
                      ? 'bg-[#00ffd5] text-[#021318] border-[#00ffd5] font-bold shadow'
                      : 'bg-[#031117] text-[#00ffd5]/70 border-[#00ffd5]/20 hover:border-[#00ffd5]/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Cache / Data */}
          <div className="flex items-center justify-between p-3.5 bg-[#04151b] rounded-xl border border-[#00ffd5]/20">
            <div className="flex items-center gap-2.5">
              <HardDrive size={18} className="text-[#00ffd5]" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUrdu ? 'عارضی ڈیٹا صاف کریں' : 'Clear Local Cache'}
                </span>
                <span className="text-[10px] text-[#00ffd5]/60">
                  {clearedNotice 
                    ? (isUrdu ? 'کیشے صاف کر دیا گیا!' : 'Cache successfully cleared!') 
                    : (isUrdu ? 'محفوظ شدہ ہسٹری ری سیٹ کریں' : 'Reset stored download history')}
                </span>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 rounded-lg text-xs font-mono-cyber font-bold bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all cursor-pointer"
            >
              {isUrdu ? 'صاف کریں' : 'Reset Data'}
            </button>
          </div>
        </div>
      )}

      {/* 3. PRIVACY POLICY */}
      {activeSection === 'privacy' && (
        <div className="p-4 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#00ffd5]" />
            <span>{isUrdu ? 'رازداری کی پالیسی (Privacy Policy)' : 'Privacy & Data Protection'}</span>
          </h3>

          <div className="space-y-2 text-xs text-[#98ded4] leading-relaxed">
            <p>
              {isUrdu
                ? 'ہم آپ کی رازداری کا مکمل احترام کرتے ہیں۔ ریپڈ ویڈیو ڈاؤنلوڈر پر آپ کی سرگرمیاں 100٪ گمنام اور نجی ہیں۔'
                : 'Rapid Video Downloader is committed to absolute user privacy. Our service requires zero user registration, retains no logs, and operates entirely in RAM.'}
            </p>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-start gap-1.5">
                <span className="text-[#00ffd5]">✓</span>
                <span>{isUrdu ? 'کوئی ذاتی معلومات یا آئی پی ایڈریس محفوظ نہیں کیا جاتا۔' : 'Zero logs policy: IP addresses and user search queries are never recorded.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#00ffd5]">✓</span>
                <span>{isUrdu ? 'ویڈیوز براہِ راست آپ کے براؤزر میں ڈاؤنلوڈ ہوتی ہیں، سرور پر کاپی نہیں رکھی جاتی۔' : 'Files are streamed in real time without being cached or stored on our servers.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#00ffd5]">✓</span>
                <span>{isUrdu ? 'تمام ٹریفک HTTPS انکرپشن کے ذریعے محفوظ ہوتی ہے۔' : 'All incoming and outgoing traffic is protected by end-to-end SSL/TLS encryption.'}</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 4. TERMS OF SERVICE */}
      {activeSection === 'terms' && (
        <div className="p-4 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-[#00ffd5]" />
            <span>{isUrdu ? 'استعمال کی شرائط (Terms of Service)' : 'Terms of Service & Fair Use'}</span>
          </h3>

          <div className="space-y-2 text-xs text-[#98ded4] leading-relaxed">
            <p>
              {isUrdu
                ? 'یہ ٹول صرف ذاتی اور تعلیمی مقاصد کے لیے بنایا گیا ہے۔ براہ کرم تخلیق کاروں کے جملہ حقوق کا احترام کریں۔'
                : 'Rapid Video Downloader is provided strictly for personal, non-commercial offline backup and educational use.'}
            </p>
            <p>
              {isUrdu
                ? 'کسی بھی کاپی رائٹ شدہ مواد کو بغیر اجازت تجارتی مقاصد کے لیے استعمال کرنا منع ہے۔'
                : 'Users are solely responsible for ensuring that their downloading activities comply with the applicable terms of service and copyright laws of content owners.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
