// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import type { ProjectFormData } from '@/lib/schemas';
import type { Project } from '@/types';

export async function POST(req: Request) {
  try {
    const { data, projectId } = (await req.json()) as {
      data: ProjectFormData;
      projectId?: string | null;
    };

    // Monta o objeto Project que a UI espera (sem tocar no DB aqui)
    const project: Project = {
      id: projectId ?? crypto.randomUUID(),
      projectName: data.projectName,
      clientName: data.clientName,
      recipients: data.recipients.map((r) => ({
        id: r.id,
        name: r.name,
        position: r.position,
        email: r.email,
        status: r.status ?? 'pendente',
        questions: r.questions ?? [],
      })),
      status: 'rascunho',
      notification: { message: '', isComprehensive: false },
    };

    return NextResponse.json({ project }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Não foi possível salvar o projeto.' },
      { status: 400 }
    );
  }
}
