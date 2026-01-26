import { Note } from '@/types';
import { NextResponse } from 'next/server';

let notes: Note[] = [
  { id: '1', contactId: '1', content: 'Cliente interessado no plano anual.', timestamp: new Date().toISOString() },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');

  await new Promise((resolve) => setTimeout(resolve, 300));

  if (contactId) {
    return NextResponse.json(notes.filter((n) => n.contactId === contactId));
  }
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { contactId, content } = body;

  if (!contactId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newNote: Note = {
    id: Math.random().toString(36).substring(7),
    contactId,
    content,
    timestamp: new Date().toISOString(),
  };

  notes.push(newNote);
  return NextResponse.json(newNote, { status: 201 });
}
