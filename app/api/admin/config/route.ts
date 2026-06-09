import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSiteConfig, updateSiteConfig, type SiteConfig } from "@/lib/siteConfig";
import { getCatalog } from "@/lib/toolsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getSiteConfig();
  const { allTools } = await getCatalog();
  const byId = new Map(allTools.map((t) => [t.id, t]));
  const rankingTools = config.topRankingIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((t) => ({ id: t!.id, name: t!.name, logo: t!.logo ?? null }));
  return NextResponse.json({ ...config, rankingTools });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<SiteConfig>;
  const next = await updateSiteConfig(body);
  revalidatePath("/"); // 首页 ISR 立即刷新
  return NextResponse.json({ ok: true, config: next });
}
