// app/page.tsx
"use client";

import { useState } from "react";

const LANGUAGES = ["C++", "Java", "Python", "JavaScript", "TypeScript", "Go"];

export default function Home() {
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState("");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
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

          <button
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            type="button"
          >
            View on GitHub
          </button>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {/* Intro Section */}
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
            AI-powered · Code quality · Complexity insights
          </p>
        </div>

        {/* Two-panel workspace */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Panel - Code Input */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Your Code</h3>
                <p className="text-xs text-slate-500">
                  Paste the snippet you want reviewed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="language"
                  className="text-xs font-medium text-slate-600"
                >
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1">
              <label
                htmlFor="code"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Paste your code here
              </label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your function, class, or snippet here..."
                className="h-72 w-full resize-none rounded-xl border border-slate-200 bg-slate-900/95 font-mono text-xs text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Your code is processed securely. You can clear it anytime.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-medium text-white shadow-md hover:bg-orange-600 active:scale-[0.98] transition"
                onClick={() => {
                  // For now just a placeholder
                  alert("Review logic will be added later. UI is ready ✅");
                }}
              >
                Review Code
              </button>
            </div>
          </div>

          {/* Right Panel - Review Output */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Review Summary</h3>
                <p className="text-xs text-slate-500">
                  Run a review to see feedback tailored to your code.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                No review yet
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                <h4 className="mb-1 text-[11px] font-semibold text-orange-700">
                  🪲 Potential Issues
                </h4>
                <p className="text-[11px] text-orange-900/90">
                  Once you run a review, this section will highlight possible
                  bugs, edge cases, and risky patterns in your code.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <h4 className="mb-1 text-[11px] font-semibold text-emerald-700">
                  ✨ Improvements
                </h4>
                <p className="text-[11px] text-emerald-900/90">
                  You&apos;ll see suggestions on readability, structure,
                  naming, and best practices here.
                </p>
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                <h4 className="mb-1 text-[11px] font-semibold text-sky-700">
                  📈 Complexity (estimated)
                </h4>
                <p className="text-[11px] text-sky-900/90">
                  The reviewer will estimate time and space complexity for the
                  main function or algorithm you&apos;ve provided.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <footer className="mt-4 pb-4 text-center text-[11px] text-slate-500">
          Built with Next.js, TypeScript & Tailwind CSS.
        </footer>
      </section>
    </main>
  );
}
