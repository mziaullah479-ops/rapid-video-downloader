import express from "express";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { createServer as createViteServer } from "vite";
import ffmpegPath from "ffmpeg-static";

const MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024;
const EXTRACTOR_HOSTS = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "instagram.com",
  "instagr.am",
  "facebook.com",
  "fb.watch",
  "fb.com",
  "twitter.com",
  "x.com",
  "t.co",
  "reddit.com",
  "redd.it",
  "pinterest.com",
  "pin.it",
  "vimeo.com",
  "dailymotion.com",
  "dai.ly",
];

const MEDIA_EXTENSIONS = /\.(?:mp4|webm|mov|m4v|mkv|avi|mp3|m4a|wav|ogg|flac)(?:$|[?#])/i;
const MEDIA_CONTENT_TYPES = /^(?:video|audio)\//i;
const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; RapidVideoDownloader/1.0)",
  Accept: "video/*,audio/*,application/octet-stream;q=0.9,*/*;q=0.5",
};
const PAGE_HEADERS = {
  ...REQUEST_HEADERS,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.8",
};

function mediaHeaders(target: URL): Record<string, string> {
  const headers = { ...REQUEST_HEADERS };
  const hostname = target.hostname.toLowerCase();
  if (hostname.includes("tiktokcdn")) headers.Referer = "https://www.tiktok.com/";
  if (hostname.includes("fbcdn") || hostname.includes("facebook")) headers.Referer = "https://www.facebook.com/";
  return headers;
}
const downloadJobs = new Map<string, {
  id: string;
  filePath: string;
  fileName: string;
  format: string;
  status: "downloading" | "ready" | "error";
  progress: number;
  error?: string;
}>();

type AnalyticsEvent = {
  id: string;
  name: string;
  timestamp: string;
  visitorId: string;
  country: string;
  path?: string;
  platform?: string;
  format?: string;
  quality?: string;
  success?: boolean;
};

const analyticsStartedAt = new Date().toISOString();
const analyticsEvents: AnalyticsEvent[] = [];
const adminSessions = new Map<string, number>();
const MAX_ANALYTICS_EVENTS = 10_000;
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

function requestAnalyticsContext(req: express.Request) {
  const rawVisitor = String(req.headers["x-visitor-id"] || req.ip || "anonymous");
  const rawCountry = String(
    req.headers["cf-ipcountry"]
      || req.headers["x-country-code"]
      || req.headers["x-vercel-ip-country"]
      || "Unknown",
  );
  return {
    visitorId: rawVisitor.slice(0, 120),
    country: /^[a-z]{2}$/i.test(rawCountry) ? rawCountry.toUpperCase() : "Unknown",
  };
}

function recordAnalyticsEvent(req: express.Request, name: string, details: Omit<AnalyticsEvent, "id" | "name" | "timestamp" | "visitorId" | "country"> = {}) {
  const context = requestAnalyticsContext(req);
  analyticsEvents.push({
    id: crypto.randomUUID(),
    name,
    timestamp: new Date().toISOString(),
    ...context,
    ...details,
  });
  if (analyticsEvents.length > MAX_ANALYTICS_EVENTS) analyticsEvents.splice(0, analyticsEvents.length - MAX_ANALYTICS_EVENTS);
}

function readCookie(req: express.Request, name: string): string | undefined {
  const cookies = String(req.headers.cookie || "").split(";");
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : undefined;
}

function secureStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isAdminAuthenticated(req: express.Request): boolean {
  const token = readCookie(req, "rapid_admin");
  const expiresAt = token ? adminSessions.get(token) : undefined;
  if (!expiresAt || expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return false;
  }
  return true;
}

function analyticsMetrics() {
  const now = Date.now();
  const recentEvents = analyticsEvents.filter((event) => now - Date.parse(event.timestamp) <= 15 * 60 * 1000);
  const pageViews = analyticsEvents.filter((event) => event.name === "page_view");
  const downloadsStarted = analyticsEvents.filter((event) => event.name === "download_started");
  const downloadsCompleted = analyticsEvents.filter((event) => event.name === "download_completed" && event.success !== false);
  const downloadsFailed = analyticsEvents.filter((event) => event.name === "download_failed" || event.success === false);
  const unique = (events: AnalyticsEvent[]) => new Set(events.map((event) => event.visitorId)).size;
  const countBy = (events: AnalyticsEvent[], key: "country" | "platform" | "format") => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const value = event[key] || "Unknown";
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12);
  };

  return {
    generatedAt: new Date().toISOString(),
    capturedSince: analyticsStartedAt,
    retention: "Current running service instance",
    pageViews: pageViews.length,
    activeUsers: unique(recentEvents),
    downloadsStarted: downloadsStarted.length,
    downloadsCompleted: downloadsCompleted.length,
    downloadsFailed: downloadsFailed.length,
    successRate: downloadsStarted.length ? Math.round((downloadsCompleted.length / downloadsStarted.length) * 100) : 0,
    countries: countBy(pageViews, "country"),
    platforms: countBy(downloadsStarted, "platform"),
    formats: countBy(downloadsStarted, "format"),
    recentActivity: analyticsEvents.slice(-18).reverse().map((event) => ({
      id: event.id,
      name: event.name,
      timestamp: event.timestamp,
      country: event.country,
      platform: event.platform,
      format: event.format,
      success: event.success,
    })),
  };
}

