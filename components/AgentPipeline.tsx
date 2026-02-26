"use client";

import { AGENTS, AgentStates } from "@/lib/types";

interface AgentPipelineProps {
  agentStates: AgentStates;
  agentMessages: Record<string, string>;
}

const statusColors: Record<string, string> = {
  pending: "border-border bg-base text-text-muted",
  active:  "border-accent-primary bg-accent-muted text-text-primary animate-glow-pulse",
  done:    "border-success bg-success-bg text-success",
  error:   "border-error bg-error-bg text-error",
};

const statusDotColors: Record<string, string> = {
  pending: "bg-border",
  active:  "bg-accent-primary animate-pulse-slow",
  done:    "bg-success",
  error:   "bg-error",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
        statusDotColors[status] ?? statusDotColors.pending
      }`}
    />
  );
}

function Arrow({ active }: { active: boolean }) {
  return (
    <div
      className={`flex-shrink-0 transition-colors duration-500 ${
        active ? "text-accent-primary" : "text-border"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function AgentPipeline({ agentStates, agentMessages }: AgentPipelineProps) {
  if (Object.values(agentStates).every((s) => s === "pending")) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
        Agent Pipeline
      </p>

      {/*
        Mobile: overflow-x-auto with min-w-max forces horizontal scroll.
        Desktop (lg): min-w-0 lets the flex container shrink and fit naturally.
        The negative margins on mobile extend the scroll area to card edges.
      */}
      <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5 pipeline-scroll">
        <div className="flex items-center gap-1.5 min-w-max lg:min-w-0 pb-1">
          {AGENTS.map((agent, idx) => {
            const status = agentStates[agent.name] ?? "pending";
            const message = agentMessages[agent.name] ?? agent.description;
            const isLast = idx === AGENTS.length - 1;

            return (
              <div key={agent.name} className="flex items-center gap-1.5">
                <div
                  className={[
                    "flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all duration-300 w-[120px] sm:w-[130px] lg:w-auto lg:flex-1",
                    statusColors[status] ?? statusColors.pending,
                  ].join(" ")}
                >
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={status} />
                    <span className="text-xs font-semibold leading-tight truncate">
                      {agent.label}
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-text-secondary line-clamp-2">
                    {status === "active" || status === "done" ? message : agent.description}
                  </p>
                </div>
                {!isLast && (
                  <Arrow active={status === "done" || status === "active"} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
