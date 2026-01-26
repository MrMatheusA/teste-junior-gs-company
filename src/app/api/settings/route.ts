import { Settings } from '@/types';
import { NextResponse } from 'next/server';

let settings: Settings = {
  companyName: 'GS Company',
  businessHours: {
    start: '08:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5]
  },
  autoReply: {
    enabled: true,
    message: 'Olá! No momento não estamos disponíveis. Deixe sua mensagem e retornaremos assim que possível.'
  }
};

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  settings = { ...settings, ...body };
  return NextResponse.json(settings);
}
