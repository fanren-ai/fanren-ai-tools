import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  categories as seedCategories,
  type Category,
  type Tool,
} from "@/data/tools";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "tools-store.json");

export interface Catalog {
  categories: Category[];
  allTools: Tool[];
}

// 静态分类定义（结构固定：id/名称/图标/二级分类）
const CATEGORY_DEFS = seedCategories.map((c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  subCategories: c.subCategories,
}));

// 规范化单个工具：补齐 categoryIds / subs / sub
function normalize(t: Tool, fallbackCatId?: string): Tool {
  const categoryIds =
    t.categoryIds && t.categoryIds.length
      ? t.categoryIds
      : fallbackCatId
      ? [fallbackCatId]
      : [];
  const subs = t.subs && t.subs.length ? t.subs : t.sub ? [t.sub] : [];
  return { ...t, categoryIds, subs, sub: subs[0] };
}

// 种子：把静态嵌套结构拍平为带 categoryIds/subs 的扁平工具列表
function seedFlat(): Tool[] {
  const out: Tool[] = [];
  for (const c of seedCategories) {
    for (const t of c.tools) out.push(normalize(t, c.id));
  }
  return out;
}

// 读取扁平工具列表（兼容旧的 {categories:[...]} 格式 → 自动迁移）
async function readTools(): Promise<Tool[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as {
      tools?: Tool[];
      categories?: Category[];
    };
    if (Array.isArray(parsed.tools)) {
      return parsed.tools.map((t) => normalize(t));
    }
    if (Array.isArray(parsed.categories)) {
      // 旧格式（嵌套）→ 迁移为扁平
      const out: Tool[] = [];
      for (const c of parsed.categories) {
        for (const t of c.tools) out.push(normalize(t, c.id));
      }
      return out;
    }
  } catch {
    // 文件不存在
  }
  return seedFlat();
}

function buildCategories(tools: Tool[]): Category[] {
  return CATEGORY_DEFS.map((def) => ({
    ...def,
    tools: tools.filter((t) => (t.categoryIds ?? []).includes(def.id)),
  }));
}

export async function getCatalog(): Promise<Catalog> {
  const tools = await readTools();
  return { categories: buildCategories(tools), allTools: tools };
}

async function saveTools(tools: Tool[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    STORE_FILE,
    JSON.stringify({ tools, updatedAt: new Date().toISOString() }),
    "utf8"
  );
}

// 取工具的主分类（用于详情页 / 列表展示）
export function findToolCategory(categories: Category[], id: string) {
  return categories.find((c) => c.tools.some((t) => t.id === id));
}

// 编辑工具（含多分类 categoryIds / 多子类 subs）
export async function updateTool(
  id: string,
  patch: Partial<Tool>
): Promise<Tool | null> {
  const tools = await readTools();
  const t = tools.find((x) => x.id === id);
  if (!t) return null;
  Object.assign(t, patch);
  // 保持规范化
  const n = normalize(t);
  t.categoryIds = n.categoryIds;
  t.subs = n.subs;
  t.sub = n.sub;
  await saveTools(tools);
  return t;
}

// 删除
export async function deleteTool(id: string): Promise<boolean> {
  const tools = await readTools();
  const next = tools.filter((t) => t.id !== id);
  if (next.length === tools.length) return false;
  await saveTools(next);
  return true;
}

// 新增（tool 自带 categoryIds / subs）
export async function addTool(tool: Tool): Promise<Tool> {
  const tools = await readTools();
  const n = normalize(tool);
  tools.unshift(n);
  await saveTools(tools);
  return n;
}
