// Hardcoded Indian demo data — investors, founders, pitch decks

export interface DemoInvestor {
  id: string;
  name: string;
  firm: string;
  role: string;
  bio: string;
  sectors: string[];
  stages: string[];
  geographies: string[];
  checkMin: number;
  checkMax: number;
  portfolioCount: number;
  avatar: string;
}

export interface DemoFounder {
  id: string;
  name: string;
  company: string;
  role: string;
  bio: string;
  sector: string;
  stage: string;
  raising: number;
  equity: string;
  location: string;
  avatar: string;
}

export interface PitchDeck {
  id: string;
  founderId: string;
  founderName: string;
  company: string;
  tagline: string;
  sector: string;
  stage: string;
  raising: number;
  description: string;
  traction: string;
  deckUrl?: string;
  submittedAt: string;
}

export const DEMO_INVESTORS: DemoInvestor[] = [
  {
    id: 'inv_001',
    name: 'Rajan Anand',
    firm: 'Sequoia Capital India',
    role: 'Managing Director',
    bio: 'Led 60+ early-stage deals across India & SEA in AI, SaaS, and fintech. Former founder of two B2B startups (both acquired). Thesis: India is the world\'s next software exporter.',
    sectors: ['AI Infrastructure', 'Enterprise SaaS', 'Fintech'],
    stages: ['Pre-Seed', 'Seed'],
    geographies: ['India', 'South-East Asia'],
    checkMin: 50000,
    checkMax: 500000,
    portfolioCount: 61,
    avatar: 'RA',
  },
  {
    id: 'inv_002',
    name: 'Kavitha Subramaniam',
    firm: 'Accel Partners India',
    role: 'Partner',
    bio: 'Accel India partner with a focus on developer tools and bottom-up SaaS. Previously at Freshworks as VP Product. Strong network across YC India and IIT alumni founders.',
    sectors: ['Developer Tools', 'Enterprise SaaS', 'EdTech'],
    stages: ['Seed', 'Series A'],
    geographies: ['India', 'North America'],
    checkMin: 200000,
    checkMax: 1500000,
    portfolioCount: 34,
    avatar: 'KS',
  },
  {
    id: 'inv_003',
    name: 'Vikram Doshi',
    firm: 'Peak XV Partners',
    role: 'Principal',
    bio: 'Investing in HealthTech and Climate solutions out of Peak XV (formerly Sequoia India). PhD in biomedical engineering from IISc. Passionate about founder-market fit in regulated industries.',
    sectors: ['HealthTech', 'Climate Tech', 'BioTech'],
    stages: ['Seed', 'Series A'],
    geographies: ['India', 'Europe'],
    checkMin: 100000,
    checkMax: 1000000,
    portfolioCount: 22,
    avatar: 'VD',
  },
  {
    id: 'inv_004',
    name: 'Nandita Krishnamurthy',
    firm: 'Blume Ventures',
    role: 'General Partner',
    bio: 'Blume GP writing first cheques into pre-seed Indian founders. Former IAS officer turned VC. Special focus on GovTech, Rural Fintech, and mission-driven startups.',
    sectors: ['Fintech', 'GovTech', 'AgriTech'],
    stages: ['Pre-Seed', 'Seed'],
    geographies: ['India'],
    checkMin: 25000,
    checkMax: 250000,
    portfolioCount: 48,
    avatar: 'NK',
  },
  {
    id: 'inv_005',
    name: 'Aryan Malhotra',
    firm: 'Matrix Partners India',
    role: 'Partner',
    bio: 'Matrix India partner backing consumer-tech and AI-native products. Previously founder of an ed-tech startup (2M+ users). Loves teams with deep domain expertise and strong distribution insights.',
    sectors: ['AI Infrastructure', 'EdTech', 'Consumer Tech'],
    stages: ['Seed', 'Series A'],
    geographies: ['India', 'Global'],
    checkMin: 500000,
    checkMax: 3000000,
    portfolioCount: 29,
    avatar: 'AM',
  },
];

