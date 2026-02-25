import { NextRequest } from "next/server";

const HF_SPACE_URL = process.env.HF_SPACE_URL;

/**
 * Proxies the analysis request to the HuggingFace Gradio backend.
 *
 * Because the Gradio backend is synchronous (demo.launch()), we:
 * 1. Upload the PDF to Gradio's /upload endpoint.
 * 2. Stream fake SSE status events so the frontend pipeline shows progress.
 * 3. Call /run/analyze and wait for the result.
 * 4. Stream the final answer as an SSE event.
 *
 * This keeps the frontend SSE interface completely unchanged.
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
          const uploadRes = await fetch(`${HF_SPACE_URL}/upload`, {
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

        // Stream status events for all pipeline stages while the Gradio call runs
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

        // Step 2: Call the Gradio analyze function
        let answer: string;
        try {
          const predictRes = await fetch(`${HF_SPACE_URL}/run/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: [
                { path: pdfPath, orig_name: pdf.name, size: pdf.size },
                question,
              ],
            }),
          });

          if (!predictRes.ok) {
            throw new Error(
              `Analysis backend returned status ${predictRes.status}.`
            );
          }

          const result = await predictRes.json();
          answer = result?.data?.[0] ?? "No answer was returned from the backend.";
        } catch (err) {
          send({
            type: "error",
            message:
              err instanceof Error ? err.message : "Analysis request failed.",
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
