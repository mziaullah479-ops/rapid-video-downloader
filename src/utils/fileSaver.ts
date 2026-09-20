export interface DownloadResult {
  success: boolean;
  method: 'server-proxy' | 'blob' | 'direct';
  message: string;
}

export interface DownloadRequestOptions {
  quality?: string;
  format?: string;
  estimatedSizeMB?: number;
}

type DownloadProgress = (status: string, percentage?: number) => void;

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  }, 30000);
}

export async function downloadFileToDevice(
  mediaUrl: string,
  fileName: string,
  onProgress?: DownloadProgress,
  options: DownloadRequestOptions = {}
): Promise<DownloadResult> {
  const safeFileName = fileName.trim() || 'video_download.mp4';
  if (!mediaUrl.trim()) throw new Error('No downloadable media URL was provided.');

  const query = new URLSearchParams({ url: mediaUrl, filename: safeFileName });
  if (options.quality) query.set('quality', options.quality);
  if (options.format) query.set('format', options.format.toLowerCase());

  onProgress?.('Connecting to the public media server...', 0);
  const response = await fetch(`/api/download?${query.toString()}`);
  if (!response.ok || !response.body) {
    let message = `The media server returned HTTP ${response.status}.`;
    try {
      message = (await response.json()).error || message;
    } catch {
      // Preserve the HTTP fallback when the response is not JSON.
    }
    return { success: false, method: 'direct', message };
  }

  const totalBytes = Number(response.headers.get('content-length') || 0);
  const estimatedBytes = options.estimatedSizeMB && options.estimatedSizeMB > 0
    ? options.estimatedSizeMB * 1024 * 1024
    : 0;
  const progressBytes = totalBytes || estimatedBytes;
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  let lastUpdate = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    receivedBytes += value.byteLength;
    const percentage = progressBytes
      ? Math.min(95, Math.round((receivedBytes / progressBytes) * 100))
      : undefined;
    const now = Date.now();
    if (!percentage || now - lastUpdate > 180) {
      lastUpdate = now;
      onProgress?.(
        totalBytes
          ? `Received ${(receivedBytes / 1024 / 1024).toFixed(1)} MB of ${(totalBytes / 1024 / 1024).toFixed(1)} MB...`
          : estimatedBytes
            ? `Received ${(receivedBytes / 1024 / 1024).toFixed(1)} MB of about ${(estimatedBytes / 1024 / 1024).toFixed(1)} MB...`
          : `Received ${(receivedBytes / 1024 / 1024).toFixed(1)} MB...`,
        percentage
      );
    }
  }

  onProgress?.('Saving the verified media file to your device...', 100);
  triggerBrowserDownload(new Blob(chunks, { type: contentType }), safeFileName);
  return {
    success: true,
    method: 'blob',
    message: 'The real media file was saved to your Downloads folder.',
  };
}
