import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // Here we could inject the founder/investor role from DB
        (session.user as any).role = token.role;
        (session.user as any).onboarded = token.onboarded;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // initial sign in
        token.role = null;
        token.onboarded = false;
      }
      if (trigger === "update" && session) {
        token.role = session.role;
        token.onboarded = true;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };
