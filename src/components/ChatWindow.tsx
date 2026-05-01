"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
import type { Contact, Message } from "@/types/index.ts";
// ═══════════════════════════════════════════════════════════════════════════════

export interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
  userId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline?: boolean;
}

export interface Queue {
  id: string;
  name: string;
  color: string;
  isActive?: boolean;
}

interface ChatWindowProps {
  selectedId: string | null;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export interface Settings {
  companyName?: string;
  businessHours?: { start: string; end: string; days: string[] };
  autoReply?: { enabled: boolean; message: string };
  [key: string]: unknown;
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "scheduled" | "completed" | "paused";
  stats?: { sent?: number; delivered?: number };
  scheduledAt?: string;
  createdAt?: string;
}

export interface Analytics {
  activeChats?: number;
  waitingChats?: number;
  averageResponseTime?: number;
  messagesSentToday?: number;
  messagesReceivedToday?: number;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = "http://localhost:3000";

function getLastMessageText(lm: Contact["lastMessage"]): string {
  if (!lm) return "Nenhuma mensagem";
  if (typeof lm === "string") return lm;
  return lm.content ?? "Nenhuma mensagem";
}

function getLastMessageTime(lm: Contact["lastMessage"]): string | undefined {
  if (!lm || typeof lm === "string") return undefined;
  return lm.timestamp;
}

function getContactOnline(status: Contact["status"]) {
  return status === "active";
}

function isOutbound(msg: Message) {
  return msg.direction === "outbound";
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtAvgTime(secs?: number) {
  if (!secs) return "—";
  return secs < 60 ? `${secs}s` : `${Math.round(secs / 60)}min`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════════════════════════

function playNotificationSound(type: "message" | "alert" = "message") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    if (type === "message") {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      [0, 0.15].forEach((d) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = "square";
        osc.frequency.setValueAtTime(660, ctx.currentTime + d);
        osc.start(ctx.currentTime + d);
        osc.stop(ctx.currentTime + d + 0.1);
      });
    }
  } catch {
    /* silencia em ambientes sem suporte */
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * useApi — fetch genérico com normalização robusta.
 *
 * CORREÇÃO: A API pode retornar:
 *   1. Array direto:          [...] → usa diretamente
 *   2. Objeto puro (Settings): {...} sem array embutido → usa diretamente
 *   3. Wrapper com array:     { contacts: [...], total: 10 } → extrai o array
 *
 * Anteriormente o código tentava sempre desencapsular, o que fazia arrays
 * diretos serem interpretados incorretamente (pegava o primeiro valor do array
 * como se fosse o dado).
 */
function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log(`[API] ${endpoint}:`, json);

      let normalized: unknown = json;

      // Só desencapsula se NÃO for array e houver exatamente uma chave que seja array
      if (json && typeof json === "object" && !Array.isArray(json)) {
        const keys = Object.keys(json as object);
        const arrayKeys = keys.filter((k) =>
          Array.isArray((json as Record<string, unknown>)[k])
        );
        // Desencapsula apenas se houver exatamente 1 chave array e outras forem meta (total, page, etc.)
        if (arrayKeys.length === 1) {
          const nonArrayKeys = keys.filter((k) => !arrayKeys.includes(k));
          const allMeta = nonArrayKeys.every((k) =>
            ["total", "page", "limit", "count", "pages", "meta", "pagination"].includes(k)
          );
          if (allMeta || nonArrayKeys.length === 0) {
            normalized = (json as Record<string, unknown>)[arrayKeys[0]];
          }
        }
      }

      setData(normalized as T);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      console.error(`[API] ${endpoint}:`, msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/** useToast — gerencia fila de notificações toast */
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((t: Omit<Toast, "id">, sound = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((p) => [...p, { ...t, id }]);
    if (sound) playNotificationSound("alert");
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((p) => p.filter((x) => x.id !== id));
  }, []);

  return { toasts, add, remove };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Skeleton({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background:
          "linear-gradient(90deg,#e8edf3 25%,#f4f6f8 50%,#e8edf3 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

function Avatar({
  name,
  src,
  size = 40,
  online,
}: {
  name: string;
  src?: string;
  size?: number;
  online?: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: size * 0.35,
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: "50%",
            background: online ? "#22c55e" : "#94a3b8",
            border: "2px solid #fff",
          }}
        />
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const out = isOutbound(message);

  const bg = message._failed ? "#fee2e2" : out ? "#dcfce7" : "#ffffff";

  const statusColor =
    message.status === "read"
      ? "#22c55e"
      : message.status === "failed" || message._failed
        ? "#ef4444"
        : "#94a3b8";

  const statusIcon = message._failed
    ? "✕"
    : message._optimistic
      ? "⏳"
      : message.status === "read" || message.status === "delivered"
        ? "✓✓"
        : "✓";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: out ? "flex-end" : "flex-start",
        // CORREÇÃO: sem marginBottom aqui — o gap do container pai controla o espaço
        opacity: message._optimistic ? 0.75 : 1,
        transition: "opacity 0.2s",
        animation: "bubbleIn 0.18s ease",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          background: bg,
          borderRadius: out ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          padding: "8px 12px 6px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
          border: message._failed ? "1px solid #fca5a5" : "none",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#1e293b",
            lineHeight: 1.55,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            marginTop: 2,
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {fmtTime(message.timestamp)}
          </span>
          {out && (
            <span style={{ fontSize: 11, color: statusColor }}>
              {statusIcon}
            </span>
          )}
        </div>
        {message._failed && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ef4444" }}>
            Falha ao enviar · toque para reenviar
          </p>
        )}
      </div>
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const map = {
    success: {
      bg: "#f0fdf4",
      border: "#86efac",
      icon: "#16a34a",
      text: "#15803d",
      sym: "✓",
    },
    error: {
      bg: "#fff1f2",
      border: "#fca5a5",
      icon: "#dc2626",
      text: "#b91c1c",
      sym: "✕",
    },
    info: {
      bg: "#eff6ff",
      border: "#93c5fd",
      icon: "#2563eb",
      text: "#1d4ed8",
      sym: "i",
    },
    warning: {
      bg: "#fffbeb",
      border: "#fcd34d",
      icon: "#d97706",
      text: "#b45309",
      sym: "!",
    },
  };
  const c = map[toast.type];

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: "11px 14px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        animation: "toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        minWidth: 240,
        maxWidth: 320,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: c.icon,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {c.sym}
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{ margin: 0, fontWeight: 600, fontSize: 13, color: c.text }}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function AnalyticsBanner({ a }: { a: Analytics }) {
  const metrics = [
    { label: "Ativos", value: a.activeChats ?? "—", color: "#3b82f6" },
    { label: "Fila", value: a.waitingChats ?? "—", color: "#f59e0b" },
    { label: "Enviadas", value: a.messagesSentToday ?? "—", color: "#10b981" },
    {
      label: "T. Médio",
      value: fmtAvgTime(a.averageResponseTime),
      color: "#8b5cf6",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 4,
        padding: "7px 10px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: "#f8fafc",
            borderRadius: 7,
            padding: "4px 3px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: m.color,
              lineHeight: 1,
            }}
          >
            {m.value}
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ChatWindow({
  selectedId,
  contacts,
  setContacts
}: ChatWindowProps) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [rightTab, setRightTab] = useState<"info" | "notes" | "tags">("info");
  const [showRight, setShowRight] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInteracted = useRef(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const { toasts, add: addToast, remove: removeToast } = useToast();

  // ── API calls ─────────────────────────────────────────────────────────────
  // const contacts = useApi<Contact[]>("/api/contacts");
  const messages = useApi<Message[]>("/api/messages");
  const templates = useApi<Template[]>("/api/templates");
  const notes = useApi<Note[]>("/api/notes");
  const tags = useApi<Tag[]>("/api/tags");
  const users = useApi<User[]>("/api/users");
  const queues = useApi<Queue[]>("/api/queues");
  const settings = useApi<Settings>("/api/settings");
  const campaigns = useApi<Campaign[]>("/api/campaigns");
  const analytics = useApi<Analytics>("/api/analytics");

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const mark = () => {
      hasInteracted.current = true;
    };
    window.addEventListener("click", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("click", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data, optimisticMessages.length]);

  useEffect(() => {
    if (!hasInteracted.current) return;
    const msgs = messages.data;
    if (!msgs?.length) return;
    const last = msgs[msgs.length - 1];
    if (last.direction === "inbound") playNotificationSound("message");
  }, [messages.data?.length]); // eslint-disable-line

  // ── Derived data ──────────────────────────────────────────────────────────
  // ── Emoji Picker ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => setShowEmojiPicker(false);
    if (showEmojiPicker) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showEmojiPicker]);

  // ── Emoji Picker ──────────────────────────────────────────────────────────

  const selectedContact = useMemo(
    () => contacts?.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  const visibleMessages = useMemo(() => {
    const api = (messages.data ?? []).filter((m) => m.contactId === selectedId);
    const opt = optimisticMessages.filter((m) => m.contactId === selectedId);
    const confirmed = new Set(api.map((m) => `${m.content}|${m.direction}`));
    const pendingOpt = opt.filter(
      (m) =>
        !confirmed.has(`${m.content}|${m.direction}`) || m._failed
    );
    return [...api, ...pendingOpt].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages.data, optimisticMessages, selectedId]);

  const filteredTemplates = useMemo(() => {
    if (!templates.data) return [];
    const q = inputValue.replace(/^\//, "").toLowerCase();
    if (!q) return templates.data.slice(0, 6);
    return templates.data.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
    );
  }, [templates.data, inputValue]);

  const contactNotes = useMemo(
    () => (notes.data ?? []).filter((n) => n.contactId === selectedId),
    [notes.data, selectedId]
  );

  const contactTags = useMemo(() => {
    if (!selectedContact?.tags || !tags.data) return [];
    return tags.data.filter((t) => selectedContact.tags!.includes(t.id));
  }, [selectedContact, tags.data]);

  const contactQueue = useMemo(
    () => queues.data?.find((q) => q.id === selectedContact?.queueId),
    [queues.data, selectedContact]
  );

  const assignedUser = useMemo(
    () => users.data?.find((u) => u.id === selectedContact?.assignedUserId),
    [users.data, selectedContact]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async () => {
    const body = inputValue.trim();
    if (!body || !selectedId) return;

    const timestamp = new Date().toISOString();

    const tempId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      contactId: selectedId,
      content: body,
      direction: "outbound",
      timestamp,
      status: "sent",
      _optimistic: true,
    };

    // 🔥 OTIMISTA NO CHAT
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);

    // 🔥 ATUALIZA SIDEBAR NA HORA (AQUI ESTÁ A MÁGICA)
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedId
          ? {
            ...contact,
            lastMessage: {
              content: body,
              timestamp,
              direction: "outbound",
            },
          }
          : contact
      )
    );

    setInputValue("");
    setShowTemplates(false);
    inputRef.current?.focus();

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedId,
          content: body,
          direction: "outbound",
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // remove optimistic
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));

