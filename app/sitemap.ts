import type { MetadataRoute } from "next";
import { allTools, categories } from "@/data/tools";

const BASE = "https://tools.fanrenai.cn";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/favorites`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // 分类页（以查询参数形式）
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/?cat=${c.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 全部工具详情页
  const toolPages: MetadataRoute.Sitemap = allTools.map((t) => ({
    url: `${BASE}/tool/${t.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
