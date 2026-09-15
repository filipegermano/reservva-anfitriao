import type { NextAuthConfig } from "next-auth";

// Configuração "leve", sem providers que dependem do Prisma/bcrypt — é a
// parte segura de rodar no middleware (edge). A configuração completa,
// com o Credentials provider, vive em `src/auth.ts`.
export const authConfig = {
  pages: {
    signIn: "/entrar",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAppRoute = request.nextUrl.pathname.startsWith("/app");

      if (isAppRoute) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
