import type { Metadata } from "next";
import { allTools, categories } from "@/data/tools";
import ToolDetailClient from "./ToolDetailClient";

export const dynamicParams = true;

// 为全部工具静态预渲染（SEO：每个工具一个可收录的静态页）
export function generateStaticParams() {
  return allTools.map((t) => ({ id: t.id }));
}

// 每个工具独立的标题 / 描述 / Open Graph / canonical
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tool = allTools.find((t) => t.id === id);
  if (!tool) {
    return { title: "未找到工具", robots: { index: false, follow: false } };
  }
  const category = categories.find((c) => c.tools.some((t) => t.id === tool.id));
  const catName = category?.name ?? "AI 工具";
  const title = `${tool.name} - ${catName}`;
  const description = `${tool.name}：${tool.description}。在凡人修AI工具箱了解 ${tool.name} 的功能介绍、使用方法、访问统计与同类推荐，一键直达官网。`;
  const url = `/tool/${tool.id}`;
  const image = tool.logo || "/images/logo-mark.png";
  return {
    title,
    description,
    keywords: [tool.name, catName, "AI工具", "AI导航", tool.name + "官网"],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${title}｜凡人修AI工具箱`,
      description,
      url,
      images: [{ url: image }],
      locale: "zh_CN",
    },
    twitter: {
      card: "summary",
      title: `${title}｜凡人修AI工具箱`,
      description,
      images: [image],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = allTools.find((t) => t.id === id);
  const category = tool
    ? categories.find((c) => c.tools.some((t) => t.id === tool.id))
    : undefined;

  // 结构化数据（SoftwareApplication + 面包屑），帮助搜索引擎理解页面
  const base = "https://tools.fanrenai.cn";
  const jsonLd = tool
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            name: tool.name,
            description: tool.description,
            applicationCategory: category?.name ?? "AI Tool",
            operatingSystem: "Web",
            url: tool.url,
            ...(tool.logo ? { image: base + tool.logo } : {}),
            offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "首页", item: base + "/" },
              ...(category
                ? [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: category.name,
                      item: `${base}/?cat=${category.id}`,
                    },
                  ]
                : []),
              {
                "@type": "ListItem",
                position: category ? 3 : 2,
                name: tool.name,
                item: `${base}/tool/${tool.id}`,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ToolDetailClient />
    </>
  );
}
