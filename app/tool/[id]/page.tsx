import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/toolsStore";
import ToolDetailClient from "./ToolDetailClient";

export const dynamicParams = true;
// ISR：后台编辑/新增工具后，详情页最多 60 秒自动更新（也可被 revalidatePath 即时刷新）
export const revalidate = 60;

// 预渲染全部工具（SEO：每个工具一个可收录的静态页）
export async function generateStaticParams() {
  const { allTools } = await getCatalog();
  return allTools.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { allTools, categories } = await getCatalog();
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
  const { allTools, categories } = await getCatalog();
  const tool = allTools.find((t) => t.id === id);
  if (!tool) notFound();

  const category = categories.find((c) => c.tools.some((t) => t.id === tool.id));
  const subName =
    category?.subCategories.find((s) => s.id === tool.sub)?.name ?? null;
  const related = (category?.tools ?? [])
    .filter((t) => t.id !== tool.id)
    .slice(0, 8);

  const base = "https://tools.fanrenai.cn";
  const jsonLd = {
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
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolDetailClient
        tool={tool}
        categoryId={category?.id ?? null}
        categoryName={category?.name ?? null}
        categoryIcon={category?.icon ?? null}
        subName={subName}
        related={related}
      />
    </>
  );
}
