import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://tools.fanrenai.cn";
const SITE_NAME = "凡人修AI工具箱";
const SITE_DESC =
  "凡人修AI工具箱精选 3900+ 款优质 AI 工具，涵盖 AI 对话、绘画、视频、写作、编程、办公、设计、音频等 14 大类，按分类与二级标签快速查找，一键直达官网。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "凡人修AI工具箱 — AI工具导航大全｜精选3900+款AI工具",
    template: "%s｜凡人修AI工具箱",
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "AI工具", "AI工具箱", "AI导航", "AI工具导航", "AI工具大全",
    "ChatGPT", "Claude", "DeepSeek", "Midjourney", "AI绘画",
    "AI写作", "AI视频", "AI编程", "AI办公", "AI设计",
  ],
  authors: [{ name: SITE_NAME, url: "https://www.fanrenai.cn/" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "凡人修AI工具箱 — AI工具导航大全",
    description: SITE_DESC,
    url: "/",
    locale: "zh_CN",
    images: [{ url: "/images/logo-mark.png", width: 826, height: 826, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: "凡人修AI工具箱 — AI工具导航大全",
    description: SITE_DESC,
    images: ["/images/logo-mark.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

// 在水合前根据 localStorage / 系统偏好设置主题，避免首屏闪烁
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

// 站点结构化数据（WebSite + 站内搜索）
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "凡人修AI",
  url: SITE_URL,
  description: SITE_DESC,
  inLanguage: "zh-CN",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
