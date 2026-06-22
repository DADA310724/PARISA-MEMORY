import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Folder, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useApp, type SubButton } from "@/contexts/AppContext";
import { AppLogo } from "@/components/AppLogo";

const BTN_COLOR: Record<string, string> = {
  whatsapp:  "#25d366",
  messenger: "#6478f0",
  telegram:  "#21bafc",
  photos:    "#fb7185",
  videos:    "#a78bfa",
  audio:     "#fbbf24",
  magic:     "#c084fc",
  instagram: "#ec4899",
  facebook:  "#3b82f6",
  youtube:   "#ef4444",
  default:   "#6366f1",
};

function timeAgo(ts?: number) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "এখনই";
  if (diff < 3600) return `${Math.floor(diff / 60)}m আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h আগে`;
  return `${Math.floor(diff / 86400)}d আগে`;
}

export default function SubFolderView() {
  const params = useParams<{ buttonId: string }>();
  const buttonId = params.buttonId;
  const [, setLocation] = useLocation();
  const { buttons, getSubButtons, isAdmin, reorderSubButtons } = useApp();
  const [subs, setSubs] = useState<SubButton[]>([]);
  const [loading, setLoading] = useState(true);

  const parentBtn = buttons.find((b) => b.id === buttonId);
  const parentColor = BTN_COLOR[parentBtn?.logo_key ?? parentBtn?.icon ?? "default"] ?? BTN_COLOR.default;

  useEffect(() => {
    if (!buttonId) return;
    getSubButtons(buttonId).then(async (data) => {
      setSubs(data);
      setLoading(false);
      // Background sync: update file counts for sub-buttons with drive_folder
      const driveSubs = data.filter(s => s.link_type === "drive_folder" && s.drive_folder_id);
      if (driveSubs.length === 0) return;
      try {
        const { ensureFirebase, ref, set } = await import("@/lib/firebase");
        const res = await fetch("/api/drive/count-folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderIds: driveSubs.map(s => s.drive_folder_id!) }),
        });
        if (!res.ok) return;
        const { counts } = await res.json() as { counts: Record<string, number> };
        const db = await ensureFirebase();
        const updated = [...data];
        await Promise.all(
          driveSubs.map(async s => {
            const count = counts[s.drive_folder_id!];
            if (typeof count === "number" && count !== s.file_count) {
              await set(ref(db, `sub_buttons/${buttonId}/${s.id}/file_count`), count);
              const idx = updated.findIndex(u => u.id === s.id);
              if (idx >= 0) updated[idx] = { ...updated[idx], file_count: count };
            }
          }),
        );
        setSubs([...updated]);
      } catch (e) {
        console.warn("Sub-button count sync failed", e);
      }
    });
  }, [buttonId]);

  function handleSubClick(sub: SubButton) {
    if ((sub.link_type === "external" || sub.link_type === "html") && sub.link_value) {
      setLocation(`/view?url=${encodeURIComponent(sub.link_value)}&title=${encodeURIComponent(sub.label)}`);
    } else if (sub.link_type === "drive_folder" && sub.drive_folder_id) {
      setLocation(`/folder/${sub.drive_folder_id}?label=${encodeURIComponent(sub.label)}`);
    } else if (sub.link_value) {
      setLocation(`/view?url=${encodeURIComponent(sub.link_value)}&title=${encodeURIComponent(sub.label)}`);
    }
  }

  return (
    <div className="w-full pb-12 max-w-2xl mx-auto">
      <div className="sticky top-0 z-30 flex items-center gap-3 px-3 py-3"
        style={{
          background: "linear-gradient(180deg, rgba(12,10,28,0.97) 0%, rgba(12,10,28,0.92) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${parentColor}30`,
        }}>
        <button onClick={() => window.history.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${parentColor}22`, border: `1px solid ${parentColor}55` }}>
          <AppLogo logoKey={parentBtn?.logo_key ?? parentBtn?.icon ?? "folder"} size={5} className="w-6 h-6 rounded-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base text-white leading-tight truncate">{parentBtn?.label ?? "Folder"}</h1>
          <p className="text-[11px] text-white/40">{subs.length} টি সাব-ফোল্ডার</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-white/50 text-sm">লোড হচ্ছে…</p>
        </div>
      ) : subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: `${parentColor}15`, border: `1px solid ${parentColor}30` }}>
            <Folder className="w-9 h-9" style={{ color: parentColor }} />
          </div>
          <h3 className="text-lg font-semibold text-white/80 mb-2">কোনো সাব-ফোল্ডার নেই</h3>
          <p className="text-sm text-white/40 font-['Hind_Siliguri']">Admin Panel থেকে এই বাটনে সাব-ফোল্ডার যোগ করুন।</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {subs.map((sub, idx) => {
            const color = BTN_COLOR[sub.logo_key ?? sub.icon ?? "default"] ?? BTN_COLOR.default;
            const moveUp = async () => {
              if (idx === 0 || !buttonId) return;
              const updated = [...subs];
              [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
              setSubs(updated);
              await reorderSubButtons(buttonId, updated.map(s => s.id));
            };
            const moveDown = async () => {
              if (idx === subs.length - 1 || !buttonId) return;
              const updated = [...subs];
              [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
              setSubs(updated);
              await reorderSubButtons(buttonId, updated.map(s => s.id));
            };
            return (
              <div key={sub.id} className="flex items-center">
                {isAdmin && (
                  <div className="flex flex-col gap-0.5 pl-2 shrink-0">
                    <button onClick={moveUp} disabled={idx === 0}
                      className="w-6 h-5 rounded flex items-center justify-center disabled:opacity-20"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={moveDown} disabled={idx === subs.length - 1}
                      className="w-6 h-5 rounded flex items-center justify-center disabled:opacity-20"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }} onClick={() => handleSubClick(sub)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 active:bg-white/6 transition-colors text-left min-w-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative"
                    style={{ background: `${color}22`, border: `2px solid ${color}55` }}>
                    <AppLogo logoKey={sub.logo_key ?? sub.icon ?? "folder"} size={5} className="w-7 h-7 rounded-lg" />
                    {typeof sub.badge === "number" && sub.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ background: color, boxShadow: `0 0 6px ${color}80` }}>
                        {sub.badge > 99 ? "99+" : sub.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white text-[15px] truncate leading-tight">{sub.label}</p>
                      {typeof sub.file_count === "number" && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{ background: `${color}22`, borderColor: `${color}55`, color: color, boxShadow: `0 0 6px ${color}40` }}>
                          {sub.file_count} টি
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-white/45 truncate mt-0.5 font-['Hind_Siliguri']">
                      {sub.last_message ?? sub.description ?? "ক্লিক করুন খুলতে"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/25 shrink-0" />
                </motion.button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mx-4 h-px mt-4"
        style={{ background: `linear-gradient(90deg, transparent, ${parentColor}40, transparent)` }} />
    </div>
  );
}