export const DEMO_FOUNDERS: DemoFounder[] = [
  {
    id: 'fnd_001',
    name: 'Priya Iyer',
    company: 'NeuralFlow',
    role: 'CEO & Co-Founder',
    bio: 'Ex-Google Brain researcher (Bangalore). NeuralFlow reduces AI inference cost by 10x on edge devices. Team of 5, 2 patents filed at IIT Madras.',
    sector: 'AI Infrastructure',
    stage: 'Seed',
    raising: 800000,
    equity: '8%',
    location: 'Bengaluru, Karnataka',
    avatar: 'PI',
  },
  {
    id: 'fnd_002',
    name: 'Sahil Gupta',
    company: 'GreenGrid',
    role: 'Founder & CTO',
    bio: 'Climate engineer and IIT Delhi alumnus. GreenGrid is a B2B carbon credit marketplace for Indian SMBs — ₹1Cr ARR in month 6, 3 enterprise pilots with Tata and Mahindra.',
    sector: 'Climate Tech',
    stage: 'Pre-Seed',
    raising: 300000,
    equity: '10%',
    location: 'Delhi, NCR',
    avatar: 'SG',
  },
  {
    id: 'fnd_003',
    name: 'Meera Nair',
    company: 'PaySwift',
    role: 'CEO',
    bio: 'Serial fintech founder (1 exit to PhonePe). PaySwift enables cross-border payments for Indian SMBs in under 30 seconds — ₹15Cr GMV in 90 days. RBI licensed.',
    sector: 'Fintech',
    stage: 'Seed',
    raising: 1200000,
    equity: '7%',
    location: 'Mumbai, Maharashtra',
    avatar: 'MN',
  },
  {
    id: 'fnd_004',
    name: 'Aditya Shankar',
    company: 'MedBrief AI',
    role: 'Co-Founder & CEO',
    bio: 'MBBS + ML (IIT Bombay). MedBrief auto-summarises clinical notes in Hindi & English — saves doctors 2hrs/day. Deployed at AIIMS Delhi (pilot), NABH compliant.',
    sector: 'HealthTech',
    stage: 'Pre-Seed',
    raising: 500000,
    equity: '9%',
    location: 'Hyderabad, Telangana',
    avatar: 'AS',
  },
  {
    id: 'fnd_005',
    name: 'Divya Menon',
    company: 'CodeLens',
    role: 'Founder & CEO',
    bio: 'Ex-Atlassian engineer (Pune). CodeLens is an AI code review copilot that understands your entire codebase — 350 early-access signups, $0 CAC, used by 3 Indian unicorns internally.',
    sector: 'Developer Tools',
    stage: 'Seed',
    raising: 600000,
    equity: '8%',
    location: 'Pune, Maharashtra',
    avatar: 'DM',
  },
];

export const DEMO_PITCH_DECKS: PitchDeck[] = [
  {
    id: 'deck_001',
    founderId: 'fnd_001',
    founderName: 'Priya Iyer',
    company: 'NeuralFlow',
    tagline: 'AI inference 10x cheaper, 5x faster on edge devices',
    sector: 'AI Infrastructure',
    stage: 'Seed',
    raising: 800000,
    description: 'NeuralFlow is a compiler + runtime stack that quantises and fuses neural network layers at deploy time. We achieve 10x cost reduction and 5x latency improvement over baseline PyTorch on commodity hardware — no GPU required.',
    traction: '₹1Cr ARR · 4 enterprise pilots · 2 patents filed',
    deckUrl: '#',
    submittedAt: '2026-07-15T10:30:00Z',
  },
  {
    id: 'deck_002',
    founderId: 'fnd_002',
    founderName: 'Sahil Gupta',
    company: 'GreenGrid',
    tagline: 'The carbon credit marketplace built for Indian SMBs',
    sector: 'Climate Tech',
    stage: 'Pre-Seed',
    raising: 300000,
    description: 'GreenGrid makes it dead-simple for small Indian businesses to buy, track, and retire verified carbon credits. We abstract away the complexity of legacy UNFCCC registries and provide real-time Scope 1/2/3 reporting for compliance.',
    traction: '₹1Cr ARR · Tata & Mahindra pilots · Month 6',
    deckUrl: '#',
    submittedAt: '2026-07-16T14:00:00Z',
  },
  {
    id: 'deck_003',
    founderId: 'fnd_004',
    founderName: 'Aditya Shankar',
    company: 'MedBrief AI',
    tagline: 'Saving Indian doctors 2 hours per day with AI clinical summaries',
    sector: 'HealthTech',
    stage: 'Pre-Seed',
    raising: 500000,
    description: 'MedBrief AI ingests EHR data from Practo, Apollo, and AIIMS systems and generates structured clinical summaries in Hindi and English in seconds. NABH compliant with on-prem deployment options.',
    traction: 'AIIMS Delhi pilot · NABH compliant · IIT Bombay + MBBS team',
    deckUrl: '#',
    submittedAt: '2026-07-17T09:15:00Z',
  },
];

