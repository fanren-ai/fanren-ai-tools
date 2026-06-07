import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tool-feedback-db.json");

const VALID_TYPES = ["invalid", "blocked", "redirect", "sensitive", "other"];

interface FeedbackItem {
  type: string;
  text: string;
  time: string;
}
interface FeedbackDB {
  feedbacks: Record<string, FeedbackItem[]>;
  updatedAt: string;
}

async function readDB(): Promise<FeedbackDB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw) as FeedbackDB;
    if (!db.feedbacks) db.feedbacks = {};
    return db;
  } catch {
    return { feedbacks: {}, updatedAt: new Date().toISOString() };
  }
}

async function writeDB(db: FeedbackDB) {
  db.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// POST：提交一条工具状态反馈
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/feedback/[id]">
) {
  const { id } = await ctx.params;
  let body: { type?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const type = body.type ?? "";
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
  }
  const text = (body.text ?? "").toString().slice(0, 200);
  if (type === "other" && !text.trim()) {
    return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });
  }

  const db = await readDB();
  if (!db.feedbacks[id]) db.feedbacks[id] = [];
  db.feedbacks[id].push({ type, text: type === "other" ? text.trim() : "", time: new Date().toISOString() });
  await writeDB(db);

  return NextResponse.json({ ok: true, count: db.feedbacks[id].length });
}
