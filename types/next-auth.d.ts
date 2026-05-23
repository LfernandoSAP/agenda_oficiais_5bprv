import "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin: boolean;
    posto: string;
    nomeCompleto: string;
    re: string;
  }
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      posto: string;
      nomeCompleto: string;
      re: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin: boolean;
    posto: string;
    nomeCompleto: string;
    re: string;
  }
}
