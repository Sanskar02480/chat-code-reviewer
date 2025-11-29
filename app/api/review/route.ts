// app/api/review/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ReviewResponse } from "@/lib/reviewTypes";

const ReviewRequestSchema = z.object({
  language: z.string().min(1),
  code: z.string().min(10, "Please paste at least a few lines of code."),
});

// ------------ Helper analysis functions ------------

function checkUnbalancedBraces(code: string): string[] {
  const stack: string[] = [];
  const errors: string[] = [];

  const opening = "({[";
  const closing = ")}]";
  const pairs: Record<string, string> = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (opening.includes(ch)) {
      stack.push(ch);
    } else if (closing.includes(ch)) {
      const expected = pairs[ch];
      const got = stack.pop();
      if (got !== expected) {
        errors.push(
          `Mismatched bracket '${ch}' at position ${i}. Check your parentheses, braces, and brackets.`
        );
      }
    }
  }

  if (stack.length > 0) {
    errors.push(
      "Some opening brackets/parentheses/braces are not closed. Check your '{', '(', '['."
    );
  }

  return errors;
}

function detectMissingSemicolons(language: string, code: string): string[] {
  const issues: string[] = [];

  // Only for semicolon-based languages
  if (!["C++", "Java", "JavaScript", "TypeScript"].includes(language)) {
    return issues;
  }

  const lines = code.split("\n");
  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    const lineNumber = idx + 1;

    if (!line) return;
    if (line.startsWith("//") || line.startsWith("#") || line.startsWith("/*")) return;

    // Skip lines with obvious block structures
    if (
      line.endsWith("{") ||
      line.endsWith("}") ||
      line.endsWith(":") ||
      line.includes("for (") ||
      line.includes("while (") ||
      line.includes("if (") ||
      line.includes("switch (") ||
      line.startsWith("class ") ||
      line.startsWith("struct ")
    ) {
      return;
    }

    // Lines that normally should end with ';'
    const shouldEndWithSemicolon =
      line.includes("=") ||
      line.includes("cout <<") ||
      line.includes("cin >>") ||
      line.includes("return") ||
      line.includes("printf(") ||
      line.includes("std::") ||
      line.includes("System.out.println") ||
      line.includes("console.log");

    if (shouldEndWithSemicolon && !line.endsWith(";")) {
      issues.push(
        `Line ${lineNumber}: This statement looks like it should end with a semicolon (';').`
      );
    }
  });

  return issues;
}

function analyzeCodeHeuristics(language: string, code: string): ReviewResponse {
  const lines = code.split("\n");
  const lineCount = lines.length;

  const potentialIssuesItems: string[] = [];
  const improvementsItems: string[] = [];

  // 1) Length heuristics
  if (lineCount > 120) {
    potentialIssuesItems.push(
      "This snippet is quite long. Consider splitting large functions into smaller, focused ones."
    );
  } else if (lineCount > 60) {
    improvementsItems.push(
      "Code length is moderate. Check if some logic can be extracted into helper functions for better readability."
    );
  }

  // 2) Debug logging detection
  const hasConsole =
    code.includes("console.log") ||
    code.includes("System.out.println") ||
    code.includes("cout <<") ||
    code.includes("print(") ||
    code.includes("printf(");

  if (hasConsole) {
    potentialIssuesItems.push(
      "Debug/output logging detected (e.g., console.log / cout / print). Remove or guard these logs in production builds."
    );
  }

  // 3) TODO / FIXME detection
  if (code.toLowerCase().includes("todo") || code.toLowerCase().includes("fixme")) {
    potentialIssuesItems.push(
      "Found TODO/FIXME comments. Make sure these are resolved before shipping this code."
    );
  }

  // 4) Missing semicolons (for relevant languages)
  potentialIssuesItems.push(...detectMissingSemicolons(language, code));

  // 5) Unbalanced braces / brackets
  potentialIssuesItems.push(...checkUnbalancedBraces(code));

  // 6) Simple improvement suggestions
  improvementsItems.push(
    "Ensure variable and function names are descriptive and follow a consistent naming convention.",
    "Add comments or docstrings for complex logic and non-trivial algorithms.",
    "Consider adding unit tests for edge cases and failure scenarios.",
    "Group related logic into well-named helper functions to improve readability."
  );

  if (language === "Python") {
    improvementsItems.push(
      "In Python, prefer using type hints and docstrings for public functions to improve maintainability."
    );
  }

  // 7) Complexity heuristic
  const hasLoop =
    code.includes("for ") ||
    code.includes("for(") ||
    code.includes("while ") ||
    code.includes("while(") ||
    code.includes("forEach(");

  const hasNestedLoop =
    code.match(/for\s*\(.*\)\s*{[\s\S]*for\s*\(/) ||
    code.match(/while\s*\(.*\)\s*{[\s\S]*while\s*\(/);

  let timeComplexity = "O(1) – no obvious loops detected.";
  if (hasLoop) timeComplexity = "O(n) – at least one loop detected.";
  if (hasNestedLoop) timeComplexity = "O(n²) – nested loops detected in the code.";

  const complexity: ReviewResponse["complexity"] = {
    time: timeComplexity,
    space:
      code.includes("new ") ||
      code.includes("malloc(") ||
      code.includes("vector<") ||
      code.includes("Array(") ||
      code.includes("list<") ||
      code.includes("dict(")
        ? "O(n) – dynamic collections or allocations detected."
        : "O(1) – no obvious additional dynamic allocations detected.",
    notes:
      "Complexity estimates are heuristic and based on simple pattern scanning, not full compiler-level analysis.",
  };

  if (potentialIssuesItems.length === 0) {
    potentialIssuesItems.push(
      "No major red flags found by the rule-based analyzer. There still may be logical or edge-case issues not caught by static checks."
    );
  }

  return {
    language,
    summary:
      "This review is generated by a rule-based static analyzer (no external AI). It checks for common issues, style hints, and rough complexity.",
    potentialIssues: {
      title: "Potential Issues",
      items: potentialIssuesItems,
    },
    improvements: {
      title: "Improvements",
      items: improvementsItems,
    },
    complexity,
  };
}

// ------------ Main POST handler ------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid request payload.";
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const { language, code } = parsed.data;

    const review = analyzeCodeHeuristics(language, code);

    return NextResponse.json(review, { status: 200 });
  } catch (err) {
    console.error("Review API error:", err);
    return NextResponse.json(
      { error: "Unexpected server error while reviewing code." },
      { status: 500 }
    );
  }
}
