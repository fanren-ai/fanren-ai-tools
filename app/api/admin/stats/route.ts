import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getCatalog } from "@/lib/toolsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const { allTools, categories } = await getCatalog();

  // 提交审核
  const submissionsDb = await readJson<{ submissions: { status?: string }[] }>(
    "tool-submissions-db.json",
    { submissions: [] }
  );
  const submissions = submissionsDb.submissions || [];
  const pendingSubmissions = submissions.filter((s) => (s.status ?? "pending") === "pending").length;

  // 反馈
  const feedbackDb = await readJson<{ feedbacks: Record<string, unknown[]> }>(
    "tool-feedback-db.json",
    { feedbacks: {} }
  );
  const feedbackCount = Object.values(feedbackDb.feedbacks || {}).reduce(
    (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  // 访问量（汇总所有工具、所有日期的 total）
  const trafficDb = await readJson<{
    tools: Record<string, { dailyData?: Record<string, { total?: number }> }>;
  }>("tool-traffic-db.json", { tools: {} });
  let totalVisits = 0;
  for (const t of Object.values(trafficDb.tools || {})) {
    for (const d of Object.values(t.dailyData || {})) {
      totalVisits += d.total ?? 0;
    }
  }

  // 各分类工具数
  const byCategory = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    count: c.tools.length,
  }));

  return NextResponse.json({
    toolCount: allTools.length,
    categoryCount: categories.length,
    hotCount: allTools.filter((t) => t.hot).length,
    newCount: allTools.filter((t) => t.isNew).length,
    submissionCount: submissions.length,
    pendingSubmissions,
    feedbackCount,
    totalVisits,
    byCategory,
  });
}
