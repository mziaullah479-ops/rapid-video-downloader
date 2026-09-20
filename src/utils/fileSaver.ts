export interface DownloadResult {
  success: boolean;
  method: 'server-proxy' | 'blob' | 'direct';
  message: string;
}

export interface DownloadRequestOptions {
  quality?: string;
  format?: string;
  estimatedSizeMB?: number;
  backgroundJob?: boolean;
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

async function responseToFile(
  response: Response,
  fileName: string,
  onProgress?: DownloadProgress,
  estimatedSizeMB = 0,
): Promise<DownloadResult> {
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
  const estimatedBytes = estimatedSizeMB > 0 ? estimatedSizeMB * 1024 * 1024 : 0;
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
        percentage,
      );
    }
  }

  onProgress?.('Saving the verified media file to your device...', 100);
  triggerBrowserDownload(new Blob(chunks, { type: contentType }), fileName);
  return {
    success: true,
    method: 'blob',
    message: 'The real media file was saved to your Downloads folder.',
  };
}

async function downloadViaBackgroundJob(
  mediaUrl: string,
  fileName: string,
  onProgress: DownloadProgress | undefined,
  options: DownloadRequestOptions,
  retryCount = 0,
): Promise<DownloadResult> {
  onProgress?.('Queueing a background media job...', 1);
  const response = await fetch('/api/download/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: mediaUrl,
      filename: fileName,
      quality: options.quality || '1080p',
      format: (options.format || 'mp4').toLowerCase(),
    }),
  });

  if (!response.ok) {
    let message = `The download queue returned HTTP ${response.status}.`;
    try {
      message = (await response.json()).error || message;
    } catch {
      // Preserve the HTTP fallback when the response is not JSON.
    }
    return { success: false, method: 'server-proxy', message };
  }

  const { jobId } = await response.json() as { jobId?: string };
  if (!jobId) return { success: false, method: 'server-proxy', message: 'The server did not return a download job.' };

  const deadline = Date.now() + 14 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const statusResponse = await fetch(`/api/download/jobs/${encodeURIComponent(jobId)}`);
    if (!statusResponse.ok) {
      let message = `The download job returned HTTP ${statusResponse.status}.`;
      try {
        message = (await statusResponse.json()).error || message;
      } catch {
        // Preserve the HTTP fallback when the response is not JSON.
      }
      if (statusResponse.status === 404 && retryCount < 1) {
        onProgress?.('The server restarted; restarting the download job...', 1);
        return downloadViaBackgroundJob(mediaUrl, fileName, onProgress, options, retryCount + 1);
      }
      return { success: false, method: 'server-proxy', message };
    }

    const status = await statusResponse.json() as {
      status?: 'downloading' | 'ready' | 'error';
      progress?: number;
      error?: string;
    };
    if (status.status === 'error') {
      return { success: false, method: 'server-proxy', message: status.error || 'The media extractor could not download this item.' };
    }
    if (status.status === 'ready') {
      const fileResponse = await fetch(`/api/download/jobs/${encodeURIComponent(jobId)}/file`);
      const result = await responseToFile(fileResponse, fileName, onProgress, options.estimatedSizeMB);
      if (!result.success && fileResponse.status === 404 && retryCount < 1) {
        onProgress?.('The prepared file expired; restarting the download job...', 1);
        return downloadViaBackgroundJob(mediaUrl, fileName, onProgress, options, retryCount + 1);
      }
      return result;
    }

    const progress = typeof status.progress === 'number' ? Math.min(94, Math.max(2, status.progress)) : 2;
    onProgress?.('The server is preparing the verified media file...', progress);
  }

  return { success: false, method: 'server-proxy', message: 'The background download took too long and expired.' };
}

export async function downloadFileToDevice(
  mediaUrl: string,
  fileName: string,
  onProgress?: DownloadProgress,
  options: DownloadRequestOptions = {}
): Promise<DownloadResult> {
  const safeFileName = fileName.trim() || 'video_download.mp4';
  if (!mediaUrl.trim()) throw new Error('No downloadable media URL was provided.');

  if (options.backgroundJob) {
    return downloadViaBackgroundJob(mediaUrl, safeFileName, onProgress, options);
  }

  const query = new URLSearchParams({ url: mediaUrl, filename: safeFileName });
  if (options.quality) query.set('quality', options.quality);
  if (options.format) query.set('format', options.format.toLowerCase());

  onProgress?.('Connecting to the public media server...', 0);
  const response = await fetch(`/api/download?${query.toString()}`);
  return responseToFile(response, safeFileName, onProgress, options.estimatedSizeMB);
}
