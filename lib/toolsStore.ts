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

// 读取目录：有运行时存储用存储，否则用静态种子
export async function getCatalog(): Promise<Catalog> {
  let categories: Category[] = seedCategories;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as { categories?: Category[] };
    if (parsed.categories && Array.isArray(parsed.categories)) {
      categories = parsed.categories;
    }
  } catch {
    // 文件不存在 → 用种子
  }
  return { categories, allTools: categories.flatMap((c) => c.tools) };
}

async function saveCatalog(categories: Category[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    STORE_FILE,
    JSON.stringify({ categories, updatedAt: new Date().toISOString() }),
    "utf8"
  );
}

// 通用修改器：读取 → 修改 categories → 保存
export async function mutateCatalog(
  fn: (categories: Category[]) => void | Promise<void>
): Promise<Catalog> {
  const { categories } = await getCatalog();
  await fn(categories);
  await saveCatalog(categories);
  return { categories, allTools: categories.flatMap((c) => c.tools) };
}

// 查找工具所在分类
export function findToolCategory(categories: Category[], id: string) {
  return categories.find((c) => c.tools.some((t) => t.id === id));
}

// 编辑工具字段（可跨分类移动）
export async function updateTool(
  id: string,
  patch: Partial<Tool> & { category?: string }
): Promise<Tool | null> {
  let updated: Tool | null = null;
  await mutateCatalog((categories) => {
    const cat = findToolCategory(categories, id);
    if (!cat) return;
    const idx = cat.tools.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const tool = cat.tools[idx];
    const { category: newCatId, ...fields } = patch;
    Object.assign(tool, fields);
    // 跨分类移动
    if (newCatId && newCatId !== cat.id) {
      const target = categories.find((c) => c.id === newCatId);
      if (target) {
        cat.tools.splice(idx, 1);
        target.tools.push(tool);
      }
    }
    updated = tool;
  });
  return updated;
}

// 删除工具
export async function deleteTool(id: string): Promise<boolean> {
  let ok = false;
  await mutateCatalog((categories) => {
    const cat = findToolCategory(categories, id);
    if (!cat) return;
    cat.tools = cat.tools.filter((t) => t.id !== id);
    ok = true;
  });
  return ok;
}

// 新增工具
export async function addTool(
  catId: string,
  tool: Tool
): Promise<Tool | null> {
  let added: Tool | null = null;
  await mutateCatalog((categories) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    cat.tools.unshift(tool);
    added = tool;
  });
  return added;
}
