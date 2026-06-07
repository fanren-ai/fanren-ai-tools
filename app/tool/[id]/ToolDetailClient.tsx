"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { categories, allTools, type Tool } from "@/data/tools";
import HeaderActions, {
  saveFavoriteIds,
  useFavoriteIds,
} from "@/components/HeaderActions";
import SiteSidebar from "@/components/SiteSidebar";
import SiteFooter from "@/components/SiteFooter";

// 确定性哈希，用于生成稳定的评分 / 热度 / 历史访问数据
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
    "rounded-2xl flex items-center justify-center font-bold shrink-0 overflow-hidden";
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

export default function ToolDetailClient() {
  const params = useParams();
  const id = decodeURIComponent(
    Array.isArray(params.id) ? params.id[0] : params.id ?? ""
  );
  const tool = allTools.find((t) => t.id === id);

  const category = categories.find((c) =>
    tool ? c.tools.some((t) => t.id === tool.id) : false
  );

  // 状态反馈
  const [fbOpen, setFbOpen] = useState(false);
  const [fbType, setFbType] = useState("");
  const [fbText, setFbText] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbDone, setFbDone] = useState(false);

  function submitFeedback() {
    if (!tool) return;
    if (!fbType || (fbType === "other" && !fbText.trim())) return;
    setFbSubmitting(true);
    fetch(`/api/feedback/${encodeURIComponent(tool.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: fbType, text: fbText.trim() }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        // 本地记录，避免重复打扰
        try {
          const all = JSON.parse(localStorage.getItem("tool_feedbacks") || "{}");
          all[tool.id] = { type: fbType, text: fbText.trim(), time: new Date().toISOString() };
          localStorage.setItem("tool_feedbacks", JSON.stringify(all));
        } catch {}
        setFbDone(true);
        setTimeout(() => {
          setFbOpen(false);
          setFbDone(false);
          setFbType("");
          setFbText("");
        }, 1800);
      })
      .catch(() => {})
      .finally(() => setFbSubmitting(false));
  }

  // 收藏状态
  const favoriteIds = useFavoriteIds();
  const fav = tool ? favoriteIds.includes(tool.id) : false;

  function toggleFav() {
    if (!tool) return;
    const next = fav
      ? favoriteIds.filter((x) => x !== tool.id)
      : [...favoriteIds, tool.id];
    saveFavoriteIds(next);
  }

  if (!tool) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
      >
        <div className="text-5xl">🔍</div>
        <p style={{ color: "var(--text-secondary)" }}>未找到该工具</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          返回首页
        </Link>
      </div>
    );
  }

  const subName =
    category?.subCategories.find((s) => s.id === tool.sub)?.name ?? null;
  const related = (category?.tools ?? [])
    .filter((t) => t.id !== tool.id)
    .slice(0, 8);

  const h = hashCode(tool.id);
  const score = (8 + (h % 18) / 10).toFixed(1);
  const heat = 1200 + (h % 8800);

  const features = [
    { icon: "⚡", title: "高效智能", desc: `基于先进 AI 技术，${tool.name} 能快速理解并处理你的需求，给出精准结果与流畅体验。` },
    { icon: "🎯", title: "精准专业", desc: `${tool.name} 在${category?.name ?? "AI"}领域具备专业能力，针对具体场景输出高质量内容。` },
    { icon: "✨", title: "持续进化", desc: `${tool.name} 团队持续迭代模型与功能，确保你始终用上最新、最强的 AI 能力。` },
    { icon: "📘", title: "易于上手", desc: `界面简洁直观，无论是专业用户还是新手，都能快速上手 ${tool.name}。` },
  ];
  const steps = [
    { step: 1, title: "访问官网", desc: `点击「访问官网」按钮，进入 ${tool.name} 的官方网站。` },
    { step: 2, title: "注册账号", desc: "按提示完成账号注册，部分功能可能需要登录后使用。" },
    { step: 3, title: "开始使用", desc: `输入你的需求或问题，${tool.name} 将为你智能处理并给出结果。` },
    { step: 4, title: "探索进阶", desc: "尝试不同的用法与提示词，发掘更多高级功能与应用场景。" },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
      {/* 左侧导航 */}
      <SiteSidebar currentCatId={category?.id} currentSub={tool.sub} />

      {/* 主内容 */}
      <main className="flex-1 min-w-0">
        {/* 顶栏：移动端显示 logo，右上角始终显示收藏箱 + 主题切换 */}
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
          <HeaderActions />
        </header>

        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* 面包屑 */}
          <nav
            className="flex items-center gap-1.5 text-sm mb-6 flex-wrap"
            style={{ color: "var(--text-secondary)" }}
          >
            <Link href="/" className="hover:underline">首页</Link>
            <span>›</span>
            {category && (
              <>
                <Link href={`/?cat=${category.id}`} className="hover:underline">
                  {category.name}
                </Link>
                <span>›</span>
              </>
            )}
            <span style={{ color: "var(--text-primary)" }} className="font-medium">
              {tool.name}
            </span>
          </nav>

          {/* Hero */}
          <section
            className="rounded-2xl border p-6 mb-6"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex flex-col sm:flex-row gap-5">
              <LogoIcon tool={tool} size={72} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-xl font-bold">{tool.name}</h1>
                  {tool.hot && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#ff4d4d22", color: "#ff6b6b" }}>
                      🔥 热门
                    </span>
                  )}
                  {tool.isNew && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#00d47022", color: "#00d470" }}>
                      NEW
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <span className="w-14 shrink-0" style={{ color: "var(--text-secondary)" }}>分类</span>
                    <span>
                      {category && (
                        <Link href={`/?cat=${category.id}`} className="hover:underline" style={{ color: "var(--accent-light)" }}>
                          {category.icon} {category.name}
                        </Link>
                      )}
                      {subName && <span style={{ color: "var(--text-secondary)" }}> · {subName}</span>}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-14 shrink-0" style={{ color: "var(--text-secondary)" }}>简介</span>
                    <span className="leading-relaxed">{tool.description}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-14 shrink-0" style={{ color: "var(--text-secondary)" }}>评分</span>
                    <span className="font-bold" style={{ color: "#f5b800" }}>⭐ {score}</span>
                    <span style={{ color: "var(--text-secondary)" }}>· 🔥 {heat.toLocaleString()} 热度</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 flex-wrap">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    访问官网 ↗
                  </a>
                  <button
                    onClick={toggleFav}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: fav ? "#f5b80022" : "transparent",
                      border: "1px solid " + (fav ? "#f5b800" : "var(--border)"),
                      color: fav ? "#f5b800" : "var(--text-secondary)",
                    }}
                  >
                    {fav ? "★ 已收藏" : "☆ 收藏"}
                  </button>
                  <button
                    onClick={() => setFbOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    🚩 状态反馈
                  </button>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    ← 返回
                  </Link>
                </div>
              </div>

              {/* 广告位（Hero 右侧空白区，桌面端显示） */}
              <AdSlot />
            </div>
          </section>

          {/* 工具介绍 */}
          <Section title="工具介绍" icon="✨">
            <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
              {tool.name} 是一款{tool.description}的{category ? category.name.replace(/^AI/, "AI ") : "AI"}工具
              {subName ? `（${subName}方向）` : ""}。它面向需要提升效率与创作能力的用户，
              凭借易用的产品设计与持续迭代的 AI 能力，帮助你在实际工作和学习中获得更好的结果。
              无论是日常办公、学习研究还是创意创作，{tool.name} 都能成为你得力的 AI 助手。
            </p>
          </Section>

          {/* 功能特点 */}
          <Section title="功能特点" icon="⚡">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border p-4" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{f.icon}</span>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 使用步骤 */}
          <Section title="使用步骤" icon="📝">
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{s.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 访问统计 */}
          <Section title="访问统计" icon="📈">
            <VisitChart toolId={tool.id} />
          </Section>

          {/* 相关推荐 */}
          {related.length > 0 && (
            <Section title="相关推荐" icon="🔗">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {related.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tool/${encodeURIComponent(t.id)}`}
                    className="flex flex-col p-3 rounded-xl border transition-colors"
                    style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <LogoIcon tool={t} size={32} />
                      <span className="font-semibold text-sm truncate">{t.name}</span>
                    </div>
                    <p className="text-xs leading-snug mt-1.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                      {t.description}
                    </p>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        <SiteFooter />
      </main>

      {/* 状态反馈弹窗 */}
      {fbOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => !fbSubmitting && setFbOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {fbDone ? (
              <div className="py-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-semibold text-base mb-1">提交成功</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  感谢你的反馈，我们会尽快核实处理
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    🚩 工具状态反馈
                  </h3>
                  <button
                    onClick={() => setFbOpen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                  发现「{tool.name}」有问题？选择一项告诉我们，帮助维护工具质量。
                </p>

                <div className="space-y-2 mb-4">
                  {[
                    { value: "invalid", label: "🔗 链接已失效 / 打不开" },
                    { value: "blocked", label: "🚫 已下线 / 无法访问" },
                    { value: "redirect", label: "↪️ 重定向或内容变更" },
                    { value: "sensitive", label: "⚠️ 含敏感 / 违规内容" },
                    { value: "other", label: "✏️ 其他问题（自定义）" },
                  ].map((opt) => {
                    const active = fbType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFbType(opt.value)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                        style={{
                          backgroundColor: active ? "var(--accent)" : "var(--background)",
                          border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                          color: active ? "#fff" : "var(--text-primary)",
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                          style={{
                            border: "2px solid " + (active ? "#fff" : "var(--text-secondary)"),
                          }}
                        >
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#fff" }} />
                          )}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {fbType === "other" && (
                  <textarea
                    value={fbText}
                    onChange={(e) => setFbText(e.target.value)}
                    placeholder="请描述你遇到的问题…"
                    maxLength={200}
                    className="w-full h-20 p-3 mb-4 rounded-xl text-sm resize-none outline-none"
                    style={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}

                <button
                  onClick={submitFeedback}
                  disabled={
                    fbSubmitting ||
                    !fbType ||
                    (fbType === "other" && !fbText.trim())
                  }
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
                  style={{
                    backgroundColor: "var(--accent)",
                    opacity:
                      fbSubmitting || !fbType || (fbType === "other" && !fbText.trim())
                        ? 0.5
                        : 1,
                    cursor:
                      fbSubmitting || !fbType || (fbType === "other" && !fbText.trim())
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {fbSubmitting ? "提交中…" : "提交反馈"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- 访问统计图表（真实数据，来自 /api/visit） ----------
interface VisitDay {
  date: string;
  pc: number;
  mobile: number;
  total: number;
}
interface VisitResp {
  days: VisitDay[];
  totalPc: number;
  totalMobile: number;
  total: number;
}

function VisitChart({ toolId }: { toolId: string }) {
  const [resp, setResp] = useState<VisitResp | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 进入页面记录一次真实访问（POST），返回最新真实数据
    fetch(`/api/visit/${encodeURIComponent(toolId)}`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: VisitResp) => {
        if (!cancelled) setResp(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [toolId]);

  const data = resp?.days ?? [];
  const totalPc = resp?.totalPc ?? 0;
  const totalMobile = resp?.totalMobile ?? 0;
  const total = resp?.total ?? 0;
  const max = Math.max(1, ...data.map((d) => d.total));
  const mounted = resp !== null || error;

  const stats = [
    { label: "PC 访问", value: totalPc, color: "var(--accent-light)", icon: "🖥️" },
    { label: "移动访问", value: totalMobile, color: "#00d470", icon: "📱" },
    { label: "总访问", value: total, color: "#f5b800", icon: "👁️" },
  ];

  if (!mounted) {
    return (
      <div
        className="rounded-xl border p-5 h-[220px] flex items-center justify-center text-sm"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        加载中…
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--background)" }}>
            <div className="text-lg font-bold" style={{ color: s.color }}>
              {s.value.toLocaleString()}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {s.icon} {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 柱状图：近 30 天 */}
      <div className="relative flex items-end gap-[3px] h-28">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 flex flex-col justify-end rounded-t overflow-hidden group relative"
            title={`${d.date.slice(5)}  PC ${d.pc} / 移动 ${d.mobile}`}
            style={{ height: "100%" }}
          >
            <div style={{ height: `${(d.mobile / max) * 100}%`, backgroundColor: "#00d470", opacity: 0.85 }} />
            <div style={{ height: `${(d.pc / max) * 100}%`, backgroundColor: "var(--accent)" }} />
          </div>
        ))}
        {total === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            暂无访问记录，成为第一个访问者吧 👋
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        <span>30 天前</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "var(--accent)" }} /> PC
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#00d470" }} /> 移动
          </span>
        </div>
        <span>今天</span>
      </div>
      <p className="mt-3 text-[11px]" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
        * 基于真实访问统计，每次打开本页面实时累加（数据存储于服务端）。
      </p>
    </div>
  );
}

// ---------- 广告位（Hero 右侧面板） ----------
// 占位广告位：替换内部内容即可接入真实广告（如 Google AdSense / 自定义图文）
function AdSlot() {
  return (
    <a
      href="#"
      className="hidden lg:flex relative w-56 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border text-center px-4 py-5 transition-colors"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      {/* 广告标识 */}
      <span
        className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded leading-none"
        style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        广告
      </span>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: "var(--card)" }}
      >
        📢
      </div>
      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
        广告位招租
      </div>
      <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        可投放合作工具 / Banner，或接入广告联盟代码。
      </div>
      <span className="text-xs font-medium mt-1" style={{ color: "var(--accent-light)" }}>
        了解更多 →
      </span>
    </a>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-base font-bold mb-3">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
