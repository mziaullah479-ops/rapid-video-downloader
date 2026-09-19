import React, { useEffect, useRef } from 'react';
import { TerminalLog as TerminalLogType } from '../types';

interface TerminalLogProps {
  logs: TerminalLogType[];
  title?: string;
  maxHeight?: string;
  showCursor?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  title = 'TERMINAL OUTPUT',
  maxHeight = 'max-h-40',
  showCursor = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full bg-[#020b0e]/95 border border-[#00ffd5]/25 rounded-xl overflow-hidden font-mono-cyber text-xs shadow-lg">
      {/* Terminal Titlebar */}
      <div className="bg-[#051820] px-3 py-1.5 border-b border-[#00ffd5]/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5555]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffb86c]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#50fa7b]/80" />
          <span className="ml-2 text-[10px] text-[#00ffd5]/70 tracking-wider font-semibold">
            {title}
          </span>
        </div>
        <span className="text-[10px] text-[#00ffd5]/40 font-semibold">v4.8.2-SECURE</span>
      </div>

      {/* Terminal Content Lines */}
      <div
        ref={containerRef}
        className={`p-3 ${maxHeight} overflow-y-auto space-y-1 scroll-smooth select-text`}
      >
        {logs.map((log, index) => {
          let textColor = 'text-[#00ffd5]';
          if (log.type === 'warn') textColor = 'text-amber-400';
          if (log.type === 'success') textColor = 'text-[#00e599] font-semibold';
          if (log.type === 'matrix') textColor = 'text-[#0df7cb]/80';

          return (
            <div key={`${log.id}-${index}`} className="leading-relaxed flex items-start gap-1.5">
              <span className="text-[#00ffd5]/50 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`${textColor} break-all`}>{log.text}</span>
            </div>
          );
        })}

        {showCursor && (
          <div className="flex items-center gap-1 text-[#00ffd5]">
            <span className="text-[#00ffd5]/60">&gt;</span>
            <span className="inline-block w-2 h-3.5 bg-[#00ffd5] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
