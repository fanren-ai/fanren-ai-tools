import { NextResponse } from "next/server";
import { readJson } from "@/lib/adminData";
import { getCatalog } from "@/lib/toolsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DayData { pc?: number; mobile?: number; total?: number }
interface TrafficDB {
  tools: Record<string, { dailyData?: Record<string, DayData> }>;
}

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  const { allTools, categories } = await getCatalog();
  const db = await readJson<TrafficDB>("tool-traffic-db.json", { tools: {} });
  const tools = db.tools || {};

  const toolMeta = new Map(allTools.map((t) => [t.id, t]));
  const catOf = (id: string) =>
    categories.find((c) => c.tools.some((t) => t.id === id));

  // 每个工具汇总
  let totalPc = 0;
  let totalMobile = 0;
  const perTool: { id: string; name: string; logo: string | null; category: string; pc: number; mobile: number; total: number }[] = [];
  const catVisits = new Map<string, { name: string; icon: string; visits: number }>();

  for (const [id, data] of Object.entries(tools)) {
    let pc = 0;
    let mobile = 0;
    for (const d of Object.values(data.dailyData || {})) {
      pc += d.pc ?? 0;
      mobile += d.mobile ?? 0;
    }
    const total = pc + mobile;
    if (total === 0) continue;
    totalPc += pc;
    totalMobile += mobile;
    const meta = toolMeta.get(id);
    const cat = catOf(id);
    perTool.push({
      id,
      name: meta?.name ?? id,
      logo: meta?.logo ?? null,
      category: cat?.name ?? "",
      pc,
      mobile,
      total,
    });
    if (cat) {
      const cur = catVisits.get(cat.id) ?? { name: cat.name, icon: cat.icon, visits: 0 };
      cur.visits += total;
      catVisits.set(cat.id, cur);
    }
  }

  // 近 30 天站点趋势
  const dailyTrend: { date: string; pc: number; mobile: number; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    let pc = 0;
    let mobile = 0;
    for (const data of Object.values(tools)) {
      const dd = data.dailyData?.[ds];
      if (dd) {
        pc += dd.pc ?? 0;
        mobile += dd.mobile ?? 0;
      }
    }
    dailyTrend.push({ date: ds, pc, mobile, total: pc + mobile });
  }

  perTool.sort((a, b) => b.total - a.total);
  const byCategory = [...catVisits.values()].sort((a, b) => b.visits - a.visits);

  return NextResponse.json({
    overview: {
      totalVisits: totalPc + totalMobile,
      totalPc,
      totalMobile,
      toolsWithTraffic: perTool.length,
    },
    dailyTrend,
    topTools: perTool.slice(0, 50),
    byCategory,
  });
}
