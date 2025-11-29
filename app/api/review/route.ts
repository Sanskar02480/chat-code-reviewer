import { NextResponse } from "next/server";
import { z } from "zod";
import type { ReviewResponse } from "@/lib/reviewTypes";

const ReviewRequestSchema = z.object({
  language: z.string().min(1),
  code: z.string().min(10, "Please paste at least a few lines of code."),
});

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

    

    const lines = code.split("\n").length;
    const hasTodo = code.toLowerCase().includes("todo");
    const hasConsole =
      code.includes("console.log") ||
      code.includes("System.out.println") ||
      code.includes("cout <<");

    const potentialIssuesItems: string[] = [];
    const improvementsItems: string[] = [];

    if (lines > 80) {
      potentialIssuesItems.push(
        "Function or snippet is quite long. Consider breaking it into smaller functions for readability."
      );
    }

    if (hasTodo) {
      potentialIssuesItems.push(
        "Found TODO comments. Make sure to address them before production."
      );
    }

    if (hasConsole) {
      potentialIssuesItems.push(
        "Debug logging (console.log / println / cout) detected. Remove or guard logs for production builds."
      );
    }

    if (potentialIssuesItems.length === 0) {
      potentialIssuesItems.push(
        "No obvious red flags detected from a static scan. Edge cases may still exist."
      );
    }

    improvementsItems.push(
      "Ensure variable and function names are descriptive and follow a consistent naming convention.",
      "Add comments or docstrings for complex logic and non-trivial algorithms.",
      "Consider adding unit tests for edge cases and failure scenarios."
    );

    const complexity: ReviewResponse["complexity"] = {
      time:
        code.includes("while") || code.includes("for")
          ? "O(n) (approximate guess based on loops)"
          : "O(1) or O(n) depending on hidden operations",
      space:
        code.includes("new ") || code.includes("vector") || code.includes("Array")
          ? "O(n) due to dynamic allocations/collections"
          : "O(1) additional space (rough estimate)",
      notes:
        "Complexity here is a heuristic guess based on simple pattern matching, not a full analysis.",
    };

    const response: ReviewResponse = {
      language,
      summary:
        "Static mock review generated. This will later be replaced with a real AI-powered analysis.",
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

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Review API error:", err);
    return NextResponse.json(
      { error: "Unexpected server error while reviewing code." },
      { status: 500 }
    );
  }
}
