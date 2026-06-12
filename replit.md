# PARISA MEMORY PORTAL

A private digital archive and AI assistant app for preserving the story of Rubel and Parisa — their marriage, memories, chat history, and legal evidence.

## Run & Operate

- `pnpm --filter @workspace/parisa-portal run dev` — run the frontend (port 23236)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (parisa-portal artifact, port 23236)
- API: Express 5 (api-server artifact, port 8080)
- DB: Firebase Realtime Database (no PostgreSQL)
- TTS: Microsoft Web Speech API (window.speechSynthesis) — ElevenLabs removed permanently
- AI: Groq / Gemini / OpenRouter (multi-key failover, configured in AdminSettings)

## Where things live

- `artifacts/parisa-portal/src/pages/AIChat.tsx` — AI chat page, system prompts, welcome message, TTS
- `artifacts/parisa-portal/src/pages/AdminSettings.tsx` — admin panel (AI keys, folders, passwords, drive, theme, logs)
- `artifacts/parisa-portal/src/pages/FolderView.tsx` — Google Drive folder browser with in-app viewer
- `artifacts/parisa-portal/src/pages/InAppViewer.tsx` — in-app HTML/PDF viewer with fixed back navigation
- `artifacts/parisa-portal/src/contexts/AppContext.tsx` — Firebase-backed button/folder state
- `artifacts/parisa-portal/src/lib/drive.ts` — Drive API helpers, `proxyUrl(id)` → `/api/drive/proxy/:id`

## Architecture decisions

- TTS is always Microsoft Web Speech API — never ElevenLabs. The voice is selected in AIChat settings modal.
- Full history context (Rubel & Parisa's story, Bangladesh law, black magic investigation) is hardcoded in `HISTORY_CONTEXT` constant in `AIChat.tsx` and embedded in every AI request.
- Folder reorder uses Firebase `buttons/:id/order` field via `reorderButtons()` in AppContext.
- InAppViewer uses `window.history.back()` for navigation — NOT `setLocation(-1)`.
- The api-server TypeScript source only has a health route, but the compiled dist contains full routes from the original repo (AI chat, Drive proxy, Telegram notify, OAuth).

## Product

- Login page (admin/user password)
- Dashboard with folder grid (Google Drive folders)
- Folder viewer with in-app image/video/audio/HTML/PDF viewing
- AI chat with full history context, Microsoft TTS, voice input, file upload
- Admin panel: AI provider/key management, folder create/edit/reorder/delete, passwords, Drive OAuth, theme, logs

## User preferences

- No ElevenLabs — use Microsoft Web Speech API TTS permanently
- No audio/video call buttons in AI chat toolbar
- No refresh icon in folder viewer header
- No design changes to existing UI
- Bengali language throughout

## Gotchas

- The api-server `dist/index.mjs` has full routes but the TypeScript source only has health.ts — trust the running server, not the source
- `setLocation(-1)` crashes in wouter — use `window.history.back()` instead
- Folder reorder requires `reorderButtons` from `useApp()` context
- TTS voice loading is async — always call `window.speechSynthesis.getVoices()` after `voiceschanged` event
