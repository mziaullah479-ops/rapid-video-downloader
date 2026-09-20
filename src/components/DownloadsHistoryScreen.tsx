import React, { useState } from 'react';
import { 
  Play, 
  Trash2, 
  FolderDown, 
  ExternalLink, 
  CheckCircle2, 
  X,
  Sparkles,
  Share2,
  Check,
  Loader2
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import { cyberAudio } from '../utils/audio';
import { downloadFileToDevice } from '../utils/fileSaver';

interface DownloadsHistoryScreenProps {
  history: DownloadHistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  isUrdu?: boolean;
}

export const DownloadsHistoryScreen: React.FC<DownloadsHistoryScreenProps> = ({
  history,
  onDelete,
  onClearAll,
  isUrdu = false
}) => {
  const [activeTab, setActiveTab] = useState<'completed' | 'inprogress'>('completed');
  const [selectedVideoToPlay, setSelectedVideoToPlay] = useState<DownloadHistoryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const completedItems = history.filter(item => item.status === 'completed');
  const inProgressItems = history.filter(item => item.status === 'in_progress');

  const displayedItems = activeTab === 'completed' ? completedItems : inProgressItems;

  const handlePlay = (item: DownloadHistoryItem) => {
    cyberAudio.playClick();
    setSelectedVideoToPlay(item);
  };

  const handleDownloadFile = async (item: DownloadHistoryItem) => {
    cyberAudio.playClick();
    setDownloadingId(item.id);
    setDownloadError(null);
    try {
      const res = await downloadFileToDevice(
        item.mediaUrl,
        item.fileName,
        undefined,
        {
          quality: item.selectedOption.resolution,
          format: item.selectedOption.format,
          estimatedSizeMB: item.sizeMB,
          backgroundJob: item.video.platform !== 'other'
            && (item.video.platform !== 'tiktok' || item.selectedOption.format.toLowerCase() === 'mp3'),
        },
      );
      if (res.success) {
        cyberAudio.playSuccess();
        setSavedId(item.id);
        setTimeout(() => setSavedId(null), 3000);
      } else {
        setDownloadError(res.message);
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = (item: DownloadHistoryItem) => {
    cyberAudio.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.video.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300 pb-8 font-mono-cyber">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-[#00ffd5] flex items-center justify-center">
            <CheckCircle2 size={14} className="text-[#00ffd5]" />
          </div>
          <h2 className="text-lg font-display font-bold text-white tracking-wide">
            {isUrdu ? 'ڈاؤنلوڈ شدہ ویڈیوز' : 'Downloads'}
          </h2>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              cyberAudio.playClick();
              if (confirm(isUrdu ? 'کیا آپ تمام ہسٹری صاف کرنا چاہتے ہیں؟' : 'Clear all download history?')) {
                onClearAll();
              }
            }}
            className="text-[11px] text-[#00ffd5]/60 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            <span>{isUrdu ? 'صاف کریں' : 'Clear All'}</span>
          </button>
        )}
      </div>

      {downloadError && (
        <div className="p-3 rounded-xl border border-rose-400/40 bg-rose-400/10 text-xs text-rose-200">
          {downloadError}
        </div>
      )}

      {/* Tabs: Completed & In Progress matching screenshot */}
      <div className="grid grid-cols-2 p-1 bg-[#041217] rounded-xl border border-[#00ffd5]/20 text-xs">
        <button
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('completed');
          }}
          className={`py-2 rounded-lg font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-[#00ffd5] text-[#021318] shadow-[0_0_12px_rgba(0,255,213,0.4)]'
              : 'text-[#00ffd5]/60 hover:text-white'
          }`}
        >
          {isUrdu ? `مکمل شدہ (${completedItems.length})` : `Completed (${completedItems.length})`}
        </button>

        <button
          onClick={() => {
            cyberAudio.playClick();
            setActiveTab('inprogress');
          }}
          className={`py-2 rounded-lg font-bold transition-all ${
            activeTab === 'inprogress'
              ? 'bg-[#00ffd5] text-[#021318] shadow-[0_0_12px_rgba(0,255,213,0.4)]'
              : 'text-[#00ffd5]/60 hover:text-white'
          }`}
        >
          {isUrdu ? `جاری (${inProgressItems.length})` : `In Progress (${inProgressItems.length})`}
        </button>
      </div>

      {/* List of Videos matching screenshot cards */}
      {displayedItems.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-[#00ffd5]/20 rounded-xl space-y-2">
          <Sparkles size={24} className="text-[#00ffd5]/40 mx-auto" />
          <p className="text-xs text-[#00ffd5]/70">
            {isUrdu ? 'کوئی ویڈیو موجود نہیں ہے۔ ہوم سے ڈاؤنلوڈ کریں۔' : 'No downloads yet. Paste a link from the Home tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-[#04151b] border border-[#00ffd5]/25 hover:border-[#00ffd5]/60 rounded-xl transition-all space-y-2 group"
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail with Play Icon overlay */}
                <div 
                  onClick={() => handlePlay(item)}
                  className="relative w-20 h-14 rounded-lg overflow-hidden border border-[#00ffd5]/30 shrink-0 cursor-pointer"
                >
                  <img
                    src={item.video.thumbnail}
                    alt={item.video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/20 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-[#00ffd5] flex items-center justify-center text-[#021318]">
                      <Play size={12} className="fill-[#021318] ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 
                    onClick={() => handlePlay(item)}
                    className="text-xs font-display font-bold text-white truncate hover:text-[#00ffd5] cursor-pointer"
                  >
                    {item.video.title}
                  </h4>
                  <p className="text-[11px] text-[#00ffd5] truncate flex items-center gap-1">
                    <span>{item.video.author}</span>
                  </p>
                  <p className="text-[10px] text-[#00ffd5]/60 flex items-center gap-1 mt-0.5">
                    <span>{item.sizeMB.toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="text-[#00e599] font-semibold">{item.selectedOption.resolution || item.selectedOption.format}</span>
                    <span>•</span>
                    <span className="truncate">{item.downloadedAt}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#00ffd5]/10 text-xs">
                <button
                  onClick={() => handleShare(item)}
                  className="p-1.5 text-[#00ffd5]/70 hover:text-[#00ffd5] hover:bg-[#00ffd5]/10 rounded transition-colors"
                  title="Share link"
                >
                  {copiedId === item.id ? <Check size={14} className="text-[#00e599]" /> : <Share2 size={14} />}
                </button>

                <button
                  onClick={() => handleDownloadFile(item)}
                  disabled={downloadingId === item.id}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#021318] bg-[#00ffd5] hover:bg-[#00e599] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Download File"
                >
                  {downloadingId === item.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...'}</span>
                    </>
                  ) : savedId === item.id ? (
                    <>
                      <Check size={13} />
                      <span>{isUrdu ? 'محفوظ ہو گئی!' : 'Saved!'}</span>
                    </>
                  ) : (
                    <>
                      <FolderDown size={13} />
                      <span>{isUrdu ? 'محفوظ کریں' : 'Save'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    cyberAudio.playClick();
                    onDelete(item.id);
                  }}
                  className="p-1.5 text-[#00ffd5]/40 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Playback Modal */}
      {selectedVideoToPlay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#04151b] border border-[#00ffd5] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,255,213,0.3)] space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#00ffd5]/20">
              <h3 className="text-sm font-display font-bold text-white truncate max-w-[80%]">
                {selectedVideoToPlay.video.title}
              </h3>
              <button
                onClick={() => setSelectedVideoToPlay(null)}
                className="text-[#00ffd5] hover:bg-[#00ffd5]/20 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-[#00ffd5]/30">
              {selectedVideoToPlay.video.youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideoToPlay.video.youtubeVideoId}?autoplay=1&rel=0`}
                  title={selectedVideoToPlay.video.title}
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideoToPlay.mediaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#00ffd5]/70">
                {selectedVideoToPlay.selectedOption.label} • {selectedVideoToPlay.sizeMB.toFixed(1)} MB
              </span>
              <button
                onClick={() => handleDownloadFile(selectedVideoToPlay)}
                className="px-3 py-1.5 rounded-lg bg-[#00ffd5] text-[#021318] font-bold flex items-center gap-1.5"
              >
                <FolderDown size={14} />
                <span>Save to Disk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
