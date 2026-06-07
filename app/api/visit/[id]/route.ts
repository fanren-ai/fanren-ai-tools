import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tool-traffic-db.json");

interface DayData {
  pc: number;
  mobile: number;
  total: number;
}
interface ToolTraffic {
  dailyData: Record<string, DayData>;
  recentEvents: Record<string, string>;
  updatedAt?: string;
}
interface TrafficDB {
  tools: Record<string, ToolTraffic>;
  updatedAt: string;
}

async function readDB(): Promise<TrafficDB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw) as TrafficDB;
    if (!db.tools) db.tools = {};
    return db;
  } catch {
    return { tools: {}, updatedAt: new Date().toISOString() };
  }
}

async function writeDB(db: TrafficDB) {
  db.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db), "utf8");
}

function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 把某工具的流量整理成「近 30 天」序列 + 汇总
function buildResponse(traffic: ToolTraffic | undefined) {
  const daily = traffic?.dailyData ?? {};
  const days: { date: string; pc: number; mobile: number; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    const v = daily[dateStr];
    days.push({
      date: dateStr,
      pc: v?.pc ?? 0,
      mobile: v?.mobile ?? 0,
      total: v?.total ?? 0,
    });
  }
  // 全量累计（含 30 天之外的历史真实数据）
  let totalPc = 0;
  let totalMobile = 0;
  for (const v of Object.values(daily)) {
    totalPc += v.pc;
    totalMobile += v.mobile;
  }
  return { days, totalPc, totalMobile, total: totalPc + totalMobile };
}

// GET：读取真实访问数据
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/visit/[id]">
) {
  const { id } = await ctx.params;
  const db = await readDB();
  return NextResponse.json(buildResponse(db.tools[id]));
}

// POST：记录一次真实访问（按 UA 区分 PC / 移动）
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/visit/[id]">
) {
  const { id } = await ctx.params;
  const ua = req.headers.get("user-agent") || "";
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

  const db = await readDB();
  if (!db.tools[id]) {
    db.tools[id] = { dailyData: {}, recentEvents: {} };
  }
  const t = db.tools[id];
  const today = localDateStr(new Date());
  if (!t.dailyData[today]) t.dailyData[today] = { pc: 0, mobile: 0, total: 0 };
  if (isMobile) t.dailyData[today].mobile += 1;
  else t.dailyData[today].pc += 1;
  t.dailyData[today].total =
    t.dailyData[today].pc + t.dailyData[today].mobile;

  // 记录最近事件（仅保留最近 50 条，避免文件膨胀）
  if (!t.recentEvents) t.recentEvents = {};
  t.recentEvents[randomUUID()] = new Date().toISOString();
  const entries = Object.entries(t.recentEvents).sort((a, b) =>
    a[1] < b[1] ? 1 : -1
  );
  t.recentEvents = Object.fromEntries(entries.slice(0, 50));
  t.updatedAt = new Date().toISOString();

  await writeDB(db);
  return NextResponse.json(buildResponse(t));
}
