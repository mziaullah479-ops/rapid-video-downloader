import React from 'react';
import { 
  Home, 
  BookOpen, 
  Sliders, 
  ChevronLeft, 
  MoreVertical,
  Zap,
  Volume2,
  VolumeX,
  Languages
} from 'lucide-react';
import { AppView } from '../types';
import { cyberAudio } from '../utils/audio';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onBack?: () => void;
  showBack?: boolean;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isUrdu: boolean;
  onToggleLang: () => void;
}

export const TopBar: React.FC<NavbarProps> = ({
  currentView,
  onBack,
  showBack,
  onOpenSettings,
  isMuted,
  onToggleMute,
  isUrdu,
  onToggleLang
}) => {
  return (
    <header className="w-full bg-[#030e13]/90 backdrop-blur-md border-b border-[#00ffd5]/20 sticky top-0 z-40 px-4 py-3">
      {/* Top simulated status bar */}
      <div className="flex justify-between items-center text-[11px] font-mono-cyber text-[#00ffd5]/60 mb-2 select-none">
        <span>09:41</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleLang}
            title="Toggle Urdu / English language"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#07242c] text-[#00ffd5] border border-[#00ffd5]/30 hover:bg-[#00ffd5]/20 transition-colors"
          >
            <Languages size={11} />
            <span>{isUrdu ? 'EN' : 'اردو'}</span>
          </button>
          <button 
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Cyber SFX' : 'Mute Cyber SFX'}
            className="hover:text-[#00ffd5] transition-colors"
          >
            {isMuted ? <VolumeX size={13} className="text-gray-400" /> : <Volume2 size={13} className="text-[#00ffd5]" />}
          </button>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
            5G
          </span>
          <div className="w-5 h-2.5 border border-[#00ffd5]/70 rounded-sm p-0.5 flex items-center">
            <div className="h-full w-4 bg-[#00ffd5] rounded-xs" />
          </div>
        </div>
      </div>

      {/* Main Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={() => {
                cyberAudio.playClick();
                if (onBack) onBack();
              }}
              className="p-1.5 -ml-1 text-[#00ffd5] hover:bg-[#00ffd5]/15 rounded-lg transition-colors"
              title="Back"
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}

          {/* Rapid Downloader Cyber Logo */}
          <div 
            onClick={() => {
              cyberAudio.playClick();
              // return to home
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ffd5] to-[#009b80] p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,213,0.5)]">
              <div className="w-full h-full bg-[#041117] rounded-[7px] flex items-center justify-center">
                <Zap size={18} className="text-[#00ffd5] fill-[#00ffd5]" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-wider leading-none text-white">
                RAPID
              </h1>
              <p className="text-[9px] font-mono-cyber tracking-widest text-[#00ffd5] leading-none">
                VIDEO DOWNLOADER
              </p>
            </div>
          </div>
        </div>

        {/* Right menu button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onOpenSettings();
            }}
            className="p-1.5 text-[#00ffd5]/80 hover:text-[#00ffd5] hover:bg-[#00ffd5]/10 rounded-lg transition-colors"
            title="Settings & Tools"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav: React.FC<{
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  downloadsCount?: number;
  isUrdu?: boolean;
}> = ({ currentView, onNavigate, isUrdu }) => {
  const navItems = [
    { 
      view: 'home' as AppView, 
      label: isUrdu ? 'ڈاؤنلوڈر' : 'Downloader', 
      icon: Home 
    },
    { 
      view: 'guide' as AppView, 
      label: isUrdu ? 'طریقہ کار' : 'Guides & FAQ', 
      icon: BookOpen 
    },
    { 
      view: 'about' as AppView, 
      label: isUrdu ? 'متعلقہ و سیٹنگز' : 'About & Settings', 
      icon: Sliders 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#041117]/95 backdrop-blur-lg border-t border-[#00ffd5]/25 px-4 py-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => {
                cyberAudio.playClick();
                onNavigate(item.view);
              }}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl relative transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#00ffd5]'
                  : 'text-[#7feadc] hover:text-[#00ffd5]'
              }`}
            >
              {/* Active glow indicator */}
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 rounded-full bg-[#00ffd5] shadow-[0_0_8px_#00ffd5]" />
              )}

              <Icon size={21} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />

              <span className="text-[11px] font-medium mt-1 font-mono-cyber">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
