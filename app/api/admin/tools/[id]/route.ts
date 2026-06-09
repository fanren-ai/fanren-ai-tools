import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateTool, deleteTool } from "@/lib/toolsStore";
import type { Tool } from "@/data/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refresh(id: string) {
  revalidatePath("/");
  revalidatePath(`/tool/${id}`);
}

// 编辑工具（字段 / 切换热门·最新 / 移动分类）
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/tools/[id]">
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Partial<Tool> & {
    category?: string;
  };

  const patch: Partial<Tool> & { category?: string } = {};
  if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 80);
  if (typeof body.description === "string")
    patch.description = body.description.trim().slice(0, 200);
  if (typeof body.url === "string") patch.url = body.url.trim().slice(0, 300);
  if (typeof body.logo === "string") patch.logo = body.logo.trim().slice(0, 300) || undefined;
  if (typeof body.sub === "string") patch.sub = body.sub || undefined;
  if (typeof body.hot === "boolean") patch.hot = body.hot;
  if (typeof body.isNew === "boolean") patch.isNew = body.isNew;
  if (typeof body.category === "string" && body.category) patch.category = body.category;

  const updated = await updateTool(id, patch);
  if (!updated) return NextResponse.json({ ok: false, error: "未找到工具" }, { status: 404 });

  refresh(id);
  return NextResponse.json({ ok: true, tool: updated });
}

// 删除工具
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tools/[id]">
) {
  const { id } = await ctx.params;
  const ok = await deleteTool(id);
  if (!ok) return NextResponse.json({ ok: false, error: "未找到工具" }, { status: 404 });
  refresh(id);
  return NextResponse.json({ ok: true });
}
