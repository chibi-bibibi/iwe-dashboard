import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userData = user as { id?: string; group_code?: string | null };
        token.id = userData.id ?? token.sub ?? '';
        token.group_code = userData.group_code ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      const tokenData = token as { id?: string; group_code?: string | null };
      session.user.id = tokenData.id ?? '';
      session.user.group_code = tokenData.group_code ?? null;
      return session;
    },
  },
  providers: [],
});