// Sourcing signals demo data
export const DEMO_SIGNALS = [
  {
    id: 'sig_001',
    source: 'github',
    signal_type: 'trending_repo',
    title: 'NeuralFlow — Edge AI Inference Engine',
    description: 'Priya Iyer\'s open-source edge inference engine trending #3 on GitHub India. 1.2k stars in 48 hours. Python + Rust. Active issues from NVIDIA engineers.',
    url: 'https://github.com',
    strength: 0.92,
    discovered_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sig_002',
    source: 'producthunt',
    signal_type: 'new_launch',
    title: 'CodeLens — AI Code Review for Indian Teams',
    description: 'Divya Menon launched CodeLens on ProductHunt. #2 Product of the Day. 800+ upvotes. Comments from Razorpay, Zepto, and CRED engineering leads.',
    url: 'https://producthunt.com',
    strength: 0.88,
    discovered_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'sig_003',
    source: 'devpost',
    signal_type: 'hackathon_winner',
    title: 'GreenGrid — Smart India Hackathon 2026 Winner',
    description: 'Sahil Gupta\'s team won the ₹25L Smart India Hackathon prize in the Climate track. MoU signed with MoEF. Team of 4 IIT Delhi engineers.',
    url: 'https://devpost.com',
    strength: 0.85,
    discovered_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'sig_004',
    source: 'arxiv',
    signal_type: 'research_paper',
    title: 'MedBrief: Multilingual Clinical NLP for Low-Resource Settings',
    description: 'Aditya Shankar co-authored a paper on Hindi medical NLP. 40 citations in 2 weeks. Featured in Nature Digital Medicine. AIIMS collaboration confirmed.',
    url: 'https://arxiv.org',
    strength: 0.79,
    discovered_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'sig_005',
    source: 'twitter',
    signal_type: 'viral_thread',
    title: 'PaySwift — Meera Nair thread on cross-border payments goes viral',
    description: 'Thread explaining how PaySwift cuts international transfer fees from 3% to 0.2% for Indian exporters. 8.4k retweets. Replied to by RBI DG account.',
    url: 'https://twitter.com',
    strength: 0.83,
    discovered_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

// Traction KPIs
export const DEMO_KPI_CARDS = [
  { label: 'AUM Deployed', value: '₹42Cr', delta: '+₹8Cr this quarter', deltaDir: 'up' as const, color: 'text-amber-400' },
  { label: 'Active Portfolio', value: '14', delta: '+3 new investments', deltaDir: 'up' as const, color: 'text-blue-400' },
  { label: 'Avg. Check Size', value: '₹3Cr', delta: 'Seed stage', deltaDir: 'flat' as const, color: 'text-purple-400' },
  { label: 'Portfolio IRR', value: '34%', delta: '+6% vs last year', deltaDir: 'up' as const, color: 'text-green-400' },
  { label: 'Deals Reviewed', value: '287', delta: 'This year', deltaDir: 'flat' as const, color: 'text-cyan-400' },
  { label: 'Pass Rate', value: '94.8%', delta: 'Top 5% accepted', deltaDir: 'up' as const, color: 'text-rose-400' },
];

// Pipeline scores
export const DEMO_PIPELINE = [
  { id: 'p1', company: 'NeuralFlow', sector: 'AI Infrastructure', stage: 'Seed', founder_score: 91, market_score: 88, idea_score: 85, recommendation: 'deploy', thesis_alignment: 94, founder_trend: 'rising' },
  { id: 'p2', company: 'PaySwift', sector: 'Fintech', stage: 'Seed', founder_score: 87, market_score: 82, idea_score: 79, recommendation: 'diligence', thesis_alignment: 81, founder_trend: 'rising' },
  { id: 'p3', company: 'MedBrief AI', sector: 'HealthTech', stage: 'Pre-Seed', founder_score: 83, market_score: 76, idea_score: 81, recommendation: 'diligence', thesis_alignment: 78, founder_trend: 'stable' },
  { id: 'p4', company: 'GreenGrid', sector: 'Climate Tech', stage: 'Pre-Seed', founder_score: 78, market_score: 85, idea_score: 74, recommendation: 'watch', thesis_alignment: 72, founder_trend: 'stable' },
  { id: 'p5', company: 'CodeLens', sector: 'Developer Tools', stage: 'Seed', founder_score: 89, market_score: 80, idea_score: 88, recommendation: 'deploy', thesis_alignment: 90, founder_trend: 'rising' },
];
