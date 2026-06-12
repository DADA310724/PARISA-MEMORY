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
- **FolderView background suppressed**: `backgroundImage: "none"` on main wrapper — hides body gradient dots
- **Audio controlsList**: `nodownload noplaybackrate` + onContextMenu prevent on audio element
- **Drive offline error**: clean "Google Drive সংযুক্ত নয়" message instead of raw 401/API URL
- **Glass Morphism theme**: added to PRESET_THEMES (AdminSettings) and THEME_COLORS (App.tsx); key="glass"
- **.env.example**: created at `artifacts/parisa-portal/.env.example` with all secret names + comments

**Why no confirm dialogs**: user explicitly requested no dialogs anywhere in the app.
**Why dynamic redirect URI**: deployed domain differs from dev domain; hardcoded URI caused Google OAuth to reject.
**Why folder_files Firebase node**: AI needs to know current file inventory without calling Drive API on every chat message.

## Session 3 (SA migration + design batch)
- **Service Account migration**: GOOGLE_SERVICE_ACCOUNT_JSON secret set; drive.ts uses SA auth (google-auth-library)
- **`/drive/ready` endpoint**: GET /api/drive/ready returns {ready: boolean} — checks SA or OAuth without session
- **FolderView upload fix**: handleUploadClick uses `/drive/ready` instead of `/oauth/status` (SA doesn't use OAuth session)
- **AIChat welcome screen**: large 96px profile photo + "WELCOME" teal heading (Exo 2 font, text-shadow glow) + subtitle + 4 Bengali suggestion question buttons
- **Sidebar teal background**: rgba(0,26,32,0.98) from near-black — more visible teal-dark tone
- **AdminSettings sub-folder tab**: two-tab system (📁 Main | 🗂 সাব-ফোল্ডার) when editing a button; full CRUD for sub-buttons via getSubButtons/saveSubButton/deleteSubButton from AppContext; sub-button form: নাম, আইকন picker, Drive Folder ID, Last Message, Badge number, Order
- **AdminSettings Drive tab**: replaced OAuth UI with Service Account status (SA email display, sharing instructions, test button)
- **Folder save optimistic**: UI resets immediately, saveButton() runs in background; error shown if Firebase fails
- **loadAll OAuth cleanup**: removed /oauth/status and /oauth/config fetch calls; removed oauthStatus/oauthConfig state

**Why optimistic folder save**: improves perceived speed; Firebase is reliable enough that failures are rare.
**Why sub-button tab in edit modal**: screenshots from user showed Main/সাব-ফোল্ডার tab design; SubFolderView already renders WhatsApp list style.
