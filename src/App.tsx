import React, { useState, useEffect } from 'react';
import { 
  AppView, 
  VideoMetadata, 
  DownloadOption, 
  DownloadHistoryItem 
} from './types';
import { SAMPLE_VIDEOS, resolveVideoForUrl } from './data/mockVideos';
import { resolveVideoMetadataAsync } from './utils/videoResolver';
import { cyberAudio } from './utils/audio';
import { TopBar, BottomNav } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { GuideScreen } from './components/GuideScreen';
import { AboutScreen } from './components/AboutScreen';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { DownloadOptionsScreen } from './components/DownloadOptionsScreen';
import { DownloadingScreen } from './components/DownloadingScreen';
import { DownloadsHistoryScreen } from './components/DownloadsHistoryScreen';
import { SettingsModal } from './components/SettingsModal';
import { CyberBackground } from './components/CyberBackground';
import { Smartphone, Monitor } from 'lucide-react';

const INITIAL_HISTORY: DownloadHistoryItem[] = [
  {
    id: 'hist-1',
    video: SAMPLE_VIDEOS.mrbeast,
    selectedOption: SAMPLE_VIDEOS.mrbeast.options[0],
    fileName: 'MrBeast - $1 vs $1,000,000 Private Island.mp4',
    downloadedAt: 'Jun 7, 2024 • 10:26 AM',
    sizeMB: 312.4,
    status: 'completed',
    mediaUrl: SAMPLE_VIDEOS.mrbeast.options[0].sampleMediaUrl
  },
  {
    id: 'hist-2',
    video: {
      ...SAMPLE_VIDEOS.mrbeast,
      id: 'vid-mrbeast-bunker',
      title: 'I Survived 50 Hours In a Nuclear Bunker',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      views: '198,241,000',
      uploadedDate: 'Jun 5, 2024',
      durationFormatted: '18:40'
    },
    selectedOption: {
      id: 'opt-bunker-1080p',
      label: '1080p (Full HD)',
      badge: 'HD',
      format: 'MP4',
      resolution: '1080p',
      sizeMB: 289.7,
      noWatermark: true,
      qualityTag: 'Clean Stream',
      sampleMediaUrl: SAMPLE_VIDEOS.mrbeast.options[0].sampleMediaUrl
    },
    fileName: 'MrBeast - I Survived 50 Hours In a Nuclear Bunker.mp4',
    downloadedAt: 'Jun 5, 2024 • 6:12 PM',
    sizeMB: 289.7,
    status: 'completed',
    mediaUrl: SAMPLE_VIDEOS.mrbeast.options[0].sampleMediaUrl
  },
  {
    id: 'hist-3',
    video: {
      ...SAMPLE_VIDEOS.instagram_reel,
      id: 'vid-nature-4k',
      title: 'Beautiful Nature - 4K Video',
      author: 'Relaxing Nature',
      thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
      views: '42,100,000',
      uploadedDate: 'May 28, 2024',
      durationFormatted: '8:15'
    },
    selectedOption: {
      id: 'opt-nature-4k',
      label: '4K Ultra HD',
      badge: '4K',
      format: 'MP4',
      resolution: '4K',
      sizeMB: 58.2,
      noWatermark: true,
      qualityTag: '4K Master',
      sampleMediaUrl: SAMPLE_VIDEOS.instagram_reel.options[0].sampleMediaUrl
    },
    fileName: 'Relaxing Nature - Beautiful Nature 4K.mp4',
    downloadedAt: 'May 28, 2024 • 11:03 AM',
    sizeMB: 58.2,
    status: 'completed',
    mediaUrl: SAMPLE_VIDEOS.instagram_reel.options[0].sampleMediaUrl
  },
  {
    id: 'hist-4',
    video: {
      ...SAMPLE_VIDEOS.facebook_clip,
      id: 'vid-travel-places',
      title: 'Top 10 Amazing Places in the World',
      author: 'Travel Guide',
      thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
      views: '12,900,000',
      uploadedDate: 'May 20, 2024',
      durationFormatted: '12:30'
    },
    selectedOption: {
      id: 'opt-travel-1080p',
      label: '1080p (HD)',
      badge: 'HD',
      format: 'MP4',
      resolution: '1080p',
      sizeMB: 120.6,
      noWatermark: true,
      qualityTag: 'Watermark-Free',
      sampleMediaUrl: SAMPLE_VIDEOS.facebook_clip.options[0].sampleMediaUrl
    },
    fileName: 'Travel Guide - Top 10 Amazing Places in the World.mp4',
    downloadedAt: 'May 20, 2024 • 4:45 PM',
    sizeMB: 120.6,
    status: 'completed',
    mediaUrl: SAMPLE_VIDEOS.facebook_clip.options[0].sampleMediaUrl
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [url, setUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata>(SAMPLE_VIDEOS.mrbeast);
  const [selectedOption, setSelectedOption] = useState<DownloadOption>(SAMPLE_VIDEOS.mrbeast.options[0]);
  const [customFileName, setCustomFileName] = useState<string>('MrBeast - $1 vs $1,000,000 Private Island.mp4');

  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('rapid_download_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return INITIAL_HISTORY;
  });

  const [isMuted, setIsMuted] = useState<boolean>(cyberAudio.isMuted);
  const [isUrdu, setIsUrdu] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDeviceFrameMode, setIsDeviceFrameMode] = useState<boolean>(false);

  // Save history updates
  useEffect(() => {
    try {
      localStorage.setItem('rapid_download_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  const handleToggleMute = () => {
    const next = !isMuted;
    cyberAudio.setMuted(next);
    setIsMuted(next);
  };

  const handleToggleLang = () => {
    cyberAudio.playClick();
    setIsUrdu(prev => !prev);
  };

  const handleStartAnalysis = async (targetUrl?: string) => {
    const linkToAnalyze = (targetUrl || url).trim();
    if (!linkToAnalyze) return;

    cyberAudio.playClick();
    const resolvedMeta = resolveVideoForUrl(linkToAnalyze);
    setMetadata(resolvedMeta);
    setSelectedOption(resolvedMeta.options[0]);
    setCustomFileName(`${resolvedMeta.author} - ${resolvedMeta.title}.${resolvedMeta.options[0].format.toLowerCase()}`);
    setCurrentView('analyzing');

    // Asynchronously resolve genuine remote metadata (e.g. real YouTube title/thumbnail)
    try {
      const liveMeta = await resolveVideoMetadataAsync(linkToAnalyze);
      setMetadata(liveMeta);
      if (liveMeta.options && liveMeta.options.length > 0) {
        setSelectedOption(liveMeta.options[0]);
        setCustomFileName(`${liveMeta.author} - ${liveMeta.title}.${liveMeta.options[0].format.toLowerCase()}`);
      }
    } catch (err) {
      console.warn('Async video resolution fallback:', err);
    }
  };

  const handleAnalysisCompleted = () => {
    setCurrentView('preview');
  };

  const handleProceedToDownloadOptions = () => {
    setCurrentView('options');
  };

  const handleStartDownloadTask = (option: DownloadOption, fileName: string) => {
    setSelectedOption(option);
    setCustomFileName(fileName);
    setCurrentView('downloading');
  };

  const handleDownloadTaskFinished = (historyItem: DownloadHistoryItem) => {
    setHistory(prev => [historyItem, ...prev.filter(h => h.id !== historyItem.id)]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  const handleBack = () => {
    if (currentView === 'downloading') {
      setCurrentView('home');
    } else if (currentView === 'guide' || currentView === 'about' || currentView === 'history' || currentView === 'settings') {
      setCurrentView('home');
    } else {
      setCurrentView('home');
    }
  };

  const showBackButton = currentView !== 'home';

  return (
    <div className={`min-h-screen bg-[#030d12] text-[#e0f7f6] flex flex-col items-center relative overflow-x-hidden ${isUrdu ? 'rtl' : 'ltr'}`}>
      {/* Dynamic Cyberpunk Matrix Background */}
      <CyberBackground />

      {/* Top HUD Switcher for Desktop Viewport (Mobile device view vs Wide Cyber-HUD view) */}
      <aside aria-label="Cyber Console Tools" className="hidden lg:flex items-center justify-between w-full max-w-5xl px-4 py-2 text-xs font-mono-cyber text-[#00ffd5]/70 border-b border-[#00ffd5]/10 bg-[#020b0e]/70 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-ping" />
           <span>PUBLIC MEDIA RESOLVER v4.8 // DRM BYPASS DISABLED</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeviceFrameMode(!isDeviceFrameMode)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07252f] hover:bg-[#00ffd5]/20 border border-[#00ffd5]/30 text-[#00ffd5] transition-all cursor-pointer"
          >
            {isDeviceFrameMode ? <Monitor size={13} /> : <Smartphone size={13} />}
            <span>{isDeviceFrameMode ? 'Wide HUD Mode' : 'Mobile Frame Mode (Screenshot Style)'}</span>
          </button>
           <span>ENGINE: PUBLIC STREAM PROXY</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-start p-0 sm:p-4">
        <div 
          className={`w-full flex flex-col bg-[#041117] relative transition-all duration-300 ${
            isDeviceFrameMode 
              ? 'max-w-[420px] rounded-[36px] border-[6px] border-[#082933] shadow-[0_0_50px_rgba(0,255,213,0.25)] my-4 overflow-hidden min-h-[780px]' 
              : 'max-w-md md:max-w-xl sm:rounded-2xl sm:border sm:border-[#00ffd5]/20 sm:shadow-[0_0_35px_rgba(0,255,213,0.15)] min-h-[92vh]'
          }`}
        >
          {/* Header Bar */}
          <TopBar
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            onBack={handleBack}
            showBack={showBackButton}
            onOpenSettings={() => {
              cyberAudio.playClick();
              setCurrentView('about');
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isUrdu={isUrdu}
            onToggleLang={handleToggleLang}
          />

          {/* Active Screen View */}
          <div className="flex-1 p-4 pb-20 overflow-y-auto">
            {currentView === 'home' && (
              <HomeScreen
                url={url}
                setUrl={setUrl}
                isUrdu={isUrdu}
              />
            )}

            {currentView === 'guide' && (
              <GuideScreen
                isUrdu={isUrdu}
                onGoToDownloader={() => setCurrentView('home')}
              />
            )}

            {currentView === 'about' && (
              <AboutScreen
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                isUrdu={isUrdu}
                onToggleLang={handleToggleLang}
                onGoToDownloader={() => setCurrentView('home')}
              />
            )}

            {currentView === 'settings' && (
              <AboutScreen
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                isUrdu={isUrdu}
                onToggleLang={handleToggleLang}
                onGoToDownloader={() => setCurrentView('home')}
              />
            )}

            {/* Backwards compatibility for legacy subviews */}
            {currentView === 'analyzing' && (
              <AnalyzingScreen
                url={url}
                metadata={metadata}
                onComplete={handleAnalysisCompleted}
                isUrdu={isUrdu}
              />
            )}

            {currentView === 'preview' && (
              <PreviewScreen
                metadata={metadata}
                onProceedToDownload={handleProceedToDownloadOptions}
                isUrdu={isUrdu}
              />
            )}

            {currentView === 'options' && (
              <DownloadOptionsScreen
                metadata={metadata}
                onStartDownload={handleStartDownloadTask}
                isUrdu={isUrdu}
              />
            )}

            {currentView === 'downloading' && (
              <DownloadingScreen
                metadata={metadata}
                option={selectedOption}
                fileName={customFileName}
                onFinish={handleDownloadTaskFinished}
                onViewDownloads={() => setCurrentView('home')}
                isUrdu={isUrdu}
              />
            )}

            {currentView === 'history' && (
              <DownloadsHistoryScreen
                history={history}
                onDelete={handleDeleteHistoryItem}
                onClearAll={handleClearAllHistory}
                isUrdu={isUrdu}
              />
            )}
          </div>

          {/* Bottom Navigation */}
          <BottomNav
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            downloadsCount={history.length}
            isUrdu={isUrdu}
          />
        </div>
      </main>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isUrdu={isUrdu}
        onToggleLang={handleToggleLang}
      />
    </div>
  );
}
