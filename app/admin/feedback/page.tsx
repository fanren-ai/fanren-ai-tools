"use client";

import { useEffect, useState, useCallback } from "react";

interface FbItem { type: string; text: string; time: string; label: string }
interface Group {
  toolId: string;
  toolName: string;
  toolUrl: string;
  logo: string | null;
  count: number;
  items: FbItem[];
}
interface Resp { groups: Group[]; total: number; toolCount: number }

export default function AdminFeedback() {
  const [data, setData] = useState<Resp | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ groups: [], total: 0, toolCount: 0 }));
  }, []);
  useEffect(load, [load]);

  async function resolve(toolId: string) {
    if (!confirm("将该工具的所有反馈标记为已处理（清除）？")) return;
    setBusy(toolId);
    try {
      await fetch(`/api/admin/feedback/${encodeURIComponent(toolId)}`, { method: "DELETE" });
      load();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">状态反馈</h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        用户报告的工具状态问题（失效 / 下线 / 变更等）
        {data && (
          <span> · 共 {data.total} 条，涉及 {data.toolCount} 个工具</span>
        )}
      </p>

      {!data ? (
        <p style={{ color: "var(--text-secondary)" }}>加载中…</p>
      ) : data.groups.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          <div className="text-4xl mb-2">✅</div>暂无未处理的反馈
        </div>
      ) : (
        <div className="space-y-3">
          {data.groups.map((g) => (
            <div key={g.toolId} className="rounded-2xl border p-4" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {g.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.logo} alt={g.toolName} width={32} height={32} className="rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <a href={`/tool/${encodeURIComponent(g.toolId)}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {g.toolName}
                    </a>
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {g.count} 条反馈
                    </div>
                  </div>
                </div>
                <button onClick={() => resolve(g.toolId)} disabled={busy === g.toolId}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
                  ✓ 标记已处理
                </button>
              </div>
              <div className="space-y-1.5">
                {g.items.map((it, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "var(--background)" }}>
                    <span className="shrink-0">{it.label}</span>
                    {it.text && <span style={{ color: "var(--text-secondary)" }}>「{it.text}」</span>}
                    <span className="ml-auto text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {new Date(it.time).toLocaleString("zh-CN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
