import { supabase } from '@/lib/supabaseClient';

/** ===== Tipos ===== */
export type ProjetoInput = {
  nome_projeto: string;
  nome_cliente: string;
  admin_id?: string | null;
};

export type Projeto = {
  id: string;
  nome_projeto: string;
  nome_cliente: string;
  created_at?: string;
};

export type NovoDestinatario = {
  nome: string;
  cargo?: string;
  email: string;
  token?: string;
};

export type Destinatario = {
  id: string;
  projeto_id: string;
  nome: string;
  cargo?: string | null;
  email: string;
  token: string;
  respondido?: boolean | null;
};

export type RespostaPayload = Record<string, any>;

export type Resposta = {
  id: string;
  projeto_id: string;
  destinatario_id?: string | null;
  respostas_conteudo: any;
  validado: boolean;
  data_resposta?: string;
};

/** ===== Util ===== */
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export function buildResponderLink(token: string) {
  if (typeof window !== 'undefined' && !appUrl) {
    return `${window.location.origin}/responder?token=${encodeURIComponent(token)}`;
  }
  const baseUrl = appUrl?.replace(/\/$/, '') ?? '';
  return `${baseUrl}/responder?token=${encodeURIComponent(token)}`;
}

/** ===== CRUD ===== */

/** ADMIN: cria um projeto */
export async function createProjeto(input: ProjetoInput): Promise<Projeto> {
  const { data, error } = await supabase
    .from('projetos')
    .insert({
      nome_projeto: input.nome_projeto,
      nome_cliente: input.nome_cliente,
      admin_id: input.admin_id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Projeto;
}

/** ADMIN: adiciona destinatários e retorna lista + links */
export async function addDestinatarios(projetoId: string, lista: NovoDestinatario[]) {
  const payload = lista.map((d) => ({
    projeto_id: projetoId,
    nome: d.nome,
    cargo: d.cargo ?? null,
    email: d.email,
    token:
      d.token ??
      (globalThis.crypto?.randomUUID?.()
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)),
  }));

  const { data, error } = await supabase
    .from('destinatarios')
    .insert(payload)
    .select();

  if (error) throw new Error(error.message);

  const destinatarios = (data ?? []) as Destinatario[];
  const links = destinatarios.map((d) => ({
    email: d.email,
    token: d.token,
    link: buildResponderLink(d.token),
  }));

  return { destinatarios, links };
}

/** RESPONDENTE: obtém destinatário via token (valida link) */
export async function getDestinatarioByToken(token: string) {
  const { data, error } = await supabase
    .from('destinatarios')
    .select('id, projeto_id, nome, email, token, respondido')
    .eq('token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as
    | Pick<Destinatario, 'id' | 'projeto_id' | 'nome' | 'email' | 'token' | 'respondido'>
    | null;
}

/** RESPONDENTE: envia respostas (INSERT liberado para anon via policy) */
export async function submitResposta(params: { token: string; respostas: RespostaPayload }) {
  const destinatario = await getDestinatarioByToken(params.token);
  if (!destinatario) throw new Error('Link inválido ou expirado.');

  const insertPayload = {
    projeto_id: destinatario.projeto_id,
    destinatario_id: destinatario.id,
    respostas_conteudo: params.respostas,
    validado: false,
  };

  // Importante: não encadear .select() aqui, pois anon geralmente não tem SELECT
  const { error } = await supabase.from('respostas').insert(insertPayload);
  if (error) throw new Error(error.message);

  // Opcional: marcar destinatário como respondido
  await supabase
    .from('destinatarios')
    .update({ respondido: true })
    .eq('id', destinatario.id)
    .throwOnError();

  return { ok: true };
}

/** ADMIN: lista respostas por projeto */
export async function listRespostasPorProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('respostas')
    .select('id, projeto_id, destinatario_id, respostas_conteudo, validado, data_resposta')
    .eq('projeto_id', projetoId)
    .order('data_resposta', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Resposta[];
}

/** ADMIN: marca/atualiza validação */
export async function validarResposta(respostaId: string, value = true) {
  const { error } = await supabase
    .from('respostas')
    .update({ validado: value })
    .eq('id', respostaId);

  if (error) throw new Error(error.message);
  return { ok: true };
}
