# Agent Details & Data Pipelines

Cognis employs parallel AI agents and sourcing pipelines to ingest and score data at scale.

## Pipeline Architecture

```text
+-------------------+        +--------------------+        +---------------------+
| External Sources  | -----> | Discovery Agents   | -----> | Raw Ingest Queue    |
| (GitHub, X, Web)  |        | (Scrapers, Hooks)  |        | (Supabase/Memory)   |
+-------------------+        +--------------------+        +---------------------+
                                                                     |
                                                                     v
+-------------------+        +--------------------+        +---------------------+
| Client Feed       | <----- | Scoring Agents     | <----- | Pipeline Processor  |
| (React App)       |        | (LLMs, Heuristics) |        | (FastAPI Worker)    |
+-------------------+        +--------------------+        +---------------------+
```

## Agent Responsibilities
1. **Discovery Agents:** Responsible for identifying breakout repositories, stealth startup domain registrations, and viral founder tweets.
2. **Scoring Agents:** Once a signal is ingested, these agents dynamically evaluate "Execution Velocity" and "Resilience History" against the investor's configured thesis alignment.
3. **Synthesis Agents:** Responsible for extracting key metrics (Funding Needs, Equity Profiles, Tech Stacks) and standardizing them into a structured Pydantic model for frontend consumption.

## Background Data Synchronization
The frontend ensures visual persistence of this pipeline activity by doing two things:
1. Emitting background `setInterval` polling requests every 15 seconds.
2. Generating real-time synthetic data payloads directly on the client if the backend queues run dry, maintaining a high-fidelity continuous sourcing illusion for demonstration.
