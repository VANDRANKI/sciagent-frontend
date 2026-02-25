export type AgentName =
  | "ingestion"
  | "planner"
  | "retriever"
  | "analyzer"
  | "critic"
  | "synthesizer";

export type AgentStatus = "pending" | "active" | "done" | "error";

export interface AgentInfo {
  name: AgentName;
  label: string;
  description: string;
  step: number;
}

export interface AgentStates {
  [key: string]: AgentStatus;
}

export interface StreamEvent {
  type: "status" | "answer" | "error";
  agent?: AgentName;
  message?: string;
  step?: number;
  done?: boolean;
  content?: string;
  session_id?: string;
}

export interface AnalysisState {
  status: "idle" | "loading" | "done" | "error";
  agentStates: AgentStates;
  agentMessages: Record<string, string>;
  answer: string;
  errorMessage: string;
  sessionId: string;
}

export const AGENTS: AgentInfo[] = [
  {
    name: "ingestion",
    label: "Ingestion",
    description: "Parses PDF, chunks text, and builds the vector index.",
    step: 1,
  },
  {
    name: "planner",
    label: "Planner",
    description: "Orchestrates the full pipeline and manages agent calls.",
    step: 2,
  },
  {
    name: "retriever",
    label: "Retriever",
    description: "Finds relevant passages using hybrid semantic + keyword search.",
    step: 3,
  },
  {
    name: "analyzer",
    label: "Analyzer",
    description: "Extracts findings, methodology, data points, and limitations.",
    step: 4,
  },
  {
    name: "critic",
    label: "Critic",
    description: "Fact-checks every claim against the source passages.",
    step: 5,
  },
  {
    name: "synthesizer",
    label: "Synthesizer",
    description: "Produces the final cited answer with [Chunk N, Page P] references.",
    step: 6,
  },
];
