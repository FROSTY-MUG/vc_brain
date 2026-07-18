"use client";

import Desktop from "@/components/os/Desktop";
import { useSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-gold-400" size={32} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="z-10 flex flex-col items-center glass-panel p-12 rounded-2xl max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-0.5 mb-6 shadow-lg shadow-gold-500/20">
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gold-200 to-amber-500">VC</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">The VC Brain</h1>
          <p className="text-white/60 text-sm mb-8">
            Deploying $100K Checks in 24 Hours. Intelligent sourcing, screening, and diligence.
          </p>
          
          <button 
            onClick={() => signIn("google")}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Once authenticated, show the OS
  return <Desktop />;
}
