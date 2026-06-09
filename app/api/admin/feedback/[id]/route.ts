import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, type FeedbackDB } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = "tool-feedback-db.json";

// DELETE：清除某工具的全部反馈（标记为已处理）
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/feedback/[id]">
) {
  const { id } = await ctx.params; // id = toolId
  const db = await readJson<FeedbackDB>(FILE, {
    feedbacks: {},
    updatedAt: new Date().toISOString(),
  });
  if (!db.feedbacks[id]) {
    return NextResponse.json({ ok: false, error: "未找到" }, { status: 404 });
  }
  delete db.feedbacks[id];
  db.updatedAt = new Date().toISOString();
  await writeJson(FILE, db);
  return NextResponse.json({ ok: true });
}
