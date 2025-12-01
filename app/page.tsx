"use client";

import { useState } from "react";
import type { ReviewResponse } from "@/lib/reviewTypes";

const LANGUAGES = ["C++", "Java", "Python", "JavaScript", "TypeScript", "Go"];

export default function Home() {
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState("");
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || "Something went wrong.");
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setReview(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8f0] to-[#fffdf9] flex flex-col">

      {/* HEADER */}
      <header className="border-b bg-white/90 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center font-extrabold text-lg">
              C
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                AI Code Review Engine
              </p>
              <h1 className="text-lg font-semibold tracking-tight">
                CodeChat Reviewer
              </h1>
            </div>

            <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              BETA
            </span>
          </div>

          <button className="text-sm font-medium text-gray-600 hover:text-orange-600 transition">
            View on GitHub
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-6xl mx-auto w-full flex-1 px-4 py-6">

        {/* INTRO */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Chat-based Code Reviewer
          </h2>
          <p className="text-sm text-gray-600">
            Paste your code, choose a language, and get structured feedback on bugs,
            code quality, and complexity.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Rule engine · Complexity heuristics · Best practices detector
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">

          {/* LEFT PANEL */}
          <div className="bg-white border rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold text-sm">Your Code</h3>
                <p className="text-xs text-gray-500">
                  Paste the snippet you want reviewed
                </p>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border rounded-full bg-gray-100 px-3 py-1 focus:ring-1 focus:ring-orange-400"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your function, class, or snippet here..."
              className="w-full h-72 resize-none rounded-lg border bg-slate-900 text-slate-100 p-3 text-xs font-mono focus:ring-2 focus:ring-orange-400 outline-none"
            />

            <p className="mt-1 text-[11px] text-gray-500">
              Your code is processed securely. You can clear it anytime.
            </p>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={handleClear}
                className="text-xs border px-3 py-1 rounded-full hover:bg-gray-100"
              >
                Clear
              </button>

              <button
                onClick={handleReview}
                disabled={!code.trim() || isLoading}
                className="text-xs bg-orange-500 text-white px-4 py-1.5 rounded-full shadow hover:bg-orange-600 disabled:opacity-60"
              >
                {isLoading ? "Reviewing..." : "Review Code"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white border rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-sm font-semibold">Review Summary</h3>
                <p className="text-xs text-gray-500">
                  {review
                    ? "Here is the latest analysis."
                    : "Run a review to get AI feedback"}
                </p>
              </div>

              <span className="text-[10px] border px-2 py-0.5 rounded-full text-gray-500">
                {review ? "Review ready" : "No review yet"}
              </span>
            </div>

            <div className="space-y-3 text-xs">

              {/* Issues */}
              <div className="bg-orange-50 p-3 rounded-lg border">
                <h4 className="font-semibold text-orange-700">🪲 Potential Issues</h4>
                {review ? (
                  <ul className="list-disc pl-4 mt-1">
                    {review.potentialIssues.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-gray-600">Appears after review.</p>
                )}
              </div>

              {/* Improvements */}
              <div className="bg-emerald-50 p-3 rounded-lg border">
                <h4 className="font-semibold text-emerald-700">✨ Improvements</h4>
                {review ? (
                  <ul className="list-disc pl-4 mt-1">
                    {review.improvements.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-gray-600">Appears after review.</p>
                )}
              </div>

              {/* Complexity */}
              <div className="bg-sky-50 p-3 rounded-lg border">
                <h4 className="font-semibold text-sky-700">📈 Complexity</h4>
                {review ? (
                  <>
                    <p><b>Time:</b> {review.complexity.time}</p>
                    <p><b>Space:</b> {review.complexity.space}</p>
                    <p className="text-[11px] mt-1 text-gray-600">{review.complexity.notes}</p>
                  </>
                ) : (
                  <p className="mt-1 text-gray-600">Appears after review.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SUGGESTED FIX */}
        <div className="mt-6 bg-indigo-50 rounded-xl border p-4">
          <h4 className="text-sm font-semibold text-indigo-700">✅ Suggested Fix</h4>

          {review ? (
            <pre className="mt-2 p-3 bg-indigo-900 text-indigo-100 rounded-lg text-xs overflow-auto">
              {review.suggestedFix}
            </pre>
          ) : (
            <p className="mt-1 text-indigo-700 text-xs">
              Corrected code appears here.
            </p>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-6 text-center text-[11px] text-gray-500">
          Built with Next.js · TypeScript · Tailwind CSS
        </footer>

      </section>
    </main>
  );
}
