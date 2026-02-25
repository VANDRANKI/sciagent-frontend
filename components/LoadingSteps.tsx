"use client";

interface LoadingStepsProps {
  message: string;
}

export default function LoadingSteps({ message }: LoadingStepsProps) {
  return (
    <div className="flex items-center gap-3 py-2 animate-fade-in">
      <div className="flex gap-1 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
      <p className="text-sm text-text-secondary leading-snug">{message}</p>
    </div>
  );
}
