# EnvironPact Formulário

Aplicação Next.js para gestão de formulários de sustentabilidade, com persistência no Supabase e deploy via Vercel.

## Pré-requisitos

- Node.js 18 ou 20
- Uma instância do Supabase com acesso ao painel SQL
- Conta na Vercel conectada ao seu repositório GitHub

## Configuração do ambiente local

1. Instale as dependências do projeto:

   ```bash
   npm install
   ```

2. Copie o arquivo `.env.example` para `.env.local` e preencha as variáveis:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`: URL base do projeto Supabase
   - `SUPABASE_ANON_KEY`: chave pública (opcional no momento, mas útil para futuras interações no cliente)
   - `SUPABASE_SERVICE_ROLE_KEY`: chave Service Role (utilizada apenas no servidor / server actions)
   - `GOOGLE_GENAI_API_KEY`: chave da API Google GenAI usada pelo fluxo de notificação por IA

3. Crie as tabelas necessárias no Supabase executando o script [`docs/supabase-schema.sql`](docs/supabase-schema.sql) no editor SQL do painel.

4. Com tudo configurado, rode a aplicação:

   ```bash
   npm run dev
   ```

## Arquitetura resumida

- **Next.js 15 (App Router)** com componentes cliente e server actions.
- **Supabase** usado como banco principal. As server actions fazem chamadas ao PostgREST com a chave Service Role para criar projetos, destinatários e submissões.
- **Genkit / Google GenAI** gera a mensagem de conclusão quando todos os destinatários respondem.

A pasta `src/lib/supabase` contém o cliente mínimo utilizado pelas server actions.

## Scripts úteis

| Comando           | Descrição                             |
|-------------------|---------------------------------------|
| `npm run dev`     | Inicia o servidor de desenvolvimento   |
| `npm run build`   | Gera o build de produção do Next.js    |
| `npm run start`   | Inicia o servidor em modo produção     |
| `npm run lint`    | Executa o lint padrão do Next.js       |
| `npm run typecheck` | Verifica os tipos com TypeScript    |

## Deploy na Vercel

1. Faça commit das alterações e envie para o GitHub.
2. Conecte o repositório na Vercel, utilizando o comando de build padrão (`npm run build`).
3. Cadastre as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENAI_API_KEY`).
4. Realize o primeiro deploy e teste os fluxos de criação de projeto e submissão a partir do link gerado.

Consulte a seção de instruções adicionais no final da resposta do agente para um passo a passo detalhado de configuração do Supabase e Vercel.
