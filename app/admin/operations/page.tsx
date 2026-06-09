"use client";

import { useEffect, useState, useCallback } from "react";

interface RankTool { id: string; name: string; logo: string | null }
interface Config {
  heroTitle: string;
  heroSubtitle: string;
  hotKeywords: string[];
  topRankingIds: string[];
  rankingTools: RankTool[];
}

export default function AdminOperations() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [ranking, setRanking] = useState<RankTool[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // 工具搜索（用于添加到榜单）
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RankTool[]>([]);

  const load = useCallback(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((c: Config) => {
        setCfg(c);
        setHeroTitle(c.heroTitle);
        setHeroSubtitle(c.heroSubtitle);
        setKeywords(c.hotKeywords);
        setRanking(c.rankingTools);
      });
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/tools?q=${encodeURIComponent(search)}&pageSize=8`)
        .then((r) => r.json())
        .then((d) => setResults((d.items || []).map((x: { id: string; name: string; logo: string | null }) => ({ id: x.id, name: x.name, logo: x.logo }))));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function addKeyword() {
    const v = kwInput.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setKwInput("");
  }
  function addRankTool(t: RankTool) {
    if (!ranking.some((r) => r.id === t.id)) setRanking([...ranking, t]);
    setSearch("");
    setResults([]);
  }
  function moveRank(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= ranking.length) return;
    const next = [...ranking];
    [next[i], next[j]] = [next[j], next[i]];
    setRanking(next);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle,
          heroSubtitle,
          hotKeywords: keywords,
          topRankingIds: ranking.map((r) => r.id),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const card = "rounded-2xl border p-5 mb-5";
  const cardStyle = { backgroundColor: "var(--card)", borderColor: "var(--border)" };

  if (!cfg) return <div className="px-6 py-8" style={{ color: "var(--text-secondary)" }}>加载中…</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">运营管理</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>首页文案、热搜词、热门榜单 · 保存后前台即时更新</p>
        </div>
        <button onClick={save} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: saved ? "#00d470" : "var(--accent)", opacity: saving ? 0.6 : 1 }}>
          {saving ? "保存中…" : saved ? "✓ 已保存" : "保存全部"}
        </button>
      </div>

      {/* 首页文案 */}
      <div className={card} style={cardStyle}>
        <h2 className="font-bold text-sm mb-3">🎯 首页文案</h2>
        <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>主标题（Slogan）</label>
        <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} maxLength={60}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-3" style={inputStyle} />
        <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>副标题</label>
        <input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} maxLength={120}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
      </div>

      {/* 热搜词 */}
      <div className={card} style={cardStyle}>
        <h2 className="font-bold text-sm mb-3">🔥 热搜词（首页搜索框下方快捷词）</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
              {kw}
              <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>✕</button>
            </span>
          ))}
          {keywords.length === 0 && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>暂无</span>}
        </div>
        <div className="flex gap-2">
          <input value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="输入热搜词后回车" className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
          <button onClick={addKeyword} className="px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>添加</button>
        </div>
      </div>

      {/* 热门榜单 */}
      <div className={card} style={cardStyle}>
        <h2 className="font-bold text-sm mb-1">🏆 热门 TOP 榜单（自定义编排）</h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
          配置首页「全站 热门 TOP 榜」的工具与顺序；留空则自动取标记为热门的工具
        </p>
        <div className="space-y-2 mb-3">
          {ranking.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--background)" }}>
              <span className="w-5 text-center text-sm font-bold" style={{ color: "var(--accent-light)" }}>{i + 1}</span>
              {t.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logo} alt={t.name} width={24} height={24} className="rounded" />
              )}
              <span className="flex-1 text-sm truncate">{t.name}</span>
              <button onClick={() => moveRank(i, -1)} disabled={i === 0} className="px-1.5 text-sm" style={{ opacity: i === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => moveRank(i, 1)} disabled={i === ranking.length - 1} className="px-1.5 text-sm" style={{ opacity: i === ranking.length - 1 ? 0.3 : 1 }}>↓</button>
              <button onClick={() => setRanking(ranking.filter((r) => r.id !== t.id))} className="px-1.5 text-sm" style={{ color: "#ff6b6b" }}>✕</button>
            </div>
          ))}
          {ranking.length === 0 && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>未配置（前台自动取热门工具）</p>}
        </div>
        {/* 搜索添加 */}
        <div className="relative">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 搜索工具加入榜单"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
          {results.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
              {results.map((t) => (
                <button key={t.id} onClick={() => addRankTool(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:opacity-80"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  {t.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt={t.name} width={22} height={22} className="rounded" />
                  )}
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto text-xs" style={{ color: "var(--accent-light)" }}>+ 加入</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
