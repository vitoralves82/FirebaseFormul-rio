import { NextResponse } from 'next/server';
import { markSingleEmailAsSent } from '@/lib/actions';

interface MarkEmailBody {
  projectId?: string;
  recipientId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MarkEmailBody | null;

    if (!body?.projectId || !body?.recipientId) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const project = await markSingleEmailAsSent(body.projectId, body.recipientId);
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível marcar o e-mail como enviado.';
    console.error('Failed to mark recipient email as sent via API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
