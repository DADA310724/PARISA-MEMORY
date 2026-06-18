import { Router } from "express";
import type { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const chatRouter = Router();

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}
interface Conversation {
  chat_id: string;
  platform: string;
  total_messages: number;
  messages: ChatMessage[];
}

let _db: Conversation[] | null = null;
function getDb(): Conversation[] {
  if (_db) return _db;
  try {
    const fp = path.join(__dirname, "chat_database.json");
    _db = JSON.parse(fs.readFileSync(fp, "utf8")) as Conversation[];
    return _db;
  } catch { return []; }
}

function normConv(s: string) { return s.toLowerCase().replace(/[\s_\-\.]/g, ""); }

chatRouter.post("/search", (req: Request, res: Response) => {
  const {
    date,         // YYYY, YYYY-MM, or YYYY-MM-DD
    keyword,      // text to search in message body
    conversation, // conversation chat_id (partial match ok)
    limit = 200,
  } = req.body as { date?: string; keyword?: string; conversation?: string; limit?: number };

  if (!date && !keyword && !conversation) {
    res.json({ results: "", total: 0 }); return;
  }

  const db = getDb();
  const lines: string[] = [];
  const kwLow = (keyword || "").toLowerCase().trim();
  const convNorm = conversation ? normConv(conversation) : "";

  for (const conv of db) {
    if (convNorm) {
      const idNorm = normConv(conv.chat_id);
      if (!idNorm.includes(convNorm) && !convNorm.includes(idNorm)) continue;
    }
    const convLabel = `[${conv.chat_id} / ${conv.platform}]`;
    let added = 0;
    for (const msg of conv.messages) {
      if (date && !msg.timestamp.startsWith(date)) continue;
      if (kwLow) {
        const mLow = (msg.message || "").toLowerCase();
        if (!mLow.includes(kwLow)) continue;
      }
      if (added === 0) lines.push(`\n--- ${convLabel} ---`);
      lines.push(`[${msg.timestamp}] ${msg.sender}: ${msg.message}`);
      added++;
      if (lines.length >= (limit as number)) break;
    }
    if (lines.length >= (limit as number)) break;
  }

  res.json({ results: lines.join("\n"), total: lines.length });
});

chatRouter.get("/conversations", (_req: Request, res: Response) => {
  const db = getDb();
  res.json(db.map(c => ({
    id: c.chat_id, platform: c.platform, total: c.total_messages,
    first: c.messages[0]?.timestamp, last: c.messages[c.messages.length - 1]?.timestamp,
  })));
});
