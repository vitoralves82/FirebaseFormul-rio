import { NextResponse } from 'next/server';
import { updateProjectQuestions } from '@/lib/actions';

interface UpdateQuestionsBody {
  projectId?: string;
  recipientId?: string;
  questions?: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateQuestionsBody | null;

    if (!body?.projectId || !body?.recipientId || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const project = await updateProjectQuestions(body.projectId, body.recipientId, body.questions);
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível atualizar as perguntas.';
    console.error('Failed to update recipient questions via API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
