"use client";

import { useEffect, useState, useCallback } from "react";

interface Submission {
  id: string;
  name: string;
  url: string;
  category?: string;
  categories?: string[];
  description?: string;
  contact?: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  reviewComment?: string;
}
interface Resp {
  submissions: Submission[];
  counts: { total: number; pending: number; approved: number; rejected: number };
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "待审核", color: "#f5b800", bg: "#f5b80022" },
  approved: { label: "已通过", color: "#00d470", bg: "#00d47022" },
  rejected: { label: "已驳回", color: "#ff6b6b", bg: "#ff6b6b22" },
};

export default function AdminSubmissions() {
  const [data, setData] = useState<Resp | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [busy, setBusy] = useState<string>("");

  const load = useCallback(() => {
    fetch("/api/admin/submissions")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ submissions: [], counts: { total: 0, pending: 0, approved: 0, rejected: 0 } }));
  }, []);
  useEffect(load, [load]);

  async function act(id: string, action: "approved" | "rejected" | "pending" | "delete") {
    setBusy(id);
    try {
      if (action === "delete") {
        if (!confirm("确定删除这条提交？")) { setBusy(""); return; }
        await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/submissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });
      }
      load();
    } finally {
      setBusy("");
    }
  }

  const list = (data?.submissions || []).filter((s) =>
    filter === "all" ? true : (s.status ?? "pending") === filter
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">提交审核</h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        审核用户通过前台「提交工具」提交的收录申请
      </p>

      {/* 状态筛选 */}
      <div className="inline-flex p-0.5 rounded-xl mb-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {([
          ["all", `全部 ${data?.counts.total ?? 0}`],
          ["pending", `待审核 ${data?.counts.pending ?? 0}`],
          ["approved", `已通过 ${data?.counts.approved ?? 0}`],
          ["rejected", `已驳回 ${data?.counts.rejected ?? 0}`],
        ] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === v ? "var(--accent)" : "transparent",
              color: filter === v ? "#fff" : "var(--text-secondary)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {!data ? (
        <p style={{ color: "var(--text-secondary)" }}>加载中…</p>
      ) : list.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          <div className="text-4xl mb-2">📭</div>暂无{filter === "all" ? "" : STATUS_META[filter]?.label}提交
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const meta = STATUS_META[s.status ?? "pending"];
            return (
              <div key={s.id} className="rounded-2xl border p-4" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
                      {s.url} ↗
                    </a>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {new Date(s.time).toLocaleString("zh-CN")}
                  </span>
                </div>
                {s.description && (
                  <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>{s.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                  {(s.categories?.length ? s.categories.join("、") : s.category) && (
                    <span>分类：{s.categories?.length ? s.categories.join("、") : s.category}</span>
                  )}
                  {s.contact && <span>联系方式：{s.contact}</span>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {s.status !== "approved" && (
                    <button onClick={() => act(s.id, "approved")} disabled={busy === s.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "#00d470", color: "#fff" }}>
                      ✓ 通过
                    </button>
                  )}
                  {s.status !== "rejected" && (
                    <button onClick={() => act(s.id, "rejected")} disabled={busy === s.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--border)", color: "#ff6b6b" }}>
                      ✕ 驳回
                    </button>
                  )}
                  {s.status !== "pending" && (
                    <button onClick={() => act(s.id, "pending")} disabled={busy === s.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      ↺ 重置待审
                    </button>
                  )}
                  <button onClick={() => act(s.id, "delete")} disabled={busy === s.id}
                    className="px-3 py-1.5 rounded-lg text-sm" style={{ color: "var(--text-secondary)" }}>
                    🗑 删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
