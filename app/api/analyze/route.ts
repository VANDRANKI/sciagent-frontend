import { NextRequest } from "next/server";

const HF_SPACE_URL = process.env.HF_SPACE_URL;

/**
 * Proxies the analysis request to the HuggingFace backend.
 *
 * The backend exposes a plain FastAPI endpoint at POST /api/analyze that
 * accepts multipart/form-data (pdf + question) and returns JSON:
 *   {"answer": "...", "session_id": "..."}  on success
 *   {"error":  "..."}                        on failure
 *
 * This route wraps that single request in an SSE stream so the frontend can
 * show agent-pipeline progress while the backend is processing.
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

      // Heartbeat to keep the SSE connection alive during long analyses.
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      const startHeartbeat = () => {
        heartbeatTimer = setInterval(() => {
          try {
            send({ type: "heartbeat" });
          } catch {
            /* stream already closed */
          }
        }, 15_000);
      };
      const stopHeartbeat = () => {
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      };

      try {
        // Build the multipart payload for /api/analyze
        const backendForm = new FormData();
        backendForm.append("pdf", pdf, pdf.name);
        backendForm.append("question", question);

        // Fire the backend request immediately (do not await yet).
        // The pipeline can take 60–120 s; we stream fake progress in parallel.
        const analyzePromise = fetch(`${HF_SPACE_URL}/api/analyze`, {
          method: "POST",
          body: backendForm,
          // 5-minute hard timeout — enough for the full 6-agent pipeline.
          signal: AbortSignal.timeout(300_000),
        });

        // ----------------------------------------------------------------
        // Stream fake progress events while the backend processes the paper.
        // ----------------------------------------------------------------
        send({
          type: "status",
          agent: "ingestion",
          message: "Uploading and parsing PDF...",
          step: 1,
        });

        await delay(800);
        send({
          type: "status",
          agent: "ingestion",
          message: "Chunking and indexing with embeddings...",
          step: 1,
          done: false,
        });

        await delay(700);
        send({
          type: "status",
          agent: "planner",
          message: "Orchestrating analysis pipeline...",
          step: 2,
        });

        await delay(600);
        send({
          type: "status",
          agent: "retriever",
          message: "Retrieving relevant passages with hybrid search...",
          step: 3,
        });

        await delay(600);
        send({
          type: "status",
          agent: "analyzer",
          message: "Extracting findings, methodology, and data points...",
          step: 4,
        });

        await delay(600);
        send({
          type: "status",
          agent: "critic",
          message: "Fact-checking every claim against source text...",
          step: 5,
        });

        await delay(500);
        send({
          type: "status",
          agent: "synthesizer",
          message: "Synthesizing the final cited answer...",
          step: 6,
        });

        // Start heartbeat so the SSE connection stays alive while we wait.
        startHeartbeat();

        // ----------------------------------------------------------------
        // Await the backend response.
        // ----------------------------------------------------------------
        const res = await analyzePromise;
        stopHeartbeat();

        if (!res.ok) {
          let errMsg = `Backend returned status ${res.status}.`;
          try {
            const body = await res.json();
            if (body?.error) errMsg = body.error;
          } catch {
            /* ignore parse errors */
          }
          send({ type: "error", message: errMsg });
          return;
        }

        const data = await res.json();

        if (data?.error) {
          send({ type: "error", message: data.error });
          return;
        }

        if (!data?.answer) {
          send({
            type: "error",
            message: "No answer was returned from the backend.",
          });
          return;
        }

        send({
          type: "answer",
          content: data.answer,
          session_id: data.session_id,
        });
      } catch (err) {
        stopHeartbeat();
        const isTimeout =
          err instanceof Error && err.name === "TimeoutError";
        send({
          type: "error",
          message: isTimeout
            ? "Analysis timed out after 5 minutes. Please try again."
            : err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
        });
      } finally {
        // Every path above (the three early returns, the success send, and
        // the catch block) reaches this finally, so this is the only close()
        // call needed. The early-return branches used to also call
        // controller.close() themselves before returning, which meant the
        // controller got closed twice on the backend-error, backend-error-body
        // and no-answer paths -- close() on an already-closed
        // ReadableStreamDefaultController throws, turning an ordinary
        // handled-error response into an unhandled rejection in this stream's
        // start() callback.
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
