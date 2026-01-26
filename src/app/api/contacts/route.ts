import { Contact } from '@/types';
import { NextResponse } from 'next/server';

// Mock Data
const contacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Silva',
    phoneNumber: '+5511999999999',
    profilePicture: 'https://ui-avatars.com/api/?name=Alice+Silva&background=random',
    status: 'active',
    lastMessage: {
      content: 'Olá, gostaria de saber mais sobre o plano Enterprise.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    tags: ['Lead', 'WhatsApp'],
  },
  {
    id: '2',
    name: 'Roberto Santos',
    phoneNumber: '+5511988888888',
    profilePicture: 'https://ui-avatars.com/api/?name=Roberto+Santos&background=random',
    status: 'active',
    lastMessage: {
      content: 'Obrigado pelo atendimento!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    tags: ['Cliente', 'Suporte'],
  },
  {
    id: '3',
    name: 'Marcos Oliveira',
    phoneNumber: '+5521977777777',
    profilePicture: 'https://ui-avatars.com/api/?name=Marcos+Oliveira&background=random',
    status: 'inactive',
    tags: ['Inativo'],
  },
];

export async function GET() {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return NextResponse.json(contacts);
}
