"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import AgentPipeline from "@/components/AgentPipeline";
import ChatDisplay from "@/components/ChatDisplay";
import LoadingSteps from "@/components/LoadingSteps";
import CavemanLoader from "@/components/CavemanLoader";
import { analyzeStream } from "@/lib/api";
import { AGENTS, AgentStates, AgentName } from "@/lib/types";

function buildInitialAgentStates(): AgentStates {
  const states: AgentStates = {};
  AGENTS.forEach((a) => (states[a.name] = "pending"));
  return states;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentStatusMsg, setCurrentStatusMsg] = useState("");
  const [agentStates, setAgentStates] = useState<AgentStates>(buildInitialAgentStates());
  const [agentMessages, setAgentMessages] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");

  const resetState = () => {
    setAnswer("");
    setErrorMessage("");
    setCurrentStatusMsg("");
    setAgentStates(buildInitialAgentStates());
    setAgentMessages({});
    setSessionId("");
  };

  const setAgentActive = (name: AgentName, message: string) => {
    setAgentStates((prev) => ({ ...prev, [name]: "active" }));
    setAgentMessages((prev) => ({ ...prev, [name]: message }));
    setCurrentStatusMsg(message);
  };

  const setAgentDone = (name: AgentName, message?: string) => {
    setAgentStates((prev) => ({ ...prev, [name]: "done" }));
    if (message) setAgentMessages((prev) => ({ ...prev, [name]: message }));
  };

  const setAgentError = (name: AgentName) => {
    setAgentStates((prev) => ({ ...prev, [name]: "error" }));
  };

  const handleAnalyze = async () => {
    if (!file || !question.trim() || isLoading) return;
    resetState();
    setIsLoading(true);

    try {
      for await (const event of analyzeStream(file, question.trim())) {
        if (event.type === "status" && event.agent) {
          const agentName = event.agent as AgentName;
          const msg = event.message ?? "";
          if (event.done) {
            setAgentDone(agentName, msg);
          } else {
            setAgentActive(agentName, msg);
          }
        } else if (event.type === "answer") {
          setAgentStates((prev) => {
            const next = { ...prev };
            AGENTS.forEach((a) => {
              if (next[a.name] === "active") next[a.name] = "done";
            });
            next["synthesizer"] = "done";
            return next;
          });
          setCurrentStatusMsg("");
          setAnswer(event.content ?? "");
          if (event.session_id) setSessionId(event.session_id);
        } else if (event.type === "error") {
          setErrorMessage(event.message ?? "An unexpected error occurred.");
          setAgentStates((prev) => {
            const next = { ...prev };
            AGENTS.forEach((a) => {
              if (next[a.name] === "active") next[a.name] = "error";
            });
            return next;
          });
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error. Check your connection.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setCurrentStatusMsg("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isLoading) {
      handleAnalyze();
    }
  };

  const canSubmit = !!file && question.trim().length > 0 && !isLoading;
  const showPipeline =
    isLoading || Object.values(agentStates).some((s) => s !== "pending");

  return (
    <div className="min-h-screen bg-base grid-bg">

      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold gradient-text tracking-tight">
              SciAgent
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Multi-Agent Research Paper Analyzer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-text-secondary px-2.5 py-1 rounded-full border border-border bg-card">
              Agentic RAG
            </span>
            <span className="hidden sm:inline-block text-xs text-text-secondary px-2.5 py-1 rounded-full border border-border bg-card">
              6 Agents
            </span>
          </div>
        </div>
      </header>

      {/*
        3-item grid for correct mobile ordering:
          Desktop: 2-col left (input + how-it-works), 3-col right (output spanning both rows)
          Mobile:  input first -> output second -> how-it-works last
      */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:items-start">

          {/* 1 - Input form */}
          <div className="lg:col-span-2 lg:row-start-1 order-1 flex flex-col gap-4">
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card flex flex-col gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                  Research Paper
                </label>
                <FileUpload onFileSelect={setFile} disabled={isLoading} />
              </div>

              <div>
                <label
                  htmlFor="question"
                  className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2"
                >
                  Your Question
                </label>
                <textarea
                  id="question"
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="What methodology did the authors use to evaluate their model?"
                  className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-text-primary placeholder-text-muted transition-all duration-150 focus:border-accent-primary focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1.5">Ctrl+Enter to submit</p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!canSubmit}
                className={[
                  "w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-base",
                  canSubmit
                    ? "bg-accent-primary hover:bg-accent-hover text-white active:scale-[0.98]"
                    : "bg-card border border-border text-text-muted cursor-not-allowed",
                ].join(" ")}
              >
                {isLoading ? "Analyzing..." : "Analyze Paper"}
              </button>
            </div>
          </div>

          {/* 2 - Pipeline + Answer (spans both grid rows on desktop) */}
          <div className="lg:col-span-3 lg:row-start-1 lg:row-span-2 lg:col-start-3 order-2 flex flex-col gap-4">

            {showPipeline && (
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card">
                <AgentPipeline
                  agentStates={agentStates}
                  agentMessages={agentMessages}
                />
                {isLoading && currentStatusMsg && (
                  <div className="mt-3">
                    <LoadingSteps message={currentStatusMsg} />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="bg-error-bg border border-error rounded-2xl p-4 animate-fade-in">
                <p className="text-sm font-semibold text-error mb-1">Analysis failed</p>
                <p className="text-xs text-text-secondary leading-relaxed">{errorMessage}</p>
                <p className="text-xs text-text-muted mt-2">
                  If the HuggingFace Space is cold-starting, wait 1-2 minutes and try again.
                </p>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card flex-1 min-h-[260px] sm:min-h-[320px]">
              {isLoading && !answer && (
                <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 py-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s`, animationDuration: "0.9s" }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-text-muted">Agents are working on your question...</p>
                  <CavemanLoader isActive={isLoading && !answer} />
                </div>
              )}
              <ChatDisplay answer={answer} />
            </div>

            {sessionId && (
              <p className="text-xs text-text-muted text-right animate-fade-in">
                Session: {sessionId}
              </p>
            )}
          </div>

          {/* 3 - How It Works (last on mobile, bottom-left on desktop) */}
          <div className="lg:col-span-2 lg:row-start-2 order-3">
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                How It Works
              </p>
              <ol className="flex flex-col gap-2.5">
                {AGENTS.map((agent) => (
                  <li key={agent.name} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-muted border border-accent-primary/30 text-accent-glow text-xs flex items-center justify-center font-bold mt-0.5">
                      {agent.step}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{agent.label}</span>
                      <p className="text-xs text-text-muted leading-snug mt-0.5">{agent.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-border mt-12 sm:mt-16 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-text-muted text-center leading-relaxed">
            SciAgent uses smolagents, ChromaDB, and HuggingFace Inference to analyze research papers.
            All processing is grounded exclusively in the uploaded paper.
          </p>
        </div>
      </footer>
    </div>
  );
}
