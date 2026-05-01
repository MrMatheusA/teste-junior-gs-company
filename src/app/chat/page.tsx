"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
import type { Contact } from "@/types/index.ts";
// ═══════════════════════════════════════════════════════════════════════════════


export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selectedId={selectedId}
        onSelectContact={setSelectedId}
        contacts={contacts}
        setContacts={setContacts}
      />

      <ChatWindow
        selectedId={selectedId}
        contacts={contacts}
        setContacts={setContacts}
      />
    </div>
  );
}