function extractorEnvironment() {
  const bundledPath = path.join(process.cwd(), ".render", "yt-dlp");
  return {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: [bundledPath, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
  };
}

function extractorFfmpegArgs(): string[] {
  return ffmpegPath ? ["--ffmpeg-location", ffmpegPath] : [];
}

function isPrivateAddress(address: string): boolean {
  const value = address.toLowerCase();
  if (net.isIPv4(value)) {
    const [a, b] = value.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  return (
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:") ||
    value.startsWith("::ffff:127.") ||
    value.startsWith("::ffff:10.") ||
    value.startsWith("::ffff:192.168.")
  );
}

async function validatePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("A valid media URL is required.");
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("Only public HTTP(S) URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local") || isPrivateAddress(hostname)) {
    throw new Error("Private and local network URLs are not allowed.");
  }

  if (!net.isIP(hostname)) {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new Error("The destination is not a public internet address.");
    }
  }

  return parsed;
}

function isExtractorUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  return EXTRACTOR_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function platformForUrl(url: URL): { id: string; name: string } {
  const hostname = url.hostname.toLowerCase();
  if (hostname.includes("youtube") || hostname === "youtu.be") return { id: "youtube", name: "YouTube" };
  if (hostname.includes("tiktok")) return { id: "tiktok", name: "TikTok" };
  if (hostname.includes("instagram") || hostname.includes("instagr.am")) return { id: "instagram", name: "Instagram" };
  if (hostname.includes("facebook") || hostname === "fb.watch" || hostname === "fb.com") return { id: "facebook", name: "Facebook" };
  if (hostname.includes("twitter") || hostname === "x.com" || hostname === "t.co") return { id: "twitter", name: "X (Twitter)" };
  if (hostname.includes("reddit") || hostname === "redd.it") return { id: "reddit", name: "Reddit" };
  if (hostname.includes("pinterest") || hostname === "pin.it") return { id: "pinterest", name: "Pinterest" };
  if (hostname.includes("vimeo")) return { id: "vimeo", name: "Vimeo" };
  if (hostname.includes("dailymotion") || hostname === "dai.ly") return { id: "dailymotion", name: "Dailymotion" };
  return { id: "other", name: "Direct Media" };
}

function runYtDlp(args: string[], timeoutMs = 30_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.YTDLP_BIN || "python3", ["-m", "yt_dlp", ...args], {
      env: extractorEnvironment(),
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("The media extractor timed out."));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr.trim() || `Media extractor exited with code ${code}.`));
      }
    });
  });
}

function extractorUserMessage(error: unknown, sourcePlatform?: string): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (sourcePlatform === "youtube" && /sign in to confirm|cookies-from-browser|cookies for the authentication|not a bot/i.test(raw)) {
    return "YouTube requires sign-in verification for this video. This downloader cannot bypass that security check. Use YouTube's official download controls or provide a direct media URL you are authorized to save.";
  }
  if (sourcePlatform === "tiktok" && /unexpected response|webpage request|blocked/i.test(raw)) {
    return "TikTok did not expose a public download stream for this link. Try a public video link or provide a direct media URL you are authorized to save.";
  }
  return raw.trim().slice(-800) || "The media extractor could not download this item.";
}

async function extractMetadata(targetUrl: string) {
  const output = await runYtDlp([
    "--dump-single-json",
    "--skip-download",
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout",
    "15",
    targetUrl,
  ]);
  const jsonLine = output.trim().split("\n").find((line) => line.trim().startsWith("{"));
  if (!jsonLine) throw new Error("The media extractor returned no metadata.");
  return JSON.parse(jsonLine) as Record<string, unknown>;
}

