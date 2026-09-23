import React, { useEffect, useState } from 'react';
import { 
  Check, 
  Download, 
  Edit3, 
  Film, 
  Music, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { VideoMetadata, DownloadOption } from '../types';
import { cyberAudio } from '../utils/audio';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';

interface DownloadOptionsScreenProps {
  metadata: VideoMetadata;
  onStartDownload: (option: DownloadOption, customFileName: string) => void;
  isUrdu?: boolean;
}

export const DownloadOptionsScreen: React.FC<DownloadOptionsScreenProps> = ({
  metadata,
  onStartDownload,
  isUrdu = false
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    metadata.options[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio'>('all');
  const [isEditingName, setIsEditingName] = useState(false);
  const [fileName, setFileName] = useState(
    `${metadata.author} - ${metadata.title}`.replace(/[\\/:*?"<>|]/g, '')
  );

  const selectedOption = metadata.options.find(o => o.id === selectedOptionId) || metadata.options[0];

  const matchesFilter = (opt: DownloadOption) => {
    if (filterType === 'video') return opt.format === 'MP4' || opt.format === 'WEBM';
    if (filterType === 'audio') return opt.format === 'MP3' || opt.format === 'M4A';
    return true;
  };

  const filteredOptions = metadata.options.filter(matchesFilter);

  useEffect(() => {
    if (filteredOptions.length > 0 && !filteredOptions.some(option => option.id === selectedOptionId)) {
      setSelectedOptionId(filteredOptions[0].id);
    }
  }, [filterType, metadata.options, selectedOptionId]);

  const handleSelectOption = (option: DownloadOption) => {
    cyberAudio.playClick();
    setSelectedOptionId(option.id);
  };

  const handleStart = () => {
    cyberAudio.playClick();
    if (!selectedOption) return;
    const finalExt = selectedOption.format.toLowerCase();
    const cleanName = fileName.endsWith(`.${finalExt}`) ? fileName : `${fileName}.${finalExt}`;
    onStartDownload(selectedOption, cleanName);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300 pb-4 font-mono-cyber">
      {/* Mini Video Summary Banner matching screenshot */}
      <div className="flex items-center gap-3 p-2.5 bg-[#04151b] border border-[#00ffd5]/20 rounded-xl">
        <img
          src={metadata.thumbnail}
          alt={metadata.title}
          className="w-16 h-12 rounded-lg object-cover border border-[#00ffd5]/30 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-display font-bold text-white truncate">
            {metadata.title}
          </h3>
          <p className="text-[11px] text-[#00ffd5] truncate">{metadata.author}</p>
          <p className="text-[10px] text-[#00ffd5]/60 flex items-center gap-1">
            <span>⏱ {metadata.durationFormatted}</span>
            <span>•</span>
            <span className="text-[#00e599] flex items-center gap-0.5">
               <ShieldCheck size={10} /> Source stream
            </span>
          </p>
        </div>
      </div>

      {/* Format Filter Tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
          {isUrdu ? 'ویڈیو کوالٹی اور فارمیٹ' : 'Video Quality'}
        </h3>
        <div className="flex items-center gap-1 bg-[#041117] p-0.5 rounded-lg border border-[#00ffd5]/20 text-[10px]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 rounded transition-colors ${
              filterType === 'all' ? 'bg-[#00ffd5] text-[#021318] font-bold' : 'text-[#00ffd5]/60 hover:text-white'
            }`}
          >
            {isUrdu ? 'تمام' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              filterType === 'video' ? 'bg-[#00ffd5] text-[#021318] font-bold' : 'text-[#00ffd5]/60 hover:text-white'
            }`}
          >
            <Film size={10} />
            <span>MP4</span>
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              filterType === 'audio' ? 'bg-[#00ffd5] text-[#021318] font-bold' : 'text-[#00ffd5]/60 hover:text-white'
            }`}
          >
            <Music size={10} />
            <span>MP3</span>
          </button>
        </div>
      </div>

      {/* Quality Options List matching screenshot */}
      <div className="space-y-2">
        {filteredOptions.map((option) => {
          const isSelected = selectedOptionId === option.id;

          return (
            <div
              key={option.id}
              onClick={() => handleSelectOption(option)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#05222b] border-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                  : 'bg-[#04151b] border-[#00ffd5]/20 hover:border-[#00ffd5]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Badge icon (HD, 4K, SD, MP3) */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-display ${
                    isSelected
                      ? 'bg-[#00ffd5] text-[#021318]'
                      : 'bg-[#072c36] text-[#00ffd5] border border-[#00ffd5]/30'
                  }`}
                >
                  {option.badge}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{option.label}</span>
                    {option.noWatermark && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00ffd5]/15 text-[#00ffd5] border border-[#00ffd5]/30 flex items-center gap-0.5">
                        <Sparkles size={8} /> No WM
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#00ffd5]/70 flex items-center gap-1.5 mt-0.5">
                    <span>{option.format}</span>
                    <span>•</span>
                    <span className="text-[#a5ede3] font-semibold">{option.sizeMB.toFixed(1)} MB</span>
                    {option.bitrate && (
                      <>
                        <span>•</span>
                        <span className="text-[#00ffd5]/50">{option.bitrate}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Radio selector icon */}
              <div className="shrink-0 ml-2">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#00ffd5] bg-[#00ffd5]'
                      : 'border-[#00ffd5]/40 bg-transparent'
                  }`}
                >
                  {isSelected && <Check size={12} className="text-[#021318] stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* File Name section matching screenshot */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-[#00ffd5]/80 uppercase tracking-wider block">
          {isUrdu ? 'فائل کا نام' : 'File Name'}
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onFocus={() => setIsEditingName(true)}
            onBlur={() => setIsEditingName(false)}
            className="w-full py-2.5 px-3 pr-10 bg-[#04151b] border border-[#00ffd5]/30 focus:border-[#00ffd5] rounded-xl text-xs text-[#a0ede3] outline-none truncate"
          />
          <button
            onClick={() => setIsEditingName(!isEditingName)}
            className="absolute right-3 text-[#00ffd5]/60 hover:text-[#00ffd5]"
            title="Edit filename"
          >
            <Edit3 size={14} />
          </button>
        </div>
      </div>

      <AdsterraNativeBanner />

      {/* Big Neon Download Now button matching screenshot */}
      <div className="pt-2">
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-display font-bold text-base tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-[#00ffd5] via-[#0df7cb] to-[#00d2aa] text-[#021318] hover:shadow-[0_0_25px_rgba(0,255,213,0.6)] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
        >
          <Download size={20} className="stroke-[2.5]" />
          <span>{isUrdu ? 'ابھی ڈاؤنلوڈ کریں' : 'DOWNLOAD NOW'}</span>
        </button>
      </div>
    </div>
  );
};