      messages.refetch();
    } catch (err) {
      console.error("[ChatWindow] Falha ao enviar:", err);

      // marca como erro no chat
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, _optimistic: false, _failed: true }
            : m
        )
      );

      // ⚠️ OPCIONAL (rollback no sidebar)
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedId
            ? {
              ...contact,
              lastMessage: {
                content: "Falha ao enviar mensagem",
                timestamp,
                direction: "outbound",
              },
            }
            : contact
        )
      );

      addToast(
        {
          type: "error",
          title: "Falha ao enviar mensagem",
          message: "Verifique sua conexão e tente novamente.",
        },
        true
      );
    }
  }, [inputValue, selectedId, messages, addToast, setContacts]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputValue(v);
      setShowTemplates(v.startsWith("/") && !!templates.data?.length);
    },
    [templates.data]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
      if (e.key === "Escape") setShowTemplates(false);
    },
    [handleSendMessage]
  );

  const handleApplyTemplate = useCallback((t: Template) => {
    setInputValue(t.content);
    setShowTemplates(false);
    inputRef.current?.focus();
  }, []);

  const handleAddNote = useCallback(() => {
    if (!noteText.trim() || !selectedId) return;
    addToast({ type: "info", title: "Nota adicionada!" }, true);
    setNoteText("");
  }, [noteText, selectedId, addToast]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Global CSS ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes bubbleIn {
          from { opacity:0; transform:translateY(4px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes toastIn {
          from { opacity:0; transform:translateX(16px) scale(0.96); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        @keyframes pulseDot {
          0%,100% { transform:scale(1); }
          50%     { transform:scale(1.5); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        input:focus, textarea:focus { outline: none; }
        button { font-family: inherit; }

        .sidebar-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 40;
        }
        @media (max-width: 767px) {
          .sidebar-backdrop.open { display: block; }
          .chat-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: 260px !important;
          }
          .chat-sidebar.open { transform: translateX(0); }
          .chat-right-panel {
            position: fixed !important;
            right: 0; top: 0; bottom: 0;
            z-index: 50;
            width: 260px !important;
            transform: translateX(100%);
            transition: transform 0.25s ease;
          }
          .chat-right-panel.open { transform: translateX(0); }
          .mobile-header-btn { display: flex !important; }
        }
        @media (min-width: 768px) {
          .mobile-header-btn { display: none !important; }
          .chat-sidebar { transform: none !important; position: relative !important; }
        }
      `}</style>

      {/* ── Toast Stack ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "all" }}>
            <ToastItem toast={t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </div>

      {/* ── Mobile sidebar backdrop ─────────────────────────────────────────── */}
      <div
        className={`sidebar-backdrop ${showSidebar ? "open" : ""}`}
        onClick={() => setShowSidebar(false)}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYOUT RAIZ
          
          Proporções:
            Sidebar esquerda  : 240px  (fixa)
            Chat (main)       : flex:1 (ocupa todo o espaço restante)
            Painel direito    : 260px  (fixa, menor que antes)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          height: "100dvh",
          width: "100%",
          background: "#f1f5f9",
          overflow: "hidden",
        }}
      >

        {/* ══════════════════════════════════════════════════════════════════
            CHAT AREA — flex:1 → ocupa todo espaço disponível
        ══════════════════════════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#e9ddd4",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c0b4aa' fill-opacity='0.12'%3E%3Cpath d='M10 10h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zM3 17h4v4H3zm14 0h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zM10 24h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zM3 31h4v4H3zm14 0h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4zM10 38h4v4h-4zm14 0h4v4h-4zm14 0h4v4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            overflow: "hidden",
            position: "relative",
            minWidth: 0,
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <header
            style={{
              height: 56,
              background: "#fff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            {/* Botão hamburger mobile */}
            <button
              className="mobile-header-btn"
              onClick={() => setShowSidebar(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: 4,
                display: "none",
                alignItems: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {selectedContact ? (
              <>
                <Avatar
                  name={selectedContact.name}
                  src={selectedContact.profilePicture}
                  size={36}
                  online={getContactOnline(selectedContact.status)}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#1e293b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedContact.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: getContactOnline(selectedContact.status)
                          ? "#22c55e"
                          : "#94a3b8",
                      }}
                    >
                      {getContactOnline(selectedContact.status)
                        ? "Online"
                        : "Offline"}
                    </span>
                    {contactQueue && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "1px 7px",
                          borderRadius: 999,
                          background: contactQueue.color + "22",
                          color: contactQueue.color,
                          border: `1px solid ${contactQueue.color}44`,
                        }}
                      >
                        {contactQueue.name}
                      </span>
                    )}
                    {assignedUser && (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        · {assignedUser.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle painel direito */}
                <button
                  onClick={() => setShowRight((v) => !v)}
                  title={showRight ? "Fechar painel" : "Abrir painel"}
                  style={{
                    background: showRight ? "#eff6ff" : "transparent",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "5px 8px",
                    cursor: "pointer",
                    color: showRight ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 500,
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M15 3v18" />
                  </svg>
                </button>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#94a3b8",
                    }}
                  >
                    Selecione um contato
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#cbd5e1",
                    }}
                  >
                    Para começar o atendimento
                  </p>
                </div>
              </div>
            )}
          </header>

          {/* ── Área de Mensagens ─────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
            }}
          >
            {!selectedId ? (
              /* Estado vazio */
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  GS Company Chat
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    margin: 0,
                    textAlign: "center",
                    maxWidth: 260,
                  }}
                >
                  Selecione uma conversa ao lado para visualizar o histórico
                  e enviar mensagens.
                </p>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#fef9c3",
                    color: "#a16207",
                    padding: "4px 12px",
                    borderRadius: 999,
                    border: "1px solid #fde68a",
                  }}
                >
                  Ambiente de Teste
                </span>
              </div>
            ) : messages.loading ? (
              /* Skeleton de mensagens */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[70, 45, 55, 80, 40].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent:
                        i % 2 === 0 ? "flex-start" : "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: `${w}%`,
                        height: 48,
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.6)",
                        animation: "shimmer 1.4s infinite",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : visibleMessages.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  Nenhuma mensagem. Diga olá! 👋
                </p>
              </div>
            ) : (
              /*
               * CORREÇÃO de espaçamento: um único container com gap:4 controla
               * o espaço entre bolhas. A própria MessageBubble NÃO tem margin.
               * Separadores de data ficam dentro do mesmo fluxo de gap.
               */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {visibleMessages.map((msg, idx) => {
                  const prev = visibleMessages[idx - 1];
                  const showDateSep =
                    !prev ||
                    new Date(msg.timestamp).toDateString() !==
                    new Date(prev.timestamp).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateSep && (
                        <div
                          style={{
                            textAlign: "center",
                            margin: "8px 0 4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#64748b",
                              background: "rgba(255,255,255,0.75)",
                              padding: "3px 12px",
                              borderRadius: 999,
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleDateString(
                              "pt-BR",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              }
                            )}
                          </span>
                        </div>
                      )}
                      <MessageBubble message={msg} />
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Templates Dropdown ─────────────────────────────────────────── */}
          {showTemplates &&
            filteredTemplates.length > 0 &&
            selectedId && (
              <div
                style={{
                  position: "absolute",
                  bottom: 70,
                  left: 12,
                  right: 12,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  zIndex: 30,
                  overflow: "hidden",
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "7px 12px",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Templates de resposta
                </div>
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleApplyTemplate(t)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#1e293b",
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.content}
                    </span>
                  </button>
                ))}
              </div>
            )}

          {/* ── Input Area ─────────────────────────────────────────────────── */}
          <footer
            style={{
              padding: "8px 12px",
              background: "#f0f2f5",
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              {/* Emoji btn + picker */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    flexShrink: 0,
                    opacity: selectedId ? 1 : 0.4,
                  }}
                  title="Emoji"
                  disabled={!selectedId}
                >
                  <Smile size={20} />
                </button>

                {showEmojiPicker && (
                  <div
                    style={{
                      position: "fixed",
                      bottom: "80px",   // ajusta conforme altura do input
                      // right: "80px",   // joga pra dentro da área do chat
                      zIndex: 9999,
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setInputValue((prev) => prev + emojiData.emoji);
                      }}
                    />
                  </div>
                )}
              </div>


              {/* Input container */}
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  border: "1px solid #e2e8f0",
                  minWidth: 0,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedId
                      ? "Digite / para templates ou uma mensagem…"
                      : "Selecione um contato para começar"
                  }
                  disabled={!selectedId}
                  style={{
                    flex: 1,
                    border: "none",
                    padding: "10px 0",
                    fontSize: 14,
                    color: "#1e293b",
                    background: "transparent",
                    fontFamily: "inherit",
                    minWidth: 0,
                  }}
                />

                {optimisticMessages.some(
                  (m) => m.contactId === selectedId && m._optimistic
                ) && (
                    <div
                      title="Enviando…"
                      style={{
                        width: 15,
                        height: 15,
                        border: "2px solid #2563eb",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        flexShrink: 0,
                        marginLeft: 6,
                      }}
                    />
                  )}
              </div>

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !selectedId}
                title="Enviar (Enter)"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background:
                    inputValue.trim() && selectedId
                      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                      : "#e2e8f0",
                  border: "none",
                  cursor:
                    inputValue.trim() && selectedId
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  boxShadow:
                    inputValue.trim() && selectedId
                      ? "0 4px 14px rgba(37,99,235,0.4)"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && selectedId)
                    e.currentTarget.style.transform = "scale(1.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>

            {/* Dica de atalhos */}
            {selectedId && !inputValue && (
              <p
                style={{
                  margin: "4px 0 0 48px",
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: 4,
                    padding: "0 4px",
                    fontFamily: "monospace",
                  }}
                >
                  /
                </kbd>{" "}
                templates ·{" "}
                <kbd
                  style={{
                    background: "#e2e8f0",
                    borderRadius: 4,
                    padding: "0 4px",
                    fontFamily: "monospace",
                  }}
                >
                  Enter
                </kbd>{" "}
                enviar
              </p>
            )}
          </footer>
        </main>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PANEL — Info / Notas / Tags (260px — mais estreito)
            Renderizado APENAS quando showRight=true E há contato selecionado.
            Em desktop fica inline ao lado do chat; em mobile usa overlay.
        ══════════════════════════════════════════════════════════════════ */}
        {showRight && selectedContact && (
          <aside
            className="chat-right-panel open"
            style={{
              width: 260,
              minWidth: 260,
              background: "#fff",
              borderLeft: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              {(["info", "notes", "tags"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      rightTab === tab
                        ? "2px solid #2563eb"
                        : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: rightTab === tab ? 700 : 500,
                    color: rightTab === tab ? "#2563eb" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {tab === "info"
                    ? "Info"
                    : tab === "notes"
                      ? "Notas"
                      : "Tags"}
                </button>
              ))}
              {/* Fechar painel mobile */}
              <button
                className="mobile-header-btn"
                onClick={() => setShowRight(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "0 8px",
                  display: "none",
                  alignItems: "center",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 12,
              }}
            >
              {/* ── Tab: Info ──────────────────────────────────────────────── */}
              {rightTab === "info" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {/* Cartão do contato */}
                  <div
                    style={{
                      textAlign: "center",
                      padding: "14px 12px",
                      background:
                        "linear-gradient(135deg,#eff6ff,#f0f9ff)",
                      borderRadius: 10,
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Avatar
                        name={selectedContact.name}
                        src={selectedContact.profilePicture}
                        size={46}
                        online={getContactOnline(selectedContact.status)}
                      />
                    </div>
                    <p
                      style={{
                        margin: "0 0 3px",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#1e293b",
                      }}
                    >
                      {selectedContact.name}
                    </p>
                    {selectedContact.phoneNumber && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {selectedContact.phoneNumber}
                      </p>
                    )}
                    {selectedContact.email && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        {selectedContact.email}
                      </p>
                    )}
                  </div>

                  {/* Fila */}
                  {contactQueue && (
                    <InfoRow label="Fila">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: contactQueue.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {contactQueue.name}
                        </span>
                      </div>
                    </InfoRow>
                  )}

                  {/* Agente */}
                  {assignedUser && (
                    <InfoRow label="Agente">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "#dcfce7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 10,
                            color: "#166534",
                            flexShrink: 0,
                          }}
                        >
                          {assignedUser.name[0]}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {assignedUser.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              color: "#64748b",
                            }}
                          >
                            {assignedUser.role} ·{" "}
                            {assignedUser.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    </InfoRow>
                  )}

                  {/* Campanhas */}
                  {campaigns.data && campaigns.data.length > 0 && (
                    <InfoRow label="Campanhas">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {campaigns.data.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                color: "#1e293b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 130,
                              }}
                            >
                              {c.name}
                            </span>
                            <CampaignBadge status={c.status} />
                          </div>
                        ))}
                      </div>
                    </InfoRow>
                  )}
                </div>
              )}

              {/* ── Tab: Notas ─────────────────────────────────────────────── */}
              {rightTab === "notes" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Escreva uma nota interna…"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 9,
                      fontSize: 12,
                      resize: "vertical",
                      fontFamily: "inherit",
                      color: "#1e293b",
                      background: "#f8fafc",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "#2563eb")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "#e2e8f0")
                    }
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    style={{
                      padding: "7px 0",
                      background: noteText.trim()
                        ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                        : "#e2e8f0",
                      color: noteText.trim() ? "#fff" : "#94a3b8",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: noteText.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                    }}
                  >
                    Adicionar nota
                  </button>

                  {notes.loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        marginTop: 4,
                      }}
                    >
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <Skeleton w="35%" h={9} />
                          <Skeleton w="90%" h={11} />
                        </div>
                      ))}
                    </div>
                  ) : contactNotes.length === 0 ? (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      Nenhuma nota para este contato.
                    </p>
                  ) : (
                    contactNotes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 3px",
                            fontSize: 12,
                            color: "#1e293b",
                            lineHeight: 1.5,
                          }}
                        >
                          {n.content}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            color: "#92400e",
                          }}
                        >
                          {new Date(n.timestamp).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Tab: Tags ──────────────────────────────────────────────── */}
              {rightTab === "tags" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 7px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Tags aplicadas
                    </p>
                    {contactTags.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                        }}
                      >
                        {contactTags.map((t) => (
                          <TagPill key={t.id} tag={t} />
                        ))}
                      </div>
                    ) : (
                      <p
                        style={{ fontSize: 12, color: "#94a3b8" }}
                      >
                        Nenhuma tag aplicada.
                      </p>
                    )}
                  </div>

                  <div>
                    <p
                      style={{
                        margin: "0 0 7px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Disponíveis
                    </p>
                    {tags.loading ? (
                      <Skeleton w="75%" h={26} />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                        }}
                      >
                        {tags.data?.map((t) => (
                          <button
                            key={t.id}
                            onClick={() =>
                              addToast(
                                {
                                  type: "info",
                                  title: `Tag "${t.name}" aplicada!`,
                                },
                                true
                              )
                            }
                            style={{
                              background: "#f8fafc",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                              padding: "3px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              cursor: "pointer",
                              transition: "all 0.15s",
                              fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.color = "#2563eb";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#f8fafc";
                              e.currentTarget.style.color = "#64748b";
                            }}
                          >
                            + {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do painel */}
            {settings.data && (
              <div
                style={{
                  padding: "7px 12px",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  {settings.data.companyName} ·{" "}
                  {settings.data.businessHours?.start}–
                  {settings.data.businessHours?.end}
                </span>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

// ── Small helper components ────────────────────────────────────────────────────

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </p>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 8,
          padding: "7px 9px",
          border: "1px solid #f1f5f9",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TagPill({ tag }: { tag: Tag }) {
  const hex = tag.color.startsWith("#") ? tag.color : colorNameToHex(tag.color);
  return (
    <span
      style={{
        background: hex + "22",
        color: hex,
        border: `1px solid ${hex}44`,
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {tag.name}
    </span>
  );
}

function CampaignBadge({ status }: { status: Campaign["status"] }) {
  const map = {
    active: { bg: "#dcfce7", color: "#166534", label: "Ativa" },
    scheduled: { bg: "#eff6ff", color: "#1d4ed8", label: "Agendada" },
    completed: { bg: "#f1f5f9", color: "#64748b", label: "Concluída" },
    paused: { bg: "#fef9c3", color: "#92400e", label: "Pausada" },
  };
  const s = map[status] ?? map.completed;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

function colorNameToHex(name: string): string {
  const m: Record<string, string> = {
    red: "#ef4444",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#eab308",
    purple: "#8b5cf6",
    orange: "#f97316",
    pink: "#ec4899",
    teal: "#14b8a6",
    gray: "#6b7280",
  };
  return m[name.toLowerCase()] ?? "#6b7280";
}

export default ChatWindow;