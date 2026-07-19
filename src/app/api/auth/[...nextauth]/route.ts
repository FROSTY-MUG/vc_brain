import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google is only wired up when both halves of the credential pair are present.
// Half-configured OAuth fails at the callback with an opaque "Try signing in
// with a different account", so an unusable provider is never registered.
const hasGoogle = Boolean(googleClientId && googleClientSecret);

const providers: NextAuthOptions["providers"] = [];

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId as string,
      clientSecret: googleClientSecret as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  );
} else {
  // Fallback so the product is reachable without external OAuth setup, mirroring
  // the mock LLM provider. Accepts any email and verifies nothing — it exists
  // only while Google is unconfigured and disappears as soon as it is.
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        name: { label: "Name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        if (!email) return null;
        const name = credentials?.name?.trim() || email.split("@")[0];
        return { id: email, email, name, image: "" };
      },
    })
  );
}

const handler = NextAuth({
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id || token.sub;
        token.email = user.email || token.email;
        token.name = user.name || token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as { id?: string }).id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "hacknation_vc_brain_development_secret_2026",
});

export { handler as GET, handler as POST };
