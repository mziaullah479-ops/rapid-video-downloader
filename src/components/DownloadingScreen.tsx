import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDown, 
  Clock, 
  CheckCircle2, 
  FolderDown, 
  RotateCcw,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { VideoMetadata, DownloadOption, TerminalLog as TerminalLogType, DownloadHistoryItem } from '../types';
import { RadialProgress } from './RadialProgress';
import { OscilloscopeWave } from './OscilloscopeWave';
import { TerminalLog } from './TerminalLog';
import { cyberAudio } from '../utils/audio';
import { downloadFileToDevice } from '../utils/fileSaver';

interface DownloadingScreenProps {
  metadata: VideoMetadata;
  option: DownloadOption;
  fileName: string;
  onFinish: (historyItem: DownloadHistoryItem) => void;
  onViewDownloads: () => void;
  isUrdu?: boolean;
}

export const DownloadingScreen: React.FC<DownloadingScreenProps> = ({
  metadata,
  option,
  fileName,
  onFinish,
  onViewDownloads,
  isUrdu = false
}) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [speedMBps, setSpeedMBps] = useState(4.8);
  const [secondsRemaining, setSecondsRemaining] = useState(24);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string>('');
  const hasStartedRef = useRef(false);

  const totalMB = option.sizeMB;
  const downloadedMB = (progress / 100) * totalMB;

  const [logs, setLogs] = useState<TerminalLogType[]>([
    { id: 'dl-1', timestamp: '10:25:14', text: 'Download pipeline initiated...', type: 'cyan' },
    { id: 'dl-2', timestamp: '10:25:16', text: 'Connecting to direct edge media server...', type: 'info' },
    { id: 'dl-3', timestamp: '10:25:18', text: `Preparing ${option.label} (${option.resolution || option.format}) from the public source...`, type: 'matrix' },
  ]);

  const handleDownloadFinished = () => {
    setIsCompleted(true);
    cyberAudio.playSuccess();
    const nowStr = new Date().toTimeString().split(' ')[0];
    const uniqueDoneId = `done-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLogs((prevLogs) => [
      ...prevLogs,
      {
        id: uniqueDoneId,
        timestamp: nowStr,
        text: 'Download complete. The public media file was saved [100% OK].',
        type: 'success'
      }
    ]);

    const historyItem: DownloadHistoryItem = {
      id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      video: metadata,
      selectedOption: option,
      fileName: fileName,
      downloadedAt: 'Just now',
      sizeMB: option.sizeMB,
      status: 'completed',
      mediaUrl: option.downloadUrl || option.sampleMediaUrl
    };

    onFinish(historyItem);
  };

  // Start the real file transfer and report bytes received to the cyber progress UI.
  const handleSaveToDisk = async () => {
    if (isSaving) return;
    cyberAudio.playClick();
    setIsSaving(true);
    setIsCompleted(false);
    setSaveSuccess(false);
    setDownloadError('');
    setProgress(0);
    setSaveMessage(isUrdu ? 'ڈاؤنلوڈ شروع ہو رہا ہے...' : 'Starting download...');

    try {
      const nowStr = new Date().toTimeString().split(' ')[0];
      setLogs((prev) => [
        ...prev,
        {
          id: `save-${Date.now()}`,
          timestamp: nowStr,
          text: `Requesting real media bytes from the public source: ${fileName}...`,
          type: 'info'
        }
      ]);

      const result = await downloadFileToDevice(
        option.downloadUrl || option.sampleMediaUrl,
        fileName,
        (statusText, percentage) => {
          setSaveMessage(statusText);
          if (percentage !== undefined) setProgress(percentage);
        },
        { quality: option.resolution, format: option.format }
      );

      if (result.success) {
        cyberAudio.playSuccess();
        setSaveSuccess(true);
        setProgress(100);
        setSaveMessage(isUrdu ? 'فائل ڈاؤنلوڈز فولڈر میں محفوظ ہو گئی!' : result.message);
        const doneStr = new Date().toTimeString().split(' ')[0];
        setLogs((prev) => [
          ...prev,
          {
            id: `saved-ok-${Date.now()}`,
            timestamp: doneStr,
            text: `File write complete (${result.method}): ${fileName} [SAVED]`,
            type: 'success'
          }
        ]);
      } else {
        setDownloadError(result.message);
        setSaveMessage(result.message);
      }
    } catch (err: any) {
      console.error('Save to disk error:', err);
      setDownloadError(err?.message || 'Download failed.');
      setSaveMessage(isUrdu ? 'ڈاؤنلوڈ ناکام ہو گیا' : (err?.message || 'Download failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void handleSaveToDisk();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300 pb-4 font-mono-cyber">
      {/* Mini Video Summary Banner */}
      <div className="flex items-center gap-3 p-2 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
        <img
          src={metadata.thumbnail}
          alt={metadata.title}
          className="w-14 h-10 rounded-lg object-cover border border-[#00ffd5]/30 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-display font-bold text-white truncate">
            {metadata.title}
          </h3>
          <p className="text-[11px] text-[#00ffd5] truncate">
            {metadata.author} • {option.label}
          </p>
        </div>
      </div>

      {/* Radial Progress Ring matching screenshot */}
      <RadialProgress
        percentage={progress}
        downloadedMB={downloadedMB}
        totalMB={totalMB}
      />

      {/* Speed & Remaining Metrics Row matching screenshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-2.5 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
          <div className="p-2 rounded-lg bg-[#00ffd5]/10 text-[#00ffd5]">
            <ArrowDown size={18} className="animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {isCompleted ? '0.0 MB/s' : `${speedMBps} MB/s`}
            </p>
            <p className="text-[10px] text-[#00ffd5]/60 uppercase tracking-wider">
              {isUrdu ? 'اسپیڈ' : 'Speed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
          <div className="p-2 rounded-lg bg-[#00ffd5]/10 text-[#00ffd5]">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {isCompleted ? '00:00:00' : formatTime(secondsRemaining)}
            </p>
            <p className="text-[10px] text-[#00ffd5]/60 uppercase tracking-wider">
              {isUrdu ? 'باقی وقت' : 'Remaining'}
            </p>
          </div>
        </div>
      </div>

      {/* Oscilloscope Waveform matching screenshot */}
      <OscilloscopeWave
        speedMBps={isCompleted || !isSaving ? 0 : speedMBps}
        active={!isCompleted && isSaving}
      />

      {/* Terminal Log Box matching screenshot */}
      <TerminalLog
        logs={logs}
        title="LIVE_CHUNK_STREAM"
        maxHeight="max-h-28"
      />

      {/* Bottom Action Controls */}
      <div className="space-y-2 pt-1">
        {downloadError && !isCompleted && (
          <div className="p-2.5 rounded-xl border border-rose-400/40 bg-rose-400/10 text-xs text-rose-200">
            {downloadError}
          </div>
        )}
        {isCompleted ? (
          <div className="space-y-2.5">
            {saveMessage && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                saveSuccess 
                  ? 'bg-[#00e599]/15 border-[#00e599]/40 text-[#00e599]' 
                  : 'bg-[#00ffd5]/10 border-[#00ffd5]/30 text-[#00ffd5]'
              }`}>
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin shrink-0 text-[#00ffd5]" />
                ) : saveSuccess ? (
                  <Check size={16} className="shrink-0 text-[#00e599]" />
                ) : (
                  <FolderDown size={16} className="shrink-0 text-[#00ffd5]" />
                )}
                <span className="truncate">{saveMessage}</span>
              </div>
            )}

            <button
              onClick={handleSaveToDisk}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                saveSuccess
                  ? 'bg-gradient-to-r from-[#00e599] to-[#00b87a] text-[#021318] shadow-[0_0_20px_rgba(0,229,153,0.5)]'
                  : 'bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_20px_rgba(0,255,213,0.6)]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin stroke-[2.5]" />
                  <span>{isUrdu ? 'ڈیوائس پر محفوظ ہو رہا ہے...' : 'SAVING TO DEVICE...'}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={18} className="stroke-[2.5]" />
                  <span>{isUrdu ? 'دوبارہ محفوظ کریں (Save Again)' : 'FILE SAVED! SAVE AGAIN'}</span>
                </>
              ) : (
                <>
                  <FolderDown size={18} className="stroke-[2.5]" />
                  <span>{isUrdu ? 'فائل ڈیوائس پر محفوظ کریں' : 'SAVE FILE TO DEVICE'}</span>
                </>
              )}
            </button>

            <button
              onClick={onViewDownloads}
              className="w-full py-2.5 rounded-xl font-mono-cyber text-xs text-[#00ffd5] bg-[#041920] hover:bg-[#072a36] border border-[#00ffd5]/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{isUrdu ? 'ڈاؤنلوڈز کی فہرست دیکھیں' : 'VIEW IN DOWNLOADS LIST'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleSaveToDisk}
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-[#05222b] hover:bg-[#08303d] border border-[#00ffd5]/40 text-[#00ffd5] hover:border-[#00ffd5] transition-all cursor-pointer disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isUrdu ? 'ڈاؤنلوڈ جاری ہے...' : 'DOWNLOADING REAL MEDIA...'}</span>
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                <span>{isUrdu ? 'دوبارہ کوشش کریں' : 'RETRY DOWNLOAD'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
