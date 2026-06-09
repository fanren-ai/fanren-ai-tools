"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  toolCount: number;
  categoryCount: number;
  hotCount: number;
  newCount: number;
  submissionCount: number;
  pendingSubmissions: number;
  feedbackCount: number;
  totalVisits: number;
  byCategory: { id: string; name: string; icon: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const cards = stats
    ? [
        { label: "收录工具", value: stats.toolCount, icon: "🧰", color: "var(--accent-light)" },
        { label: "分类数", value: stats.categoryCount, icon: "📂", color: "#00b8d4" },
        { label: "待审核提交", value: stats.pendingSubmissions, icon: "📤", color: "#f5b800", href: "/admin/submissions" },
        { label: "用户反馈", value: stats.feedbackCount, icon: "🚩", color: "#ff6b6b", href: "/admin/feedback" },
        { label: "累计访问", value: stats.totalVisits, icon: "👁️", color: "#00d470" },
        { label: "热门工具", value: stats.hotCount, icon: "🔥", color: "#ff7a45" },
      ]
    : [];

  const maxCat = stats ? Math.max(1, ...stats.byCategory.map((c) => c.count)) : 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">仪表盘</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        凡人修AI工具箱 · 数据总览
      </p>

      {error ? (
        <p style={{ color: "#ff6b6b" }}>加载失败，请刷新重试</p>
      ) : !stats ? (
        <p style={{ color: "var(--text-secondary)" }}>加载中…</p>
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((c) => {
              const inner = (
                <div
                  className="rounded-2xl border p-5 h-full transition-colors"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                >
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <div className="text-2xl font-bold" style={{ color: c.color }}>
                    {c.value.toLocaleString()}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {c.label}
                  </div>
                </div>
              );
              return c.href ? (
                <Link key={c.label} href={c.href}>
                  {inner}
                </Link>
              ) : (
                <div key={c.label}>{inner}</div>
              );
            })}
          </div>

          {/* 分类分布 */}
          <h2 className="text-lg font-bold mb-4">各分类工具数</h2>
          <div
            className="rounded-2xl border p-5 space-y-2.5"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            {stats.byCategory.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-sm truncate">
                  {c.icon} {c.name}
                </div>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.count / maxCat) * 100}%`, backgroundColor: "var(--accent)" }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {c.count}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
