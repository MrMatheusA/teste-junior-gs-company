import { User } from '@/types';
import { NextResponse } from 'next/server';

const users: User[] = [
  { id: '1', name: 'Alice Silva', email: 'alice@gs.com', role: 'admin', isOnline: true, avatar: 'https://ui-avatars.com/api/?name=Alice+Silva' },
  { id: '2', name: 'Bob Santos', email: 'bob@gs.com', role: 'agent', isOnline: true, avatar: 'https://ui-avatars.com/api/?name=Bob+Santos' },
  { id: '3', name: 'Charlie Oliveira', email: 'charlie@gs.com', role: 'agent', isOnline: false, avatar: 'https://ui-avatars.com/api/?name=Charlie+Oliveira' },
  { id: '4', name: 'Diana Costa', email: 'diana@gs.com', role: 'supervisor', isOnline: true, avatar: 'https://ui-avatars.com/api/?name=Diana+Costa' },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return NextResponse.json(users);
}
