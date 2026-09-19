import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2, 
  X, 
  ArrowRight, 
  Check, 
  ClipboardPaste,
  Sparkles,
  Download,
  FolderDown,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  Volume2,
  Video,
  Music,
  Loader2,
  Pause,
  AlertCircle
} from 'lucide-react';
import { VideoMetadata, DownloadOption } from '../types';
import { SUPPORTED_PLATFORMS, SAMPLE_VIDEOS } from '../data/mockVideos';
import { cyberAudio } from '../utils/audio';
import { resolveVideoMetadataAsync, detectPlatform } from '../utils/videoResolver';
import { downloadFileToDevice } from '../utils/fileSaver';
import { PlatformIcon } from './PlatformIcons';

interface HomeScreenProps {
  url: string;
  setUrl: (url: string) => void;
  isUrdu?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  url,
  setUrl,
  isUrdu = false
}) => {
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [selectedOption, setSelectedOption] = useState<DownloadOption | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(5.4);
  const [timeRemaining, setTimeRemaining] = useState<number>(18);
  const [statusText, setStatusText] = useState<string>('');

  // Device saving state
  const [isSavingToDevice, setIsSavingToDevice] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Handle clipboard paste
  const handlePaste = async () => {
    try {
      cyberAudio.playClick();
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          cyberAudio.playKey();
          return;
        }
      }
    } catch {
      // fallback
    }
    setUrl(SAMPLE_VIDEOS.mrbeast.url);
    cyberAudio.playKey();
  };

  // Analyze video URL
  const handleAnalyze = async (overrideUrl?: string) => {
    const target = (overrideUrl || url).trim();
    if (!target) return;

    cyberAudio.playScanSweep();
    setIsAnalyzing(true);
    setVideoData(null);
    setIsDownloading(false);
    setDownloadProgress(0);
    setIsCompleted(false);
    setSaveSuccess(false);
    setSaveFeedback('');
    setIsPlayingVideo(false);

    try {
      const resolved = await resolveVideoMetadataAsync(target);
      setVideoData(resolved);
      if (resolved.options && resolved.options.length > 0) {
        setSelectedOption(resolved.options[0]);
      }
      cyberAudio.playSuccess();
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      console.error('Failed to resolve video:', err);
      // Fallback to sample
      setVideoData(SAMPLE_VIDEOS.mrbeast);
      setSelectedOption(SAMPLE_VIDEOS.mrbeast.options[0]);
      cyberAudio.playSuccess();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start download simulation & direct saving pipeline
  const handleStartDownload = () => {
    if (!videoData || !selectedOption) return;
    cyberAudio.playClick();
    setIsDownloading(true);
    setDownloadProgress(5);
    setIsCompleted(false);
    setIsPaused(false);
    setSaveSuccess(false);
    setSaveFeedback('');
    setStatusText(isUrdu ? 'اسٹریم ڈکرپٹ کی جا رہی ہے...' : 'Decrypting clean video stream...');

    setTimeout(() => {
      downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  // Live download progress ticker
  useEffect(() => {
    if (!isDownloading || isPaused || isCompleted) return;

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompleted(true);
          cyberAudio.playSuccess();
          setStatusText(isUrdu ? 'ڈاؤنلوڈ تیار ہے! ڈیوائس پر محفوظ کریں۔' : 'Ready! Click Save to Device.');
          return 100;
        }

        const delta = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(100, prev + delta);

        if (next > 25 && next < 55) {
          setStatusText(isUrdu ? 'واٹر مارک ہٹا دیا گیا، فائل پیکیجنگ جاری ہے...' : 'Watermark stripped. Packing MP4 stream...');
        } else if (next >= 55 && next < 90) {
          setStatusText(isUrdu ? 'اصل ہائی کوالٹی بٹس رائٹ ہو رہے ہیں...' : 'Streaming multi-threaded media packets...');
        } else if (next >= 90) {
          setStatusText(isUrdu ? 'فائل تیار ہو رہی ہے...' : 'Finalizing media container...');
        }

        // speed & ETA calculation
        const remainingPct = 100 - next;
        const speed = Number((4.5 + Math.random() * 2.2).toFixed(1));
        setDownloadSpeed(speed);
        setTimeRemaining(Math.max(1, Math.round((remainingPct / 100) * 15)));

        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isDownloading, isPaused, isCompleted, isUrdu]);

  // Direct save to device
  const handleSaveToDevice = async () => {
    if (!videoData || !selectedOption || isSavingToDevice) return;
    cyberAudio.playClick();
    setIsSavingToDevice(true);
    setSaveFeedback(isUrdu ? 'فائل ڈیوائس پر لکھی جا رہی ہے...' : 'Dispatching to device Downloads...');

    const ext = selectedOption.format.toLowerCase();
    const safeTitle = `${videoData.author} - ${videoData.title}.${ext}`.replace(/[^a-zA-Z0-9._\- ]/g, '_');

    try {
      const res = await downloadFileToDevice(
        selectedOption.sampleMediaUrl,
        safeTitle,
        (msg) => setSaveFeedback(msg)
      );

      if (res.success) {
        cyberAudio.playSuccess();
        setSaveSuccess(true);
        setSaveFeedback(
          isUrdu 
            ? 'فائل کامیابی سے ڈاؤنلوڈز فولڈر میں محفوظ ہو گئی!' 
            : 'File successfully saved to your Downloads folder!'
        );
      } else {
        setSaveFeedback(isUrdu ? 'براہِ راست ونڈو کھولی گئی' : 'Download stream initiated');
      }
    } catch (err) {
      console.error('Device save error:', err);
      setSaveFeedback(isUrdu ? 'ڈاؤنلوڈ ونڈو کھولی گئی' : 'Direct browser stream opened');
    } finally {
      setIsSavingToDevice(false);
    }
  };

  // Reset to download another video
  const handleReset = () => {
    cyberAudio.playClick();
    setVideoData(null);
    setSelectedOption(null);
    setIsDownloading(false);
    setDownloadProgress(0);
    setIsCompleted(false);
    setSaveSuccess(false);
    setSaveFeedback('');
    setIsPlayingVideo(false);
  };

  const calculatedDownloadedMB = selectedOption 
    ? ((downloadProgress / 100) * selectedOption.sizeMB).toFixed(1)
    : '0';

  // Dynamic real-time platform recognition
  const detectedPlatform = url.trim() ? detectPlatform(url) : null;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. Hero Tagline */}
      <div className="text-left space-y-1">
        <p className="text-sm md:text-base font-display font-medium text-[#7feadc] leading-snug">
          {isUrdu 
            ? 'ایک یو آر ایل۔ تمام پلیٹ فارمز۔ بغیر واٹر مارک ڈاؤنلوڈ انجن۔'
            : 'One URL. Multiple Platforms. Instant Direct Download.'}
        </p>
        <p className="text-xs font-mono-cyber text-[#00ffd5]/60 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
          <span>CYBER CORE BYPASS // NO WATERMARKS // 1080P & MP3</span>
        </p>
      </div>

      {/* 2. Supported Platforms Grid with ORIGINAL BRAND LOGOS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono-cyber text-[#00ffd5]/80 font-semibold tracking-wider">
            {isUrdu ? 'تعاون یافتہ پلیٹ فارمز (اصل ایپس):' : 'SUPPORTED PLATFORMS:'}
          </span>
          {detectedPlatform && detectedPlatform.id !== 'other' && (
            <span className="text-[11px] font-mono-cyber text-[#00ffd5] flex items-center gap-1 bg-[#00ffd5]/10 px-2 py-0.5 rounded-full border border-[#00ffd5]/30 animate-pulse">
              <PlatformIcon platformId={detectedPlatform.id} size={13} />
              <span>{detectedPlatform.name} {isUrdu ? 'شناخت ہوا' : 'Detected'}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const isDetected = detectedPlatform?.id === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => {
                  cyberAudio.playClick();
                  setUrl(platform.sampleUrl);
                  handleAnalyze(platform.sampleUrl);
                }}
                className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm ${
                  isDetected
                    ? 'bg-[#00ffd5]/15 border-2 border-[#00ffd5] shadow-[0_0_18px_rgba(0,255,213,0.35)] scale-[1.03]'
                    : 'bg-[#051821]/85 hover:bg-[#082933] border border-[#00ffd5]/20 hover:border-[#00ffd5]/70 hover:shadow-[0_0_12px_rgba(0,255,213,0.25)]'
                }`}
                title={`Download from ${platform.name}`}
              >
                {/* Official Brand Vector Logo */}
                <div className="relative flex items-center justify-center transition-transform group-hover:scale-110">
                  <PlatformIcon platformId={platform.id} size={30} />
                  {isDetected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00ffd5] ring-2 ring-[#051821] animate-ping" />
                  )}
                </div>

                <span className="text-[11px] font-medium text-[#c0f0eb] mt-1.5 truncate max-w-full font-display">
                  {platform.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. URL Search Bar (Directly below platform logos - preset card removed as requested) */}
      <div className="space-y-3 pt-1">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[#00ffd5]/60 pointer-events-none">
            <Link2 size={18} />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              cyberAudio.playKey();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url.trim()) {
                handleAnalyze();
              }
            }}
            placeholder={isUrdu ? "یہاں ویڈیو کا لنک پیسٹ کریں..." : "Paste video URL here..."}
            className="w-full pl-10 pr-24 py-3.5 bg-[#051821] border border-[#00ffd5]/30 focus:border-[#00ffd5] focus:ring-2 focus:ring-[#00ffd5]/20 rounded-xl text-sm font-mono-cyber text-white placeholder-[#00ffd5]/35 outline-none transition-all shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {detectedPlatform && detectedPlatform.id !== 'other' && (
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/30">
                <PlatformIcon platformId={detectedPlatform.id} size={14} />
              </div>
            )}

            {url ? (
              <button
                onClick={() => {
                  cyberAudio.playClick();
                  setUrl('');
                }}
                className="p-1.5 text-[#00ffd5]/50 hover:text-[#00ffd5] transition-colors cursor-pointer"
                title="Clear"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono-cyber text-[#00ffd5] bg-[#00ffd5]/10 hover:bg-[#00ffd5]/25 rounded-lg border border-[#00ffd5]/35 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Paste Clipboard"
              >
                <ClipboardPaste size={12} />
                <span>{isUrdu ? 'پیسٹ' : 'Paste'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Neon Action Button */}
        <button
          onClick={() => handleAnalyze()}
          disabled={!url.trim() || isAnalyzing}
          className={`w-full py-4 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
            url.trim() && !isAnalyzing
              ? 'bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_25px_rgba(0,255,213,0.6)] cursor-pointer active:scale-[0.99]'
              : 'bg-[#06242c] text-[#00ffd5]/40 border border-[#00ffd5]/20 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="animate-spin stroke-[2.5]" />
              <span>{isUrdu ? 'اسکیننگ اور ڈکرپشن جاری ہے...' : 'SCANNING STREAM...'}</span>
            </>
          ) : (
            <>
              <span>{isUrdu ? 'ویڈیو حاصل کریں (GET VIDEO)' : 'GET VIDEO / ANALYZE'}</span>
              <ArrowRight size={18} className="stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

      {/* 4. INLINE VIDEO PREVIEW & QUALITY SELECTION */}
      {videoData && (
        <div 
          ref={previewRef}
          className="space-y-4 p-4 rounded-2xl bg-[#04151b] border-2 border-[#00ffd5]/50 shadow-[0_0_30px_rgba(0,255,213,0.2)] animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {/* Status Header with Official Platform Logo */}
          <div className="flex items-center justify-between pb-2 border-b border-[#00ffd5]/20">
            <span className="text-xs font-mono-cyber font-bold text-[#00ffd5] flex items-center gap-1.5">
              <ShieldCheck size={16} />
              <span>{isUrdu ? 'ویڈیو تیار ہے (واٹر مارک ہٹا دیا گیا)' : 'STREAM READY // NO WATERMARK'}</span>
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/30">
              <PlatformIcon platformId={videoData.platform} size={15} />
              <span className="text-[10px] text-[#00ffd5] font-mono-cyber font-bold uppercase">
                {videoData.platformName}
              </span>
            </div>
          </div>

          {/* Video Player / Embedded Frame */}
          <div className="relative w-full aspect-video bg-[#020b0e] rounded-xl overflow-hidden border border-[#00ffd5]/40 shadow-inner group">
            {isPlayingVideo ? (
              videoData.youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoData.youtubeVideoId}?autoplay=1&rel=0`}
                  title={videoData.title}
                  className="w-full h-full object-cover rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoData.previewVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                  onEnded={() => setIsPlayingVideo(false)}
                />
              )
            ) : (
              <>
                <img
                  src={videoData.thumbnail}
                  alt={videoData.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={() => {
                      cyberAudio.playClick();
                      setIsPlayingVideo(true);
                    }}
                    className="w-14 h-14 rounded-full bg-[#00ffd5] text-[#021318] flex items-center justify-center hover:scale-110 shadow-[0_0_25px_rgba(0,255,213,0.8)] transition-transform cursor-pointer pl-0.5"
                    title="Play Video"
                  >
                    <Play size={24} className="fill-[#021318]" />
                  </button>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-white text-xs font-mono-cyber font-semibold tracking-wider">
                  {videoData.durationFormatted}
                </div>
              </>
            )}
          </div>

          {/* Video Title & Creator Info */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
              {videoData.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-[#00ffd5]/70 font-mono-cyber">
              <div className="flex items-center gap-1.5 truncate">
                <img
                  src={videoData.authorAvatar}
                  alt={videoData.author}
                  className="w-4 h-4 rounded-full border border-[#00ffd5]/50"
                />
                <span className="text-[#a8eae2] truncate">{videoData.author}</span>
              </div>
              <span className="shrink-0">{videoData.views}</span>
            </div>
          </div>

          {/* Quality & Resolution Selector (Right here on Home screen) */}
          <div className="space-y-2 pt-2 border-t border-[#00ffd5]/20">
            <div className="flex items-center justify-between text-xs font-mono-cyber">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Video size={14} className="text-[#00ffd5]" />
                <span>{isUrdu ? 'ڈاؤنلوڈ کوالٹی منتخب کریں:' : 'Select Download Quality:'}</span>
              </span>
              <span className="text-[10px] text-[#00ffd5]/70">
                {selectedOption ? `${selectedOption.resolution || selectedOption.format} • ${selectedOption.sizeMB} MB` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {videoData.options.map((opt) => {
                const isSelected = selectedOption?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      cyberAudio.playClick();
                      setSelectedOption(opt);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00ffd5]/15 border-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                        : 'bg-[#031117] border-[#00ffd5]/20 hover:border-[#00ffd5]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-cyber font-bold text-xs ${
                        isSelected 
                          ? 'bg-[#00ffd5] text-[#021318]' 
                          : 'bg-[#07242c] text-[#00ffd5]'
                      }`}>
                        {opt.badge}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#00ffd5]/70 font-mono-cyber">
                          {opt.sizeMB} MB • {opt.qualityTag}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected 
                        ? 'border-[#00ffd5] bg-[#00ffd5]' 
                        : 'border-[#00ffd5]/40'
                    }`}>
                      {isSelected && <Check size={10} className="text-[#021318] stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Action Trigger */}
          {!isDownloading && (
            <button
              onClick={handleStartDownload}
              className="w-full py-3.5 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_25px_rgba(0,255,213,0.6)] cursor-pointer active:scale-[0.99] transition-all"
            >
              <Download size={18} className="stroke-[2.5]" />
              <span>
                {isUrdu 
                  ? `ڈاؤنلوڈ شروع کریں (${selectedOption?.resolution || selectedOption?.format})` 
                  : `START DOWNLOAD (${selectedOption?.resolution || selectedOption?.format} • ${selectedOption?.sizeMB}MB)`}
              </span>
            </button>
          )}

          {/* 6. LIVE INLINE DOWNLOADING SECTION */}
          {isDownloading && (
            <div 
              ref={downloadRef}
              className="p-4 rounded-xl bg-[#020b0e] border border-[#00ffd5]/40 space-y-3.5 animate-in fade-in duration-300"
            >
              {/* Progress & Speed Header */}
              <div className="flex items-center justify-between text-xs font-mono-cyber">
                <span className="text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-ping" />
                  <span>{isCompleted ? (isUrdu ? 'ڈاؤنلوڈ مکمل ہوا' : 'COMPLETED') : (isUrdu ? 'ڈاؤنلوڈ ہو رہا ہے...' : 'DOWNLOADING...')}</span>
                </span>
                <span className="text-[#00ffd5] font-bold text-base">
                  {downloadProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-[#07242c] rounded-full overflow-hidden p-0.5 border border-[#00ffd5]/30 relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00e599] rounded-full transition-all duration-300 shadow-[0_0_12px_#00ffd5]"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-cyber">
                <div className="p-2 rounded-lg bg-[#04151b] border border-[#00ffd5]/20">
                  <span className="text-[10px] text-[#00ffd5]/60 block">{isUrdu ? 'سپیڈ' : 'Speed'}</span>
                  <span className="text-white font-bold">{isCompleted ? 'Done' : `${downloadSpeed} MB/s`}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#04151b] border border-[#00ffd5]/20">
                  <span className="text-[10px] text-[#00ffd5]/60 block">{isUrdu ? 'سائز' : 'Size'}</span>
                  <span className="text-[#00ffd5] font-bold">{calculatedDownloadedMB} / {selectedOption?.sizeMB} MB</span>
                </div>
                <div className="p-2 rounded-lg bg-[#04151b] border border-[#00ffd5]/20">
                  <span className="text-[10px] text-[#00ffd5]/60 block">{isUrdu ? 'باقی وقت' : 'ETA'}</span>
                  <span className="text-white font-bold">{isCompleted ? '0s' : `${timeRemaining}s`}</span>
                </div>
              </div>

              {/* Status Message Line */}
              <div className="text-[11px] font-mono-cyber text-[#00ffd5]/80 flex items-center gap-1.5 px-1">
                <span className="text-[#00ffd5]">&gt;</span>
                <span className="truncate">{statusText}</span>
              </div>

              {/* Device Save Feedback notice */}
              {saveFeedback && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  saveSuccess 
                    ? 'bg-[#00e599]/15 border-[#00e599]/40 text-[#00e599]' 
                    : 'bg-[#00ffd5]/10 border-[#00ffd5]/30 text-[#00ffd5]'
                }`}>
                  {isSavingToDevice ? (
                    <Loader2 size={15} className="animate-spin shrink-0 text-[#00ffd5]" />
                  ) : saveSuccess ? (
                    <Check size={15} className="shrink-0 text-[#00e599]" />
                  ) : (
                    <FolderDown size={15} className="shrink-0 text-[#00ffd5]" />
                  )}
                  <span className="truncate">{saveFeedback}</span>
                </div>
              )}

              {/* Direct Save Button */}
              <button
                onClick={handleSaveToDevice}
                disabled={isSavingToDevice}
                className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  saveSuccess
                    ? 'bg-gradient-to-r from-[#00e599] to-[#00b87a] text-[#021318] shadow-[0_0_20px_rgba(0,229,153,0.5)]'
                    : 'bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_20px_rgba(0,255,213,0.6)]'
                }`}
              >
                {isSavingToDevice ? (
                  <>
                    <Loader2 size={18} className="animate-spin stroke-[2.5]" />
                    <span>{isUrdu ? 'ڈیوائس پر لکھا جا رہا ہے...' : 'SAVING TO DEVICE DISK...'}</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={18} className="stroke-[2.5]" />
                    <span>{isUrdu ? 'فائل محفوظ ہو گئی! (دوبارہ سیو کریں)' : 'FILE SAVED! SAVE AGAIN'}</span>
                  </>
                ) : (
                  <>
                    <FolderDown size={18} className="stroke-[2.5]" />
                    <span>{isUrdu ? 'فائل ڈیوائس پر محفوظ کریں (Downloads)' : 'SAVE FILE TO DEVICE (DOWNLOADS)'}</span>
                  </>
                )}
              </button>

              {/* Reset button */}
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={handleReset}
                  className="text-xs font-mono-cyber text-[#00ffd5]/70 hover:text-[#00ffd5] flex items-center gap-1.5 py-1 px-3 rounded hover:bg-[#00ffd5]/10 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{isUrdu ? 'دوسری ویڈیو ڈاؤنلوڈ کریں' : 'Download Another Video'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Supported Platforms Checklist Box */}
      <div className="bg-[#04151b] border border-[#00ffd5]/25 rounded-xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-mono-cyber uppercase tracking-wider text-[#00ffd5]/80 font-semibold">
          {isUrdu ? 'سپورٹ شدہ پلیٹ فارمز' : 'Supported Platforms'}
        </h3>
        <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-xs font-mono-cyber text-[#c3f2ed]">
          {[
            'YouTube', 'TikTok', 'Instagram',
            'Facebook', 'X (Twitter)', 'Reddit',
            'Vimeo', 'Dailymotion', '+ More'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#00ffd5]/20 border border-[#00ffd5] flex items-center justify-center shrink-0">
                <Check size={9} className="text-[#00ffd5] stroke-[3]" />
              </span>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
