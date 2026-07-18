import React from "react";

const ProfileApp = () => {
  return (
    <div className="p-6 text-white h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gold-400">User Profile</h2>
      <div className="glass-panel p-4 rounded-xl flex-1">
        <p className="text-white/70">Welcome to your Conviction Profile.</p>
        <p className="mt-2 text-sm text-white/50">This module allows you to define your thesis and whether you are a Founder or Investor.</p>
      </div>
    </div>
  );
};

export default ProfileApp;
