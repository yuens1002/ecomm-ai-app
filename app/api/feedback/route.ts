import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema, feedbackTypeLabels, feedbackTypeEmojis } from "@/lib/feedback";

const GITHUB_API_URL = "https://api.github.com";

/**
 * POST /api/feedback
 * Submit feedback which creates a GitHub issue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, type, email } = parsed.data;

    // Check for GitHub configuration
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      console.warn("GitHub integration not configured, logging feedback locally");
      console.log("Feedback received:", { type, message, email: email || "(not provided)" });

      return NextResponse.json({
        success: true,
        message: "Feedback received (GitHub integration not configured)",
      });
    }

    // Create GitHub issue
    const issueTitle = `[${feedbackTypeLabels[type]}] User Feedback`;
    const issueBody = buildIssueBody(message, type, email);
    const labels = [feedbackTypeEmojis[type], "user-feedback"];

    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("GitHub API error:", response.status, errorData);

      // Fallback: log the feedback locally
      console.log("Feedback received (GitHub API failed):", { type, message, email: email || "(not provided)" });

      return NextResponse.json({
        success: true,
        message: "Feedback received (will be reviewed manually)",
      });
    }

    const issue = await response.json();
    console.log(`GitHub issue created: ${issue.html_url}`);

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback!",
      issueUrl: issue.html_url,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

function buildIssueBody(message: string, type: string, email?: string): string {
  const sections = [
    "## Feedback",
    "",
    message,
    "",
    "---",
    "",
    "## Details",
    "",
    `- **Type:** ${feedbackTypeLabels[type as keyof typeof feedbackTypeLabels]}`,
    `- **Contact Email:** ${email || "Not provided"}`,
    `- **Submitted:** ${new Date().toISOString()}`,
    "",
    "---",
    "",
    "_This issue was automatically created from the in-app feedback widget._",
  ];

  return sections.join("\n");
}
