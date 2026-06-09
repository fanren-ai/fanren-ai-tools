"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }
      // 跳回来源页或仪表盘
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from && from.startsWith("/admin") ? from : "/admin";
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-7"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="凡人修AI" width={36} height={36} className="rounded-lg" />
          <div className="font-bold text-base">凡人修AI 管理后台</div>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          请输入管理员密码登录
        </p>

        <form onSubmit={submit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {error && (
            <p className="text-sm mb-3" style={{ color: "#ff6b6b" }}>
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity"
            style={{
              backgroundColor: "var(--accent)",
              opacity: loading || !password ? 0.5 : 1,
              cursor: loading || !password ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
