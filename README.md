# FirebaseFormulário

Aplicativo de formulários construído com Next.js 15, Tailwind CSS e Supabase. Ele permite que você crie projetos, defina destinatários e acompanhe respostas diretamente no banco de dados do Supabase.

## Como começar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env.local` e preencha os valores necessários:
   ```bash
   cp .env.example .env.local
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O app ficará disponível em `http://localhost:9002` por padrão.

## Configuração do Supabase

O projeto utiliza três tabelas principais no Supabase:

- **projects**
  - `id` (`uuid`, chave primária, `default uuid_generate_v4()`)
  - `project_name` (`text`)
  - `client_name` (`text`)
  - `status` (`text`, valores esperados: `rascunho`, `em_andamento`, `concluido`)
  - `notification` (`jsonb`, opcional)
  - `created_at` (`timestamptz`, `default now()`)
  - `updated_at` (`timestamptz`, atualizado via trigger)

- **recipients**
  - `id` (`uuid`, chave primária)
  - `project_id` (`uuid`, referência para `projects.id`)
  - `name` (`text`)
  - `position` (`text`)
  - `email` (`text`)
  - `status` (`text`, valores esperados: `pendente`, `enviado`, `concluido`)
  - `questions` (`jsonb`, array de IDs de perguntas)
  - `created_at` (`timestamptz`, `default now()`)
  - `updated_at` (`timestamptz`, atualizado via trigger)

- **submissions**
  - `id` (`uuid`, chave primária, `default uuid_generate_v4()`)
  - `project_id` (`uuid`, referência para `projects.id`)
  - `recipient_id` (`uuid`, referência para `recipients.id`)
  - `answers` (`jsonb`)
  - `created_at` (`timestamptz`, `default now()`)

Habilite o Row Level Security (RLS) e crie policies adequadas para acessos públicos, se necessário. As _server actions_ utilizam a `SUPABASE_SERVICE_ROLE_KEY`, portanto conseguem realizar mutações mesmo com RLS ativo.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase utilizada no cliente. |
| `NEXT_PUBLIC_APP_URL` | URL pública utilizada para montar links compartilháveis (ex.: convites). |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role usada pelas _server actions_ para mutações seguras. |
| `NEXT_PUBLIC_SITE_URL` | URL pública da aplicação (utilizada em links gerados no app). |

## Funcionalidades principais

- Persistência de projetos, destinatários e perguntas diretamente no Supabase através de _server actions_.
- Atualização granular de perguntas por destinatário com a rota `/api/projects/[id]` disponível para carregamento direto via URL.
- Registro de envios dos destinatários e geração de aviso automatizado quando todos completam as respostas.

## Scripts úteis

- `npm run dev` – inicia o servidor de desenvolvimento.
- `npm run build` – gera o build de produção do Next.js.
- `npm run start` – inicia o servidor de produção local.
- `npm run lint` – executa o lint do Next.js.
- `npm run typecheck` – valida os tipos TypeScript.

## Deploy

O projeto pode ser implantado na Vercel. Certifique-se de replicar todas as variáveis de ambiente no painel da Vercel e garanta que a `SUPABASE_SERVICE_ROLE_KEY` seja configurada apenas como variável de ambiente de servidor.
