# Rapid Video Downloader

A free React and Express app for resolving metadata and downloading public or user-authorized media when the source exposes a downloadable stream.

## Safety

- Private, login-protected, DRM-protected, and paywalled content is not supported.
- Watermark removal and security bypass are not supported.
- The server rejects local/private network targets and limits proxied files to 250 MB.

## Run Locally

Prerequisites: Node.js, npm, and Python 3.

1. Install dependencies with `npm install`. The install step places `yt-dlp` in `.render/yt-dlp` for public platform extraction.
2. Start development mode with `npm run dev`.
3. Build with `npm run build` and start production mode with `npm start`.

## Deployment

The project is configured for a free Render Web Service. Use:

- Build command: `npm install --legacy-peer-deps && npm run build`
- Start command: `npm run start`

Free instances can sleep after inactivity. Large or slow downloads may exceed free-hosting limits.
