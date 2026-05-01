"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';


// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
import type { Contact, Message } from "@/types/index.ts";
// ═══════════════════════════════════════════════════════════════════════════════

interface SidebarProps {
  selectedId: string | null;
  onSelectContact: (id: string) => void;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const API_BASE = 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getLastMessageText(lm: Contact['lastMessage']): string {
  if (!lm) return 'Nenhuma mensagem';
  if (typeof lm === 'string') return lm;

  const text = lm.content ?? 'Nenhuma mensagem';

  // 👇 AQUI resolve seu problema
  if (lm.direction === 'outbound') {
    return `Você: ${text}`;
  }

  return text;
}

function getLastMessageTime(lm: Contact['lastMessage']): string | undefined {
  if (!lm || typeof lm === 'string') return undefined;
  return lm.timestamp;
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  src,
  online,
}: {
  name: string;
  src?: string;
  online: boolean;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
      )}
      <span
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-400' : 'bg-slate-300'
          }`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT ITEM
// ─────────────────────────────────────────────────────────────────────────────

function ContactItem({
  contact,
  active,
  onClick,
}: {
  contact: Contact;
  active: boolean;
  onClick: () => void;
}) {
  const lastText = getLastMessageText(contact.lastMessage);
  const lastTime = getLastMessageTime(contact.lastMessage);
  const online = contact.status === 'active';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        border-l-[3px] hover:bg-slate-50
        ${active
          ? 'bg-blue-50 border-l-blue-500'
          : 'border-l-transparent'
        }
      `}
    >
      <Avatar name={contact.name} src={contact.profilePicture} online={online} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm font-semibold truncate ${active ? 'text-blue-700' : 'text-slate-800'
              }`}
          >
            {contact.name}
          </span>
          {lastTime && (
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {fmtTime(lastTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-slate-500 truncate">{lastText}</span>
          {(contact.unreadMessages ?? 0) > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
              {contact.unreadMessages}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────────────────

function ContactSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-l-[3px] border-l-transparent">
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded animate-pulse w-2/5" />
        <div className="h-2.5 bg-slate-100 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar({
  selectedId,
  onSelectContact,
  contacts,
  setContacts
}: SidebarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Busca de contatos ────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [contactsRes, messagesRes] = await Promise.all([
        fetch(`${API_BASE}/api/contacts`),
        fetch(`${API_BASE}/api/messages`),
      ]);

      if (!contactsRes.ok) throw new Error(`Contacts HTTP ${contactsRes.status}`);
      if (!messagesRes.ok) throw new Error(`Messages HTTP ${messagesRes.status}`);

      const contactsJson = await contactsRes.json();
      const messagesJson = await messagesRes.json();

      let contactsData: Contact[] = Array.isArray(contactsJson)
        ? contactsJson
        : Object.values(contactsJson).find((v) => Array.isArray(v)) || [];

      const messages: any[] = Array.isArray(messagesJson)
        ? messagesJson
        : [];

      // 👇 MAPEAR última mensagem por contato
      const lastMessageMap = new Map<string, any>();

      messages.forEach((msg) => {
        const prev = lastMessageMap.get(msg.contactId);

        if (!prev || new Date(msg.timestamp) > new Date(prev.timestamp)) {
          lastMessageMap.set(msg.contactId, msg);
        }
      });

      // 👇 INJETAR no contato
      const enrichedContacts = contactsData.map((contact) => {
        const lastMsg = lastMessageMap.get(contact.id);

        if (!lastMsg) return contact;

        return {
          ...contact,
          lastMessage: {
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            direction: lastMsg.direction,
          },
        };
      });

      setContacts((prev: Contact[]) => {
        return enrichedContacts.map((newContact: Contact) => {
          const oldContact = prev.find((c: Contact) => c.id === newContact.id);

          if (!oldContact) return newContact;

          const oldTime = oldContact.lastMessage?.timestamp;
          const newTime = newContact.lastMessage?.timestamp;

          // 👇 mantém o mais recente (evita sobrescrever sua mensagem enviada)
          if (oldTime && newTime) {
            return new Date(oldTime) > new Date(newTime)
              ? oldContact
              : newContact;
          }

          return newContact;
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [setContacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Filtragem por busca ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const activeCount = contacts.filter((c) => c.status === 'active').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <aside className="w-72 h-full border-r border-slate-200 bg-white flex flex-col shadow-sm z-10 flex-shrink-0">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-800">Conversas</h2>
          </div>

          {!loading && !error && (
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {activeCount} ativas
            </span>
          )}
        </div>

        {/* Busca */}
        <div className="relative">
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contato..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* ── Lista de Contatos ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          /* Skeleton */
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <ContactSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          /* Erro */
          <div className="p-8 text-center">
            <svg
              className="w-8 h-8 text-slate-300 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-500 font-medium">{error}</p>
            <button
              onClick={fetchContacts}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Vazio */
          <div className="p-8 text-center">
            <svg
              className="w-8 h-8 text-slate-200 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p className="text-xs text-slate-400">
              {search ? 'Nenhum contato encontrado.' : 'Nenhum contato disponível.'}
            </p>
          </div>
        ) : (
          /* Lista */
          <div className="divide-y divide-slate-50">
            {filtered.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                active={contact.id === selectedId}
                onClick={() => onSelectContact(contact.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
        <p className="text-[10px] text-center text-slate-400">
          GS Company CRM v1.0
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;