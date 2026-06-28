import { NextResponse } from "next/server";

const WORKFLOW = "snapshot.yml";
const OWNER = "devsh25";
const REPO = "portfolio-tracker";

export async function POST() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_DISPATCH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `GitHub API ${res.status}: ${body.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
