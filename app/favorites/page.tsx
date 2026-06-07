"use client";

import Link from "next/link";
import { useState } from "react";
import { allTools, type Tool } from "@/data/tools";
import { saveFavoriteIds, ThemeToggle, useFavoriteIds } from "@/components/HeaderActions";
import SiteSidebar from "@/components/SiteSidebar";
import SiteFooter from "@/components/SiteFooter";

function LogoIcon({ tool, size }: { tool: Tool; size: number }) {
  const [failed, setFailed] = useState(false);
  const style = {
    width: size,
    height: size,
    backgroundColor: "var(--border)",
    color: "var(--accent-light)",
    fontSize: size * 0.4,
  };
  const cls =
    "rounded-xl flex items-center justify-center font-bold shrink-0 overflow-hidden";
  if (tool.logo && !failed) {
    return (
      <div className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.logo}
          alt={tool.name}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div className={cls} style={style}>
      {tool.name.charAt(0)}
    </div>
  );
}

export default function FavoritesPage() {
  const ids = useFavoriteIds();

  function remove(id: string) {
    saveFavoriteIds(ids.filter((x) => x !== id));
  }

  function clearAll() {
    saveFavoriteIds([]);
  }

  const tools = ids
    .map((id) => allTools.find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t));

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      {/* 左侧导航 */}
      <SiteSidebar />

      <main className="flex-1 min-w-0">
        {/* 顶栏：移动端 logo + 右上角主题切换 */}
        <header
          className="sticky top-0 z-10 border-b px-6 py-3 flex items-center"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="凡人修AI" width={28} height={28} />
            <span className="font-bold text-sm">凡人修AI</span>
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🗃️ 我的收藏箱
            <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
              {tools.length} 个工具
            </span>
          </h1>
          {tools.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              清空
            </button>
          )}
        </div>

        {tools.length === 0 ? (
          <div className="text-center py-24" style={{ color: "var(--text-secondary)" }}>
            <div className="text-5xl mb-4">🗃️</div>
            <p className="mb-5">收藏箱还是空的</p>
            <Link
              href="/"
              className="inline-flex px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              去发现工具 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="group relative flex flex-col p-4 rounded-2xl border transition-colors"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => remove(tool.id)}
                  title="移除收藏"
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  ✕
                </button>
                <Link href={`/tool/${encodeURIComponent(tool.id)}`} className="flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2 pr-6">
                    <LogoIcon tool={tool} size={40} />
                    <span className="font-semibold text-sm truncate">{tool.name}</span>
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {tool.description}
                  </p>
                </Link>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs font-medium"
                  style={{ color: "var(--accent-light)" }}
                >
                  访问官网 ↗
                </a>
              </div>
            ))}
          </div>
        )}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
