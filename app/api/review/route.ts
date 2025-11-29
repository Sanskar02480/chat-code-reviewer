import { NextResponse } from "next/server";
import { z } from "zod";
import type { ReviewResponse } from "@/lib/reviewTypes";

/* ---------------- SCHEMA ---------------- */

const ReviewRequestSchema = z.object({
  language: z.string().min(1),
  code: z.string().min(5),
});

/* ---------------- HELPERS ---------------- */

function checkUnbalancedBraces(code: string): string[] {
  const stack: string[] = [];
  const errors: string[] = [];
  const opening = "({[";
  const closing = ")}]";
  const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (opening.includes(ch)) stack.push(ch);
    if (closing.includes(ch)) {
      const expected = pairs[ch];
      const actual = stack.pop();
      if (actual !== expected) {
        errors.push(`Mismatched '${ch}' at position ${i}`);
      }
    }
  }

  if (stack.length) {
    errors.push("Opening braces/brackets not closed.");
  }

  return errors;
}

function detectMissingSemicolons(language: string, code: string): string[] {
  const issues: string[] = [];

  if (!["C++", "Java", "JavaScript", "TypeScript"].includes(language)) {
    return issues;
  }

  code.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    const lineNo = i + 1;

    if (!line) return;
    if (line.startsWith("//")) return;
    if (line.endsWith("{") || line.endsWith("}")) return;

    const likelyStatement =
      line.includes("=") ||
      line.includes("cout <<") ||
      line.includes("cin >>") ||
      line.includes("return") ||
      line.includes("console.log") ||
      line.includes("System.out.println");

    if (likelyStatement && !line.endsWith(";")) {
      issues.push(`Line ${lineNo}: Missing semicolon (';')`);
    }
  });

  return issues;
}

function detectUnclosedQuotes(code: string): string[] {
  const issues: string[] = [];

  code.split("\n").forEach((line, i) => {
    const count = (line.match(/"/g) || []).length;
    if (count % 2 !== 0) {
      issues.push(`Line ${i + 1}: Unclosed string literal (missing ")`);
    }
  });

  return issues;
}

/* ---------------- AUTO-FIX ENGINE ---------------- */

function generateSuggestedFix(language: string, code: string): string {
  if (!["C++", "Java", "JavaScript", "TypeScript"].includes(language)) {
    return code;
  }

  const fixed = code.split("\n").map((line) => {
    let newLine = line;
    const trimmed = newLine.trim();

    // ✅ fix missing quote
    const quoteCount = (newLine.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      newLine = newLine + `"`;
    }

    // ✅ fix missing semicolon
    const likelyStatement =
      trimmed.includes("=") ||
      trimmed.includes("cout <<") ||
      trimmed.includes("cin >>") ||
      trimmed.includes("return") ||
      trimmed.includes("console.log") ||
      trimmed.includes("System.out.println");

    const ignore =
      trimmed.endsWith("{") ||
      trimmed.endsWith("}") ||
      trimmed.startsWith("if") ||
      trimmed.startsWith("for") ||
      trimmed.startsWith("while");

    if (likelyStatement && !trimmed.endsWith(";") && !ignore) {
      newLine = newLine + ";";
    }

    return newLine;
  });

  return fixed.join("\n");
}

/* ---------------- ANALYZER ---------------- */

function analyzeCodeHeuristics(language: string, code: string): ReviewResponse {
  const potential: string[] = [];
  const improvements: string[] = [];

  // ✅ collect issues
  potential.push(...detectMissingSemicolons(language, code));
  potential.push(...detectUnclosedQuotes(code));
  potential.push(...checkUnbalancedBraces(code));

  // ✅ detect debug prints
  if (
    code.includes("cout <<") ||
    code.includes("console.log") ||
    code.includes("print(")
  ) {
    potential.push("Debug output detected (cout / console.log / print).");
  }

  if (code.toLowerCase().includes("todo")) {
    potential.push("TODO comments present in code.");
  }

  if (!potential.length) {
    potential.push("No obvious issues detected by rule engine.");
  }

  // ✅ improvements
  improvements.push(
    "Use meaningful variable and function names.",
    "Add edge case tests.",
    "Split large functions into smaller ones."
  );

  // ✅ complexity
  const hasLoop = /for|while/.test(code);
  const nested = /(for|while)[\s\S]*(for|while)/.test(code);

  let time = "O(1)";
  if (hasLoop) time = "O(n)";
  if (nested) time = "O(n²)";

  const complexity = {
    time,
    space: code.includes("new ") || code.includes("malloc") ? "O(n)" : "O(1)",
    notes: "Heuristic static analysis (rule-based, not compiler-level).",
  };

  // ✅ final response
  return {
    language,
    summary: "Review generated using rule-based static analysis engine.",
    suggestedFix: generateSuggestedFix(language, code),
    potentialIssues: {
      title: "Potential Issues",
      items: potential,
    },
    improvements: {
      title: "Improvements",
      items: improvements,
    },
    complexity,
  };
}

/* ---------------- API HANDLER ---------------- */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { language, code } = parsed.data;
    const result = analyzeCodeHeuristics(language, code);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error while analyzing code." },
      { status: 500 }
    );
  }
}
