import { Router } from "express";
import type { Request, Response } from "express";

export const aiRouter = Router();

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  provider?: string;
  groqKeys?: string[];
  geminiKeys?: string[];
  openrouterKeys?: string[];
}

function getEnvKeys(envVar: string): string[] {
  const val = process.env[envVar] ?? "";
  return val.split(",").map((k) => k.trim()).filter(Boolean);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function tryGroq(
  keys: string[],
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const allKeys = shuffle([...keys, ...getEnvKeys("GROQ_API_KEYS")]);
  const uniqueKeys = [...new Set(allKeys)].filter(Boolean);
  for (const key of uniqueKeys) {
    try {
      const resp = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        },
      );
      if (!resp.ok) continue;
      const data = await resp.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  throw new Error("All Groq keys failed");
}

async function tryGemini(
  keys: string[],
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const allKeys = shuffle([...keys, ...getEnvKeys("GEMINI_API_KEYS")]);
  const uniqueKeys = [...new Set(allKeys)].filter(Boolean);

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (const key of uniqueKeys) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        },
      );
      if (!resp.ok) continue;
      const data = await resp.json() as {
        candidates: Array<{
          content: { parts: Array<{ text: string }> };
        }>;
      };
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  throw new Error("All Gemini keys failed");
}

async function tryOpenRouter(
  keys: string[],
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const allKeys = shuffle([...keys, ...getEnvKeys("OPENROUTER_API_KEYS")]);
  const uniqueKeys = [...new Set(allKeys)].filter(Boolean);
  for (const key of uniqueKeys) {
    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            max_tokens: 1024,
          }),
        },
      );
      if (!resp.ok) continue;
      const data = await resp.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  throw new Error("All OpenRouter keys failed");
}

aiRouter.post("/chat", async (req: Request, res: Response) => {
  const {
    messages = [],
    systemPrompt = "",
    groqKeys = [],
    geminiKeys = [],
    openrouterKeys = [],
  } = req.body as ChatRequest;

  const providers: Array<{
    name: string;
    fn: () => Promise<string>;
  }> = [
    {
      name: "groq",
      fn: () => tryGroq(groqKeys, messages, systemPrompt),
    },
    {
      name: "gemini",
      fn: () => tryGemini(geminiKeys, messages, systemPrompt),
    },
    {
      name: "openrouter",
      fn: () => tryOpenRouter(openrouterKeys, messages, systemPrompt),
    },
  ];

  for (const p of providers) {
    try {
      const text = await p.fn();
      res.json({ text, provider: p.name });
      return;
    } catch (err) {
      console.warn(`${p.name} failed:`, err);
    }
  }

  res.status(503).json({ error: "All AI providers failed" });
});
