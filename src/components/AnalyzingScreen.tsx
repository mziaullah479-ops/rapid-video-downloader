import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Check, 
  Loader2, 
  FastForward,
  ShieldCheck
} from 'lucide-react';
import { VideoMetadata, TerminalLog as TerminalLogType } from '../types';
import { TerminalLog } from './TerminalLog';
import { cyberAudio } from '../utils/audio';

interface AnalyzingScreenProps {
  url: string;
  metadata: VideoMetadata;
  onComplete: () => void;
  isUrdu?: boolean;
}

interface StepItem {
  id: string;
  label: string;
  urduLabel: string;
  timeTaken?: string;
  status: 'pending' | 'active' | 'completed';
}

export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({
  url,
  metadata,
  onComplete,
  isUrdu = false
}) => {
  const [progress, setProgress] = useState(12);
  const [steps, setSteps] = useState<StepItem[]>([
    { id: '1', label: 'URL Detected', urduLabel: 'یو آر ایل کی تصدیق', status: 'completed', timeTaken: '0.8s' },
    { id: '2', label: `Platform Identified (${metadata.platformName})`, urduLabel: `پلیٹ فارم شناخت شدہ (${metadata.platformName})`, status: 'active', timeTaken: '1.2s' },
    { id: '3', label: 'Fetching Video Data...', urduLabel: 'ویڈیو ڈیٹا برآمد ہو رہا ہے...', status: 'pending' },
    { id: '4', label: 'Stripping Watermarks & DRM Tokens', urduLabel: 'واٹر مارک اور نشانات کا خاتمہ', status: 'pending' },
    { id: '5', label: 'Extracting Direct Media Streams', urduLabel: 'براہ راست میڈیا اسٹریمز الگ کرنا', status: 'pending' },
    { id: '6', label: 'Preparing Download Options', urduLabel: 'ڈاؤنلوڈ آپشنز تیار کیے جا رہے ہیں', status: 'pending' },
  ]);

  const [logs, setLogs] = useState<TerminalLogType[]>([
    { id: 'l1', timestamp: '10:24:17', text: 'Initializing neural decryption kernel...', type: 'cyan' },
    { id: 'l2', timestamp: '10:24:18', text: `URL received: ${url.length > 38 ? url.slice(0, 38) + '...' : url}`, type: 'info' },
    { id: 'l3', timestamp: '10:24:18', text: `Platform: ${metadata.platformName} (${metadata.platform.toUpperCase()}_CDN)`, type: 'matrix' },
  ]);

  useEffect(() => {
    cyberAudio.playScanSweep();

    // Sequence of cyber extraction steps
    const timers: NodeJS.Timeout[] = [];

    // Step 2 finish -> Step 3
    timers.push(setTimeout(() => {
      setProgress(36);
      cyberAudio.playKey();
      setSteps(prev => prev.map(s => {
        if (s.id === '2') return { ...s, status: 'completed' };
        if (s.id === '3') return { ...s, status: 'active', timeTaken: '3.6s' };
        return s;
      }));
      setLogs(prev => [
        ...prev,
        { id: `l-${Date.now()}-1`, timestamp: '10:24:19', text: 'Fetching raw video handshake & CDN manifest...', type: 'info' }
      ]);
    }, 700));

    // Step 3 finish -> Step 4 (Watermark bypass)
    timers.push(setTimeout(() => {
      setProgress(58);
      cyberAudio.playKey();
      setSteps(prev => prev.map(s => {
        if (s.id === '3') return { ...s, status: 'completed' };
        if (s.id === '4') return { ...s, status: 'active' };
        return s;
      }));
      setLogs(prev => [
        ...prev,
        { id: `l-${Date.now()}-2`, timestamp: '10:24:20', text: 'Analyzing video bitrate & stream packets...', type: 'info' },
        { id: `l-${Date.now()}-3`, timestamp: '10:24:21', text: 'Bypassing overlay layer: Watermark removed [CLEAN]', type: 'success' }
      ]);
    }, 1500));

    // Step 4 finish -> Step 5
    timers.push(setTimeout(() => {
      setProgress(78);
      cyberAudio.playKey();
      setSteps(prev => prev.map(s => {
        if (s.id === '4') return { ...s, status: 'completed' };
        if (s.id === '5') return { ...s, status: 'active' };
        return s;
      }));
      setLogs(prev => [
        ...prev,
        { id: `l-${Date.now()}-4`, timestamp: '10:24:22', text: `Found ${metadata.options.length} high-fidelity media streams (4K, 1080p, MP3)`, type: 'matrix' }
      ]);
    }, 2300));

    // Step 5 finish -> Step 6
    timers.push(setTimeout(() => {
      setProgress(94);
      cyberAudio.playKey();
      setSteps(prev => prev.map(s => {
        if (s.id === '5') return { ...s, status: 'completed' };
        if (s.id === '6') return { ...s, status: 'active' };
        return s;
      }));
      setLogs(prev => [
        ...prev,
        { id: `l-${Date.now()}-5`, timestamp: '10:24:23', text: 'Done. Fetching creator metadata & audio spectrum...', type: 'success' }
      ]);
    }, 3000));

    // Complete!
    timers.push(setTimeout(() => {
      setProgress(100);
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      cyberAudio.playSuccess();
      setTimeout(onComplete, 400);
    }, 3600));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [url, metadata, onComplete]);

  const handleSkip = () => {
    cyberAudio.playClick();
    onComplete();
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* Top Header matching screenshot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Scan size={22} className="text-[#00ffd5] animate-pulse" />
            <span className="absolute inset-0 rounded-full bg-[#00ffd5]/20 blur-sm -z-10 animate-ping" />
          </div>
          <h2 className="text-base md:text-lg font-display font-bold text-white tracking-wide glow-text-cyan">
            {isUrdu ? 'ویڈیو کا گہرائی سے تجزیہ جاری ہے...' : 'Analyzing Video...'}
          </h2>
        </div>

        {/* Skip button for user convenience */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-[11px] font-mono-cyber text-[#00ffd5]/70 hover:text-[#00ffd5] bg-[#00ffd5]/10 px-2.5 py-1 rounded-lg border border-[#00ffd5]/20 hover:border-[#00ffd5]/50 transition-colors cursor-pointer"
          title="Instant analysis skip"
        >
          <span>{isUrdu ? 'فوری نتیجہ' : 'Fast Pass'}</span>
          <FastForward size={12} />
        </button>
      </div>

      {/* Stepper Checklist matching screenshot */}
      <div className="bg-[#04151b] border border-[#00ffd5]/25 rounded-xl p-3.5 space-y-2.5 font-mono-cyber">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between text-xs py-1 transition-all ${
                isDone
                  ? 'text-[#00ffd5]'
                  : isActive
                  ? 'text-white font-semibold'
                  : 'text-[#00ffd5]/35'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <span className="w-4 h-4 rounded-full bg-[#00ffd5]/25 border border-[#00ffd5] flex items-center justify-center shrink-0">
                    <Check size={10} className="text-[#00ffd5] stroke-[3]" />
                  </span>
                ) : isActive ? (
                  <Loader2 size={16} className="text-[#00ffd5] animate-spin shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[#00ffd5]/25 flex items-center justify-center shrink-0 text-[9px] text-[#00ffd5]/40">
                    •
                  </span>
                )}
                <span>{isUrdu ? step.urduLabel : step.label}</span>
              </div>

              {step.timeTaken && (
                <span className="text-[10px] text-[#00ffd5]/60 font-mono-cyber">
                  {step.timeTaken}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Hacker Terminal output */}
      <TerminalLog
        logs={logs}
        title="CORE_MEDIA_DECRYPTOR"
        maxHeight="max-h-36"
      />

      {/* Cyber Segmented Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs font-mono-cyber">
          <span className="text-[#a0ece3] flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#00ffd5]" />
            <span>{isUrdu ? 'ویڈیو اور اسٹریم ڈیکوڈ ہو رہی ہے...' : 'Processing your video...'}</span>
          </span>
          <span className="text-[#00ffd5] font-bold font-display text-sm">{progress}%</span>
        </div>

        <div className="w-full h-3.5 bg-[#030d12] border border-[#00ffd5]/30 rounded-md p-0.5 overflow-hidden flex items-center">
          <div
            className="h-full bg-gradient-to-r from-[#0df7cb] to-[#00ffd5] rounded-xs transition-all duration-300 shadow-[0_0_10px_#00ffd5]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
