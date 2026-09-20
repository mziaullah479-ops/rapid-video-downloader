export type PlatformId = 
  | 'tiktok' 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'youtube' 
  | 'reddit' 
  | 'pinterest'
  | 'vimeo' 
  | 'dailymotion'
  | 'other';

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  badge: string;
  iconColor: string;
  urlPlaceholder: string;
  sampleUrl: string;
  domainKeywords: string[];
}

export interface DownloadOption {
  id: string;
  label: string;
  badge: string; // e.g., '4K', 'HD', 'SD', 'MP3'
  format: 'MP4' | 'MP3' | 'M4A' | 'WEBM' | 'GIF';
  resolution?: string; // '1080p', '720p', etc.
  sizeMB: number;
  noWatermark: boolean;
  qualityTag: string;
  bitrate?: string;
  fps?: number;
  sampleMediaUrl: string;
  downloadUrl?: string;
  downloadQuality?: string;
}

export interface VideoMetadata {
  id: string;
  url: string;
  platform: PlatformId;
  platformName: string;
  title: string;
  author: string;
  authorAvatar: string;
  authorVerified: boolean;
  subscribersOrFollowers: string;
  views: string;
  likes: string;
  uploadedDate: string;
  duration: number; // in seconds
  durationFormatted: string;
  description: string;
  tags: string[];
  thumbnail: string;
  previewVideoUrl: string;
  youtubeVideoId?: string;
  downloadSupported?: boolean;
  downloadMessage?: string;
  options: DownloadOption[];
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  text: string;
  type?: 'info' | 'success' | 'matrix' | 'warn' | 'cyan';
}

export interface DownloadHistoryItem {
  id: string;
  video: VideoMetadata;
  selectedOption: DownloadOption;
  fileName: string;
  downloadedAt: string;
  sizeMB: number;
  status: 'completed' | 'in_progress';
  mediaUrl: string;
}

export type AppView = 
  | 'home' 
  | 'guide' 
  | 'about'
  | 'analyzing' 
  | 'preview' 
  | 'options' 
  | 'downloading' 
  | 'history'
  | 'settings';
