import { StreamEvent } from "./types";

/**
 * Sends the PDF and question to the Next.js API proxy route and yields
 * parsed StreamEvent objects as they arrive via Server-Sent Events.
 *
 * Usage:
 *   for await (const event of analyzeStream(file, question)) {
 *     // handle event
 *   }
 */
export async function* analyzeStream(
  file: File,
  question: string
): AsyncGenerator<StreamEvent> {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("question", question);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok || !response.body) {
    yield {
      type: "error",
      message: `Request failed with status ${response.status}. Check that the backend is running.`,
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;

      const raw = line.slice("data: ".length).trim();
      if (!raw) continue;

      try {
        const event: StreamEvent = JSON.parse(raw);
        yield event;
      } catch {
        // Skip malformed SSE lines
      }
    }
  }
}
