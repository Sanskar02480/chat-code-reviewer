"use client";

import { useState } from "react";
import type { ReviewResponse } from "@/lib/reviewTypes";

const LANGUAGES = ["C++", "Java", "Python", "JavaScript", "TypeScript", "Go"];

/* ✅ COPY HELPER */
function copyToClipboard(text: string, cb?: (msg: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    cb?.("Copied!");
    setTimeout(() => cb?.(""), 1500);
  });
}

export default function Home() {
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState("");
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState("");

  const handleReview = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please paste some code before requesting a review.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || "Failed to generate review.";
        throw new Error(msg);
      }

      const data = (await res.json()) as ReviewResponse;
      setReview(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong while reviewing your code.");
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">

      {/* HEADER */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                CodeChat Reviewer
              </h1>
              <p className="text-xs text-slate-500">
                AI-assisted code review for developers
              </p>
            </div>
            <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 border border-orange-100">
              BETA
            </span>
          </div>

          <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
            View on GitHub
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {/* INTRO */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Chat-based Code Reviewer
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Paste your code, choose a language, and get structured feedback on
            bugs, code quality, and complexity. Designed for fast iterations and
            clean reviews.
          </p>
          <p className="text-xs text-slate-500">
            Rule-based analysis · Code quality · Complexity insights
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* PANELS */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* LEFT */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Your Code</h3>
                <p className="text-xs text-slate-500">
                  Paste the snippet you want reviewed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your function, class, or snippet here..."
              className="h-72 w-full resize-none rounded-xl border border-slate-200 bg-slate-900/95 font-mono text-xs text-slate-100 p-3"
            />

            <div className="flex justify-end">
              <button
                onClick={handleReview}
                disabled={isLoading || !code.trim()}
                className="rounded-full bg-orange-500 px-4 py-1.5 text-xs text-white hover:bg-orange-600"
              >
                {isLoading ? "Reviewing..." : "Review Code"}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Review Summary</h3>
                <p className="text-xs text-slate-500">
                  {review ? "Here is the latest analysis." : "Run a review."}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px]">
                {review ? "Review ready" : "No review yet"}
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">

              {/* ISSUES */}
              <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-orange-700 font-semibold">🪲 Potential Issues</h4>
                  {review && (
                    <button
                      className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded"
                      onClick={() =>
                        copyToClipboard(review.potentialIssues.items.join("\n"), setCopiedMsg)
                      }
                    >
                      Copy
                    </button>
                  )}
                </div>
                {review ? (
                  <ul className="list-disc pl-4 mt-1">
                    {review.potentialIssues.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px]">Issues appear after review.</p>
                )}
              </div>

              {/* IMPROVEMENTS */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-emerald-700 font-semibold">✨ Improvements</h4>
                  {review && (
                    <button
                      className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded"
                      onClick={() =>
                        copyToClipboard(review.improvements.items.join("\n"), setCopiedMsg)
                      }
                    >
                      Copy
                    </button>
                  )}
                </div>
                {review ? (
                  <ul className="list-disc pl-4 mt-1">
                    {review.improvements.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px]">Suggestions appear here.</p>
                )}
              </div>

              {/* COMPLEXITY */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sky-700 font-semibold">📈 Complexity</h4>
                  {review && (
                    <button
                      className="bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded"
                      onClick={() =>
                        copyToClipboard(
                          `Time: ${review.complexity.time}\nSpace: ${review.complexity.space}`,
                          setCopiedMsg
                        )
                      }
                    >
                      Copy
                    </button>
                  )}
                </div>
                {review ? (
                  <>
                    <p>Time: {review.complexity.time}</p>
                    <p>Space: {review.complexity.space}</p>
                  </>
                ) : (
                  <p className="text-[11px]">Complexity shown after review.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ SUGGESTED FIX */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
          <div className="flex justify-between items-center">
            <h4 className="text-indigo-700 font-semibold">✅ Suggested Fix</h4>
            {review && (
              <button
                className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded"
                onClick={() =>
                  copyToClipboard(review.suggestedFix, setCopiedMsg)
                }
              >
                Copy
              </button>
            )}
          </div>

          {review ? (
            <pre className="bg-indigo-900 text-indigo-100 text-xs mt-2 p-2 rounded">
              {review.suggestedFix}
            </pre>
          ) : (
            <p className="text-[11px]">Corrected code appears here.</p>
          )}
        </div>

        {/* FOOTER */}
        <footer className="text-center text-[11px] text-slate-500">
          Built with Next.js, TypeScript & Tailwind CSS
        </footer>
      </section>

      {/* ✅ COPY TOAST */}
      {copiedMsg && (
        <div className="fixed bottom-5 right-5 bg-black text-white text-xs px-3 py-1 rounded shadow">
          {copiedMsg}
        </div>
      )}

    </main>
  );
}
