"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Settings, Award, Edit3, Camera } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const ProfileApp = () => {
  const { data: session } = useSession();
  const [role, setRole] = useState("investor");
  
  // Basic Profile State
  const [profileData, setProfileData] = useState({
    name: "",
    photoUrl: "",
    bio: "Passionate about building the future.",
    skills: "React, Python, AI, Distributed Systems"
  });

  // Investor Thesis State
  const [thesis, setThesis] = useState({
    sectors: ["AI Infrastructure", "Developer Tools", "B2B SaaS"],
    stages: ["Pre-Seed", "Seed"],
    checkSizeMin: 50000,
    checkSizeMax: 250000
  });
  
  // Set initial data from session
  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || "",
        photoUrl: session.user.image || ""
      }));
    }
  }, [session]);

  if (!session) return <div className="p-6 text-white text-center">Not logged in</div>;

  return (
    <div className="p-6 text-white h-full overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gold-gradient">User Profile</h2>
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Identity & Basic Editing */}
        <div className="col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center">
            <div className="relative group w-24 h-24 rounded-full bg-gold-500/20 flex items-center justify-center mb-4 border-2 border-gold-500/30 overflow-hidden cursor-pointer">
               {profileData.photoUrl ? (
                  <img src={profileData.photoUrl} alt="User" className="w-full h-full object-cover" />
               ) : (
                  <User size={40} className="text-gold-400" />
               )}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={20} className="text-white" />
               </div>
            </div>
            
            <div className="w-full mb-4">
              <input 
                type="text" 
                placeholder="Full Name"
                className="w-full bg-transparent text-xl font-bold text-white text-center border-b border-transparent hover:border-white/20 focus:border-gold-500 outline-none transition-colors"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              />
            </div>
            <p className="text-sm text-white/50 mb-4">{session?.user?.email}</p>
            
            <div className="w-full text-left space-y-3">
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Photo URL</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                  value={profileData.photoUrl}
                  onChange={(e) => setProfileData({...profileData, photoUrl: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Role</label>
                <select 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="investor">Investor</option>
                  <option value="founder">Founder</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl">
             <div className="flex items-center gap-2 text-gold-300 mb-3">
               <Award size={16} />
               <h4 className="font-semibold text-sm">System Status</h4>
             </div>
             <p className="text-xs text-white/70">Access Level: <span className="text-white font-mono">Tier 1</span></p>
             <p className="text-xs text-white/70 mt-1">API Usage: <span className="text-white font-mono">12/1000 calls</span></p>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="col-span-2 space-y-6">
          {/* General Bio / About */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
             <h3 className="font-semibold text-white text-sm border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                <Edit3 size={16} className="text-blue-400" /> Personal Description
             </h3>
             <textarea 
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 resize-none"
                placeholder="Write a brief bio about yourself, your background, and what you are building or looking for."
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
             ></textarea>
          </div>

          {/* Founder Specific: Skills */}
          {role === "founder" && (
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden border border-blue-500/20">
              <h3 className="font-semibold text-blue-300 text-sm border-b border-white/10 pb-2 mb-4">Founder Attributes</h3>
              <p className="text-xs text-white/50 mb-4">
                List your core technical and business skills. These are used by the VC Brain's sourcing engine to evaluate founder-market fit.
              </p>
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Core Skills (comma separated)</label>
                <input 
                  type="text" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
                  value={profileData.skills}
                  onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                  placeholder="e.g., Python, Marketing, React, B2B Sales"
                />
              </div>
              <button className="w-full mt-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-semibold">
                Save Founder Profile
              </button>
            </div>
          )}

          {/* Investor Specific: Thesis */}
          {role === "investor" && (
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden border border-gold-500/20">
              <h3 className="font-semibold text-gold-300 text-sm border-b border-white/10 pb-2 mb-4">Investment Thesis (System Prompt)</h3>
              <p className="text-xs text-white/50 mb-4">
                These parameters guide the AI agent during the Screening and Memo phases. Opportunities not matching this thesis will be assigned lower confidence scores.
              </p>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-white/60 mb-1.5 block">Target Sectors (comma separated)</label>
                    <input 
                       type="text" 
                       className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                       value={thesis.sectors.join(", ")}
                       onChange={(e) => setThesis({...thesis, sectors: e.target.value.split(",").map(s => s.trim())})}
                    />
                 </div>
                 <div>
                    <label className="text-xs text-white/60 mb-1.5 block">Target Stages</label>
                    <input 
                       type="text" 
                       className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                       value={thesis.stages.join(", ")}
                       onChange={(e) => setThesis({...thesis, stages: e.target.value.split(",").map(s => s.trim())})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs text-white/60 mb-1.5 block">Min Check Size ($)</label>
                       <input 
                          type="number" 
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                          value={thesis.checkSizeMin}
                          onChange={(e) => setThesis({...thesis, checkSizeMin: parseInt(e.target.value)})}
                       />
                    </div>
                    <div>
                       <label className="text-xs text-white/60 mb-1.5 block">Max Check Size ($)</label>
                       <input 
                          type="number" 
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold-500/50"
                          value={thesis.checkSizeMax}
                          onChange={(e) => setThesis({...thesis, checkSizeMax: parseInt(e.target.value)})}
                       />
                    </div>
                 </div>
                 <button className="w-full mt-2 py-2 bg-gold-500/20 text-gold-300 rounded-lg border border-gold-500/30 hover:bg-gold-500/30 transition-colors text-sm font-semibold">
                    Save Thesis Parameters
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileApp;
