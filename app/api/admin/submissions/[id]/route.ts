import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, type SubmissionDB } from "@/lib/adminData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = "tool-submissions-db.json";

// PATCH：审批通过 / 驳回（带审核意见）
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/submissions/[id]">
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    reviewComment?: string;
  };
  const status = body.status;
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return NextResponse.json({ ok: false, error: "无效状态" }, { status: 400 });
  }

  const db = await readJson<SubmissionDB>(FILE, {
    submissions: [],
    updatedAt: new Date().toISOString(),
  });
  const item = db.submissions.find((s) => s.id === id);
  if (!item) return NextResponse.json({ ok: false, error: "未找到" }, { status: 404 });

  item.status = status;
  item.reviewComment = (body.reviewComment ?? "").toString().slice(0, 300);
  item.reviewedAt = new Date().toISOString();
  db.updatedAt = new Date().toISOString();
  await writeJson(FILE, db);
  return NextResponse.json({ ok: true, item });
}

// DELETE：删除提交
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/submissions/[id]">
) {
  const { id } = await ctx.params;
  const db = await readJson<SubmissionDB>(FILE, {
    submissions: [],
    updatedAt: new Date().toISOString(),
  });
  const before = db.submissions.length;
  db.submissions = db.submissions.filter((s) => s.id !== id);
  if (db.submissions.length === before) {
    return NextResponse.json({ ok: false, error: "未找到" }, { status: 404 });
  }
  db.updatedAt = new Date().toISOString();
  await writeJson(FILE, db);
  return NextResponse.json({ ok: true });
}
