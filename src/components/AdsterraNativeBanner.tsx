import { useEffect } from 'react';

const CONTAINER_ID = 'container-efa56c9a59a1939d8d2e834b825f42a3';
const SCRIPT_SRC = 'https://lightlyenergeticevolution.com/efa56c9a59a1939d8d2e834b825f42a3/invoke.js';

export function AdsterraNativeBanner() {
  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || container.dataset.loaded === 'true') return;

    const collapseIfEmpty = () => {
      if (!container.children.length && !container.textContent?.trim()) {
        container.style.minHeight = '0';
      }
    };
    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = SCRIPT_SRC;
    script.addEventListener('error', collapseIfEmpty, { once: true });
    container.dataset.loaded = 'true';
    // Adsterra's native snippet expects the target container before its script.
    container.after(script);
    const timeoutId = window.setTimeout(collapseIfEmpty, 12000);

    return () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('error', collapseIfEmpty);
    };
  }, []);

  return (
    <div className="w-full mt-5 flex items-center justify-center overflow-hidden">
      <div id={CONTAINER_ID} className="w-full min-h-[90px]" />
    </div>
  );
}
