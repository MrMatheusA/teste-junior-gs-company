import { MessageTemplate } from '@/types';
import { NextResponse } from 'next/server';

const templates: MessageTemplate[] = [
  { id: '1', name: 'Boas-vindas', content: 'Olá! Como posso ajudar você hoje?' },
  { id: '2', name: 'Ausência', content: 'No momento não estamos disponíveis. Retornaremos em breve.' },
  { id: '3', name: 'Fechamento', content: 'Obrigado pelo contato! Se precisar de mais alguma coisa, estamos à disposição.' },
];

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return NextResponse.json(templates);
}
