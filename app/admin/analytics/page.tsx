"use client";

import { useEffect, useState } from "react";

interface TrendDay { date: string; pc: number; mobile: number; total: number }
interface TopTool { id: string; name: string; logo: string | null; category: string; pc: number; mobile: number; total: number }
interface CatVisit { name: string; icon: string; visits: number }
interface Analytics {
  overview: { totalVisits: number; totalPc: number; totalMobile: number; toolsWithTraffic: number };
  dailyTrend: TrendDay[];
  topTools: TopTool[];
  byCategory: CatVisit[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = [["排名", "工具", "分类", "PC", "移动", "总访问"]];
    data.topTools.forEach((t, i) =>
      rows.push([String(i + 1), t.name, t.category, String(t.pc), String(t.mobile), String(t.total)])
    );
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `访问排行_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (error) return <div className="px-6 py-8" style={{ color: "#ff6b6b" }}>加载失败</div>;
  if (!data) return <div className="px-6 py-8" style={{ color: "var(--text-secondary)" }}>加载中…</div>;

  const maxDay = Math.max(1, ...data.dailyTrend.map((d) => d.total));
  const maxTool = Math.max(1, ...data.topTools.map((t) => t.total));
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.visits));
  const ov = data.overview;
  const pcPct = ov.totalVisits ? Math.round((ov.totalPc / ov.totalVisits) * 100) : 0;

  const card = "rounded-2xl border p-5";
  const cardStyle = { backgroundColor: "var(--card)", borderColor: "var(--border)" };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">数据分析</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>基于真实访问统计</p>
        </div>
        <button onClick={exportCsv} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          ⬇ 导出排行 CSV
        </button>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "累计访问", value: ov.totalVisits, icon: "👁️", color: "#f5b800" },
          { label: "PC 访问", value: ov.totalPc, icon: "🖥️", color: "var(--accent-light)" },
          { label: "移动访问", value: ov.totalMobile, icon: "📱", color: "#00d470" },
          { label: "有访问工具", value: ov.toolsWithTraffic, icon: "🧰", color: "#00b8d4" },
        ].map((c) => (
          <div key={c.label} className={card} style={cardStyle}>
            <div className="text-xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value.toLocaleString()}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 30 天趋势 */}
      <div className={`${card} mb-6`} style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm">近 30 天访问趋势</h2>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "var(--accent)" }} /> PC（{pcPct}%）</span>
            <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#00d470" }} /> 移动（{100 - pcPct}%）</span>
          </div>
        </div>
        <div className="relative flex items-end gap-[3px] h-32">
          {data.dailyTrend.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col justify-end rounded-t overflow-hidden" title={`${d.date.slice(5)}  PC ${d.pc} / 移动 ${d.mobile}`} style={{ height: "100%" }}>
              <div style={{ height: `${(d.mobile / maxDay) * 100}%`, backgroundColor: "#00d470", opacity: 0.85 }} />
              <div style={{ height: `${(d.pc / maxDay) * 100}%`, backgroundColor: "var(--accent)" }} />
            </div>
          ))}
          {ov.totalVisits === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
              暂无访问数据
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
          <span>30 天前</span><span>今天</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 访问 TOP 工具 */}
        <div className={card} style={cardStyle}>
          <h2 className="font-bold text-sm mb-4">访问量 TOP 工具</h2>
          {data.topTools.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>暂无数据</p>
          ) : (
            <div className="space-y-2.5">
              {data.topTools.slice(0, 12).map((t, i) => (
                <div key={t.id} className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-sm font-bold" style={{ color: i < 3 ? "#f5b800" : "var(--text-secondary)" }}>{i + 1}</span>
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt={t.name} width={22} height={22} className="rounded shrink-0" />
                  ) : <span className="w-[22px]" />}
                  <span className="text-sm truncate w-28 shrink-0">{t.name}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(t.total / maxTool) * 100}%`, backgroundColor: "var(--accent)" }} />
                  </div>
                  <span className="w-12 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{t.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分类访问分布 */}
        <div className={card} style={cardStyle}>
          <h2 className="font-bold text-sm mb-4">分类访问分布</h2>
          {data.byCategory.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>暂无数据</p>
          ) : (
            <div className="space-y-2.5">
              {data.byCategory.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm truncate">{c.icon} {c.name}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(c.visits / maxCat) * 100}%`, backgroundColor: "#00b8d4" }} />
                  </div>
                  <span className="w-12 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{c.visits}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
