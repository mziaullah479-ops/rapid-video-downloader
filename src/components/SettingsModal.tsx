import React from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Languages, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isUrdu: boolean;
  onToggleLang: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  isUrdu,
  onToggleLang
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#04151b] border border-[#00ffd5] rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(0,255,213,0.3)] font-mono-cyber">
        {/* Header */}
        <div className="bg-[#051c24] px-4 py-3 border-b border-[#00ffd5]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-[#00ffd5]" />
            <span className="text-xs font-bold text-white tracking-wider">
              {isUrdu ? 'سسٹم سیٹنگز اور کنفیگریشن' : 'SYSTEM CONFIG // CYBER KERNEL'}
            </span>
          </div>
          <button
            onClick={() => {
              cyberAudio.playClick();
              onClose();
            }}
            className="text-[#00ffd5] hover:bg-[#00ffd5]/20 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Watermark Removal Engine */}
          <div className="p-3 bg-[#030e13] rounded-xl border border-[#00ffd5]/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#00ffd5]" />
                {isUrdu ? 'واٹر مارک بائی پاس انجن' : 'Watermark Bypass Engine'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/20 text-[#00ffd5] font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#00ffd5]/60 leading-relaxed">
              {isUrdu 
                ? 'براہ راست CDN اسٹریم ہائی جیکنگ کے ذریعے ٹک ٹاک، انسٹاگرام اور فیس بک ویڈیوز سے تمام واٹر مارک فوری حذف ہو جاتے ہیں۔'
                : 'Direct raw CDN stream extraction strips TikTok, Instagram & Facebook logos before packet encoding.'}
            </p>
          </div>

          {/* Audio Cyber SFX */}
          <div className="flex items-center justify-between p-3 bg-[#030e13] rounded-xl border border-[#00ffd5]/20">
            <div className="flex items-center gap-2">
              {isMuted ? <VolumeX size={16} className="text-gray-400" /> : <Volume2 size={16} className="text-[#00ffd5]" />}
              <div>
                <span className="text-white font-semibold block">
                  {isUrdu ? 'سائبر آوازیں اور بیپس' : 'Futuristic Cyber Audio'}
                </span>
                <span className="text-[10px] text-[#00ffd5]/60">
                  {isUrdu ? 'ہیکنگ ٹرمینل ساؤنڈ افیکٹس' : 'Synthesizer terminal ticks & pulses'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onToggleMute();
                cyberAudio.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                !isMuted 
                  ? 'bg-[#00ffd5] text-[#021318]' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {isMuted ? (isUrdu ? 'بند ہے' : 'Muted') : (isUrdu ? 'آن ہے' : 'Enabled')}
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#030e13] rounded-xl border border-[#00ffd5]/20">
            <div className="flex items-center gap-2">
              <Languages size={16} className="text-[#00ffd5]" />
              <div>
                <span className="text-white font-semibold block">
                  {isUrdu ? 'زبان / Language' : 'Interface Language'}
                </span>
                <span className="text-[10px] text-[#00ffd5]/60">
                  {isUrdu ? 'اردو اور انگلش میں سوئچ کریں' : 'English & Urdu dual mode'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                cyberAudio.playClick();
                onToggleLang();
              }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#072d38] hover:bg-[#00ffd5] hover:text-[#021318] text-[#00ffd5] border border-[#00ffd5]/30 transition-all cursor-pointer"
            >
              {isUrdu ? 'Switch to English' : 'اردو منتخب کریں'}
            </button>
          </div>

          {/* Terminal Matrix Status */}
          <div className="p-3 bg-[#030e13] rounded-xl border border-[#00ffd5]/20 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white flex items-center gap-1.5">
                <Terminal size={13} className="text-[#00ffd5]" />
                <span>Node Connection</span>
              </span>
              <span className="text-[#00e599] font-bold">100% OPERATIONAL</span>
            </div>
            <p className="text-[10px] text-[#00ffd5]/60">
              TikTok v19.2 API • IG Graph API • X Video v2 • FB Watch • YT 4K
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#051c24] px-4 py-2.5 border-t border-[#00ffd5]/20 flex justify-end">
          <button
            onClick={() => {
              cyberAudio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-[#00ffd5] hover:bg-[#00e599] text-[#021318] font-bold rounded-lg text-xs"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
