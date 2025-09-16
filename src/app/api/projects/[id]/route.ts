import { NextResponse } from 'next/server';
import { fetchProjectWithRecipients } from '@/lib/supabase/projects';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const project = await fetchProjectWithRecipients(params.id);

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Failed to load project:', error);
    return NextResponse.json({ error: 'Falha ao carregar o projeto.' }, { status: 500 });
  }
}
