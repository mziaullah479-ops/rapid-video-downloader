import { useEffect } from 'react';

const CONTAINER_ID = 'adsterra-native-banner-efa56c9a59a1939d8d2e834b825f42a3';
const SCRIPT_SRC = 'https://lightlyenergeticevolution.com/efa56c9a59a1939d8d2e834b825f42a3/invoke.js';

export function AdsterraNativeBanner() {
  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || container.dataset.loaded === 'true') return;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = SCRIPT_SRC;
    container.dataset.loaded = 'true';
    container.before(script);
  }, []);

  return (
    <div className="w-full min-h-[64px] flex items-center justify-center overflow-hidden rounded-xl border border-[#00ffd5]/10 bg-[#031117]/60">
      <div id={CONTAINER_ID} className="w-full" />
    </div>
  );
}

