"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, allTools } from "@/data/tools";

// 左侧导航（基于 Link 跳转回首页筛选），用于详情页 / 收藏页等非首页页面
export default function SiteSidebar({
  currentCatId,
  currentSub,
}: {
  currentCatId?: string;
  currentSub?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(currentCatId ?? null);
  return (
    <aside
      className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r overflow-y-auto"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="凡人修AI" width={48} height={48} className="rounded-xl shrink-0" />
          <div>
            <div className="font-bold text-base">凡人修AI</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>工具箱</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <Link
          href="/"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="text-base">🏠</span>
          <span className="flex-1 font-medium">全部工具</span>
        </Link>
        <div className="mt-4 mb-2 px-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          分类导航
        </div>
        {categories.map((cat) => {
          const hasSubs = cat.subCategories.length > 0;
          const isExpanded = expanded === cat.id;
          const isCurrent = currentCatId === cat.id;
          return (
            <div key={cat.id}>
              <div
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors"
                style={{
                  backgroundColor: isCurrent && !currentSub ? "var(--accent)" : "transparent",
                  color: isCurrent && !currentSub ? "#fff" : isCurrent ? "var(--accent-light)" : "var(--text-secondary)",
                }}
              >
                <Link href={`/?cat=${cat.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-base">{cat.icon}</span>
                  <span className="flex-1 font-medium truncate">{cat.name}</span>
                </Link>
                {hasSubs && (
                  <span
                    onClick={() => setExpanded(isExpanded ? null : cat.id)}
                    className="w-5 h-5 -mr-1 flex items-center justify-center cursor-pointer transition-transform"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", opacity: 0.7 }}
                  >
                    ›
                  </span>
                )}
              </div>
              {hasSubs && isExpanded && (
                <div className="ml-4 pl-3 mt-0.5 mb-1 space-y-0.5 border-l" style={{ borderColor: "var(--border)" }}>
                  {cat.subCategories.map((sub) => {
                    const subActive = isCurrent && currentSub === sub.id;
                    return (
                      <Link
                        key={sub.id}
                        href={`/?cat=${cat.id}&sub=${sub.id}`}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{
                          backgroundColor: subActive ? "var(--accent)" : "transparent",
                          color: subActive ? "#fff" : "var(--text-secondary)",
                        }}
                      >
                        <span className="flex-1 truncate">{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-center" style={{ color: "var(--text-secondary)" }}>
        共收录 {allTools.length} 个工具
      </div>
    </aside>
  );
}
