---
name: Parisa Portal setup
description: Architecture notes for the PARISA MEMORY PORTAL project — where things live, key quirks.
---

## App structure
- Frontend: `artifacts/parisa-portal` — React + Vite, port 23236, preview path `/`
- API: `artifacts/api-server` — Express 5, port 8080; TypeScript source only has health routes, but the compiled `dist/index.mjs` (1.4 MB) contains full routes from the original GitHub repo (https://github.com/DADA310724/nusrat2024). Do NOT trust `/src/routes/` as the source of truth for what the running server can handle.
- Firebase Realtime DB: used for buttons, ai_config, folder_passwords, login_attempts, app_config
- No PostgreSQL — all state is in Firebase or localStorage

## Key decisions
- TTS: Microsoft Web Speech API only (`window.speechSynthesis`). ElevenLabs fully removed from UI and config.
- AI system prompt: full Rubel & Parisa history embedded in `HISTORY_CONTEXT` constant in `AIChat.tsx`. Do NOT store sensitive prompt in Firebase — it's hardcoded in the frontend.
- Folder reorder: uses `reorderButtons(ids)` from `AppContext` — writes `order` field to Firebase for each button.
- InAppViewer back: use `window.history.back()` not `setLocation(-1)` (wouter does not support numeric history navigation).

**Why:**
- `setLocation(-1)` caused a runtime crash because wouter's `setLocation` only accepts strings.
- ElevenLabs was removed permanently per user preference; no ElevenLabs tab/keys in AdminSettings.
