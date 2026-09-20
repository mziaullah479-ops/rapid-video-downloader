import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Video, 
  Music, 
  ShieldCheck, 
  Download, 
  Zap, 
  ExternalLink,
  Smartphone,
  Laptop,
  ChevronDown,
  Layers
} from 'lucide-react';
import { SUPPORTED_PLATFORMS } from '../data/mockVideos';
import { cyberAudio } from '../utils/audio';
import { PlatformIcon } from './PlatformIcons';

interface GuideScreenProps {
  isUrdu?: boolean;
  onGoToDownloader: () => void;
}

export const GuideScreen: React.FC<GuideScreenProps> = ({ isUrdu = false, onGoToDownloader }) => {
  const [activeTab, setActiveTab] = useState<'how-to' | 'platforms' | 'faq'>('how-to');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = isUrdu ? [
    {
      q: 'کیا یہ ویڈیو ڈاؤنلوڈر بالکل مفت ہے؟',
      a: 'جی ہاں! ریپڈ ویڈیو ڈاؤنلوڈر 100٪ مفت ہے اور اس کے لیے کسی اکاؤنٹ یا سبسکرپشن کی ضرورت نہیں ہے۔'
    },
    {
      q: 'ڈاؤنلوڈ شدہ ویڈیوز میرے موبائل یا کمپیوٹر میں کہاں محفوظ ہوتی ہیں؟',
      a: 'جب آپ "SAVE FILE TO DEVICE" پر کلک کرتے ہیں تو فائل خودکار طور پر آپ کے فون کے "Downloads" فولڈر یا کمپیوٹر کی ڈیفالٹ ڈاؤنلوڈ ڈائرکٹری میں محفوظ ہو جاتی ہے۔'
    },
    {
      q: 'کیا ٹک ٹاک اور انسٹاگرام ویڈیوز بغیر واٹر مارک ڈاؤنلوڈ ہوتی ہیں؟',
      a: 'بالکل! ہمارا سائبر بائی پاس انجن براہ راست سی ڈی این سے اصل ویڈیو اسٹریم حاصل کرتا ہے جس سے ٹک ٹاک اور انسٹاگرام کا واٹر مارک مکمل طور پر ختم ہو جاتا ہے۔'
    },
    {
      q: 'کیا میں صرف آڈیو (MP3) ڈاؤنلوڈ کر سکتا ہوں؟',
      a: 'جی ہاں، کوالٹی لسٹ میں "Audio Only (MP3)" منتخب کر کے آپ کسی بھی ویڈیو سے 320 kbps ہائی کوالٹی آڈیو فائل حاصل کر سکتے ہیں۔'
    },
    {
      q: 'کیا ڈاؤنلوڈ کرنے کی کوئی روزانہ حد ہے؟',
      a: 'نہیں! آپ جتنی چاہیں ویڈیوز بغیر کسی پابندی یا اسپیڈ کی کمی کے ڈاؤنلوڈ کر سکتے ہیں۔'
    }
  ] : [
    {
      q: 'Is Rapid Video Downloader completely free to use?',
      a: 'Yes, 100% free! There are no hidden fees, paid tiers, or account registrations required. Unlimited downloads forever.'
    },
    {
      q: 'Where are downloaded files saved on my device?',
      a: 'When you click "SAVE FILE TO DEVICE", files are directly dispatched by your browser to your device’s default Downloads folder (Files app on mobile, or Downloads folder on PC/Mac).'
    },
    {
      q: 'Can every TikTok and Instagram link be downloaded?',
      a: 'No. A download works only when the platform exposes a public stream and you have permission to save it. Private content, DRM, and watermark removal are not supported.'
    },
    {
      q: 'Can I extract audio only (MP3) from videos?',
      a: 'When the public source provides audio extraction, select the audio option. Availability and format depend on the source and the free server limits.'
    },
    {
      q: 'Is there any download limit or throttling?',
      a: 'No daily or bandwidth limits. You can download as many videos as you want at maximum connection speed.'
    }
  ];

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#06242c] via-[#04151b] to-[#020b0e] border border-[#00ffd5]/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00ffd5]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-1.5 text-xs font-mono-cyber text-[#00ffd5]">
          <BookOpen size={16} />
          <span>{isUrdu ? 'مکمل گائیڈ اور پلیٹ فارمز' : 'PLATFORMS & USER GUIDE'}</span>
        </div>
        <h2 className="text-lg md:text-xl font-display font-bold text-white leading-tight">
          {isUrdu ? 'ویڈیوز ڈاؤنلوڈ کرنے کا آسان طریقہ کار' : 'Master Any Video Stream in Seconds'}
        </h2>
        <p className="text-xs text-[#a3e5dc] mt-1 leading-relaxed">
          {isUrdu 
            ? 'کسی بھی سوشل میڈیا پلیٹ فارم سے ویڈیو کا لنک کاپی کریں، اور بغیر واٹر مارک کے ہائی ڈیفینیشن میں محفوظ کریں۔'
             : 'Resolve public media links, inspect available formats, and save authorized files without bypassing platform protections.'}
        </p>

        {/* Action Button to Home */}
        <button
          onClick={() => {
            cyberAudio.playClick();
            onGoToDownloader();
          }}
          className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#00ffd5] text-[#021318] text-xs font-bold font-display uppercase tracking-wider hover:bg-[#00e599] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,213,0.4)]"
        >
          <Zap size={14} className="fill-[#021318]" />
          <span>{isUrdu ? 'ڈاؤنلوڈر پر جائیں' : 'GO TO DOWNLOADER'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#051821] border border-[#00ffd5]/20 rounded-xl">
        <button
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('how-to');
          }}
          className={`py-2 px-1 rounded-lg text-xs font-medium font-mono-cyber transition-all ${
            activeTab === 'how-to'
              ? 'bg-[#00ffd5] text-[#021318] font-bold shadow'
              : 'text-[#00ffd5]/70 hover:text-white'
          }`}
        >
          {isUrdu ? 'طریقہ کار' : 'How It Works'}
        </button>

        <button
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('platforms');
          }}
          className={`py-2 px-1 rounded-lg text-xs font-medium font-mono-cyber transition-all ${
            activeTab === 'platforms'
              ? 'bg-[#00ffd5] text-[#021318] font-bold shadow'
              : 'text-[#00ffd5]/70 hover:text-white'
          }`}
        >
          {isUrdu ? 'پلیٹ فارمز' : 'Platforms'}
        </button>

        <button
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('faq');
          }}
          className={`py-2 px-1 rounded-lg text-xs font-medium font-mono-cyber transition-all ${
            activeTab === 'faq'
              ? 'bg-[#00ffd5] text-[#021318] font-bold shadow'
              : 'text-[#00ffd5]/70 hover:text-white'
          }`}
        >
          {isUrdu ? 'عمومی سوالات' : 'FAQs'}
        </button>
      </div>

      {/* Tab 1: How It Works */}
      {activeTab === 'how-to' && (
        <div className="space-y-3.5">
          {/* 3 Step Cards */}
          <div className="space-y-2.5">
            {[
              {
                step: '01',
                title: isUrdu ? 'لنک کاپی کریں (Copy URL)' : 'Copy Video Link',
                desc: isUrdu 
                  ? 'ٹک ٹاک، یوٹیوب یا فیس بک ایپ پر "Share" دبائیں اور "Copy Link" منتخب کریں۔'
                  : 'Open TikTok, YouTube, Instagram or Facebook, click Share and tap "Copy Link".',
                icon: ExternalLink
              },
              {
                step: '02',
                title: isUrdu ? 'پیسٹ کریں اور کوالٹی منتخب کریں' : 'Paste & Select Quality',
                desc: isUrdu
                  ? 'ہمارے ہوم پیج پر لنک پیسٹ کر کے بٹن دبائیں۔ ویڈیو کے نیچے 1080p، 720p یا MP3 کوالٹی چنیں۔'
                  : 'Paste the link on our Downloader page. Choose Full HD 1080p, 720p or MP3 Audio right below.',
                icon: Layers
              },
              {
                step: '03',
                title: isUrdu ? 'فائل ڈیوائس پر محفوظ کریں' : 'Download Direct to Device',
                desc: isUrdu
                  ? 'ڈاؤنلوڈ بٹن دبائیں۔ ویڈیو بغیر واٹر مارک فوری طور پر آپ کے فون یا کمپیوٹر میں محفوظ ہو جائے گی۔'
                  : 'Click "DOWNLOAD" and "SAVE TO DEVICE". The clean file is stored directly in your local Downloads folder.',
                icon: Download
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 hover:border-[#00ffd5]/50 transition-all flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] flex items-center justify-center font-mono-cyber font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Icon size={14} className="text-[#00ffd5]" />
                      <span>{item.title}</span>
                    </h4>
                    <p className="text-xs text-[#98ded4] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Device Tips Box */}
          <div className="p-3.5 rounded-xl bg-[#031117] border border-[#00ffd5]/20 space-y-2">
            <h4 className="text-xs font-mono-cyber font-bold text-[#00ffd5] flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>{isUrdu ? 'موبائل اور پی سی کے لیے مفید ہدایات' : 'Platform Compatibility'}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#aae9e0]">
              <div className="p-2 rounded-lg bg-[#051d25] border border-[#00ffd5]/15 flex items-center gap-2">
                <Smartphone size={16} className="text-[#00ffd5] shrink-0" />
                <div>
                  <span className="font-bold block text-white">Android & iPhone</span>
                  <span className="text-[10px] text-[#00ffd5]/70">Chrome, Safari, Brave</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#051d25] border border-[#00ffd5]/15 flex items-center gap-2">
                <Laptop size={16} className="text-[#00ffd5] shrink-0" />
                <div>
                  <span className="font-bold block text-white">Windows & Mac</span>
                  <span className="text-[10px] text-[#00ffd5]/70">Edge, Firefox, Chrome</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Supported Platforms */}
      {activeTab === 'platforms' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUPPORTED_PLATFORMS.map((platform) => (
              <div 
                key={platform.id}
                className="p-3 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#051821] border border-[#00ffd5]/30">
                  <PlatformIcon platformId={platform.id} size={28} />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white truncate">
                      {platform.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/15 text-[#00ffd5] font-mono-cyber">
                       PUBLIC SOURCE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#91dbd0] leading-snug">
                     {platform.id === 'tiktok' 
                       ? (isUrdu ? 'صرف عوامی یا مجاز ویڈیو اسٹریمز دستیاب ہوں تو محفوظ کریں۔' : 'Save public or authorized streams when the platform exposes them.')
                      : platform.id === 'youtube'
                      ? (isUrdu ? 'یوٹیوب 1080p فل ایچ ڈی، شارٹس اور 320 kbps ایم پی تھری۔' : 'Full HD 1080p, Shorts, 60fps streams, MP3 track.')
                      : platform.id === 'instagram'
                      ? (isUrdu ? 'انسٹاگرام ریلز، پوسٹس اور کہانیاں اصل ریزولوشن میں۔' : 'Instagram Reels & carousel videos in clean MP4.')
                      : platform.id === 'facebook'
                      ? (isUrdu ? 'فیس بک واچ اور ریلز اصل کوالٹی میں۔' : 'Facebook Watch & Reels in high definition.')
                      : (isUrdu ? 'اصل کوالٹی میں تیز رفتار ڈاؤنلوڈ۔' : 'Ultra-fast direct media packet extraction.')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Formats support */}
          <div className="p-3.5 rounded-xl bg-[#04151b] border border-[#00ffd5]/20 space-y-2">
            <h4 className="text-xs font-mono-cyber font-bold text-[#00ffd5] flex items-center gap-1.5">
              <Video size={14} />
              <span>{isUrdu ? 'سپورٹ شدہ فارمیٹس اور ریزولوشن' : 'Supported Formats & Resolutions'}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['MP4 (1080p 60fps)', 'MP4 (720p HD)', 'MP4 (480p SD)', 'MP3 (320 kbps Audio)', 'M4A Stereo', 'WEBM'].map((fmt, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#062630] border border-[#00ffd5]/30 text-[#00ffd5] font-mono-cyber text-[11px]">
                  ✓ {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: FAQs */}
      {activeTab === 'faq' && (
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-xl bg-[#04151b] border border-[#00ffd5]/20 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => {
                    cyberAudio.playClick();
                    setOpenFaq(isOpen ? null : idx);
                  }}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-white hover:text-[#00ffd5] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle size={14} className="text-[#00ffd5] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#00ffd5] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-xs text-[#98ded4] leading-relaxed border-t border-[#00ffd5]/10 pt-2 bg-[#031117]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
