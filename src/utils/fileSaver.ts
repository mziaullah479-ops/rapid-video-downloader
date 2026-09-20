export interface DownloadResult {
  success: boolean;
  method: 'server-proxy' | 'blob' | 'direct';
  message: string;
}

export interface DownloadRequestOptions {
  quality?: string;
  format?: string;
}

function triggerBrowserDownload(url: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => anchor.remove(), 1500);
}

export async function downloadFileToDevice(
  mediaUrl: string,
  fileName: string,
  onProgress?: (status: string) => void,
  options: DownloadRequestOptions = {}
): Promise<DownloadResult> {
  const safeFileName = fileName.trim() || 'video_download.mp4';
  if (!mediaUrl.trim()) {
    throw new Error('No downloadable media URL was provided.');
  }

  const query = new URLSearchParams({
    url: mediaUrl,
    filename: safeFileName,
  });
  if (options.quality) query.set('quality', options.quality);
  if (options.format) query.set('format', options.format.toLowerCase());

  const proxyUrl = `/api/download?${query.toString()}`;
  onProgress?.('Checking the public media stream...');

  try {
    const head = await fetch(proxyUrl, { method: 'HEAD' });
    if (head.ok) {
      onProgress?.('Starting the real media download...');
      triggerBrowserDownload(proxyUrl, safeFileName);
      return {
        success: true,
        method: 'server-proxy',
        message: 'The media download was started.',
      };
    }

    const errorText = await head.text();
    let message = 'The server could not prepare this media.';
    try {
      message = JSON.parse(errorText).error || message;
    } catch {
      // Keep the user-facing fallback message when the response is not JSON.
    }
    return { success: false, method: 'direct', message };
  } catch (error) {
    console.warn('Media download request failed:', error);
    return {
      success: false,
      method: 'direct',
      message: 'The media server is unavailable. Please try again.',
    };
  }
}
