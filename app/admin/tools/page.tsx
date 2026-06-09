"use client";

import { useEffect, useState, useCallback } from "react";

interface ToolRow {
  id: string;
  name: string;
  description: string;
  url: string;
  logo: string | null;
  sub: string | null;
  category: string;
  categoryId: string;
  categoryIcon: string;
  hot: boolean;
  isNew: boolean;
}
interface SubCat { id: string; name: string }
interface Cat { id: string; name: string; icon: string; count: number; subCategories: SubCat[] }
interface Resp {
  items: ToolRow[];
  total: number;
  page: number;
  totalPages: number;
  categories: Cat[];
}

type Editing =
  | { mode: "add" }
  | { mode: "edit"; row: ToolRow }
  | null;

export default function AdminTools() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [flag, setFlag] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Resp | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    const p = new URLSearchParams({ q, cat, flag, page: String(page), pageSize: "20" });
    fetch(`/api/admin/tools?${p}`).then((r) => r.json()).then(setData).catch(() => {});
  }, [q, cat, flag, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => setPage(1), [q, cat, flag]);

  async function toggle(row: ToolRow, key: "hot" | "isNew") {
    setBusy(row.id);
    try {
      await fetch(`/api/admin/tools/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !row[key] }),
      });
      load();
    } finally {
      setBusy("");
    }
  }

  async function del(row: ToolRow) {
    if (!confirm(`确定删除工具「${row.name}」？前台将不再显示。`)) return;
    setBusy(row.id);
    try {
      await fetch(`/api/admin/tools/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      load();
    } finally {
      setBusy("");
    }
  }

  const inputStyle = { backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">工具管理</h1>
        <button onClick={() => setEditing({ mode: "add" })}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>
          ➕ 新增工具
        </button>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        共 {data?.total ?? 0} 个 · 编辑/新增/删除会即时同步到前台（ISR）
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 搜索工具名 / 描述"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
          <option value="">全部分类</option>
          {data?.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}（{c.count}）</option>)}
        </select>
        <select value={flag} onChange={(e) => setFlag(e.target.value)} className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
          <option value="">全部标记</option>
          <option value="hot">🔥 热门</option>
          <option value="new">🆕 最新</option>
        </select>
      </div>

      {!data ? (
        <p style={{ color: "var(--text-secondary)" }}>加载中…</p>
      ) : data.items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>没有匹配的工具</div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {data.items.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: "var(--card)", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "var(--border)", color: "var(--accent-light)" }}>
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt={t.name} width={36} height={36} className="w-full h-full object-contain" />
                  ) : t.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{t.name}</div>
                  <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{t.categoryIcon} {t.category} · {t.description}</div>
                </div>
                <button onClick={() => toggle(t, "hot")} disabled={busy === t.id} title="切换热门"
                  className="shrink-0 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: t.hot ? "#ff4d4d22" : "var(--background)", color: t.hot ? "#ff6b6b" : "var(--text-secondary)", border: "1px solid var(--border)" }}>🔥</button>
                <button onClick={() => toggle(t, "isNew")} disabled={busy === t.id} title="切换最新"
                  className="shrink-0 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: t.isNew ? "#00d47022" : "var(--background)", color: t.isNew ? "#00d470" : "var(--text-secondary)", border: "1px solid var(--border)" }}>NEW</button>
                <button onClick={() => setEditing({ mode: "edit", row: t })} className="shrink-0 text-xs px-2.5 py-1 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent-light)" }}>编辑</button>
                <button onClick={() => del(t)} disabled={busy === t.id} className="shrink-0 text-xs px-2 py-1 rounded-lg" style={{ color: "#ff6b6b" }}>删除</button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-5 text-sm">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", opacity: page <= 1 ? 0.5 : 1 }}>上一页</button>
            <span style={{ color: "var(--text-secondary)" }}>{data.page} / {data.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
              className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", opacity: page >= data.totalPages ? 0.5 : 1 }}>下一页</button>
          </div>
        </>
      )}

      {editing && data && (
        <ToolForm
          editing={editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ToolForm({
  editing,
  categories,
  onClose,
  onSaved,
}: {
  editing: Exclude<Editing, null>;
  categories: Cat[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const init = editing.mode === "edit" ? editing.row : null;
  const [form, setForm] = useState({
    name: init?.name ?? "",
    description: init?.description ?? "",
    url: init?.url ?? "",
    logo: init?.logo ?? "",
    category: init?.categoryId ?? categories[0]?.id ?? "",
    sub: init?.sub ?? "",
    hot: init?.hot ?? false,
    isNew: init?.isNew ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const subs = categories.find((c) => c.id === form.category)?.subCategories ?? [];

  async function save() {
    if (!form.name.trim() || !/^https?:\/\//i.test(form.url.trim())) {
      setError("请填写名称和合法的官网链接（http/https）");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editing.mode === "add" ? "/api/admin/tools" : `/api/admin/tools/${encodeURIComponent(init!.id)}`;
      const method = editing.mode === "add" ? "POST" : "PATCH";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.ok) { setError(d.error || "保存失败"); setSaving(false); return; }
      onSaved();
    } catch {
      setError("网络错误");
      setSaving(false);
    }
  }

  const inputStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-base mb-4">{editing.mode === "add" ? "➕ 新增工具" : "✏️ 编辑工具"}</h3>
        <div className="space-y-3">
          <Field label="工具名称 *"><input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} /></Field>
          <Field label="官网链接 *"><input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} /></Field>
          <Field label="一句话简介"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={200} className="w-full h-16 px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} /></Field>
          <Field label="Logo 路径（可选，如 /images/tools/xxx.png）"><input value={form.logo} onChange={(e) => set("logo", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="分类">
              <select value={form.category} onChange={(e) => { set("category", e.target.value); set("sub", ""); }} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
            <Field label="二级分类">
              <select value={form.sub} onChange={(e) => set("sub", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle}>
                <option value="">（无）</option>
                {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hot} onChange={(e) => set("hot", e.target.checked)} /> 🔥 热门</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} /> 🆕 最新</label>
          </div>
          {error && <p className="text-sm" style={{ color: "#ff6b6b" }}>⚠️ {error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "var(--accent)", opacity: saving ? 0.6 : 1 }}>{saving ? "保存中…" : "保存"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>取消</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
