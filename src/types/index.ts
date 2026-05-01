export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  contactId: string;
  content: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  status?: "sent" | "delivered" | "read" | "failed";
  _optimistic?: boolean;
  _failed?: boolean;
}

export type Contact = {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  profilePicture?: string;
  status: 'active' | 'inactive';
 lastMessage?: {
  content: string;
  timestamp: string;
  direction?: 'inbound' | 'outbound';
};
  tags?: string[];
  queueId?: string;
  assignedUserId?: string;
  unreadMessages?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
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
  role: 'admin' | 'agent' | 'supervisor';
  avatar?: string;
  isOnline: boolean;
}

export interface Queue {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt?: string;
  createdAt: string;
  messageTemplateId?: string;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export interface DashboardStats {
  activeChats: number;
  waitingChats: number;
  averageResponseTime: number; // in seconds
  messagesSentToday: number;
  messagesReceivedToday: number;
}

export interface Settings {
  companyName: string;
  businessHours: {
    start: string; // "09:00"
    end: string; // "18:00"
    days: number[]; // [1, 2, 3, 4, 5] (0=Sunday)
  };
  autoReply: {
    enabled: boolean;
    message: string;
  };
}
