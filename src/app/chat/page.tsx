import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
