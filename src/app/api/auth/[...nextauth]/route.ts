import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
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
  secret: process.env.NEXTAUTH_SECRET || "hacknation_vc_brain_development_secret_2026",
});

export { handler as GET, handler as POST };
