---
name: Parisa Portal features done
description: Summary of all implemented features across sessions for parisa-portal
---

# Features Implemented

## Session 1
- mic/camera removed from AIChat
- per-message delete button (later removed in session 2)
- sidebar clear-all
- 15 themes in 3-col grid (extended to 16 with Glass Morphism in session 2)
- folder IDs privacy-fixed (empty KNOWN_FOLDER_IDS, Firebase-only)
- drive.ts TS fix: use pid() helper + String() cast for req.params/query

## Session 2 (major fixes batch)
- **AIChat voice labels**: "PARISA" (FEMALE) / "RUBEL" (MALE) instead of Microsoft Female/Male
- **No delete message button**: removed from message action buttons
- **No window.confirm anywhere**: clearAllMessages + deleteCustomFolder both no-confirm
- **Folder files AI context**: FolderView saves file listing to Firebase `folder_files/{folderId}` on each load; AIChat subscribes with onValue and appends file names to system prompt dynamically
- **saveAiConfig fixed**: explicitly serializes fields (no undefined values in Firebase write)
- **Drive redirect URI dynamic**: shows `window.location.origin + "/api/oauth/callback"` — always matches current domain (dev + published)
- **Passwords tab uses live buttons[]**: no longer hardcoded FOLDER_LIST; shows all drive_folder type buttons including custom ones
- **Audio controlsList**: `nodownload noplaybackrate` + onContextMenu prevent on audio element
- **Glass Morphism theme**: added to PRESET_THEMES (AdminSettings) and THEME_COLORS (App.tsx); key="glass"

**Why no confirm dialogs**: user explicitly requested no dialogs anywhere in the app.
**Why dynamic redirect URI**: deployed domain differs from dev domain; hardcoded URI caused Google OAuth to reject.
**Why folder_files Firebase node**: AI needs to know current file inventory without calling Drive API on every chat message.

## Session 3 (SA migration + design batch)
- **Service Account migration**: GOOGLE_SERVICE_ACCOUNT_JSON secret set; drive.ts uses SA auth (google-auth-library)
- **`/drive/ready` endpoint**: GET /api/drive/ready returns {ready: boolean} — checks SA or OAuth without session
- **AIChat welcome screen**: large 96px profile photo + "WELCOME" teal heading (Exo 2 font, text-shadow glow) + subtitle + 4 Bengali suggestion question buttons
- **AdminSettings sub-folder tab**: two-tab system (📁 Main | 🗂 সাব-ফোল্ডার) when editing a button; full CRUD for sub-buttons
- **AdminSettings Drive tab**: replaced OAuth UI with Service Account status

## Session 4 (24-task polish batch)
- **Back buttons**: all use window.history.back() (not setLocation(-1) — crashes in wouter)
- **Fonts**: Google Fonts import for Hind Siliguri + Noto Sans Bengali in index.css
- **API key test REAL**: calls `/api/ai/chat` with single key; sets status ok/error based on real response
- **PDF overlay**: white div covers Google Docs viewer's ↗ button

**Why real API test**: fake setTimeout gave false "ok" status; real test catches 401/403.
**Why PDF overlay**: Google Docs viewer ↗ button is cross-origin; white div same bg color covers it.

## Session 5 (Microsoft Edge TTS)
- **Microsoft Edge TTS server-side**: `msedge-tts` npm package; `POST /api/voice`; voices: bn-BD-NabanitaNeural (female) / bn-BD-PradeepNeural (male)
- **AIChat TTS**: `speakText()` and `speakAndWait()` call `/api/voice` and play audio blob; module-level `_currentAudio` for stop/cancel

**Why server-side TTS**: window.speechSynthesis Microsoft Neural voices not available on Android; server-side is reliable everywhere.
**Why module-level `_currentAudio`**: React refs can't be used in module-scope async functions.

## Session 6 (PARISA-main full redesign + chat_database.json integration)
- **chat_database.json**: 69,011 real messages across 13 conversations (WhatsApp, Messenger, Telegram); stored at `artifacts/api-server/src/chat_database.json` AND `dist/chat_database.json` (must copy to dist on each build)
- **ai.ts chat DB search**: flattens all nested messages at startup into `FLAT_DB: FlatMsg[]`; `searchChatDB()` searches by date pattern first (timestamp field format: "YYYY-MM-DD HH:MM:SS"), then keyword; top results injected into system prompt as context block
- **AIChat.tsx full PARISA-main redesign**: aurora animated background (.parisa-aurora), grain texture (.parisa-grain), glass surfaces (.parisa-glass), PARISA brand title (.parisa-brand-title gradient text), smoke spinning circles on welcome screen (.parisa-smoke + conic-gradient), ORB audio call (.parisa-orb-core + .parisa-orb-ring), two-row composer (.parisa-composer), glass message bubbles (.parisa-msg-user / .parisa-msg-ai)
- **Camera mode**: NEW — fullscreen camera overlay with snap+ask AI, mic voice input, flip camera; opened via camera button in composer tools row
- **Sidebar**: RIGHT side (user requirement); PARISA brand title in sidebar header
- **Audio/video call**: in composer tools row (not topbar)
- **All CSS added to index.css** inside the existing `@layer` block

**Why chat_database.json in dist**: api-server is compiled with tsc; json files are not copied by tsc; must manually cp after build.
**Why FLAT_DB at startup**: 69k messages too large to filter inline on every request; flatten once at startup, filter is fast.
**Why camera mode in composer tools**: PARISA-main design; user wanted camera mode feature added.
**Why sidebar on RIGHT**: explicit user requirement (PARISA-main had left sidebar but user wants right).
