import { NextResponse } from "next/server";
import { readJson, type SubmissionDB } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readJson<SubmissionDB>("tool-submissions-db.json", {
    submissions: [],
    updatedAt: new Date().toISOString(),
  });
  // 新的在前
  const submissions = [...(db.submissions || [])].sort((a, b) =>
    (b.time || "") < (a.time || "") ? -1 : 1
  );
  return NextResponse.json({
    submissions,
    counts: {
      total: submissions.length,
      pending: submissions.filter((s) => (s.status ?? "pending") === "pending").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    },
  });
}
