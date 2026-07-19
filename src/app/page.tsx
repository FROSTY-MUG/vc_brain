"use client";

import { Desktop } from "@/components/os/Desktop";
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
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gold-200 to-amber-500">C</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Cognis</h1>
          <p className="text-white/60 text-sm mb-8">
            The intelligence engine for equitable capital.
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={() => signIn("google")}
              className="flex-1 py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-all flex items-center justify-center shadow-xl"
            >
              Sign In
            </button>
            <button 
              onClick={() => signIn("google")}
              className="flex-1 py-3.5 px-4 bg-black border border-white/20 hover:bg-white/5 text-white font-semibold rounded-xl transition-all flex items-center justify-center shadow-xl"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Once authenticated, show the OS
  return <Desktop />;
}
