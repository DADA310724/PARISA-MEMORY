import { Router } from "express";
import type { Request, Response } from "express";

export const telegramRouter = Router();

telegramRouter.post("/notify", async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.json({ ok: false, reason: "telegram not configured" });
    return;
  }

  try {
    const payload = req.body as Record<string, unknown>;
    const lines: string[] = ["📨 *PARISA PORTAL*"];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined && v !== null && v !== "") {
        lines.push(`*${k}*: ${String(v).slice(0, 300)}`);
      }
    }
    const text = lines.join("\n");

    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      },
    );
    const data = await resp.json() as { ok: boolean };
    res.json({ ok: data.ok });
  } catch (err) {
    console.error("Telegram notify error", err);
    res.json({ ok: false, error: String(err) });
  }
});
