import { Queue } from '@/types';
import { NextResponse } from 'next/server';

const queues: Queue[] = [
  { id: '1', name: 'Comercial', color: '#10B981', isActive: true },
  { id: '2', name: 'Suporte Técnico', color: '#3B82F6', isActive: true },
  { id: '3', name: 'Financeiro', color: '#F59E0B', isActive: true },
  { id: '4', name: 'Retenção', color: '#EF4444', isActive: false },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return NextResponse.json(queues);
}
