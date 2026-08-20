import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      group_code: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    group_code?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    group_code: string | null;
  }
}
