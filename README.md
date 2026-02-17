
# MeetMet AI - Meeting Assistant

MeetMet is a production-ready meeting intelligence platform designed for modern enterprises. It leverages Gemini 3 to transform passive meeting recordings into active, searchable knowledge.

## Features
- **Intelligent Transcription**: Simulated high-fidelity transcription processing.
- **Structured Summaries**: Powered by Gemini 3 Flash for speed and Gemini 3 Pro for complex reasoning.
- **Action Item Extraction**: Automated extraction of tasks, assignees, and deadlines.
- **Contextual Chat**: Grounded RAG-style chat that answers questions strictly from meeting context.
- **Analytics Dashboard**: Talk-time distribution, sentiment heatmaps, and productivity scoring.

## Tech Stack
- **Frontend**: React, Tailwind CSS, TypeScript, Gemini SDK.
- **Backend (Reference)**: Node.js, Express, MongoDB Atlas, JWT.
- **AI Engine**: Google Gemini 3 (Pro/Flash).

## Getting Started
1. **Environment Variables**:
   Create a `.env` file or set the following:
   - `API_KEY`: Your Google AI Studio API Key.
   - `MONGODB_URI`: Connection string for Atlas.
   - `JWT_SECRET`: For authentication.

2. **Frontend Run**:
   `npm start` or view via index.html/App.tsx.

3. **Backend Run**:
   `ts-node server/server.ts`

## Prompt Engineering Strategy
We use **Grounded System Instructions** to ensure hallucination-free answers:
```text
You are an AI meeting assistant. 
Answer ONLY from the transcript provided. 
If the answer is not found, reply: "This was not discussed in the meeting."
```

## Deployment
- **Frontend**: Deploy `dist/` folder to Vercel/Netlify.
- **Backend**: Deploy `server/` to Render/Heroku.
- **Database**: Host on MongoDB Atlas (Shared Cluster).
