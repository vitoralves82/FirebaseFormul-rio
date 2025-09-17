import { supabase } from '@/lib/supabaseClient';

export async function createProjeto({ nome_projeto, nome_cliente, admin_id = null }:{
  nome_projeto:string; nome_cliente:string; admin_id?:string|null;
}) {
  const { data, error } = await supabase
    .from('projetos')              // TABELA: projetos
    .insert({ nome_projeto, nome_cliente, admin_id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data; // { id, ... }
}

export async function addDestinatarios(projetoId:string, lista:{nome:string;cargo?:string;email:string;token?:string}[]) {
  const payload = lista.map(d => ({
    projeto_id: projetoId,        // FK para projetos.id
    nome: d.nome,
    cargo: d.cargo ?? null,
    email: d.email,
    token: d.token ?? (globalThis.crypto?.randomUUID?.() ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
  }));
  const { data, error } = await supabase
    .from('destinatarios')        // TABELA: destinatarios
    .insert(payload)
    .select();
  if (error) throw new Error(error.message);
  return data;
}
