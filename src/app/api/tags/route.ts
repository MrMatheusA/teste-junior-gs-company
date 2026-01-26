import { Tag } from '@/types';
import { NextResponse } from 'next/server';

const tags: Tag[] = [
  { id: '1', name: 'Lead Quente', color: 'red' },
  { id: '2', name: 'Cliente', color: 'green' },
  { id: '3', name: 'Suporte', color: 'blue' },
  { id: '4', name: 'Financeiro', color: 'yellow' },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return NextResponse.json(tags);
}
