import { Router } from "express";
import type { Request, Response } from "express";

export const telegramRouter = Router();

const EMOJI: Record<string, string> = {
  folder_opened: "📂",
  file_opened:   "👁️",
  file_closed:   "⏱️",
  ai_chat:       "🤖",
  ai_chat_message: "🤖",
  file_viewed:   "📄",
};

function dhaka(): string {
  return new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatNotification(payload: Record<string, unknown>): string {
  const event = String(payload.event || "notify");
  const emoji = EMOJI[event] || "📨";

  const lines: string[] = [`${emoji} *PARISA PORTAL — ${event.toUpperCase()}*`];

  const skip = new Set(["event"]);
  for (const [k, v] of Object.entries(payload)) {
    if (skip.has(k) || v === undefined || v === null || v === "") continue;
    const val = String(v);
    lines.push(`*${k}*: ${val.slice(0, 400)}`);
  }

  lines.push(`*সময়*: ${dhaka()}`);
  return lines.join("\n");
}

telegramRouter.post("/notify", async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.json({ ok: false, reason: "telegram not configured" });
    return;
  }

  try {
    const payload = req.body as Record<string, unknown>;
    const text = formatNotification(payload);

    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      },
    );
    const data = await resp.json() as { ok: boolean };
    res.json({ ok: data.ok });
  } catch (err) {
    console.error("Telegram notify error", err);
    res.json({ ok: false, error: String(err) });
  }
});
