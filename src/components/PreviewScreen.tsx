import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  Eye, 
  Calendar, 
  CheckCircle, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Download,
  Share2,
  Check
} from 'lucide-react';
import { VideoMetadata } from '../types';
import { cyberAudio } from '../utils/audio';

interface PreviewScreenProps {
  metadata: VideoMetadata;
  onProceedToDownload: () => void;
  isUrdu?: boolean;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  metadata,
  onProceedToDownload,
  isUrdu = false
}) => {
  const downloadAvailable = metadata.downloadSupported !== false;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleTogglePlay = () => {
    cyberAudio.playClick();
    setIsPlaying(!isPlaying);
  };

  const handleShare = () => {
    cyberAudio.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(metadata.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300 pb-4">
      {/* Video Preview / Player Container */}
      <div className="relative w-full aspect-video bg-[#020b0e] rounded-xl overflow-hidden border border-[#00ffd5]/30 shadow-lg group">
        {isPlaying ? (
          metadata.youtubeVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${metadata.youtubeVideoId}?autoplay=1&rel=0`}
              title={metadata.title}
              className="w-full h-full object-cover rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              src={metadata.previewVideoUrl}
              controls
              autoPlay
              className="w-full h-full object-cover"
              onEnded={() => setIsPlaying(false)}
            />
          )
        ) : (
          <>
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Play Button Overlay matching screenshot */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-[#00ffd5] text-[#030d12] flex items-center justify-center shadow-[0_0_20px_#00ffd5] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Play preview"
              >
                <Play size={26} className="fill-[#030d12] ml-1" />
              </button>
            </div>

            {/* Platform / Original Badge */}
            {metadata.youtubeVideoId && (
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-mono-cyber font-bold tracking-wider flex items-center gap-1 shadow">
                <span>▶ YOUTUBE ORIGINAL</span>
              </div>
            )}

            {/* Duration badge matching screenshot */}
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-white text-xs font-mono-cyber font-semibold tracking-wider">
              {metadata.durationFormatted}
            </div>
          </>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base md:text-lg font-display font-bold text-white leading-tight">
        {metadata.title}
      </h2>

      {/* Creator Channel Row */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5">
          <img
            src={metadata.authorAvatar}
            alt={metadata.author}
            className="w-10 h-10 rounded-full border border-[#00ffd5]/50 object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{metadata.author}</span>
              {metadata.authorVerified && (
                <CheckCircle size={14} className="text-[#00ffd5] fill-[#00ffd5]/20" />
              )}
            </div>
            <span className="text-xs font-mono-cyber text-[#00ffd5]/70">
              {metadata.subscribersOrFollowers}
            </span>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-xs font-mono-cyber text-[#00ffd5] bg-[#00ffd5]/10 hover:bg-[#00ffd5]/20 px-2.5 py-1.5 rounded-lg border border-[#00ffd5]/25 transition-all cursor-pointer"
        >
          {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copiedLink ? (isUrdu ? 'کاپی ہوا' : 'Copied') : (isUrdu ? 'شیئر' : 'Share')}</span>
        </button>
      </div>

      {/* Stats Cards Row matching screenshot */}
      <div className="grid grid-cols-2 gap-2 font-mono-cyber">
        <div className="flex items-center gap-2.5 p-2.5 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
          <div className="p-2 rounded-lg bg-[#00ffd5]/10 text-[#00ffd5]">
            <Eye size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{metadata.views}</p>
            <p className="text-[10px] text-[#00ffd5]/60">{isUrdu ? 'ویوز' : 'views'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
          <div className="p-2 rounded-lg bg-[#00ffd5]/10 text-[#00ffd5]">
            <Calendar size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{metadata.uploadedDate}</p>
            <p className="text-[10px] text-[#00ffd5]/60">{isUrdu ? 'تاریخ اپلوڈ' : 'uploaded'}</p>
          </div>
        </div>
      </div>

      {/* Description Block */}
      <div className="bg-[#04151b] border border-[#00ffd5]/20 rounded-xl p-3 space-y-1 text-xs font-mono-cyber">
        <h4 className="text-[#00ffd5] font-semibold text-[11px] tracking-wider uppercase">
          {isUrdu ? 'تفصیل' : 'Description'}
        </h4>
        <p className={`text-[#b4ebe4] leading-relaxed ${showFullDesc ? '' : 'line-clamp-2'}`}>
          {metadata.description}
        </p>
        <button
          onClick={() => {
            cyberAudio.playClick();
            setShowFullDesc(!showFullDesc);
          }}
          className="text-[#00ffd5] text-[11px] font-semibold flex items-center gap-1 hover:underline pt-1 cursor-pointer"
        >
          <span>{showFullDesc ? (isUrdu ? 'کم دکھائیں' : 'Show less') : (isUrdu ? 'مزید دکھائیں' : 'Show more')}</span>
          {showFullDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Tags Chips matching screenshot */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-mono-cyber text-[#00ffd5]/80 font-semibold uppercase">
          {isUrdu ? 'ٹیگز اور کی ورڈز' : 'Tags'}
        </h4>
        <div className="flex flex-wrap gap-1.5 font-mono-cyber text-[11px]">
          {metadata.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-[#05212a] border border-[#00ffd5]/25 text-[#98e9df]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons: Choose Download Options & View on Platform */}
      <div className="space-y-2 pt-2">
        {metadata.downloadSupported === false && (
          <div className="p-3 rounded-xl border border-amber-400/40 bg-amber-400/10 text-xs text-amber-200">
            {metadata.downloadMessage || (isUrdu
              ? 'اس سورس نے عوامی download stream فراہم نہیں کی۔ براہِ کرم direct public media URL یا official download استعمال کریں۔'
              : "This source did not expose a public download stream. Use a direct media URL or the platform's official download controls.")}
          </div>
        )}
        <button
          onClick={() => {
            cyberAudio.playClick();
            onProceedToDownload();
          }}
          disabled={!downloadAvailable}
          className={`w-full py-3.5 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
            downloadAvailable
              ? 'bg-gradient-to-r from-[#00ffd5] to-[#00c9a7] text-[#031317] hover:shadow-[0_0_20px_rgba(0,255,213,0.5)] cursor-pointer'
              : 'bg-[#06242c] text-[#00ffd5]/45 border border-[#00ffd5]/20 cursor-not-allowed'
          }`}
        >
          <Download size={18} className="stroke-[2.5]" />
          <span>{downloadAvailable
            ? (isUrdu ? 'ڈاؤنلوڈ کوالٹی منتخب کریں' : 'SELECT DOWNLOAD QUALITY')
            : (isUrdu ? 'ڈاؤنلوڈ دستیاب نہیں' : 'DOWNLOAD UNAVAILABLE')}</span>
        </button>

        <a
          href={metadata.url}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 rounded-xl font-mono-cyber text-xs text-[#00ffd5] bg-[#041920] hover:bg-[#072a36] border border-[#00ffd5]/30 flex items-center justify-center gap-1.5 transition-all text-center block"
        >
          <span>{isUrdu ? `اصل ${metadata.platformName} پر دیکھیں` : `View on ${metadata.platformName}`}</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
};
