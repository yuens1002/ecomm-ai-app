import { APP_VERSION, EDITION, compareVersions } from "@/lib/version";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

interface GitHubRelease {
  tag_name: string;
  body: string;
  html_url: string;
}

export async function GET() {
  try {
    // Fetch latest release from GitHub
    const res = await fetch(
      "https://api.github.com/repos/yuens1002/ecomm-ai-app/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GitHub token if available for higher rate limits
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) {
      // If no releases or rate limited, return current version
      return Response.json({
        current: APP_VERSION,
        latest: APP_VERSION,
        edition: EDITION,
        updateAvailable: false,
      });
    }

    const release: GitHubRelease = await res.json();
    const latest = release.tag_name.replace(/^v/, "");

    return Response.json({
      current: APP_VERSION,
      latest,
      edition: EDITION,
      updateAvailable: compareVersions(latest, APP_VERSION) > 0,
      releaseNotes: release.body?.slice(0, 500) || undefined,
      changelogUrl: release.html_url,
    });
  } catch {
    // On any error, return current version without update
    return Response.json({
      current: APP_VERSION,
      latest: APP_VERSION,
      edition: EDITION,
      updateAvailable: false,
    });
  }
}
