# reservva-anfitriao

App do ecossistema [Reservva](https://github.com/filipegermano/reservva) voltado a
anfitriões de Airbnb, pousadas e temporada: cria cartazes de boas-vindas e guias
digitais para hóspedes, inspirado no [anfitrian.com.br](https://anfitrian.com.br).

## O que faz

- **Importar anúncio** — cola o link do Airbnb e o guia vem pré-preenchido
  (nome, capacidade, horários, regras, comodidades, fotos por ambiente e
  anfitrião). Outros sites são lidos via JSON-LD/Open Graph; com IA
  configurada, também dá para colar o texto do anúncio.
- **Guia digital do hóspede** — página pública (`/g/[slug]`), acessível por
  link ou QR code, montada com seções modulares (Wi-Fi, check-in/out, regras,
  comodidades, ambientes, anfitrião, emergência, dicas locais, restaurantes,
  avaliação, transporte e outras). Tem capa de entrada, busca, navegação
  inferior, QR code de conexão ao Wi-Fi e avaliação pelos hóspedes. Só fica
  acessível depois de publicado.
- **Editor** — seções com ativar/desativar, reordenar e editar, prévia ao vivo
  em moldura de celular, salvamento automático, temas visuais (Grafite é o
  padrão) e "Gerar com IA" para textos (opcional).
- **Compartilhar e cartaz** — publicação, link, QR code em PNG, envio por
  WhatsApp/e-mail e cartaz em PDF com 5 modelos, tamanhos A5 a A1 e textos em
  português, inglês ou espanhol.
- **Calendário de reservas** — importa os calendários compartilhados (iCal) do
  Airbnb, Booking e outros sites em `/app/calendario`: grade mensal com as
  estadias por cor, próximas reservas, check-ins/check-outs da semana, taxa de
  ocupação do mês e detalhes de cada reserva (datas, noites, link no site de
  origem). A sincronização é só de leitura e roda ao abrir a página quando os
  dados estão com mais de 30 minutos, ou no botão "Sincronizar".
- **Painel do anfitrião** — lista de guias com status, visualizações e nota
  média, atrás de autenticação própria (e-mail/senha).
- **Conta compartilhada** — guias, cartazes e calendários pertencem a uma
  conta, e não a uma pessoa: em `/app/equipe` o dono gera um link de convite
  (uso único, 7 dias) para outros anfitriões, recepção ou limpeza acessarem a
  mesma área. Membros criam e editam guias e calendários; convidar, remover
  pessoas e excluir guias ficam só com o dono. Quem participa de mais de uma
  conta troca pelo seletor no topo.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (Radix)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Auth.js](https://authjs.dev) (Credentials) para login/registro
- `qrcode` para gerar os QR codes e `@react-pdf/renderer` para o cartaz em PDF
- Armazenamento de objetos S3-compatible (`@aws-sdk/client-s3`) para as
  fotos (capa, ambientes, anfitrião e fotos importadas)
- [Gemini](https://ai.google.dev) (API REST, `GEMINI_API_KEY`), opcional, para
  gerar textos, interpretar anúncios colados e traduzir o guia
- [Vitest](https://vitest.dev) para os testes

## Rodando localmente

Precisa de um PostgreSQL. Com Docker:

```bash
docker run -d --name reservva-anfitriao-db \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=reservva_anfitriao \
  -p 5433:5432 postgres:17-alpine
```

```bash
npm install
cp .env.example .env   # ajuste AUTH_SECRET, DATABASE_URL e demais variáveis
npx prisma migrate dev
npm run dev
```

O `npm test` usa o mesmo banco do `DATABASE_URL` (os testes de integração
criam e apagam os próprios registros).

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — eslint
- `npm test` — testes (parser de anúncios, seções, segurança de URLs,
  calendário, convites e acesso por conta)
- `npx prisma studio` — explorar o banco local

## Cadastro de novas contas

O cadastro público em `/registrar` é controlado por `REGISTRATION_ENABLED` e
vem **fechado por padrão**: sem `true` (ou `1`), a página responde 404, a
`POST /api/register` responde 403 e os botões de "criar conta" saem da página
inicial e do login. Convites de equipe continuam valendo mesmo com o cadastro
fechado — quem abre um link de convite válido consegue criar o acesso.

## Deploy (Railway)

Em produção no [Railway](https://railway.com):

- **Banco**: serviço PostgreSQL do próprio Railway, com
  `DATABASE_URL=${{Postgres.DATABASE_URL}}` (URL interna, sem sair da rede
  privada do projeto).
- **Variáveis**: `AUTH_SECRET` (forte, gerado com `openssl rand -base64 33`),
  `AUTH_TRUST_HOST=true`, `AUTH_URL` apontando para o domínio público do
  serviço e `REGISTRATION_ENABLED` (padrão fechado).
- **Start command** customizado: `npx prisma migrate deploy && next start`.
- **Bucket** (Railway Object Storage, S3-compatible) para a foto de capa —
  `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`. As imagens são servidas pela
  própria aplicação em `/api/uploads/[...key]` (o bucket não precisa ser
  público).

### Migração do SQLite para o PostgreSQL

Até setembro de 2026 o banco era SQLite em um volume montado em `/data`
(`DATABASE_URL=file:/data/prod.db`). A virada foi feita com
`scripts/sqlite-para-postgres.mjs`, que copia os dados do arquivo antigo para
o banco novo — só lê o SQLite, exige o destino vazio, roda em uma transação e
confere as contagens no fim:

```bash
DATABASE_URL="postgresql://..." node scripts/sqlite-para-postgres.mjs prod.db
```

Como o Postgres do Railway só é alcançável de dentro da rede privada do
projeto, o script rodou no próprio container (`railway ssh`), com
`better-sqlite3` temporariamente entre as dependências de produção — hoje ele
é dependência de desenvolvimento, então rodar o script de novo lá dentro
exigiria instalá-lo antes. O arquivo `/data/prod.db` continua no volume como
plano de volta.
