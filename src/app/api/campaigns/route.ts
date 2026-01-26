import { Campaign } from '@/types';
import { NextResponse } from 'next/server';

const campaigns: Campaign[] = [
  {
    id: '1',
    name: 'Black Friday 2025',
    status: 'completed',
    createdAt: '2025-11-01T10:00:00Z',
    stats: { total: 1000, sent: 998, delivered: 980, read: 850, failed: 2 }
  },
  {
    id: '2',
    name: 'Natal Antecipado',
    status: 'scheduled',
    createdAt: '2025-12-01T09:00:00Z',
    scheduledAt: '2025-12-10T14:00:00Z',
    stats: { total: 500, sent: 0, delivered: 0, read: 0, failed: 0 }
  }
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCampaign: Campaign = {
    id: Math.random().toString(36).substring(7),
    ...body,
    createdAt: new Date().toISOString(),
    status: 'draft',
    stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
  };
  campaigns.push(newCampaign);
  return NextResponse.json(newCampaign, { status: 201 });
}
