import express from "express";
import dns from "node:dns/promises";
import net from "node:net";
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
            sourceUrl: parsed.toString(),
            downloadSupported: false,
            downloadMessage: "This platform did not expose a downloadable public stream. Use the platform's own download controls or provide a direct public media URL.",
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
