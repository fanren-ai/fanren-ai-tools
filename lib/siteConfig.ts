import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "site-config.json");

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  hotKeywords: string[];
  topRankingIds: string[]; // 自定义「全站热门 TOP 榜」顺序；为空则自动取热门工具
}

export const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: "链接 AI · 连接未来 ✨",
  heroSubtitle: "精选优质 AI 工具，覆盖对话、绘画、视频、编程等创作场景",
  hotKeywords: ["ChatGPT", "AI绘画", "论文写作", "AI视频", "PPT", "数字人"],
  topRankingIds: [],
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      heroTitle: parsed.heroTitle ?? DEFAULT_CONFIG.heroTitle,
      heroSubtitle: parsed.heroSubtitle ?? DEFAULT_CONFIG.heroSubtitle,
      hotKeywords: Array.isArray(parsed.hotKeywords) ? parsed.hotKeywords : DEFAULT_CONFIG.hotKeywords,
      topRankingIds: Array.isArray(parsed.topRankingIds) ? parsed.topRankingIds : [],
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function updateSiteConfig(patch: Partial<SiteConfig>): Promise<SiteConfig> {
  const cur = await getSiteConfig();
  const next: SiteConfig = {
    heroTitle: (patch.heroTitle ?? cur.heroTitle).toString().slice(0, 60),
    heroSubtitle: (patch.heroSubtitle ?? cur.heroSubtitle).toString().slice(0, 120),
    hotKeywords: (patch.hotKeywords ?? cur.hotKeywords)
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 12),
    topRankingIds: (patch.topRankingIds ?? cur.topRankingIds)
      .map((s) => String(s))
      .slice(0, 20),
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
