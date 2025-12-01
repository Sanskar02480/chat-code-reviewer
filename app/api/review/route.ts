// app/api/review/route.ts
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Optional: short-lived access token (service account / OAuth). If provided this will
// be sent as an Authorization: Bearer <token> header instead of using the key query param.
const GEMINI_ACCESS_TOKEN = process.env.GEMINI_ACCESS_TOKEN;

// Helpful, non-sensitive debug log at startup (prints prefix only, if present)
if (GEMINI_API_KEY) {
  console.log("Gemini key available (prefix):", GEMINI_API_KEY.slice(0, 6));
} else if (GEMINI_ACCESS_TOKEN) {
  console.log("Gemini access token available (prefix):", GEMINI_ACCESS_TOKEN.slice(0, 6));
} else {
  console.log("Gemini credentials not present in env");
}


// System prompt: tell Gemini exactly what JSON we want back.
const SYSTEM_INSTRUCTIONS = `
You are an expert code reviewer.
Given a code snippet and its language, you must analyse it and reply ONLY in pure JSON.

JSON FORMAT (very important):

{
  "potentialIssues": { "items": ["issue 1", "issue 2", "..."] },
  "improvements": { "items": ["suggestion 1", "suggestion 2", "..."] },
  "complexity": {
    "time": "Big-O time complexity for main logic",
    "space": "Big-O space complexity",
    "notes": "short explanation"
  },
  "suggestedFix": "a corrected and improved version of the entire code snippet"
}

Rules:
- Do NOT include any backticks.
- Do NOT wrap JSON in markdown.
- Do NOT add extra keys.
- Be concise but clear.
`;

export async function POST(req: Request) {
  try {
    // Require either an API key (GEMINI_API_KEY) or an access token (GEMINI_ACCESS_TOKEN).
    if (!GEMINI_API_KEY && !GEMINI_ACCESS_TOKEN) {
      console.error("Server misconfigured: no Gemini credentials found.");
      return NextResponse.json(
        { error: "Server misconfigured: GEMINI_API_KEY or GEMINI_ACCESS_TOKEN is missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { language, code } = body as { language: string; code: string };

    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing 'language' or 'code' in request body." },
        { status: 400 }
      );
    }

    const userPrompt = `
Language: ${language}

Code:
${code}
`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_INSTRUCTIONS },
            { text: userPrompt }
          ]
        }
      ]
    };

    const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
    // ✅ FIXED: Using correct Gemini model with models/ prefix
    const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "models/gemini-1.5-flash";
    const GEMINI_API_URL = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent`;

    // Build headers and auth. Prefer an explicit access token if present.
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Use Authorization header when an access token is available.
    const url = GEMINI_ACCESS_TOKEN
      ? GEMINI_API_URL
      : `${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY ?? "")}`;

    if (GEMINI_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${GEMINI_ACCESS_TOKEN}`;
    }

    if (process.env.NODE_ENV !== "production") {
      // Small safety: don't print secrets, but show the URL used and whether auth header is set
      console.log("Calling Gemini endpoint:", url.slice(0, 120));
      console.log("Using Authorization header:", Boolean(GEMINI_ACCESS_TOKEN));
      console.log("Payload (truncated):", JSON.stringify(payload).slice(0, 200));
    }

    // ✅ FIXED: Now using the headers variable that was built above
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini API error", { status: res.status, statusText: res.statusText, body: text });

      // If model isn't found or unsupported for generateContent, call the ListModels endpoint to help diagnose.
      if (res.status === 404) {
        try {
          const listUrl = GEMINI_ACCESS_TOKEN
            ? `${GEMINI_BASE}/models`
            : `${GEMINI_BASE}/models?key=${encodeURIComponent(GEMINI_API_KEY ?? "")}`;

          const listRes = await fetch(listUrl, {
            method: "GET",
            headers: GEMINI_ACCESS_TOKEN ? { Authorization: `Bearer ${GEMINI_ACCESS_TOKEN}` } : {},
          });

          const listBody = await listRes.text();
          console.log("ListModels response status:", listRes.status);
          console.log("ListModels (truncated):", listBody.slice(0, 1000));

          return NextResponse.json(
            {
              error: "Requested model not found or doesn't support generateContent.",
              note: `Tried model: ${GEMINI_MODEL}. See available models in ListModels response (server logs include the raw list).`,
            },
            { status: 404 }
          );
        } catch (err) {
          console.error("Failed to call ListModels:", err);
          return new Response(text, { status: res.status });
        }
      }

      return new Response(text, { status: res.status });
    }

    const data = await res.json();

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 500 }
      );
    }

    // In practice models sometimes wrap JSON with ```json ... ```
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", cleaned);
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      );
    }

    // Basic shape guard; you can make this stricter if needed.
    const response = {
      potentialIssues: {
        items: parsed?.potentialIssues?.items ?? [],
      },
      improvements: {
        items: parsed?.improvements?.items ?? [],
      },
      complexity: {
        time: parsed?.complexity?.time ?? "Unknown",
        space: parsed?.complexity?.space ?? "Unknown",
        notes:
          parsed?.complexity?.notes ??
          "Complexity information not clearly provided by the AI.",
      },
      suggestedFix: parsed?.suggestedFix ?? "// No fix generated.",
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Unexpected error in /api/review:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}