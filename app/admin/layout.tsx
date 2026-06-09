"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", icon: "📊", label: "仪表盘" },
  { href: "/admin/tools", icon: "🧰", label: "工具管理" },
  { href: "/admin/submissions", icon: "📤", label: "提交审核" },
  { href: "/admin/feedback", icon: "🚩", label: "状态反馈" },
  { href: "/admin/operations", icon: "🎯", label: "运营管理" },
  { href: "/admin/analytics", icon: "📈", label: "数据分析" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 登录页不套后台外壳
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      {/* 侧边栏 */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="px-5 py-5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="凡人修AI" width={34} height={34} className="rounded-lg" />
          <div>
            <div className="font-bold text-sm">凡人修AI</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              管理后台
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>🌐</span> 查看前台
          </a>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left"
            style={{ color: "#ff6b6b" }}
          >
            <span>🚪</span> 退出登录
          </button>
        </div>
      </aside>

      {/* 主区 */}
      <main className="flex-1 min-w-0">
        {/* 移动端顶栏 */}
        <header
          className="md:hidden sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="凡人修AI" width={26} height={26} className="rounded-md" />
            <span className="font-bold text-sm">管理后台</span>
          </div>
          <button onClick={logout} className="text-sm" style={{ color: "#ff6b6b" }}>
            退出
          </button>
        </header>

        {/* 移动端简易导航 */}
        <div className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
          {NAV.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: active ? "var(--accent)" : "var(--card)",
                  color: active ? "#fff" : "var(--text-secondary)",
                  border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                }}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>

        {children}
      </main>
    </div>
  );
}
