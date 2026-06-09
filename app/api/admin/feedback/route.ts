import { NextResponse } from "next/server";
import { readJson, type FeedbackDB } from "@/lib/adminData";
import { getCatalog } from "@/lib/toolsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  invalid: "🔗 链接失效",
  blocked: "🚫 已下线",
  redirect: "↪️ 重定向/变更",
  sensitive: "⚠️ 敏感内容",
  other: "✏️ 其他",
};

export async function GET() {
  const { allTools } = await getCatalog();
  const db = await readJson<FeedbackDB>("tool-feedback-db.json", {
    feedbacks: {},
    updatedAt: new Date().toISOString(),
  });

  const groups = Object.entries(db.feedbacks || {})
    .map(([toolId, items]) => {
      const tool = allTools.find((t) => t.id === toolId);
      const list = Array.isArray(items) ? items : [];
      const latest = list.reduce((m, i) => (i.time > m ? i.time : m), "");
      return {
        toolId,
        toolName: tool?.name ?? toolId,
        toolUrl: tool?.url ?? "",
        logo: tool?.logo ?? null,
        count: list.length,
        latest,
        items: list
          .map((i) => ({ ...i, label: TYPE_LABEL[i.type] ?? i.type }))
          .sort((a, b) => (b.time < a.time ? -1 : 1)),
      };
    })
    .filter((g) => g.count > 0)
    .sort((a, b) => (b.latest < a.latest ? -1 : 1));

  return NextResponse.json({
    groups,
    total: groups.reduce((n, g) => n + g.count, 0),
    toolCount: groups.length,
  });
}
