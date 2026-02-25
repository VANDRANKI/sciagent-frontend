"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

interface ChatDisplayProps {
  answer: string;
}

export default function ChatDisplay({ answer }: ChatDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (!answer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted text-sm gap-3">
        <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <p className="text-center max-w-xs leading-relaxed">
          Upload a PDF and ask a question. The analysis will appear here with inline citations.
        </p>
      </div>
    );
  }

  return (
    <div className="relative animate-slide-up">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-bright transition-all duration-150"
      >
        {copied ? "Copied" : "Copy"}
      </button>

      <div className="prose prose-invert prose-sm max-w-none pr-20">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-text-primary border-b border-border pb-1 mt-5 mb-3">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-accent-glow mt-4 mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm leading-relaxed text-text-primary mb-3">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-sm text-text-primary space-y-1 mb-3 pl-4 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="text-sm text-text-primary space-y-1 mb-3 pl-4 list-decimal">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-text-primary">{children}</strong>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <code className="block bg-card border border-border rounded-lg p-3 text-xs font-mono text-accent-glow overflow-x-auto">
                    {children}
                  </code>
                );
              }
              // Inline citation highlight: [Chunk N, Page P]
              const text = String(children);
              if (/^\[Chunk \d+/.test(text)) {
                return (
                  <span className="inline-block px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-glow text-xs font-mono border border-accent-primary/30">
                    {text}
                  </span>
                );
              }
              return (
                <code className="px-1.5 py-0.5 rounded bg-card border border-border text-xs font-mono text-accent-glow">
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-accent-primary/50 pl-4 italic text-text-secondary my-3">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="text-xs text-text-primary border-collapse w-full">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border px-3 py-2 bg-card font-semibold text-left">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-1.5">{children}</td>
            ),
          }}
        >
          {answer}
        </ReactMarkdown>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-text-muted">
          Citations in the format [Chunk N, Page P] reference specific passages from the uploaded paper.
        </p>
      </div>
    </div>
  );
}
