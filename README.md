# SciAgent

[![Build and lint](https://github.com/VANDRANKI/sciagent-frontend/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/VANDRANKI/sciagent-frontend/actions/workflows/build.yml)

SciAgent, a research paper question-answering system powered by a multi-agent AI pipeline.

---

## What It Does

Upload a research paper (PDF) and ask any question about it. Six AI agents work in sequence to retrieve relevant sections, analyze them, fact-check the analysis, and produce a fully cited answer.

---

## Project Structure

```
sciagent-frontend/
    app/
        page.tsx              
        layout.tsx            
        globals.css           
        api/analyze/route.ts  
    components/
        FileUpload.tsx        
        AgentPipeline.tsx      
        ChatDisplay.tsx       
        CavemanLoader.tsx     
        LoadingSteps.tsx      
    lib/
        types.ts             
        api.ts        
```

---

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

3. Set the backend URL in `.env.local`:

```
HF_SPACE_URL=https://your-hf-space.hf.space
```

4. Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## How It Works

```mermaid
flowchart TD
    A([User uploads PDF and types a question])

    A --> B[1. Ingestion - parse, chunk, embed, store]
    B --> C[2. Planner - orchestrate the full pipeline]
    C --> D[3. Retriever - hybrid BM25 and vector search]
    D --> E[4. Analyzer - structured analysis of chunks]
    E --> F[5. Critic - fact-check against source]
    F --> G[6. Synthesizer - build final cited answer]

    G --> H([User reads the answer with inline citations])
```
