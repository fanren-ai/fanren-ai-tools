import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tool-submissions-db.json");

interface Submission {
  id: string;
  name: string;
  url: string;
  category: string;
  categories: string[];
  description: string;
  contact: string;
  time: string;
  status: "pending";
}
interface SubmissionDB {
  submissions: Submission[];
  updatedAt: string;
}

async function readDB(): Promise<SubmissionDB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw) as SubmissionDB;
    if (!db.submissions) db.submissions = [];
    return db;
  } catch {
    return { submissions: [], updatedAt: new Date().toISOString() };
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 60);
  const url = String(body.url ?? "").trim().slice(0, 300);
  const categories = Array.isArray(body.categories)
    ? (body.categories as unknown[])
        .map((c) => String(c).trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const category = categories.join("、").slice(0, 200);
  const description = String(body.description ?? "").trim().slice(0, 200);
  const contact = String(body.contact ?? "").trim().slice(0, 100);

  if (!name || !url) {
    return NextResponse.json(
      { ok: false, error: "工具名称和官网链接为必填项" },
      { status: 400 }
    );
  }
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { ok: false, error: "官网链接需以 http:// 或 https:// 开头" },
      { status: 400 }
    );
  }

  const db = await readDB();
  db.submissions.push({
    id: randomUUID(),
    name,
    url,
    category,
    categories,
    description,
    contact,
    time: new Date().toISOString(),
    status: "pending",
  });
  db.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");

  return NextResponse.json({ ok: true, total: db.submissions.length });
}
