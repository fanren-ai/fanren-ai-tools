import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getCatalog, addTool } from "@/lib/toolsStore";
import type { Tool } from "@/data/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toolCatIds(t: Tool): string[] {
  return t.categoryIds ?? [];
}
function toolSubs(t: Tool): string[] {
  return t.subs && t.subs.length ? t.subs : t.sub ? [t.sub] : [];
}

// 列表：搜索 / 分类 / 标记 / 分页（读运行时存储）
export async function GET(req: NextRequest) {
  const { allTools, categories } = await getCatalog();
  const catName = new Map(categories.map((c) => [c.id, c]));
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().toLowerCase();
  const cat = sp.get("cat") || "";
  const flag = sp.get("flag") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(sp.get("pageSize") || "20", 10) || 20));

  let list = allTools.filter((t) => {
    if (cat && !toolCatIds(t).includes(cat)) return false;
    if (flag === "hot" && !t.hot) return false;
    if (flag === "new" && !t.isNew) return false;
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
      return false;
    return true;
  });

  const total = list.length;
  const start = (page - 1) * pageSize;
  list = list.slice(start, start + pageSize);

  const items = list.map((t) => {
    const cids = toolCatIds(t);
    const cats = cids.map((id) => catName.get(id)).filter(Boolean);
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      url: t.url,
      logo: t.logo ?? null,
      categoryIds: cids,
      subs: toolSubs(t),
      categoryLabel: cats.map((c) => `${c!.icon} ${c!.name}`).join("、"),
      hot: !!t.hot,
      isNew: !!t.isNew,
    };
  });

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      count: c.tools.length,
      subCategories: c.subCategories,
    })),
  });
}

// 新增工具（多分类 categoryIds + 多子类 subs）
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<Tool>;
  const name = (body.name ?? "").toString().trim();
  const url = (body.url ?? "").toString().trim();
  const categoryIds = Array.isArray(body.categoryIds)
    ? body.categoryIds.map(String).filter(Boolean)
    : [];
  if (!name || !/^https?:\/\//i.test(url) || categoryIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "名称、合法官网链接、至少一个分类为必填" },
      { status: 400 }
    );
  }
  const subs = Array.isArray(body.subs) ? body.subs.map(String).filter(Boolean) : [];
  const tool: Tool = {
    id: `t-${randomUUID().slice(0, 8)}`,
    name: name.slice(0, 80),
    description: (body.description ?? "").toString().trim().slice(0, 200),
    url: url.slice(0, 300),
    logo: body.logo ? String(body.logo).slice(0, 300) : undefined,
    categoryIds,
    subs,
    hot: !!body.hot,
    isNew: !!body.isNew,
  };
  const added = await addTool(tool);

  revalidatePath("/");
  revalidatePath(`/tool/${added.id}`);
  return NextResponse.json({ ok: true, tool: added });
}
