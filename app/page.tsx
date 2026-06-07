"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { categories, allTools, type Tool } from "@/data/tools";
import HeaderActions from "@/components/HeaderActions";
import SiteFooter from "@/components/SiteFooter";

function LogoIcon({ tool, size }: { tool: Tool; size: number }) {
  const [failed, setFailed] = useState(false);
  const cls = "rounded-xl flex items-center justify-center font-bold shrink-0 overflow-hidden";
  const style = {
    width: size,
    height: size,
    backgroundColor: "var(--border)",
    color: "var(--accent-light)",
    fontSize: size * 0.4,
  };
  if (tool.logo && !failed) {
    return (
      <div className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.logo}
          alt={tool.name}
          width={size}
          height={size}
          loading="lazy"
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

type TagFilter = "all" | "hot" | "new";
const PREVIEW_OPTIONS = [12, 24, Infinity];

function readInitialFilters() {
  const initial = {
    activeCategory: "all",
    activeSub: "all",
    search: "",
    tagFilter: "all" as TagFilter,
    expandedCat: null as string | null,
  };
  if (typeof window === "undefined") return initial;

  const p = new URLSearchParams(window.location.search);
  const cat = p.get("cat");
  const sub = p.get("sub");
  const tag = p.get("tag") as TagFilter | null;
  const q = p.get("q");
  if (cat && categories.some((c) => c.id === cat)) {
    initial.activeCategory = cat;
    const found = categories.find((c) => c.id === cat);
    if (found && found.subCategories.length > 0) initial.expandedCat = cat;
  }
  if (sub) initial.activeSub = sub;
  if (tag === "hot" || tag === "new") initial.tagFilter = tag;
  if (q) initial.search = q;
  return initial;
}

export default function Home() {
  const [initialFilters] = useState(readInitialFilters);
  const [activeCategory, setActiveCategory] = useState<string>(
    initialFilters.activeCategory
  );
  const [activeSub, setActiveSub] = useState<string>(initialFilters.activeSub);
  const [search, setSearch] = useState(initialFilters.search);
  const [tagFilter, setTagFilter] = useState<TagFilter>(
    initialFilters.tagFilter
  );
  const [previewCount, setPreviewCount] = useState<number>(12);
  const [copied, setCopied] = useState(false);
  const [topCat, setTopCat] = useState<string>("all");
  const [expandedCat, setExpandedCat] = useState<string | null>(
    initialFilters.expandedCat
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");

  // 打开分享弹窗时生成二维码（基于当前 URL，含筛选条件）
  useEffect(() => {
    if (!shareOpen) return;
    if (!shareUrl) return;
    let cancelled = false;
    import("qrcode")
      .then((m) =>
        m.toDataURL(shareUrl, { width: 220, margin: 1, color: { dark: "#1a1a24", light: "#ffffff" } })
      )
      .then((data) => {
        if (!cancelled) setQrUrl(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shareOpen, shareUrl]);

  function openShare() {
    setQrUrl("");
    setShareUrl(window.location.href);
    setShareOpen(true);
  }

  function copyLink() {
    const url = window.location.href;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    // 优先 Clipboard API，失败时回退到 execCommand（兼容非安全上下文 / iframe）
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(text: string, done: () => void) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch {
      /* 忽略 */
    }
  }

  // 同步筛选状态到 URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (activeCategory !== "all") p.set("cat", activeCategory);
    if (activeSub !== "all") p.set("sub", activeSub);
    if (tagFilter !== "all") p.set("tag", tagFilter);
    if (search.trim()) p.set("q", search.trim());
    const qs = p.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [activeCategory, activeSub, tagFilter, search]);

  // 切换大分类时：重置二级分类、在侧边栏自动展开该分类
  function selectCategory(id: string) {
    setActiveCategory(id);
    setActiveSub("all");
    const cat = categories.find((c) => c.id === id);
    setExpandedCat(cat && cat.subCategories.length > 0 ? id : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 选中某个二级分类（侧边栏 / 主区通用）
  function selectSub(catId: string, subId: string) {
    setActiveCategory(catId);
    setActiveSub(subId);
    setExpandedCat(catId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const matchTool = (t: Tool, q: string) => {
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
      return false;
    if (tagFilter === "hot" && !t.hot) return false;
    if (tagFilter === "new" && !t.isNew) return false;
    return true;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (activeCategory === "all") {
      return categories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter((t) => matchTool(t, q)),
        }))
        .filter((cat) => cat.tools.length > 0);
    }
    const cat = categories.find((c) => c.id === activeCategory);
    if (!cat) return [];
    const tools = cat.tools.filter(
      (t) => matchTool(t, q) && (activeSub === "all" || t.sub === activeSub)
    );
    return [{ ...cat, tools }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeSub, search, tagFilter]);

  const totalCount = allTools.length;
  const hotTools = allTools.filter((t) => t.hot).slice(0, 10);
  const currentCat = categories.find((c) => c.id === activeCategory);

  // TOP 榜：全站取 HOT 工具，分类取该类前 10（数据按收录/热度排序）
  const topTools = useMemo(() => {
    if (topCat === "all") return hotTools;
    const cat = categories.find((c) => c.id === topCat);
    return cat ? cat.tools.slice(0, 10) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topCat]);

  // 二级分类计数（随搜索 / 标签筛选联动）
  const subCounts = useMemo(() => {
    const m: Record<string, number> = { __all: 0 };
    if (!currentCat) return m;
    const q = search.trim().toLowerCase();
    for (const t of currentCat.tools) {
      if (!matchTool(t, q)) continue;
      m.__all += 1;
      if (t.sub) m[t.sub] = (m[t.sub] || 0) + 1;
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCat, search, tagFilter]);

  // 是否处于「全部」预览模式（用于限制每类数量）
  const isAllPreview =
    activeCategory === "all" && !search.trim() && tagFilter === "all";
  // 展示卡片总数（用于空状态判断）
  const resultTotal = filtered.reduce((n, c) => n + c.tools.length, 0);

  // 「猜你喜欢」：搜索无结果时，按搜索词与工具名/描述的关键词重叠度推荐
  const suggestions = useMemo(() => {
    if (resultTotal > 0) return [];
    const hot = () => allTools.filter((t) => t.hot).slice(0, 8);
    const q = search.trim().toLowerCase();
    if (!q) return hot(); // 仅筛选无果 → 回退热门

    // 中文常见停用字（不作为匹配关键词，避免噪音）
    const STOP = new Set(
      "的了和与在是有个只一二三四五六七八九十我你他她它这那不啊吗呢请帮做给想要能会把被让如何怎么什么AI".split("")
    );
    // 拉丁词（≥2字符）整体匹配
    const latinTokens = (q.match(/[a-z0-9]{2,}/g) || []).filter(
      (w) => w !== "ai"
    );
    // 有意义的中文字
    const cnChars = Array.from(
      new Set(q.replace(/[a-z0-9\s]/g, "").split(""))
    ).filter((c) => c && !STOP.has(c));

    if (latinTokens.length === 0 && cnChars.length === 0) return hot();

    const scored = allTools
      .map((t) => {
        const name = t.name.toLowerCase();
        const desc = t.description.toLowerCase();
        let score = 0;
        for (const w of latinTokens) {
          if (name.includes(w)) score += 5;
          else if (desc.includes(w)) score += 2;
        }
        for (const c of cnChars) {
          if (name.includes(c)) score += 3;
          else if (desc.includes(c)) score += 1;
        }
        if (t.hot) score += 0.3; // 同分时热门优先
        return { t, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.t);

    return scored.length > 0 ? scored : hot();
  }, [resultTotal, search]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r overflow-y-auto"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mark.png"
              alt="凡人修AI"
              width={48}
              height={48}
              className="rounded-xl shrink-0"
            />
            <div>
              <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                凡人修AI
              </div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                工具箱
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <NavItem
            active={activeCategory === "all"}
            onClick={() => selectCategory("all")}
            icon="🏠"
            label="全部工具"
          />
          <div
            className="mt-4 mb-2 px-2 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            分类导航
          </div>
          {categories.map((cat) => {
            const hasSubs = cat.subCategories.length > 0;
            const expanded = expandedCat === cat.id;
            const groupActive = activeCategory === cat.id;
            return (
              <div key={cat.id}>
                <NavItem
                  active={groupActive && activeSub === "all"}
                  groupActive={groupActive && activeSub !== "all"}
                  onClick={() => selectCategory(cat.id)}
                  icon={cat.icon}
                  label={cat.name}
                  expandable={hasSubs}
                  expanded={expanded}
                  onToggle={
                    hasSubs
                      ? (e) => {
                          e.stopPropagation();
                          setExpandedCat(expanded ? null : cat.id);
                        }
                      : undefined
                  }
                />
                {hasSubs && expanded && (
                  <div
                    className="ml-4 pl-3 mt-0.5 mb-1 space-y-0.5 border-l"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {cat.subCategories.map((sub) => {
                      const subActive =
                        activeCategory === cat.id && activeSub === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => selectSub(cat.id, sub.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors"
                          style={{
                            backgroundColor: subActive
                              ? "var(--accent)"
                              : "transparent",
                            color: subActive ? "#fff" : "var(--text-secondary)",
                          }}
                        >
                          <span className="flex-1 truncate">{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className="px-5 py-4 text-xs text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          共收录 {totalCount} 个工具
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header
          className="sticky top-0 z-10 border-b px-6 py-4"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
          }}
        >
          <div className="flex items-center gap-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-mark.png"
                alt="凡人修AI"
                width={28}
                height={28}
                className="rounded-md shrink-0"
              />
              <span
                className="font-bold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                凡人修AI工具箱
              </span>
            </div>
            <div className="flex-1 relative max-w-xl">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="搜索AI工具..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* 分享：复制链接 + 二维码 */}
            <button
              onClick={openShare}
              title="分享当前页面（含筛选条件）"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <span>🔗</span>
              <span className="hidden sm:inline">分享</span>
            </button>

            {/* 收藏箱 + 主题切换 */}
            <HeaderActions />
          </div>
        </header>

        <div className="px-6 py-8 max-w-6xl mx-auto">
          {/* Hero */}
          {isAllPreview && (
            <div className="mb-10">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                链接 AI · 连接未来 ✨
              </h1>
              <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
                精选 {totalCount}+ 款AI工具，覆盖对话、绘画、视频、编程等场景
              </p>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>🔥</span> 热门 TOP 榜
                  <span style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
                    {topCat === "all"
                      ? "· 全站最受欢迎"
                      : "· " +
                        (categories.find((c) => c.id === topCat)?.name ?? "")}
                  </span>
                </h2>
                <button
                  onClick={() =>
                    topCat === "all"
                      ? setTagFilter("hot")
                      : selectCategory(topCat)
                  }
                  className="text-sm font-medium shrink-0"
                  style={{ color: "var(--accent-light)" }}
                >
                  {topCat === "all" ? "查看全部热门 →" : "进入该分类 →"}
                </button>
              </div>

              {/* TOP 榜分类切换 */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <CategoryPill
                  active={topCat === "all"}
                  onClick={() => setTopCat("all")}
                  label="🏆 全站"
                />
                {categories.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    active={topCat === cat.id}
                    onClick={() => setTopCat(cat.id)}
                    label={cat.icon + " " + cat.name}
                  />
                ))}
              </div>

              {topTools.length === 0 ? (
                <div
                  className="text-sm py-6 text-center rounded-xl"
                  style={{ color: "var(--text-secondary)", backgroundColor: "var(--card)" }}
                >
                  该分类暂无榜单数据
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topTools.map((tool, i) => (
                    <HotRankCard key={tool.id} tool={tool} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile pills */}
          <div className="flex lg:hidden gap-2 mb-4 overflow-x-auto pb-2">
            <CategoryPill
              active={activeCategory === "all"}
              onClick={() => selectCategory("all")}
              label="全部"
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={activeCategory === cat.id}
                onClick={() => selectCategory(cat.id)}
                label={cat.icon + " " + cat.name}
              />
            ))}
          </div>

          {/* 工具栏：标签筛选 + 每类预览数量 */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* 热门/最新筛选 */}
            <div
              className="inline-flex p-0.5 rounded-xl"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              {(
                [
                  ["all", "全部"],
                  ["hot", "🔥 热门"],
                  ["new", "🆕 最新"],
                ] as [TagFilter, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTagFilter(val)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: tagFilter === val ? "var(--accent)" : "transparent",
                    color: tagFilter === val ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 每类显示数量（仅「全部」预览模式） */}
            {isAllPreview && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span>每类显示</span>
                <div
                  className="inline-flex p-0.5 rounded-xl"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {PREVIEW_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPreviewCount(n)}
                      className="px-2.5 py-1 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: previewCount === n ? "var(--accent)" : "transparent",
                        color: previewCount === n ? "#fff" : "var(--text-secondary)",
                      }}
                    >
                      {n === Infinity ? "全部" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 二级分类筛选（仅选中具体分类且该分类有子类时） */}
          {currentCat && currentCat.subCategories.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <CategoryPill
                active={activeSub === "all"}
                onClick={() => setActiveSub("all")}
                label="全部"
                count={subCounts.__all}
              />
              {currentCat.subCategories.map((sub) => (
                <CategoryPill
                  key={sub.id}
                  active={activeSub === sub.id}
                  onClick={() => setActiveSub(sub.id)}
                  label={sub.name}
                  count={subCounts[sub.id] || 0}
                />
              ))}
            </div>
          )}

          {/* Tool grid */}
          {resultTotal === 0 ? (
            <div>
              <div
                className="text-center py-12"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="text-5xl mb-4">🔍</div>
                <p>
                  没有找到
                  {search.trim() ? `「${search.trim()}」相关的` : "匹配的"}工具
                </p>
              </div>

              {suggestions.length > 0 && (
                <section>
                  <h2
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span>✨</span>
                    <span>猜你喜欢</span>
                    <span
                      className="text-sm font-normal"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      为你推荐这些工具
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suggestions.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map((cat) => {
                const shown = isAllPreview
                  ? cat.tools.slice(0, previewCount)
                  : cat.tools;
                const hasMore = isAllPreview && cat.tools.length > previewCount;
                return (
                  <section key={cat.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h2
                        className="flex items-center gap-2 text-lg font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        <span
                          className="text-sm font-normal"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {cat.tools.length} 个工具
                        </span>
                      </h2>
                      {hasMore && (
                        <button
                          onClick={() => selectCategory(cat.id)}
                          className="text-sm font-medium shrink-0"
                          style={{ color: "var(--accent-light)" }}
                        >
                          查看全部 →
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {shown.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <SiteFooter />
      </main>

      {/* 分享弹窗 */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold text-base flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <span>🔗</span> 分享这个页面
              </h3>
              <button
                onClick={() => setShareOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              扫码或复制链接，对方打开即可看到相同的筛选结果。
            </p>

            {/* 二维码 */}
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-white">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="分享二维码" width={200} height={200} />
                ) : (
                  <div
                    className="w-[200px] h-[200px] flex items-center justify-center text-xs"
                    style={{ color: "#888" }}
                  >
                    生成中…
                  </div>
                )}
              </div>
            </div>

            {/* 链接 + 复制 */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              />
              <button
                onClick={copyLink}
                className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: copied ? "#00d470" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {copied ? "✅ 已复制" : "复制"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({
  active,
  groupActive,
  onClick,
  icon,
  label,
  count,
  expandable,
  expanded,
  onToggle,
}: {
  active: boolean;
  groupActive?: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 text-left transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? "var(--accent)" : "transparent",
        color: active
          ? "#fff"
          : groupActive
          ? "var(--accent-light)"
          : "var(--text-secondary)",
      }}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 font-medium truncate">{label}</span>
      {count !== undefined && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: active
              ? "rgba(255,255,255,0.2)"
              : "var(--border)",
            color: active ? "#fff" : "var(--text-secondary)",
          }}
        >
          {count}
        </span>
      )}
      {expandable && (
        <span
          onClick={onToggle}
          className="w-5 h-5 -mr-1 flex items-center justify-center rounded transition-transform"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            opacity: 0.7,
          }}
        >
          ›
        </span>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
      style={{
        backgroundColor: active ? "var(--accent)" : "var(--card)",
        color: active ? "#fff" : "var(--text-secondary)",
        border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
      }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full leading-none"
          style={{
            backgroundColor: active ? "rgba(255,255,255,0.22)" : "var(--border)",
            color: active ? "#fff" : "var(--text-secondary)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${encodeURIComponent(tool.id)}`}
      className="group flex flex-col p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "var(--card-hover)";
        el.style.borderColor = "var(--accent)";
        el.style.boxShadow = "0 6px 18px rgba(109,90,255,0.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = "var(--card)";
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "none";
      }}
    >
      <div className="flex items-center gap-2.5">
        <LogoIcon tool={tool} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {tool.name}
            </span>
            {tool.hot && (
              <span
                className="shrink-0 text-[10px] px-1 py-px rounded font-medium leading-none"
                style={{ backgroundColor: "#ff4d4d22", color: "#ff6b6b" }}
              >
                🔥
              </span>
            )}
            {tool.isNew && (
              <span
                className="shrink-0 text-[10px] px-1 py-px rounded font-medium leading-none"
                style={{ backgroundColor: "#00d47022", color: "#00d470" }}
              >
                NEW
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        className="text-xs leading-snug mt-1.5 line-clamp-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {tool.description}
      </div>
    </Link>
  );
}

function HotRankCard({ tool, rank }: { tool: Tool; rank: number }) {
  // 前三名金/银/铜配色
  const medal =
    rank === 1
      ? { bg: "#f5b80022", fg: "#f5b800" }
      : rank === 2
      ? { bg: "#b9c2d022", fg: "#c3ccda" }
      : rank === 3
      ? { bg: "#cd7f3222", fg: "#e0954e" }
      : { bg: "var(--border)", fg: "var(--text-secondary)" };
  return (
    <Link
      href={`/tool/${encodeURIComponent(tool.id)}`}
      className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--accent)";
        el.style.backgroundColor = "var(--card-hover)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.backgroundColor = "var(--card)";
      }}
    >
      <div
        className="w-6 text-center font-bold text-sm shrink-0 rounded-md py-0.5"
        style={{ backgroundColor: medal.bg, color: medal.fg }}
      >
        {rank}
      </div>
      <LogoIcon tool={tool} size={36} />
      <div className="min-w-0 flex-1">
        <div
          className="font-semibold text-sm truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {tool.name}
        </div>
        <div
          className="text-xs truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {tool.description}
        </div>
      </div>
    </Link>
  );
}
