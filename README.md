<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your app

This contains everything you need to run your app locally.

## Run Locally

### Prerequisites
- Node.js 18+ and npm
- Vercel CLI (for local API routes): `npm i -g vercel`

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
Create a `.env.local` file in the project root (Vite will load it automatically). At minimum you need:
```
OPENAI_API_KEY=your-openai-key
# Required for audio transcription with speaker diarization
ELEVENLABS_API_KEY=your-elevenlabs-key
# Optional: enable Dropbox uploads for transcripts
DROPBOX_ACCESS_TOKEN=your-dropbox-token
# Optional: Gemini key if you plan to use it elsewhere
GEMINI_API_KEY=your-gemini-key
```

> Keep real keys out of version control. The app reads `OPENAI_API_KEY` client-side via Vite’s `define` in `vite.config.ts`.

### 3) Run the app (with serverless APIs)
Use Vercel’s dev server so `/api/fetch`, `/api/search`, `/api/transcribe`, and `/api/saveDropbox` work locally. We standardize on port 3000:
```bash
vercel dev --listen 3000
```
Open http://localhost:3000.

Audio transcription calls `/api/transcribe`, which requires `ELEVENLABS_API_KEY`.
The browser request times out after 3 minutes so a provider/network hang returns
an error instead of leaving the upload spinner running indefinitely. Large audio
uploads are cleaned up by the server after transcription.

### 4) Alternate: front-end only
If you already have the API deployed elsewhere, you can preview just the UI:
```bash
npm run dev
```
This serves the front-end on the port shown in the terminal (default 5173). The built-in `/api` calls will 404 unless you point them at a running backend.

### 5) Build/preview production bundle
```bash
npm run build
npm run preview
```
