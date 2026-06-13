import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ArrowLeft } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface SearchResult {
  page: number;
  snippet: string;
}

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export function PdfViewer({ url, title, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageInput, setPageInput] = useState("1");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultIdx, setResultIdx] = useState(0);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
    loadingTask.promise
      .then((doc) => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError("PDF লোড হয়নি। আবার চেষ্টা করুন।");
        console.error("PDF load error", e);
        setLoading(false);
      });
    return () => { loadingTask.destroy(); };
  }, [url]);

  const renderPage = useCallback(async (doc: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    if (!canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }
    const page = await doc.getPage(pageNum);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
    const unscaled = page.getViewport({ scale: 1 });
    const scale = (containerWidth / unscaled.width) * (window.devicePixelRatio || 1);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
    canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;
    try {
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== "RenderingCancelledException") {
        console.error("Render error", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    setPageInput(String(currentPage));
    renderPage(pdfDoc, currentPage);
  }, [pdfDoc, currentPage, renderPage]);

  const handleSearch = useCallback(async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setSearching(true);
    setResults([]);
    setNoResults(false);
    const q = searchQuery.trim().toLowerCase();
    const found: SearchResult[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as { str: string }[]).map((it) => it.str).join(" ");
      let idx = pageText.toLowerCase().indexOf(q);
      while (idx !== -1) {
        const start = Math.max(0, idx - 35);
        const end = Math.min(pageText.length, idx + q.length + 35);
        found.push({
          page: i,
          snippet: pageText.substring(start, end).trim(),
        });
        idx = pageText.toLowerCase().indexOf(q, idx + 1);
      }
    }
    setSearching(false);
    if (found.length === 0) {
      setNoResults(true);
      return;
    }
    setResults(found);
    setResultIdx(0);
    setCurrentPage(found[0].page);
  }, [pdfDoc, searchQuery]);

  const jumpToResult = (idx: number) => {
    if (idx < 0 || idx >= results.length) return;
    setResultIdx(idx);
    setCurrentPage(results[idx].page);
  };

  const jumpToPage = () => {
    const n = parseInt(pageInput);
    if (n >= 1 && n <= totalPages) setCurrentPage(n);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0e1f" }}>
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{
          background: "rgba(10,14,31,0.98)",
          borderBottom: "1px solid rgba(0,212,170,0.18)",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <p
          className="flex-1 text-xs font-semibold truncate text-center"
          style={{ color: "#00e5ff", textShadow: "0 0 8px rgba(0,229,255,0.4)", fontFamily: "'Exo 2',sans-serif" }}
        >
          {title}
        </p>

        {/* Page jump input */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && jumpToPage()}
            onBlur={jumpToPage}
            className="w-10 text-center text-xs rounded-lg py-1 text-white font-mono focus:outline-none"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          />
          <span className="text-white/30 text-[10px]">/ {totalPages || "—"}</span>
        </div>

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch((s) => !s)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all flex-shrink-0"
          style={{
            background: showSearch ? "rgba(0,229,255,0.18)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${showSearch ? "rgba(0,229,255,0.45)" : "rgba(255,255,255,0.1)"}`,
          }}
          title="নম্বর/টেক্সট সার্চ"
        >
          🔍
        </button>
      </div>

      {/* ── Search Panel ── */}
      {showSearch && (
        <div
          className="flex-shrink-0 px-3 py-2.5 space-y-2"
          style={{ background: "rgba(0,0,0,0.45)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setNoResults(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="নম্বর বা যেকোনো টেক্সট লিখুন..."
              autoFocus
              className="flex-1 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(0,229,255,0.3)",
                fontFamily: "'Hind Siliguri',sans-serif",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-40"
              style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.4)", color: "#00e5ff" }}
            >
              {searching ? "..." : "খুঁজুন"}
            </button>
          </div>

          {noResults && (
            <p className="text-xs text-red-400/80" style={{ fontFamily: "'Hind Siliguri',sans-serif" }}>
              কিছু পাওয়া যায়নি।
            </p>
          )}

          {results.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: "#00d4aa" }}>
                  {results.length}টি রেজাল্ট
                </span>
                <button
                  onClick={() => jumpToResult(resultIdx - 1)}
                  disabled={resultIdx === 0}
                  className="text-xs px-2 py-0.5 rounded-lg text-white/60 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >‹</button>
                <span className="text-xs text-white/40">{resultIdx + 1} / {results.length}</span>
                <button
                  onClick={() => jumpToResult(resultIdx + 1)}
                  disabled={resultIdx === results.length - 1}
                  className="text-xs px-2 py-0.5 rounded-lg text-white/60 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >›</button>
                <span className="text-xs text-white/30 flex-1 truncate">
                  📄 পেজ {results[resultIdx]?.page}
                </span>
              </div>

              {/* Result list */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToResult(i)}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{
                      background: i === resultIdx ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${i === resultIdx ? "rgba(0,229,255,0.35)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <span className="font-bold mr-1.5" style={{ color: "#00e5ff" }}>পেজ {r.page}:</span>
                    <span className="text-white/65">…{r.snippet}…</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PDF Canvas Area ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ background: "#1a1a2e" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="flex items-center justify-center h-full min-h-48">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/40 text-sm" style={{ fontFamily: "'Hind Siliguri',sans-serif" }}>
                PDF লোড হচ্ছে...
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full min-h-48 px-6">
            <p className="text-red-400 text-sm text-center" style={{ fontFamily: "'Hind Siliguri',sans-serif" }}>
              {error}
            </p>
          </div>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} className="block mx-auto shadow-2xl" />
        )}
      </div>

      {/* ── Bottom Page Navigation ── */}
      {!loading && !error && totalPages > 1 && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-4 py-3"
          style={{ background: "rgba(10,14,31,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg disabled:opacity-25"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >‹</button>
          <span className="text-white/50 text-sm min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg disabled:opacity-25"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >›</button>
        </div>
      )}
    </div>
  );
}
