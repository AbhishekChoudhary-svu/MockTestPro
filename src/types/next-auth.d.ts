import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'student' | 'admin';
      targetExam?: string;
      state?: string;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role?: 'student' | 'admin';
    targetExam?: string;
    state?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: 'student' | 'admin';
    targetExam?: string;
    state?: string;
  }
}
