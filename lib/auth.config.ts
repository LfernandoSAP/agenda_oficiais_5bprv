import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = !!(auth?.user as any)?.isAdmin;
      const { pathname } = nextUrl;

      if (pathname === "/login") {
        if (isLoggedIn) {
          return Response.redirect(new URL(isAdmin ? "/admin" : "/agenda", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (pathname.startsWith("/admin") && !isAdmin) {
        return Response.redirect(new URL("/agenda", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.posto = (user as any).posto;
        token.nomeCompleto = (user as any).nomeCompleto;
        token.re = (user as any).re;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.posto = token.posto as string;
      session.user.nomeCompleto = token.nomeCompleto as string;
      session.user.re = token.re as string;
      return session;
    },
  },
  providers: [],
};
