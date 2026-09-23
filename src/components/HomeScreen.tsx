import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Link2,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import { PlatformInfo } from '../types';
import { SUPPORTED_PLATFORMS } from '../data/mockVideos';
import { cyberAudio } from '../utils/audio';
import { detectPlatform } from '../utils/videoResolver';
import { PlatformIcon } from './PlatformIcons';
import { InstallAppButton } from './InstallAppButton';

interface HomeScreenProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (url: string) => void;
  isUrdu?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  url,
  setUrl,
  onAnalyze,
  isUrdu = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformInfo | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const detectedPlatform = url.trim() ? detectPlatform(url) : null;

  const submit = () => {
    const target = url.trim();
    if (!target) {
      inputRef.current?.focus();
      return;
    }
    cyberAudio.playClick();
    onAnalyze(target);
  };

  const handlePaste = async () => {
    cyberAudio.playClick();
    setIsPasting(true);
    try {
      const clipboardText = await navigator.clipboard?.readText();
      if (clipboardText?.trim()) setUrl(clipboardText.trim());
    } catch {
      inputRef.current?.focus();
    } finally {
      setIsPasting(false);
    }
  };

  const handlePlatformClick = (platform: PlatformInfo) => {
    cyberAudio.playClick();
    setSelectedPlatform(platform);
    if (platform.sampleUrl) {
      setUrl(platform.sampleUrl);
      onAnalyze(platform.sampleUrl);
      return;
    }
    inputRef.current?.focus();
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300 pb-4 font-mono-cyber">
      <div className="space-y-1 px-1">
        <h1 className="text-lg md:text-xl font-display font-bold text-white leading-tight">
          {isUrdu ? 'عوامی میڈیا کے لیے مفت ویڈیو ڈاؤنلوڈر' : 'Free video downloader for public media'}
        </h1>
        <p className="text-sm md:text-base font-display font-medium text-[#7feadc] leading-snug">
          {isUrdu
            ? 'ایک یو آر ایل۔ تمام پلیٹ فارمز۔ ایک ڈاؤنلوڈ انجن۔'
            : 'One URL. Multiple Platforms. One Download Engine.'}
        </p>
        <p className="text-xs text-[#00ffd5]/65 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
           <span>MEDIA RESOLVER // QUALITY-AWARE STREAMS</span>
        </p>
      </div>

      <InstallAppButton isUrdu={isUrdu} />

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-[#00ffd5]/85 font-semibold tracking-wider">
            {isUrdu ? 'تعاون یافتہ پلیٹ فارمز:' : 'SUPPORTED PLATFORMS:'}
          </span>
          {detectedPlatform && detectedPlatform.id !== 'other' && (
            <span className="text-[11px] text-[#00ffd5] flex items-center gap-1 bg-[#00ffd5]/10 px-2 py-0.5 rounded-full border border-[#00ffd5]/30">
              <PlatformIcon platformId={detectedPlatform.id} size={13} />
              {detectedPlatform.name} {isUrdu ? 'شناخت ہوا' : 'Detected'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const isDetected = detectedPlatform?.id === platform.id;
            const isSelected = selectedPlatform?.id === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform)}
                className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                  isDetected || isSelected
                    ? 'bg-[#00ffd5]/15 border-2 border-[#00ffd5] shadow-[0_0_18px_rgba(0,255,213,0.35)] scale-[1.03]'
                    : 'bg-[#051821]/85 hover:bg-[#082933] border border-[#00ffd5]/20 hover:border-[#00ffd5]/70 hover:shadow-[0_0_12px_rgba(0,255,213,0.25)]'
                }`}
                title={platform.sampleUrl ? `Try ${platform.name} example` : `Paste a ${platform.name} URL`}
              >
                <PlatformIcon platformId={platform.id} size={30} />
                <span className="text-[11px] font-medium text-[#c0f0eb] mt-1.5 truncate max-w-full font-display">
                  {platform.name}
                </span>
                {!platform.sampleUrl && (
                  <span className="absolute top-1 right-1 text-[8px] text-[#7feadc]">URL</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[#00ffd5]/60 pointer-events-none">
            <Link2 size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            aria-label={isUrdu ? 'ویڈیو کا لنک' : 'Video URL'}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            placeholder={
              selectedPlatform
                ? `Paste ${selectedPlatform.name} URL here...`
                : isUrdu
                  ? 'یہاں ویڈیو کا لنک پیسٹ کریں...'
                  : 'Paste video URL here...'
            }
            className="w-full pl-10 pr-24 py-3.5 bg-[#051821] border border-[#00ffd5]/30 focus:border-[#00ffd5] focus:ring-2 focus:ring-[#00ffd5]/20 rounded-xl text-sm text-white placeholder-[#00ffd5]/35 outline-none transition-all shadow-inner"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {url ? (
              <button
                onClick={() => setUrl('')}
                className="p-1.5 text-[#00ffd5]/50 hover:text-[#00ffd5] transition-colors cursor-pointer"
                title="Clear"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                onClick={handlePaste}
                disabled={isPasting}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#00ffd5] bg-[#00ffd5]/10 hover:bg-[#00ffd5]/25 rounded-lg border border-[#00ffd5]/35 transition-all cursor-pointer"
              >
                {isPasting ? <Loader2 size={12} className="animate-spin" /> : <ClipboardPaste size={12} />}
                <span>{isUrdu ? 'پیسٹ' : 'Paste'}</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!url.trim()}
          className={`w-full py-4 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
            url.trim()
              ? 'bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_25px_rgba(0,255,213,0.6)] cursor-pointer active:scale-[0.99]'
              : 'bg-[#06242c] text-[#00ffd5]/40 border border-[#00ffd5]/20 cursor-not-allowed'
          }`}
        >
          <span>{isUrdu ? 'ویڈیو کا تجزیہ کریں' : 'ANALYZE VIDEO'}</span>
          <ArrowRight size={18} className="stroke-[2.5]" />
        </button>
      </div>

      <div className="bg-[#04151b] border border-[#00ffd5]/25 rounded-xl p-3.5 space-y-2.5">
        <h2 className="text-xs uppercase tracking-wider text-[#00ffd5]/80 font-semibold">
          {isUrdu ? 'سپورٹ شدہ پلیٹ فارمز' : 'Supported Platforms'}
        </h2>
        <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-xs text-[#c3f2ed]">
          {['TikTok', 'Instagram', 'Facebook', 'X (Twitter)', 'Reddit', 'Pinterest', 'Dailymotion', '+ More'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#00ffd5]/20 border border-[#00ffd5] flex items-center justify-center shrink-0">
                <Check size={9} className="text-[#00ffd5] stroke-[3]" />
              </span>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 text-[11px] text-[#00ffd5]/55">
        <Play size={12} />
        <span>{isUrdu ? 'لنک پیسٹ کریں، پھر اصل metadata اور دستیاب qualities دیکھیں۔' : 'Paste a link to inspect real metadata and available qualities.'}</span>
      </div>

      <nav aria-label="SEO guides" className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-1 pt-1 text-[10px] text-[#7feadc]/70">
        <a href="/tiktok-video-downloader/" className="hover:text-[#00ffd5]">TikTok Video Downloader</a>
        <a href="/video-downloader/" className="hover:text-[#00ffd5]">All Platform Guide</a>
        <a href="/video-to-mp3/" className="hover:text-[#00ffd5]">Video to MP3</a>
      </nav>

      <nav aria-label="Legal information" className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-1 pt-1 text-[10px] text-[#7feadc]/70">
        <a href="/about/" className="hover:text-[#00ffd5]">About</a>
        <a href="/privacy-policy/" className="hover:text-[#00ffd5]">Privacy</a>
        <a href="/terms/" className="hover:text-[#00ffd5]">Terms</a>
        <a href="/cookie-policy/" className="hover:text-[#00ffd5]">Cookies</a>
        <a href="/contact/" className="hover:text-[#00ffd5]">Contact / Takedown</a>
      </nav>
    </div>
  );
};
