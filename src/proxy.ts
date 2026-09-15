import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Protege as rotas autenticadas (/app/**). É a versão "leve" do auth,
// sem o Credentials provider (que depende de Prisma/bcrypt e não roda
// no runtime do proxy/middleware).
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/app/:path*"],
};
