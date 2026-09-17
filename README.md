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

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (Radix)
- [Prisma](https://www.prisma.io) + SQLite (mesmo banco usado pelo
  `reservva-backend`)
- [Auth.js](https://authjs.dev) (Credentials) para login/registro
- `qrcode` para gerar os QR codes e `@react-pdf/renderer` para o cartaz em PDF
- Armazenamento de objetos S3-compatible (`@aws-sdk/client-s3`) para as
  fotos (capa, ambientes, anfitrião e fotos importadas)
- [Gemini](https://ai.google.dev) (API REST, `GEMINI_API_KEY`), opcional, para
  gerar textos, interpretar anúncios colados e traduzir o guia
- [Vitest](https://vitest.dev) para os testes

## Rodando localmente

```bash
npm install
cp .env.example .env   # ajuste AUTH_SECRET e demais variáveis
npx prisma migrate dev
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — eslint
- `npm test` — testes (parser de anúncios, seções, segurança de URLs, calendário)
- `npx prisma studio` — explorar o banco local

## Deploy (Railway)

Em produção no [Railway](https://railway.com), o SQLite precisa de um volume
persistente — sem ele, o banco é perdido a cada deploy. Configuração usada:

- **Volume** montado em `/data`.
- **Variáveis**: `DATABASE_URL=file:/data/prod.db`, `AUTH_SECRET` (forte,
  gerado com `openssl rand -base64 33`), `AUTH_TRUST_HOST=true`, `AUTH_URL`
  apontando para o domínio público do serviço.
- **Start command** customizado: `npx prisma migrate deploy && next start`.
  A migração roda no comando de start (não em `deploy.preDeployCommand`)
  porque, na Railway, o pre-deploy roda em uma instância efêmera sem o
  volume persistente montado — rodar a migração ali não persiste no banco
  real, causando `table does not exist` na primeira query em produção.
- **Bucket** (Railway Object Storage, S3-compatible) para a foto de capa —
  `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`. As imagens são servidas pela
  própria aplicação em `/api/uploads/[...key]` (o bucket não precisa ser
  público).
