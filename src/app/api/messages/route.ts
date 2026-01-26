import { Message } from '@/types';
import { NextResponse } from 'next/server';

// Mock Data
let messages: Message[] = [
  {
    id: 'm1',
    contactId: '1',
    content: 'Olá, bom dia!',
    direction: 'inbound',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'm2',
    contactId: '1',
    content: 'Bom dia, Alice! Como posso ajudar?',
    direction: 'outbound',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9).toISOString(),
  },
  {
    id: 'm3',
    contactId: '1',
    content: 'Olá, gostaria de saber mais sobre o plano Enterprise.',
    direction: 'inbound',
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'm4',
    contactId: '2',
    content: 'Meu boleto venceu.',
    direction: 'inbound',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
  },
  {
    id: 'm5',
    contactId: '2',
    content: 'Sem problemas, Roberto. Segue a segunda via.',
    direction: 'outbound',
    status: 'read',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5).toISOString(),
  },
  {
    id: 'm6',
    contactId: '2',
    content: 'Obrigado pelo atendimento!',
    direction: 'inbound',
    status: 'delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');

  await new Promise((resolve) => setTimeout(resolve, 300));

  if (contactId) {
    const filtered = messages.filter((m) => m.contactId === contactId);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { contactId, content } = body;

  if (!contactId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newMessage: Message = {
    id: Math.random().toString(36).substring(7),
    contactId,
    content,
    direction: 'outbound',
    status: 'sent',
    timestamp: new Date().toISOString(),
  };

  messages.push(newMessage);

  return NextResponse.json(newMessage, { status: 201 });
}
