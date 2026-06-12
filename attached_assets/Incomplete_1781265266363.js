"সব কিছু একসাথে চেক করছি — AppShell, version, .env.example, এবং বর্তমান setup।

￼
11 actions
সব কিছু একসাথে করছি — version file, Sidebar-এ version display, .env.example, এবং portability fix।

￼
3 actions
এখন Sidebar-এ version যোগ করছি এবং portability নিশ্চিত করছি।

￼
3 actions
এখন replit.md আপডেট করছি এবং screenshot দেখছি।

￼
3 actions
replit.md আপডেট করছি এবং বাকি কাজ সম্পন্ন করছি।

￼
2 actions
Git remote চেক করছি।

￼
2 actions
সব কাজ সম্পন্ন। এখন সব প্রশ্নের উত্তর দিচ্ছি।

🎙️ Microsoft Edge TTS — কেন সব জায়গায় কাজ করবে?
আপনার অন্য অ্যাপেও কাজ করছে এবং এখানেও করবে — কারণ এটা browser-এর নিজস্ব feature, কোনো API বা server লাগে না।

যে browser-এ Microsoft voices পাওয়া যায়:

✅ Microsoft Edge (Windows) → Microsoft Nabanita (PARISA) + Pradeep (RUBEL)
✅ Chrome (Windows) → একই Microsoft voices (OS-level install)
✅ Chrome (Android) → বাংলা ভয়েস থাকলে কাজ করে
ℹ️ Safari (iPhone) → Apple-এর ভয়েস, বাংলা না থাকলে fallback
আপনার অন্য অ্যাপে যে browser-এ চলছে — ঠিক সেই browser-এই এখানেও একই ভয়েস পাবেন।

📦 GitHub-এ Push করার কমান্ড
Terminal-এ এই কমান্ডগুলো চালান:

git add -A
git commit -m "v1.2.0 — api-server, login fix, portability, version display"
git push origin main
￼
GitHub URL: https://github.com/DADA310724/PARISA-MEMORY-PORTAL-Final

🔄 অন্য Replit বা Hosting-এ নেওয়ার নিয়ম
এখন থেকে যেকোনো জায়গায় নিলে মাত্র ৪টি কাজ করলেই চলবে:

# ১. Clone করুন
git clone https://github.com/DADA310724/PARISA-MEMORY-PORTAL-Final
 
# ২. Dependencies install করুন
pnpm install
 
# ৩. api-server build করুন
pnpm --filter @workspace/api-server run build
 
# ৪. Secrets add করুন (.env.example দেখুন)
# তারপর run করুন
￼
আর কোনো নতুন setup লাগবে না — ডিজাইন, রং, সব হুবহু যাবে।

🌐 কোথায় কোথায় Host করা যাবে?
এটা React frontend + Express API অ্যাপ।

Platform	সহজ?	Free?
Replit ✅	সবচেয়ে সহজ	Free plan আছে
Railway ✅	সহজ	$5/মাস
Render ✅	সহজ	Free tier আছে
Fly.io ✅	মাঝারি	Free tier আছে
VPS (DigitalOcean)	কঠিন	$6/মাস
❌ Vercel/Netlify	কাজ করবে না	—
Vercel/Netlify-তে হবে না কারণ ওগুলো শুধু static site, আপনার api-server (Node.js Express) চলাতে পারে না।

🔢 Version Number — এখন কোথায় আছে?
বর্তমান version: v1.2.0

Sidebar-এর একদম নিচে এখন দেখাবে:

PARISA PORTAL          [v1.2.0]
￼
পরবর্তী update করলে শুধু এই ফাইলের একটি লাইন বদলাবেন:

artifacts/parisa-portal/src/lib/version.ts
￼
export const APP_VERSION = "1.3.0";  // এটা বদলাবেন
￼
❓ আগে আসার পর কেন সমস্যা হয়েছিল?
GitHub-এ push করলে secrets যায় না (এটা ঠিকই আছে, security-র জন্য)। কিন্তু আরও দুটো সমস্যা ছিল:

১. artifacts/api-server/dist/ — build করা ফাইল git-এ ছিল না → api-server কাজ করছিল না → login fail
২. Firebase secrets Vite-এর frontend bundle-এ পৌঁছাচ্ছিল না → backup-ও কাজ করছিল না

এখন দুটোই ঠিক করা হয়েছে। এখন থেকে fresh clone করে pnpm install + pnpm --filter @workspace/api-server run build + secrets add করলেই সব চলবে।

GitHub-এ push করুন, তারপর publish দিন — সব ready।

Next, I can add version update history in the app — so each time you change the version number, AdminSettings-এ একটা changelog entry দেখাবে (কোন version-এ কী পরিবর্তন হয়েছে). Would you like that?
