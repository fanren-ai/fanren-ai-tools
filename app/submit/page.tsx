"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/data/tools";
import { ThemeToggle } from "@/components/HeaderActions";
import SiteSidebar from "@/components/SiteSidebar";
import SiteFooter from "@/components/SiteFooter";

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    contact: "",
  });
  const [cats, setCats] = useState<string[]>([]); // 多选分类（含二级）
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCat = (label: string) =>
    setCats((c) => (c.includes(label) ? c.filter((x) => x !== label) : [...c, label]));
  const valid = form.name.trim() && /^https?:\/\//i.test(form.url.trim());

  function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError("");
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categories: cats }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.error || "提交失败");
        setDone(true);
      })
      .catch((e) => setError(e.message || "提交失败，请稍后再试"))
      .finally(() => setSubmitting(false));
  }

  const inputStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <SiteSidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-10 border-b px-6 py-3 flex items-center"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="凡人修AI" width={28} height={28} />
            <span className="font-bold text-sm">凡人修AI工具箱</span>
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8">
          <nav className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            <Link href="/" className="hover:underline">首页</Link>
            <span> › </span>
            <span style={{ color: "var(--text-primary)" }}>提交工具</span>
          </nav>

          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">➕ 提交工具</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            发现了好用的 AI 工具？欢迎推荐给我们，审核通过后将收录到工具箱。
          </p>

          {done ? (
            <div
              className="rounded-2xl border p-10 text-center"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-lg font-bold mb-2">提交成功，感谢推荐！</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                我们会尽快核实并收录「{form.name}」。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setForm({ name: "", url: "", description: "", contact: "" });
                    setCats([]);
                    setDone(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  再提交一个
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  返回首页
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl border p-6 space-y-5"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
            >
              <Field label="工具名称" required>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="例如：ChatGPT"
                  maxLength={60}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="官网链接" required>
                <input
                  value={form.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://..."
                  maxLength={300}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label={`所属分类（可多选二级分类${cats.length ? ` · 已选 ${cats.length}` : ""}）`}>
                <div
                  className="rounded-xl border p-3 max-h-72 overflow-y-auto space-y-3"
                  style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
                >
                  {categories.map((c) => {
                    const hasSubs = c.subCategories.length > 0;
                    return (
                      <div key={c.id}>
                        {hasSubs ? (
                          <>
                            <div
                              className="text-xs font-medium mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.icon} {c.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {c.subCategories.map((s) => {
                                const label = `${c.name} · ${s.name}`;
                                const on = cats.includes(label);
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggleCat(label)}
                                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                                    style={{
                                      backgroundColor: on ? "var(--accent)" : "var(--card)",
                                      color: on ? "#fff" : "var(--text-secondary)",
                                      border: "1px solid " + (on ? "var(--accent)" : "var(--border)"),
                                    }}
                                  >
                                    {s.name}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          (() => {
                            const on = cats.includes(c.name);
                            return (
                              <button
                                type="button"
                                onClick={() => toggleCat(c.name)}
                                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                                style={{
                                  backgroundColor: on ? "var(--accent)" : "var(--card)",
                                  color: on ? "#fff" : "var(--text-secondary)",
                                  border: "1px solid " + (on ? "var(--accent)" : "var(--border)"),
                                }}
                              >
                                {c.icon} {c.name}
                              </button>
                            );
                          })()
                        )}
                      </div>
                    );
                  })}
                </div>
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cats.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => toggleCat(label)}
                          className="leading-none"
                          aria-label="移除"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="一句话简介">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="简单描述这个工具能做什么（可选，最多 200 字）"
                  maxLength={200}
                  className="w-full h-20 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="联系方式">
                <input
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  placeholder="邮箱 / 微信，方便我们与你联系（可选）"
                  maxLength={100}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </Field>

              {error && (
                <p className="text-sm" style={{ color: "#ff6b6b" }}>
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={!valid || submitting}
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity"
                style={{
                  backgroundColor: "var(--accent)",
                  opacity: !valid || submitting ? 0.5 : 1,
                  cursor: !valid || submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "提交中…" : "提交工具"}
              </button>
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                带 <span style={{ color: "#ff6b6b" }}>*</span> 为必填项
              </p>
            </div>
          )}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span style={{ color: "#ff6b6b" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
