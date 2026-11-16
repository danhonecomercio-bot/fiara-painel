# Painel Fiara

Swipe file interno das ofertas digitais em escala (infoproduto, SaaS e low ticket) mineradas da Biblioteca de Anúncios da Meta. O painel fica em [https://painel.fiara.com.br](https://painel.fiara.com.br).

A interface é em português. Só entra quem tem conta. Não há cadastro público: um administrador cria o membro. A leitura passa pelo login e pela RLS do Supabase. A escrita é só da API dos bots, com a service role.

## Rodar aqui

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Em produção o comando é `npm run build && npm start`.

Para ver a tela sem um projeto Supabase, deixe a URL vazia e ligue o modo demo no `.env.local`:

```bash
DEMO_MODE=true
BOT_API_KEY=uma-chave-local
```

Entre com `demo@fiara.com.br` / `fiara-demo`. As três ofertas são exemplo e somem quando o processo reinicia. Não defina `DEMO_MODE` na Vercel. Se `NEXT_PUBLIC_SUPABASE_URL` existir, o modo demo é ignorado.

## 1. Aplicar as migrations

O schema está em `supabase/migrations/20261116140645_create_offer_swipe_file.sql`.

Pelo CLI, na raiz do projeto, com o [Supabase CLI](https://supabase.com/docs/guides/cli) autenticado:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Pelo SQL Editor do projeto: cole e rode o arquivo de migration inteiro, uma vez. Se quiser os três exemplos no banco de verdade, rode depois `supabase/seed.sql`. Eles estão marcados com `raw.example = true` e o título começa com `Exemplo:`. Para apagar:

```sql
delete from public.offers where raw->>'example' = 'true';
```

O mesmo seed pela API, com a service role no `.env.local`:

```bash
npm run seed
```

O que a migration faz:

- `offers`, `offer_libraries` (uma linha por página) e `offer_snapshots` (uma linha por mineração).
- View `offer_cards` com a leitura atual, a anterior e o total, em `security_invoker`.
- RLS ligada. `authenticated` só faz `select`. `anon` não lê. Não há policy de insert, update ou delete. A service role escreve porque ignora RLS.

## 2. Criar o primeiro administrador

No painel da Supabase, em Authentication → Providers → Email, desligue **Allow new users to sign up**. O app não tem tela de cadastro, mas a chave anônima é pública e o bloqueio real fica nessa opção.

Em Authentication → URL Configuration:

- Site URL: `https://painel.fiara.com.br`
- Redirect URLs: `https://painel.fiara.com.br/**`

Com a service role no `.env.local`:

```bash
npm run create-admin -- admin@fiara.com.br 'uma-senha-com-8-ou-mais'
```

Isso cria o usuário com e-mail já confirmado e `app_metadata.role = admin`. O papel fica em `app_metadata` de propósito: `user_metadata` o próprio usuário consegue editar.

Pelo dashboard, se preferir: Authentication → Users → Add user. Depois, no SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@fiara.com.br';
```

Saia e entre de novo. O JWT só passa a carregar o papel novo na próxima sessão.

Esse administrador abre **Membros** e cria o resto da equipe, com senha ou com convite por e-mail. O convite só chega se o SMTP do projeto estiver configurado. Criar com senha não depende de e-mail.

## 3. Variáveis na Vercel

No projeto da Vercel, Settings → Environment Variables, para Production e Preview:

| Variável | Onde vale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública. URL do projeto, `https://xxxx.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública. A chave anon. Em projeto novo a Supabase mostra esse valor como publishable key: cole aqui mesmo assim. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensível. Só no servidor. Nunca use o prefixo `NEXT_PUBLIC_`. |
| `BOT_API_KEY` | Sensível. Segredo que os bots mandam em `Authorization: Bearer`. |

Não crie `DEMO_MODE` na Vercel.

O arquivo `.env.example` lista os mesmos nomes. `.env.local` não entra no git.

## 4. Domínio painel.fiara.com.br

1. No projeto da Vercel, Settings → Domains, adicione `painel.fiara.com.br`.
2. Na Cloudflare, na zona `fiara.com.br`, crie o registro que a Vercel mostrar. Para esse subdomínio o registro é:

| Tipo | Nome | Destino | Proxy |
| --- | --- | --- | --- |
| CNAME | `painel` | `cname.vercel-dns.com` | DNS only, nuvem cinza |

A nuvem laranja quebra a emissão do certificado da Vercel. Deixe cinza, espere o DNS propagar e confira o cadeado em `https://painel.fiara.com.br`.

Se a tela de domínios da Vercel mostrar outro destino, use o valor dela.

## API dos bots

`docs/API.md` tem os curls de `POST /api/offers`, `PATCH /api/offers/:slug` e `GET /api/offers?since=...`.

Os bots das 7h e das 22h (horário de Brasília) fazem `POST` com as bibliotecas. Cada chamada acrescenta um snapshot. O bot de análise faz `PATCH` só com `opportunity` e `opportunity_notes`.

## Testes

```bash
npm test
npm run test:sql
```

`npm test` cobre validação, upsert, snapshot, patch e o formato da lista (`546 (+80 desde 15/11 22h)`, estrela acima de 500, fogo acima de 200). `npm run test:sql` sobe o schema num Postgres local, aplica o seed e confere a RLS: autenticado lê, anônimo não lê, autenticado não escreve, service role escreve.