function titleFromUrl(url: URL): string {
  const lastPart = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "media");
  return lastPart.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 100) || "Direct media file";
}

function formatCount(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US")
    : "Public data unavailable";
}

function formatUploadDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) return "Public date unavailable";
  const date = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00Z`);
  return Number.isNaN(date.valueOf())
    ? "Public date unavailable"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatTags(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).slice(0, 16)
    : fallback;
}

function decodePageValue(value: string): string {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchPageText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { ...PAGE_HEADERS, ...headers },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`The public page returned HTTP ${response.status}.`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function metaContent(html: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (!new RegExp(`(?:property|name)=["']${escapedName}["']`, "i").test(tag)) continue;
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return decodePageValue(content);
  }
  return undefined;
}

type PublicMediaFallback = {
  title?: string;
  author?: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  thumbnail?: string;
  subscribersOrFollowers?: string;
  views?: string;
  likes?: string;
  uploadedDate?: string;
  duration?: number;
  description?: string;
  tags?: string[];
  previewVideoUrl?: string;
  downloadUrl: string;
};

function pageNumber(html: string, key: string): number | undefined {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : undefined;
}

function pageStringNumber(html: string, key: string): number | undefined {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*"(\\d+)"`));
  return match ? Number(match[1]) : undefined;
}

function formatUnixDate(value: number | undefined): string {
  if (!value) return "Public date unavailable";
  return new Date(value * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function resolveTikTokPublicMedia(target: URL): Promise<PublicMediaFallback | null> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(target.toString())}`;
  const oembed = JSON.parse(await fetchPageText(oembedUrl, { Accept: "application/json,text/plain,*/*" })) as Record<string, unknown>;
  const videoId = target.pathname.match(/\/video\/(\d+)/i)?.[1]
    || (typeof oembed.embed_product_id === "string" ? oembed.embed_product_id : undefined);
  if (!videoId) return null;

  const embedHtml = await fetchPageText(`https://www.tiktok.com/embed/v2/${videoId}`, { Referer: target.toString() });
  const videoUrl = embedHtml.match(/https?:\/\/[^"'<> ]+mime_type=video_mp4[^"'<> ]*/i)?.[0];
  if (!videoUrl) return null;
  const avatarTag = embedHtml.match(/<[^>]*data-e2e=["']Player-Layer-LayerAvatar["'][^>]*>/i)?.[0] || "";
  const avatarUrl = avatarTag.match(/background-image:url\((https?:\/\/[^)]+)\)/i)?.[1];
  const caption = typeof oembed.title === "string" ? oembed.title : undefined;
  const tags = caption?.match(/#[\p{L}\p{N}_]+/gu)?.map((tag) => tag.slice(1)).slice(0, 16);
  const profileStats = embedHtml.match(/"authorStats":\{[\s\S]{0,500}?"followerCount":(\d+)/i);
  const followerCount = profileStats ? Number(profileStats[1]) : undefined;
  const createTime = pageStringNumber(embedHtml, "createTime");

  return {
    title: caption,
    author: typeof oembed.author_name === "string" ? oembed.author_name : undefined,
    authorAvatar: avatarUrl ? decodePageValue(avatarUrl) : undefined,
    authorVerified: /"verified":true/i.test(embedHtml),
    thumbnail: typeof oembed.thumbnail_url === "string" ? oembed.thumbnail_url : undefined,
    subscribersOrFollowers: followerCount ? formatCount(followerCount) : undefined,
    views: pageNumber(embedHtml, "playCount") ? formatCount(pageNumber(embedHtml, "playCount")) : undefined,
    likes: pageNumber(embedHtml, "diggCount") ? formatCount(pageNumber(embedHtml, "diggCount")) : undefined,
    uploadedDate: formatUnixDate(createTime),
    duration: pageNumber(embedHtml, "duration"),
    description: caption || "Public description unavailable.",
    tags: tags && tags.length > 0 ? tags : ["tiktok", "public media"],
    previewVideoUrl: decodePageValue(videoUrl),
    downloadUrl: decodePageValue(videoUrl),
  };
}

async function resolveOpenGraphMedia(target: URL): Promise<PublicMediaFallback | null> {
  const html = await fetchPageText(target.toString(), { Referer: target.origin });
  const downloadUrl = metaContent(html, "og:video")
    || metaContent(html, "og:video:url")
    || metaContent(html, "twitter:player:stream");
  if (!downloadUrl) return null;

  return {
    title: metaContent(html, "og:title"),
    author: metaContent(html, "article:author"),
    thumbnail: metaContent(html, "og:image"),
    description: metaContent(html, "og:description") || "Public description unavailable.",
    tags: ["facebook", "public media"],
    downloadUrl,
  };
}

function safeFileName(rawName: string): string {
  const clean = rawName.replace(/[^a-zA-Z0-9._ -]/g, "_").trim();
  return (clean || "rapid_download.mp4").slice(0, 180);
}

function contentDisposition(fileName: string): string {
  return `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function extractorFormat(quality: string, format: string): string {
  if (format === "mp3") return "bestaudio/best";
  const height = { "1080p": 1080, "720p": 720, "480p": 480, "360p": 360 }[quality as "1080p" | "720p" | "480p" | "360p"] || 1080;
  // Prefer a ready-to-play file so downloads still work when ffmpeg is not installed.
  return `best[height<=${height}][ext=mp4]/best[height<=${height}]/bestvideo[height<=${height}]+bestaudio/best`;
}

function transcodeToMp3(sourcePath: string, outputPath: string): Promise<void> {
  if (!ffmpegPath) return Promise.reject(new Error("Audio conversion is not available on this server."));

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      "-y",
      "-loglevel",
      "error",
      "-i",
      sourcePath,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "192k",
      outputPath,
    ]);
    let errorOutput = "";
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(errorOutput.trim().slice(-800) || "Audio conversion failed."));
    });
  });
}

async function probeDirectMedia(target: URL): Promise<{ contentType: string; fileName?: string } | null> {
  let current = target;

  for (let redirects = 0; redirects < 4; redirects += 1) {
    await validatePublicUrl(current.toString());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    let response: Response;

    try {
      response = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        headers: mediaHeaders(current),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = new URL(location, current);
      continue;
    }

    let contentType = (response.headers.get("content-type") || "").split(";", 1)[0].trim();
    if ((response.status === 405 || response.status === 403 || !contentType) && !response.body) {
      const fallbackController = new AbortController();
      const fallbackTimer = setTimeout(() => fallbackController.abort(), 8_000);
      try {
        response = await fetch(current, {
          headers: { ...mediaHeaders(current), Range: "bytes=0-0" },
          redirect: "manual",
          signal: fallbackController.signal,
        });
        contentType = (response.headers.get("content-type") || "").split(";", 1)[0].trim();
        await response.body?.cancel();
      } catch {
        return null;
      } finally {
        clearTimeout(fallbackTimer);
      }
    }
    if (!MEDIA_CONTENT_TYPES.test(contentType) && contentType !== "application/octet-stream") return null;

    const disposition = response.headers.get("content-disposition") || "";
    const fileName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
      || disposition.match(/filename=["']?([^;"']+)/i)?.[1];
    return { contentType, fileName };
  }

  return null;
}

function startExtractorJob(target: URL, fileName: string, quality: string, format: string) {
  const id = crypto.randomUUID();
  const extension = format === "mp3" ? "mp3" : "mp4";
  const filePath = path.join(os.tmpdir(), `rapid-${id}.${extension}`);
  const sourcePath = path.join(os.tmpdir(), `rapid-${id}-source`);
  const sourcePlatform = platformForUrl(target).id;
  const job = { id, filePath, fileName, format, status: "downloading" as const, progress: 0 };
  downloadJobs.set(id, job);

  if (format === "mp3" && !ffmpegPath) {
    job.status = "error";
    job.error = "Audio conversion is not available on this server.";
    return job;
  }

  const args = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "--retries",
    "1",
    "--socket-timeout",
    "20",
    "--max-filesize",
    `${MAX_DOWNLOAD_BYTES}`,
    "--format",
    extractorFormat(quality, format),
    "--output",
    filePath,
  ];
  if (format !== "mp3") {
    args.splice(args.indexOf("--output"), 0, "--merge-output-format", "mp4");
  }
  args.push(...extractorFfmpegArgs());
  if (format === "mp3") args[args.indexOf("--output") + 1] = sourcePath;
  args.push(target.toString());

  const child = spawn(process.env.YTDLP_BIN || "python3", ["-m", "yt_dlp", ...args], {
    env: extractorEnvironment(),
  });
  let errorOutput = "";
  const updateProgress = (chunk: Buffer) => {
    const text = chunk.toString();
    const match = text.match(/(\d+(?:\.\d+)?)%/);
    if (match) job.progress = Math.min(99, Number(match[1]));
  };
  child.stdout.on("data", updateProgress);
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    errorOutput += text;
    updateProgress(chunk);
  });
  child.once("error", (error) => {
    job.status = "error";
    job.error = extractorUserMessage(error, sourcePlatform);
  });
  child.once("close", async (code) => {
    if (code === 0) {
      if (format === "mp3") {
        try {
          job.progress = 92;
          await transcodeToMp3(sourcePath, filePath);
          job.status = "ready";
          job.progress = 100;
        } catch (error) {
          job.status = "error";
          job.error = extractorUserMessage(error, sourcePlatform);
          await fsPromises.unlink(filePath).catch(() => undefined);
        }
        await fsPromises.unlink(sourcePath).catch(() => undefined);
      } else {
        job.status = "ready";
        job.progress = 100;
      }
    } else {
      job.status = "error";
       job.error = extractorUserMessage(errorOutput, sourcePlatform);
      await fsPromises.unlink(filePath).catch(() => undefined);
      await fsPromises.unlink(sourcePath).catch(() => undefined);
    }
  });

  setTimeout(async () => {
    await fsPromises.unlink(filePath).catch(() => undefined);
    await fsPromises.unlink(sourcePath).catch(() => undefined);
    downloadJobs.delete(id);
  }, 15 * 60 * 1000);

  return job;
}

async function startTikTokAudioJob(target: URL, fileName: string) {
  const id = crypto.randomUUID();
  const filePath = path.join(os.tmpdir(), `rapid-${id}.mp3`);
  const job = { id, filePath, fileName, format: "mp3", status: "downloading" as const, progress: 5 };
  downloadJobs.set(id, job);

  if (!ffmpegPath) {
    job.status = "error";
    job.error = "Audio conversion is not available on this server.";
    return job;
  }

  const child = spawn(ffmpegPath, [
    "-y",
    "-loglevel",
    "error",
    "-i",
    "pipe:0",
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "192k",
    filePath,
  ]);
  let errorOutput = "";
  child.stderr.on("data", (chunk) => {
    errorOutput += chunk.toString();
  });
  child.once("error", (error) => {
    job.status = "error";
    job.error = error.message;
  });
  child.once("close", async (code) => {
    if (job.status === "error") return;
    if (code === 0) {
      job.status = "ready";
      job.progress = 100;
    } else {
      job.status = "error";
      job.error = errorOutput.trim().slice(-800) || "TikTok audio conversion failed.";
      await fsPromises.unlink(filePath).catch(() => undefined);
    }
  });

  try {
    const upstream = await fetch(target, { headers: mediaHeaders(target) });
    if (!upstream.ok || !upstream.body) {
      throw new Error(`TikTok media server returned HTTP ${upstream.status}.`);
    }
    Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream).pipe(child.stdin);
  } catch (error) {
    child.kill("SIGTERM");
    job.status = "error";
    job.error = error instanceof Error ? error.message : "TikTok media could not be read.";
  }

  setTimeout(async () => {
    await fsPromises.unlink(filePath).catch(() => undefined);
    downloadJobs.delete(id);
  }, 15 * 60 * 1000);

  return job;
}

async function pipeDirectMedia(target: URL, res: express.Response, fileName: string) {
  let current = target;
  let upstream: Response | undefined;

  for (let redirects = 0; redirects < 4; redirects += 1) {
    await validatePublicUrl(current.toString());
    upstream = await fetch(current, { redirect: "manual", headers: mediaHeaders(current) });
    if ([301, 302, 303, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get("location");
      if (!location) throw new Error("The media server returned an invalid redirect.");
      current = new URL(location, current);
      continue;
    }
    break;
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    throw new Error(`The media server returned HTTP ${upstream?.status || 502}.`);
  }

  const length = Number(upstream.headers.get("content-length") || 0);
  if (length > MAX_DOWNLOAD_BYTES) throw new Error("The file is larger than the free-hosting limit of 250 MB.");

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  if (/text\/html|application\/json/i.test(contentType)) {
    throw new Error("That URL is a webpage, not a direct media file.");
  }

  res.status(200);
  res.setHeader("Content-Disposition", contentDisposition(fileName));
  res.setHeader("Content-Type", contentType);
  if (length) res.setHeader("Content-Length", String(length));
  res.setHeader("Cache-Control", "no-store");

  let bytes = 0;
  const stream = Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream);
  stream.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > MAX_DOWNLOAD_BYTES) stream.destroy(new Error("The file exceeded the free-hosting limit."));
  });
  stream.on("error", (error) => res.destroy(error));
  stream.pipe(res);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const legacyRedirects: Record<string, string> = {
    "/facebook-downloader": "/facebook-video-downloader/",
    "/tiktok-no-watermark": "/tiktok-video-downloader/",
    "/blog/extract-audio-from-tiktok-instagram-mp3": "/video-to-mp3/",
  };

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();

    const legacyPath = legacyRedirects[req.path];
    const isApexHost = req.hostname.toLowerCase() === "rapid-video-downloader.online";
    if (!legacyPath && !isApexHost) return next();

    const destinationPath = legacyPath || req.originalUrl;
    return res.redirect(301, `https://www.rapid-video-downloader.online${destinationPath}`);
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", extractor: process.env.YTDLP_BIN || "python3 -m yt_dlp", timestamp: new Date().toISOString() });
  });

  app.post("/api/analytics/event", (req, res) => {
    const name = String(req.body?.name || "").trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: "An analytics event name is required." });
    recordAnalyticsEvent(req, name, {
      path: typeof req.body?.path === "string" ? req.body.path.slice(0, 240) : undefined,
      platform: typeof req.body?.platform === "string" ? req.body.platform.slice(0, 40) : undefined,
      format: typeof req.body?.format === "string" ? req.body.format.slice(0, 20) : undefined,
      quality: typeof req.body?.quality === "string" ? req.body.quality.slice(0, 20) : undefined,
      success: typeof req.body?.success === "boolean" ? req.body.success : undefined,
    });
    return res.status(204).end();
  });

  app.post("/api/admin/login", (req, res) => {
    const configuredPassword = String(process.env.ADMIN_PASSWORD || "");
    if (!configuredPassword) return res.status(503).json({ error: "The admin password is not configured yet." });
    const password = String(req.body?.password || "");
    if (!secureStringEqual(password, configuredPassword)) return res.status(401).json({ error: "Incorrect admin password." });

    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.set(token, Date.now() + ADMIN_SESSION_MS);
    res.setHeader("Set-Cookie", `rapid_admin=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(ADMIN_SESSION_MS / 1000)}`);
    return res.json({ ok: true });
  });

  app.post("/api/admin/logout", (req, res) => {
    const token = readCookie(req, "rapid_admin");
    if (token) adminSessions.delete(token);
    res.setHeader("Set-Cookie", "rapid_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
    return res.status(204).end();
  });

  app.get("/api/admin/metrics", (req, res) => {
    if (!isAdminAuthenticated(req)) return res.status(401).json({ error: "Admin authentication is required." });
    return res.json(analyticsMetrics());
  });

  app.get("/api/resolve-video", async (req, res) => {
    try {
      const targetUrl = String(req.query.url || "").trim();
      const parsed = await validatePublicUrl(targetUrl);
      const platform = platformForUrl(parsed);
      recordAnalyticsEvent(req, "resolve_started", { platform: platform.id });

      if (isExtractorUrl(parsed)) {
        try {
          const data = await extractMetadata(parsed.toString());
          return res.json({
            platform: platform.id,
            platformName: platform.name,
              videoId: String(data.id || ""),
              title: String(data.title || `${platform.name} media`),
              author: String(data.uploader || data.channel || data.creator || "Public creator"),
              authorAvatar: typeof data.uploader_thumbnail === "string"
                ? data.uploader_thumbnail
                : typeof data.channel_thumbnail === "string"
                  ? data.channel_thumbnail
                  : "",
              authorVerified: data.uploader_verified === true || data.channel_is_verified === true,
              thumbnail: typeof data.thumbnail === "string" ? data.thumbnail : "",
              duration: Number(data.duration || 0),
            views: formatCount(data.view_count),
            likes: formatCount(data.like_count),
            uploadedDate: formatUploadDate(data.upload_date),
              description: typeof data.description === "string"
                ? data.description.trim().slice(0, 1600)
                : "Public description unavailable.",
              tags: formatTags(data.tags, [platform.name.toLowerCase(), "public media"]),
              subscribersOrFollowers: formatCount(data.channel_follower_count),
              previewVideoUrl: typeof data.url === "string" && /^https?:\/\//i.test(data.url) ? data.url : "",
              sourcePageUrl: typeof data.webpage_url === "string" ? data.webpage_url : parsed.toString(),
            sourceUrl: parsed.toString(),
            downloadSupported: true,
            extractor: "yt-dlp",
          });
        } catch (extractorError) {
          console.warn("Extractor metadata unavailable:", extractorError);
          let publicFallback: PublicMediaFallback | null = null;
          try {
            publicFallback = platform.id === "tiktok"
              ? await resolveTikTokPublicMedia(parsed)
              : platform.id === "facebook"
                ? await resolveOpenGraphMedia(parsed)
                : null;
          } catch (fallbackError) {
            console.warn("Public embed fallback unavailable:", fallbackError);
          }
          if (publicFallback) {
            return res.json({
              platform: platform.id,
              platformName: platform.name,
              videoId: parsed.pathname.match(/\/video\/(\d+)/i)?.[1] || "",
              title: publicFallback.title || `${platform.name} public video`,
              author: publicFallback.author || "Public creator",
              authorAvatar: publicFallback.authorAvatar || "",
              authorVerified: publicFallback.authorVerified === true,
              thumbnail: publicFallback.thumbnail || "",
              duration: publicFallback.duration || 0,
              views: publicFallback.views || "Public data unavailable",
              likes: publicFallback.likes || "Public data unavailable",
              uploadedDate: publicFallback.uploadedDate || "Public date unavailable",
              description: publicFallback.description || `A public ${platform.name} stream was detected from the platform embed.`,
              tags: publicFallback.tags || [platform.name.toLowerCase(), "public media"],
              subscribersOrFollowers: publicFallback.subscribersOrFollowers || "Public data unavailable",
              previewVideoUrl: publicFallback.previewVideoUrl || "",
              sourcePageUrl: parsed.toString(),
              sourceUrl: parsed.toString(),
              downloadSupported: true,
              extractor: "public-embed",
            });
          }
          return res.json({
            platform: platform.id,
            platformName: platform.name,
            title: `${platform.name} link`,
            author: "Public creator",
            thumbnail: "",
            views: "Public data unavailable",
            likes: "Public data unavailable",
            uploadedDate: "Public date unavailable",
            description: "The platform did not return public metadata for this link.",
            tags: [platform.name.toLowerCase(), "public media"],
            sourceUrl: parsed.toString(),
            downloadSupported: false,
             downloadMessage: extractorUserMessage(extractorError, platform.id),
          });
        }
      }

      const directProbe = MEDIA_EXTENSIONS.test(parsed.toString())
        ? { contentType: "" }
        : await probeDirectMedia(parsed);
      if (directProbe) {
        return res.json({
          platform: "other",
          platformName: "Direct Media",
          title: directProbe.fileName ? safeFileName(directProbe.fileName) : titleFromUrl(parsed),
          author: "Public source",
          thumbnail: "",
          views: "Direct media file",
          likes: "Not applicable",
          uploadedDate: "Source date unavailable",
          description: "A direct public media file was detected.",
          tags: ["direct media", "public source"],
          sourceUrl: parsed.toString(),
          downloadSupported: true,
          directMedia: true,
        });
      }

      return res.status(422).json({
        error: "This is not a supported platform link or a direct media URL.",
        downloadSupported: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resolve this URL.";
      return res.status(400).json({ error: message });
    }
  });

  app.post("/api/download/jobs", async (req, res) => {
    try {
      const targetUrl = String(req.body?.url || "").trim();
      const parsed = await validatePublicUrl(targetUrl);
      if (!isExtractorUrl(parsed)) {
        return res.status(400).json({ error: "Background jobs are only used for supported platform links." });
      }
      const fileName = safeFileName(String(req.body?.filename || "rapid_download.mp4"));
      const format = String(req.body?.format || "mp4").toLowerCase();
      const quality = String(req.body?.quality || "1080p");
      if (format === "mp3" && platformForUrl(parsed).id === "tiktok") {
        const publicFallback = await resolveTikTokPublicMedia(parsed);
        if (publicFallback?.downloadUrl) {
          const job = await startTikTokAudioJob(new URL(publicFallback.downloadUrl), fileName);
          return res.status(202).json({ jobId: job.id, status: job.status });
        }
      }
      const job = startExtractorJob(parsed, fileName, quality, format);
      return res.status(202).json({ jobId: job.id, status: job.status });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to start download." });
    }
  });

  app.get("/api/download/jobs/:jobId", (req, res) => {
    const job = downloadJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Download job expired or was not found." });
    return res.json({ jobId: job.id, status: job.status, progress: job.progress, error: job.error });
  });

  app.get("/api/download/jobs/:jobId/file", async (req, res) => {
    const job = downloadJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Download job expired or was not found." });
    if (job.status !== "ready") return res.status(409).json({ error: job.error || "The download is not ready yet." });

    try {
      const stat = await fsPromises.stat(job.filePath);
      res.setHeader("Content-Disposition", contentDisposition(job.fileName));
      res.setHeader("Content-Type", job.format === "mp3" ? "audio/mpeg" : "video/mp4");
      res.setHeader("Content-Length", String(stat.size));
      res.setHeader("Cache-Control", "no-store");
      fs.createReadStream(job.filePath).pipe(res);
    } catch {
      return res.status(404).json({ error: "The prepared media file is no longer available." });
    }
  });

  app.all("/api/download", async (req, res) => {
    try {
      const targetUrl = String(req.query.url || "").trim();
      const parsed = await validatePublicUrl(targetUrl);
      const fileName = safeFileName(String(req.query.filename || "rapid_download.mp4"));
      const format = String(req.query.format || "mp4").toLowerCase();
      const quality = String(req.query.quality || "1080p");
      recordAnalyticsEvent(req, "download_started", { platform: platformForUrl(parsed).id, format, quality });

      if (req.method === "HEAD") {
        res.setHeader("Content-Disposition", contentDisposition(fileName));
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).end();
      }

      if (platformForUrl(parsed).id === "tiktok") {
        const publicFallback = await resolveTikTokPublicMedia(parsed);
        if (publicFallback && format !== "mp3") {
          await pipeDirectMedia(new URL(publicFallback.downloadUrl), res, fileName);
          return;
        }
        if (publicFallback?.downloadUrl && format === "mp3") {
          const job = await startTikTokAudioJob(new URL(publicFallback.downloadUrl), fileName);
          const deadline = Date.now() + 14 * 60 * 1000;
          while (job.status === "downloading" && Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 1_500));
          }
          if (job.status !== "ready") throw new Error(job.error || "The audio download took too long and expired.");
          const stat = await fsPromises.stat(job.filePath);
          res.setHeader("Content-Disposition", contentDisposition(job.fileName));
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Content-Length", String(stat.size));
          res.setHeader("Cache-Control", "no-store");
          fs.createReadStream(job.filePath).pipe(res);
          return;
        }
      }

      if (format === "mp3" && isExtractorUrl(parsed)) {
        const job = startExtractorJob(parsed, fileName, quality, format);
        const deadline = Date.now() + 14 * 60 * 1000;
        while (job.status === "downloading" && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 1_500));
        }
        if (job.status !== "ready") throw new Error(job.error || "The audio download took too long and expired.");

        const stat = await fsPromises.stat(job.filePath);
        res.setHeader("Content-Disposition", contentDisposition(job.fileName));
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", String(stat.size));
        res.setHeader("Cache-Control", "no-store");
        fs.createReadStream(job.filePath).pipe(res);
        return;
      }

      if (isExtractorUrl(parsed)) {
        const extractorArgs = [
          "--no-playlist",
          "--no-warnings",
          "--quiet",
          "--no-progress",
          "--retries",
          "1",
          "--socket-timeout",
          "20",
          "--max-filesize",
          `${MAX_DOWNLOAD_BYTES}`,
          "--format",
          extractorFormat(quality, format),
          ...(format === "mp3" ? ["--extract-audio", "--audio-format", "mp3"] : ["--merge-output-format", "mp4"]),
          ...extractorFfmpegArgs(),
          "--output",
          "-",
        ];
        extractorArgs.push(parsed.toString());

        res.setHeader("Content-Disposition", contentDisposition(fileName));
        res.setHeader("Content-Type", format === "mp3" ? "audio/mpeg" : "video/mp4");
        res.setHeader("Cache-Control", "no-store");

        const child = spawn(process.env.YTDLP_BIN || "python3", ["-m", "yt_dlp", ...extractorArgs], {
          env: extractorEnvironment(),
        });
        let errorOutput = "";
        child.stderr.on("data", (chunk) => {
          errorOutput += chunk.toString();
        });
        child.stdout.pipe(res);
        req.on("close", () => child.kill("SIGTERM"));
        child.once("error", (error) => {
          if (!res.headersSent) res.status(502).json({ error: error.message });
          else res.destroy(error);
        });
        child.once("close", (code) => {
          if (code !== 0 && !res.destroyed) {
            console.warn("Extractor download failed:", errorOutput.trim());
            res.destroy(new Error("The media extractor could not download this item."));
          } else if (!res.writableEnded) {
            res.end();
          }
        });
        return;
      }

      await pipeDirectMedia(parsed, res, fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed.";
      if (!res.headersSent) res.status(400).json({ error: message });
      else res.destroy(error instanceof Error ? error : undefined);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Rapid Video Downloader server running on http://localhost:${PORT}`);
  });
}

startServer();
