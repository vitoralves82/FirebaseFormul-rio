'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDestinatarioByToken, submitResposta } from '@/lib/esgApi';

export default function ResponderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [dest, setDest] = useState<{ nome: string; email: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    pergunta_1: '',
    pergunta_2: '',
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  useEffect(() => {
    (async () => {
      if (!token) {
        setErro('Link sem token.');
        setLoading(false);
        return;
      }
      try {
        const d = await getDestinatarioByToken(token);
        if (!d) throw new Error('Link inválido.');
        setDest({ nome: d.nome, email: d.email });
      } catch (e: any) {
        setErro(e.message || 'Erro ao validar link.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await submitResposta({ token, respostas: form });
      alert('Obrigado! Resposta enviada.');
      router.replace('/');
    } catch (e: any) {
      alert(e.message || 'Falha ao enviar.');
    }
  };

  if (loading) return <p>Carregando…</p>;
  if (erro) return <p style={{ color: 'crimson' }}>{erro}</p>;

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1>Responder Formulário</h1>
      <p>
        Destinatário: <b>{dest?.nome}</b> ({dest?.email})
      </p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Pergunta 1
          <input name="pergunta_1" value={form.pergunta_1} onChange={onChange} required />
        </label>
        <label>
          Pergunta 2
          <input name="pergunta_2" value={form.pergunta_2} onChange={onChange} />
        </label>
        <button type="submit">Enviar respostas</button>
      </form>
    </main>
  );
}
