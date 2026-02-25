import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SciAgent - Multi-Agent Research Paper Analyzer",
  description:
    "Upload any research paper PDF and ask questions. Six specialized AI agents collaborate to deliver grounded, cited answers using Agentic RAG.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-base text-text-primary antialiased">{children}</body>
    </html>
  );
}
