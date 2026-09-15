# reservva-anfitriao

App do ecossistema [Reservva](https://github.com/filipegermano/reservva) voltado a
anfitriões de Airbnb, pousadas e temporada: cria cartazes de boas-vindas e guias
digitais para hóspedes, inspirado no [anfitrian.com.br](https://anfitrian.com.br).

## O que faz

- **Guia digital do hóspede** — uma página pública (`/g/[slug]`), acessível por
  link ou QR code, com wi-fi, horários e instruções de check-in/check-out,
  regras da casa e recomendações locais (restaurantes, atrações, etc).
- **Cartaz para impressão** — PDF em A4, pronto para imprimir, com QR code
  apontando para o guia digital.
- **Painel do anfitrião** — cadastro de imóveis e edição do conteúdo do guia,
  atrás de autenticação própria (e-mail/senha).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (Radix)
- [Prisma](https://www.prisma.io) + SQLite (mesmo banco usado pelo
  `reservva-backend`)
- [Auth.js](https://authjs.dev) (Credentials) para login/registro
- `qrcode` para gerar os QR codes e `@react-pdf/renderer` para o cartaz em PDF

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
- `npx prisma studio` — explorar o banco local
