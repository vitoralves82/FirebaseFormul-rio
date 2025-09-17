import { NextResponse } from 'next/server';
import { createOrUpdateProject } from '@/lib/actions';
import type { ProjectFormData } from '@/lib/schemas';

interface UpsertProjectRequestBody {
  data?: ProjectFormData;
  projectId?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpsertProjectRequestBody | null;

    if (!body?.data) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const projectId = typeof body.projectId === 'string' && body.projectId.length > 0 ? body.projectId : undefined;
    const project = await createOrUpdateProject(body.data, projectId);

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível processar a requisição.';
    console.error('Failed to persist project via API route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
