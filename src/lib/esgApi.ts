import { supabase } from './supabaseClient';

export type ProjetoInput = { nome_projeto: string; nome_cliente: string; admin_id?: string | null };
export type Projeto = { id: string; nome_projeto: string; nome_cliente: string; created_at?: string };

export type NovoDestinatario = { nome: string; cargo?: string; email: string; token?: string };
export type Destinatario = { id: string; projeto_id: string; nome: string; cargo?: string|null; email: string; token: string; respondido?: boolean|null };

export type RespostaPayload = Record<string, any>;
export type Resposta = { id: string; projeto_id: string; destinatario_id?: string|null; respostas_conteudo: any; validado: boolean; data_resposta?: string };

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export function buildResponderLink(token: string) {
  if (typeof window !== 'undefined' && !appUrl) {
    return `${window.location.origin}/responder?token=${encodeURIComponent(token)}`;
  }
  return `${appUrl?.replace(/\/$/, '') || ''}/responder?token=${encodeURIComponent(token)}`;
}

/** ADMIN: cria um projeto */
export async function createProjeto(input: ProjetoInput): Promise<Projeto> {
  const { data, error } = await supabase
    .from('projetos')
    .insert({ nome_projeto: input.nome_projeto, nome_cliente: input.nome_cliente, admin_id: input.admin_id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Projeto;
}

/** ADMIN: adiciona destinatários (gera token UUID no front se token não vier) */
export async function addDestinatarios(projetoId: string, lista: NovoDestinatario[]) {
  const payload = lista.map(d => ({
    projeto_id: projetoId,
    nome: d.nome,
    cargo: d.cargo ?? null,
    email: d.email,
    token: d.token ?? (globalThis.crypto?.randomUUID?.() ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
  }));
  const { data, error } = await supabase.from('destinatarios').insert(payload).select();
  if (error) throw error;
  const links = (data || []).map((d: Destinatario) => ({ email: d.email, token: d.token, link: buildResponderLink(d.token) }));
  return { destinatarios: data as Destinatario[], links };
}

/** RESPONDENTE: obtém destinatário + projeto via token (para validar link e saber projeto_id) */
export async function getDestinatarioByToken(token: string) {
  const { data, error } = await supabase
    .from('destinatarios')
    .select('id, projeto_id, nome, email, token, respondido')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data as (Pick<Destinatario, 'id'|'projeto_id'|'nome'|'email'|'token'|'respondido'> | null);
}

/** RESPONDENTE: envia respostas (INSERT permitido para role anon via policy) */
export async function submitResposta(params: { token: string; respostas: RespostaPayload }) {
  const dest = await getDestinatarioByToken(params.token);
  if (!dest) throw new Error('Link inválido ou expirado.');

  const insert = {
    projeto_id: dest.projeto_id,
    destinatario_id: dest.id,
    respostas_conteudo: params.respostas,
    validado: false,
  };

  // Atenção: anon normalmente NÃO pode .select() por causa do RLS; portanto não usamos .select() aqui.
  const { error } = await supabase.from('respostas').insert(insert);
  if (error) throw error;

  // opcional: marcar destinatário como respondido
  await supabase.from('destinatarios').update({ respondido: true }).eq('id', dest.id).throwOnError();

  return { ok: true };
}

/** ADMIN: lista respostas por projeto (requere role authenticated com policy de SELECT) */
export async function listRespostasPorProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('respostas')
    .select('id, projeto_id, destinatario_id, respostas_conteudo, validado, data_resposta')
    .eq('projeto_id', projetoId)
    .order('data_resposta', { ascending: false });
  if (error) throw error;
  return data as Resposta[];
}

/** ADMIN: marca/atualiza validação de uma resposta */
export async function validarResposta(respostaId: string, value = true) {
  const { error } = await supabase.from('respostas').update({ validado: value }).eq('id', respostaId);
  if (error) throw error;
  return { ok: true };
}
