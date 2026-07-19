import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Guest Login",
      credentials: {},
      async authorize() {
        return {
          id: "2",
          name: "Hack Nation Judge",
          email: "judge2@hacknation.com",
        };
      }
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: "hacknation_vc_brain_development_secret_2026",
});

export { handler as GET, handler as POST };
