import { useApp } from "@/contexts/AppContext";

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.243-.213-.054-.334-.373-.121L8.34 13.36l-2.96-.924c-.64-.203-.658-.64.135-.953l11.566-4.458c.538-.196 1.006.128.836.196z" />
    </svg>
  );
}

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  const { config } = useApp();
  const link = config?.telegramLink ?? "#";
  return (
    <footer
      className={`w-full py-4 px-6 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground border-t border-border/40 ${className}`}
      data-testid="app-footer"
    >
      <span>
        Development by{" "}
        <span className="text-primary font-semibold">DADA</span>
      </span>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors"
        data-testid="link-telegram"
      >
        <TelegramIcon className="w-5 h-5" />
      </a>
    </footer>
  );
}
