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
  "reddit.com",
  "redd.it",
  "pinterest.com",
  "pin.it",
  "vimeo.com",
  "dailymotion.com",
  "dai.ly",
];

const MEDIA_EXTENSIONS = /\.(?:mp4|webm|mov|m4v|mkv|avi|mp3|m4a|wav|ogg|flac)(?:$|[?#])/i;
const downloadJobs = new Map<string, {
  id: string;
  filePath: string;
  fileName: string;
  format: string;
  status: "downloading" | "ready" | "error";
  progress: number;
  error?: string;
}>();

function extractorEnvironment() {
  const bundledPath = path.join(process.cwd(), ".render", "yt-dlp");
  return {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: [bundledPath, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
  };
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
  if (hostname.includes("twitter") || hostname === "x.com") return { id: "twitter", name: "X (Twitter)" };
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

function extractorUserMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (/sign in to confirm|cookies-from-browser|cookies for the authentication|not a bot/i.test(raw)) {
    return "YouTube requires sign-in verification for this video. This downloader cannot bypass that security check. Use YouTube's official download controls or provide a direct media URL you are authorized to save.";
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
  return `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`;
}

function startExtractorJob(target: URL, fileName: string, quality: string, format: string) {
  const id = crypto.randomUUID();
  const extension = format === "mp3" ? "mp3" : "mp4";
  const filePath = path.join(os.tmpdir(), `rapid-${id}.${extension}`);
  const job = { id, filePath, fileName, format, status: "downloading" as const, progress: 0 };
  downloadJobs.set(id, job);

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
    "--merge-output-format",
    "mp4",
    "--output",
    filePath,
  ];
  if (format === "mp3") args.push("--extract-audio", "--audio-format", "mp3");
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
    job.error = extractorUserMessage(error);
  });
  child.once("close", async (code) => {
    if (code === 0) {
      job.status = "ready";
      job.progress = 100;
    } else {
      job.status = "error";
       job.error = extractorUserMessage(errorOutput);
      await fsPromises.unlink(filePath).catch(() => undefined);
    }
  });

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
    upstream = await fetch(current, { redirect: "manual" });
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

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", extractor: process.env.YTDLP_BIN || "python3 -m yt_dlp", timestamp: new Date().toISOString() });
  });

  app.get("/api/resolve-video", async (req, res) => {
    try {
      const targetUrl = String(req.query.url || "").trim();
      const parsed = await validatePublicUrl(targetUrl);
      const platform = platformForUrl(parsed);

      if (isExtractorUrl(parsed)) {
        try {
          const data = await extractMetadata(parsed.toString());
          return res.json({
            platform: platform.id,
            platformName: platform.name,
            videoId: String(data.id || ""),
            title: String(data.title || `${platform.name} media`),
            author: String(data.uploader || data.channel || data.creator || "Public creator"),
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
            sourcePageUrl: typeof data.webpage_url === "string" ? data.webpage_url : parsed.toString(),
            sourceUrl: parsed.toString(),
            downloadSupported: true,
            extractor: "yt-dlp",
          });
        } catch (extractorError) {
          console.warn("Extractor metadata unavailable:", extractorError);
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
             downloadMessage: extractorUserMessage(extractorError),
          });
        }
      }

      if (MEDIA_EXTENSIONS.test(parsed.toString())) {
        return res.json({
          platform: "other",
          platformName: "Direct Media",
          title: titleFromUrl(parsed),
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

      if (req.method === "HEAD") {
        res.setHeader("Content-Disposition", contentDisposition(fileName));
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).end();
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
          "--merge-output-format",
          "mp4",
          "--output",
          "-",
        ];
        if (format === "mp3") extractorArgs.push("--extract-audio", "--audio-format", "mp3");
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
