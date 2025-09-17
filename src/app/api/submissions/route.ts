import { NextResponse } from 'next/server';
import { getSubmissions, submitResponse } from '@/lib/actions';
import type { Submission } from '@/types';

interface SubmitBody {
  submission?: Submission;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const submissions = await getSubmissions(projectId);
    return NextResponse.json({ submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar as submissões.';
    console.error('Failed to fetch submissions via API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody | null;

    if (!body?.submission) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const result = await submitResponse(body.submission);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível registrar a submissão.';
    console.error('Failed to submit response via API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
