import React, { useState, useEffect } from 'react';
import Onboarding from './Onboarding';
import { ThemeProvider, useTheme } from '../ThemeContext';

interface TraitScore {
  base_score: number;
  confidence_margin_of_error: number;
  justification: string;
}

function RadarAppInner({ userRole }: { userRole: 'investor' | 'founder' }) {
  const { colors } = useTheme();
  const [radarSignals, setRadarSignals] = useState<any[]>([]);
  const [availableInvestors, setAvailableInvestors] = useState<any[]>([]);
  const [equityOffer, setEquityOffer] = useState('');
  const [fundingNeed, setFundingNeed] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(`user_profile_${userRole}`);
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, [userRole]);

  const finalizeProfile = (data: any) => {
    setUserProfile(data);
    localStorage.setItem(`user_profile_${userRole}`, JSON.stringify(data));
    // Fire and forget sync to backend
    fetch('/api/user/profile', { method: 'POST', body: JSON.stringify(data) }).catch(() => {});
  };

  // Append new signals instead of replacing, and limit size to 500
  const handleNewSignals = (newSignals: any[]) => {
    setRadarSignals(prev => {
      const updated = [...newSignals, ...prev.filter(s => !newSignals.find(ns => (ns.id && ns.id === s.id) || (ns.timestamp && ns.timestamp === s.timestamp && !ns.id)))];
      return updated.slice(0, 500);
    });
  };

  // Load initial data from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`radar_cache_${userRole}`);
    if (savedData) {
      if (userRole === 'investor') {
        setRadarSignals(JSON.parse(savedData));
      } else {
        setAvailableInvestors(JSON.parse(savedData));
      }
    }
  }, [userRole]);

  // Update storage whenever signals change
  useEffect(() => {
    if (userRole === 'investor' && radarSignals.length > 0) {
      localStorage.setItem(`radar_cache_${userRole}`, JSON.stringify(radarSignals));
    }
  }, [radarSignals, userRole]);

  useEffect(() => {
    if (userRole === 'founder' && availableInvestors.length > 0) {
      localStorage.setItem(`radar_cache_${userRole}`, JSON.stringify(availableInvestors));
    }
  }, [availableInvestors, userRole]);

  // Initialize Real-Time Sync Loop
  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8000/api/ws/${userRole}`);
    setWs(socket);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (userRole === 'investor' && (payload.type === 'FOUNDER_BROADCAST' || payload.type === 'RADAR_STREAM_UPDATE' || payload.type === 'INIT_LIST')) {
        let newData = payload.data || payload;
        if (!Array.isArray(newData)) newData = [newData];
        handleNewSignals(newData);
      } else if (userRole === 'founder' && (payload.type === 'INVESTOR_RADAR_UPDATE' || payload.type === 'INIT_LIST')) {
        let newData = payload.data || payload;
        if (!Array.isArray(newData)) newData = [newData];
        setAvailableInvestors(prev => {
          const updated = [...newData, ...prev.filter(s => !newData.find(ns => (ns.id && ns.id === s.id)))];
          return updated.slice(0, 500);
        });
      }
    };

    return () => socket.close();
  }, [userRole]);

  // Robust Defensive Parsing to eliminate Frontend runtime structural crashes
  const renderConfidenceMetric = (metric: any) => {
    if (!metric) return <span className={`${colors.mutedText} font-mono text-xs`}>NOT DISCLOSED</span>;
    if (typeof metric === 'number') return <span className="font-mono">{metric}% (Legacy Metric)</span>;
    
    const { base_score, confidence_margin_of_error, justification } = metric as TraitScore;
    return (
      <div className="space-y-1">
        <div className={`font-mono text-sm font-bold ${colors.accent}`}>
          {base_score}% <span className={`text-xs ${colors.mutedText}`}>±{confidence_margin_of_error}%</span>
        </div>
        <div className={`text-xs ${colors.mutedText} italic`}>"{justification}"</div>
      </div>
    );
  };

  const handleFounderBroadcast = () => {
    if (ws && equityOffer && fundingNeed) {
      ws.send(JSON.stringify({
        companyName: userProfile?.name || "Discovered Candidate",
        fundingNeed,
        equityOffer,
        timestamp: new Date().toLocaleTimeString()
      }));
    }
  };

  if (!userProfile) {
    return <Onboarding onComplete={finalizeProfile} />;
  }

  return (
    <div className={`p-6 ${colors.bg} ${colors.text} min-h-screen font-sans selection:${colors.pulseBg} selection:text-black relative overflow-hidden transition-colors duration-700`}>
      <div className="radar-sweep-line" />
      
      {/* Top Banner Status Bar */}
      <div className={`flex justify-between items-center mb-6 border-b ${colors.border} pb-4 relative z-20`}>
        <div>
          <h1 className={`text-xl font-bold font-mono tracking-tight ${colors.text}`}>VC BRAIN // CORE RADAR FUNNEL</h1>
          <p className={`text-xs ${colors.mutedText}`}>Ultra-low latency parallel agent pipelines and live scrapers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${colors.pulseBg} animate-ping`} />
          <span className={`text-xs font-mono ${colors.accent} ${colors.panelBg} px-3 py-1 border ${colors.border} rounded ${colors.glow}`}>
            SYNC ENGINE ACTIVE // 1-SEC INTERVAL
          </span>
        </div>
      </div>

      {userRole === 'investor' ? (
        <div className="grid grid-cols-3 gap-6 relative z-20">
          {/* Left/Middle Column: High-Density Live Radar Signal Stream */}
          <div className="col-span-2 space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colors.mutedText} font-mono`}>Live Ingested Internet Footprints</h2>
            <div className={`space-y-2 max-h-[70vh] overflow-y-auto pr-2 border ${colors.border} p-3 ${colors.panelBg} rounded-lg custom-scrollbar`}>
              {radarSignals.length === 0 && (
                <div className={`text-sm ${colors.mutedText} font-mono p-4 text-center`}>Awaiting incoming data payloads from global scrapers...</div>
              )}
              {radarSignals.map((signal, idx) => (
                <div key={idx} className={`p-3 ${colors.bg} border ${colors.border} rounded transition-all hover:${colors.glow}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-mono ${colors.panelBg} ${colors.accent} px-2 py-0.5 rounded border ${colors.border}`}>LIVE FEED</span>
                    <span className={`text-xs ${colors.mutedText} font-mono`}>{signal.timestamp || "Just Now"}</span>
                  </div>
                  <p className={`text-sm ${colors.text} font-medium mt-2`}>
                    {signal.companyName || "Discovered Candidate"} Sourcing Metric Triggered
                  </p>
                  {signal.fundingNeed && (
                    <p className={`text-xs ${colors.accent} font-mono mt-1`}>
                      Seeking ${signal.fundingNeed} for {signal.equityOffer}% Equity Allocation
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Deep-Dive Insight Interface */}
          <div className={`${colors.panelBg} border ${colors.border} rounded-lg p-4 space-y-4`}>
            <h3 className={`text-xs font-bold font-mono uppercase ${colors.mutedText} tracking-wider`}>Parallelized Metric Isolation</h3>
            <div className={`border ${colors.border} p-3 ${colors.bg} rounded space-y-3`}>
              <div>
                <span className={`text-xs font-mono ${colors.mutedText} block mb-1`}>Execution Velocity</span>
                {renderConfidenceMetric({
                  base_score: 88,
                  confidence_margin_of_error: 8,
                  justification: "Synthesized via recent compressed code commits and rapid deployment telemetry."
                })}
              </div>
              <hr className={`${colors.border}`} />
              <div>
                <span className={`text-xs font-mono ${colors.mutedText} block mb-1`}>Resilience History</span>
                {renderConfidenceMetric(null)} {/* Verifying missing field handling */}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FOUNDER RADAR INTERFACE FRAMEWORK */
        <div className="grid grid-cols-3 gap-6 relative z-20">
          {/* Left Column: Instant Funding Equity Blast Control Panel */}
          <div className={`${colors.panelBg} border ${colors.border} rounded-lg p-4 space-y-4`}>
            <h2 className={`text-sm font-bold font-mono ${colors.text} uppercase tracking-wider`}>Broadcast Live Proposition</h2>
            <p className={`text-xs ${colors.mutedText}`}>Instantly update active investor radar components across the platform network grid.</p>
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-mono ${colors.mutedText} mb-1`}>Target Capital Request (USD)</label>
                <input 
                  type="number" 
                  value={fundingNeed} 
                  onChange={(e) => setFundingNeed(e.target.value)}
                  placeholder="e.g. 100000" 
                  className={`w-full ${colors.bg} border ${colors.border} rounded p-2 text-sm ${colors.text} focus:outline-none focus:border-opacity-100 font-mono`}
                />
              </div>
              <div>
                <label className={`block text-xs font-mono ${colors.mutedText} mb-1`}>Equity Percentage Allocation</label>
                <input 
                  type="number" 
                  value={equityOffer} 
                  onChange={(e) => setEquityOffer(e.target.value)}
                  placeholder="e.g. 7" 
                  className={`w-full ${colors.bg} border ${colors.border} rounded p-2 text-sm ${colors.text} focus:outline-none focus:border-opacity-100 font-mono`}
                />
              </div>
              <button 
                onClick={handleFounderBroadcast}
                className={`w-full ${colors.pulseBg} hover:opacity-80 font-mono text-black py-2 rounded text-xs tracking-wider transition-colors font-bold uppercase ${colors.glow}`}
              >
                Pulse Signal Matrix
              </button>
            </div>
          </div>

          {/* Right Column Grid: Active Sourcing Map for Capital Pools */}
          <div className="col-span-2 space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colors.mutedText} font-mono`}>Open Global Investment Radars</h2>
            <div className={`space-y-2 max-h-[70vh] overflow-y-auto border ${colors.border} p-3 ${colors.panelBg} rounded-lg custom-scrollbar`}>
              {availableInvestors.length === 0 && (
                <div className={`text-sm ${colors.mutedText} font-mono p-4 text-center`}>Scanning web networks for open active VC funds matching parameters...</div>
              )}
              {availableInvestors.map((inv, idx) => (
                <div key={idx} className={`p-3 ${colors.bg} border ${colors.border} rounded flex justify-between items-center transition-all hover:${colors.glow}`}>
                  <div>
                    <h4 className={`text-sm font-bold ${colors.text} font-mono`}>{inv.name}</h4>
                    <p className={`text-xs ${colors.mutedText} font-mono mt-0.5`}>Target Ticket: {inv.ticketSize} // Core Sectors: {inv.sectors}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 ${colors.panelBg} ${colors.accent} border ${colors.border} rounded font-mono font-bold`}>MATCH FOUND</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegratedRadarApp({ userRole }: { userRole: 'investor' | 'founder' }) {
  return (
    <ThemeProvider initialTheme={userRole === 'investor' ? 'investor' : 'founder'}>
      <RadarAppInner userRole={userRole} />
    </ThemeProvider>
  );
}
