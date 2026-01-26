import { DashboardStats } from '@/types';
import { NextResponse } from 'next/server';

const stats: DashboardStats = {
  activeChats: 24,
  waitingChats: 3,
  averageResponseTime: 145, // seconds
  messagesSentToday: 1542,
  messagesReceivedToday: 1420,
};

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate heavier calculation
  return NextResponse.json(stats);
}
