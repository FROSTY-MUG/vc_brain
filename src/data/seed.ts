// =============================================
// VC Brain — Data Types & Empty Stores
// =============================================
// All mock data has been removed. 
// Data is now fetched live from the FastAPI/Supabase backend.
// =============================================

export interface Application {
  id: string;
  startup_id: string;
  source_type: string;
  status: string;
  submitted_at: string;
  startups?: {
    name: string;
    website: string;
    sector: string;
    stage: string;
  };
}

export const applications: Application[] = [];
export const outboundSignals = [];
export const demoThesis = null;
