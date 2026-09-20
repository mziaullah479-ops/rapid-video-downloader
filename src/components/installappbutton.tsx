import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppButtonProps {
  isUrdu?: boolean;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({ isUrdu = false }) => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setIsInstalled(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleInstall = async () => {
    if (!installEvent) {
      setShowHelp(prev => !prev);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setIsInstalled(true);
    setInstallEvent(null);
  };

  return (
    <div className="rounded-xl border border-[#00ffd5]/20 bg-[#04151b]/80 px-3 py-2.5">
      <button
        type="button"
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 text-xs font-display font-bold tracking-wide text-[#00ffd5] hover:text-white transition-colors cursor-pointer"
      >
        {isIOS ? <Smartphone size={15} /> : <Download size={15} />}
        <span>{isUrdu ? 'ایپ انسٹال کریں' : 'INSTALL RAPID APP'}</span>
      </button>
      {showHelp && (
        <p className="mt-2 text-[10px] leading-relaxed text-[#9ddbd3] text-center">
          {isIOS
            ? (isUrdu ? 'Safari کے Share بٹن سے Add to Home Screen منتخب کریں۔' : 'In Safari, tap Share, then choose Add to Home Screen.')
            : (isUrdu ? 'Chrome menu سے Install app یا Add to Home screen منتخب کریں۔' : 'Open the browser menu and choose Install app or Add to Home screen.')}
        </p>
      )}
    </div>
  );
};
