import { NextRequest } from "next/server";

const HF_SPACE_URL = process.env.HF_SPACE_URL;

/**
 * Proxies the analysis request to the HuggingFace Gradio 5 backend.
 *
 * Gradio 5 API (3 steps):
 * 1. Upload the PDF to /gradio_api/upload
 * 2. Call /gradio_api/call/analyze to get an event_id (returns immediately)
 * 3. Poll /gradio_api/call/analyze/{event_id} for the SSE result stream
 *
 * Fake SSE status events are streamed to the frontend during processing
 * so the agent pipeline shows progress.
 */
export async function POST(request: NextRequest) {
  if (!HF_SPACE_URL) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "HF_SPACE_URL is not configured." })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid form data." })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const pdf = formData.get("pdf") as File | null;
  const question = formData.get("question") as string | null;

  if (!pdf || !question) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "PDF and question are required." })}\n\n`,
      { status: 200, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      try {
        // Step 1: Upload the PDF to Gradio's upload endpoint
        send({
          type: "status",
          agent: "ingestion",
          message: "Uploading PDF to backend...",
          step: 1,
        });

        const uploadForm = new FormData();
        uploadForm.append("files", pdf, pdf.name);

        let uploadedPaths: string[];
        try {
          const uploadRes = await fetch(`${HF_SPACE_URL}/gradio_api/upload`, {
            method: "POST",
            body: uploadForm,
          });
          if (!uploadRes.ok) {
            throw new Error(
              `Upload failed with status ${uploadRes.status}. ` +
                "The Space may be starting up - please wait 1-2 minutes and try again."
            );
          }
          uploadedPaths = await uploadRes.json();
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "Could not reach the backend. The Space may be cold-starting.",
          });
          controller.close();
          return;
        }

        const pdfPath = uploadedPaths[0];

        send({
          type: "status",
          agent: "ingestion",
          message: "PDF uploaded. Parsing and indexing...",
          step: 1,
          done: false,
        });

        // Step 2: Kick off the Gradio 5 call - returns an event_id immediately
        let eventId: string;
        try {
          const callRes = await fetch(
            `${HF_SPACE_URL}/gradio_api/call/analyze`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: [
                  { path: pdfPath, orig_name: pdf.name, size: pdf.size },
                  question,
                ],
              }),
            }
          );

          if (!callRes.ok) {
            throw new Error(
              `Analysis backend returned status ${callRes.status}.`
            );
          }

          const callResult = await callRes.json();
          eventId = callResult.event_id;
          if (!eventId) {
            throw new Error("No event_id returned from backend.");
          }
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error ? err.message : "Analysis request failed.",
          });
          controller.close();
          return;
        }

        // Stream fake status events while the backend processes in the background
        await delay(600);
        send({
          type: "status",
          agent: "planner",
          message: "Orchestrating analysis pipeline...",
          step: 2,
        });

        await delay(500);
        send({
          type: "status",
          agent: "retriever",
          message: "Retrieving relevant passages with hybrid search...",
          step: 3,
        });

        await delay(500);
        send({
          type: "status",
          agent: "analyzer",
          message: "Extracting findings, methodology, and data points...",
          step: 4,
        });

        await delay(500);
        send({
          type: "status",
          agent: "critic",
          message: "Fact-checking every claim against source text...",
          step: 5,
        });

        await delay(400);
        send({
          type: "status",
          agent: "synthesizer",
          message: "Synthesizing the final cited answer...",
          step: 6,
        });

        // Step 3: Poll the Gradio 5 event SSE stream for the final result
        let answer: string;
        try {
          const pollRes = await fetch(
            `${HF_SPACE_URL}/gradio_api/call/analyze/${eventId}`
          );
          if (!pollRes.ok || !pollRes.body) {
            throw new Error(`Poll failed with status ${pollRes.status}.`);
          }

          const reader = pollRes.body.getReader();
          const textDecoder = new TextDecoder();
          let buffer = "";
          let lastEvent = "";
          answer = "";

          outer: while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += textDecoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                lastEvent = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                const rawData = line.slice(6).trim();
                if (lastEvent === "complete") {
                  const parsed = JSON.parse(rawData);
                  answer = Array.isArray(parsed) ? parsed[0] : String(parsed);
                  break outer;
                } else if (lastEvent === "error") {
                  throw new Error(
                    rawData !== "null"
                      ? `Backend error: ${rawData}`
                      : "An error occurred in the analysis pipeline."
                  );
                }
              }
            }
          }

          if (!answer) {
            answer = "No answer was returned from the backend.";
          }
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error ? err.message : "Analysis polling failed.",
          });
          controller.close();
          return;
        }

        send({
          type: "answer",
          content: answer,
        });
      } catch (err) {
        send({
          type: "error",
          message:
            err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
